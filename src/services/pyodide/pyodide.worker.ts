// ============================================================================
// CodeCraft — Pyodide Dedicated Web Worker with Real Execution Tracing
// ============================================================================

import { loadPyodide, type PyodideInterface } from 'pyodide'
import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
  TraceResult,
} from './types'

let pyodide: PyodideInterface | null = null
let currentRunId: string | null = null
let interruptArray: Int32Array | null = null

// Stdin synchronization via SharedArrayBuffer & Atomics
let sharedStatus: Int32Array | null = null
let sharedLength: Int32Array | null = null
let sharedData: Uint8Array | null = null
const textDecoder = new TextDecoder('utf-8')

const TRACE_HARNESS_PY = `
import sys, json

_TRACE_MAX_STEPS = 500

def _run_with_trace(user_code_str):
    trace_events = []
    is_truncated = False

    class OutputProxy:
        def __init__(self, original_stdout):
            self.orig = original_stdout
            self.buf = []
        def write(self, s):
            self.orig.write(s)
            self.buf.append(s)
        def flush(self):
            if hasattr(self.orig, 'flush'):
                self.orig.flush()
        def getvalue(self):
            return "".join(self.buf)

    orig_stdout = sys.stdout
    proxy = OutputProxy(orig_stdout)
    sys.stdout = proxy

    def tracer(frame, event, arg):
        nonlocal is_truncated
        if len(trace_events) >= _TRACE_MAX_STEPS:
            is_truncated = True
            return None
        
        # Only trace code from user code file
        if frame.f_code.co_filename != '<codecraft_user_code>':
            return tracer
            
        line_no = frame.f_lineno
        func_name = frame.f_code.co_name
        
        # Snapshot locals safely
        local_vars = {}
        for k, v in frame.f_locals.items():
            if not k.startswith('_'):
                try:
                    if isinstance(v, (int, float, str, bool, type(None))):
                        local_vars[k] = v
                    elif isinstance(v, list):
                        local_vars[k] = [x if isinstance(x, (int, float, str, bool)) else repr(x) for x in v[:50]]
                    elif isinstance(v, dict):
                        local_vars[k] = {str(dk): dv if isinstance(dv, (int, float, str, bool)) else repr(dv) for dk, dv in list(v.items())[:50]}
                    elif isinstance(v, (set, tuple)):
                        local_vars[k] = repr(v)
                    else:
                        local_vars[k] = repr(v)
                except Exception:
                    local_vars[k] = '<unserializable>'

        exc_info = None
        if event == 'exception' and arg:
            exc_info = f"{arg[0].__name__}: {arg[1]}" if hasattr(arg[0], '__name__') else str(arg)

        # Detect which variables changed from previous step
        prev_locals = trace_events[-1]['locals'] if trace_events else {}
        changed = []
        for k, v in local_vars.items():
            if k not in prev_locals or prev_locals[k] != v:
                changed.append(k)

        trace_events.append({
            'step': len(trace_events) + 1,
            'line': line_no,
            'event': event,
            'func': func_name,
            'locals': local_vars,
            'changedVars': changed,
            'outputSoFar': proxy.getvalue(),
            'exception': exc_info
        })
        return tracer

    sys.settrace(tracer)
    exc_to_raise = None
    try:
        compiled = compile(user_code_str, '<codecraft_user_code>', 'exec')
        exec(compiled, {})
    except Exception as e:
        exc_to_raise = e
    finally:
        sys.settrace(None)
        sys.stdout = orig_stdout

    trace_json = json.dumps({
        'steps': trace_events,
        'isTruncated': is_truncated,
        'maxSteps': _TRACE_MAX_STEPS,
        'supported': True
    })

    if exc_to_raise is not None:
        return trace_json, exc_to_raise
    return trace_json, None
`

async function initPyodide(
  indexURL?: string,
  sharedBuffer?: SharedArrayBuffer,
  interruptBuffer?: SharedArrayBuffer
) {
  try {
    self.postMessage({
      type: 'LOADING_PROGRESS',
      message: 'Initializing Pyodide WebAssembly runtime...',
    } satisfies WorkerToMainMessage)

    if (interruptBuffer) {
      interruptArray = new Int32Array(interruptBuffer)
    }

    if (sharedBuffer) {
      sharedStatus = new Int32Array(sharedBuffer, 0, 1)
      sharedLength = new Int32Array(sharedBuffer, 4, 1)
      sharedData = new Uint8Array(sharedBuffer, 8)
    }

    const pyodideIndex = indexURL || (typeof location !== 'undefined' ? `${location.origin}/pyodide/` : '/pyodide/')

    try {
      pyodide = await loadPyodide({
        indexURL: pyodideIndex,
      })
    } catch (loadErr) {
      console.warn('CodeCraft: Local Pyodide load failed, falling back to CDN...', loadErr)
      pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/',
      })
    }

    if (interruptArray) {
      pyodide.setInterruptBuffer(interruptArray)
    }

    // Configure standard output
    pyodide.setStdout({
      batched: (text: string) => {
        if (!currentRunId) return
        self.postMessage({
          type: 'STDOUT',
          text,
          runId: currentRunId,
        } satisfies WorkerToMainMessage)
      },
    })

    // Configure standard error
    pyodide.setStderr({
      batched: (text: string) => {
        if (!currentRunId) return
        self.postMessage({
          type: 'STDERR',
          text,
          runId: currentRunId,
        } satisfies WorkerToMainMessage)
      },
    })

    // Configure interactive stdin
    pyodide.setStdin({
      stdin: () => {
        if (!currentRunId) return ''

        if (sharedStatus && sharedLength && sharedData) {
          self.postMessage({
            type: 'STDIN_PROMPT',
            prompt: '',
            runId: currentRunId,
          } satisfies WorkerToMainMessage)

          // Mark status as waiting (0)
          Atomics.store(sharedStatus, 0, 0)

          // Block worker thread synchronously until main thread notifies
          Atomics.wait(sharedStatus, 0, 0)

          const status = Atomics.load(sharedStatus, 0)
          if (status === 2) {
            throw new Error('KeyboardInterrupt: input interrupted by user')
          }

          const byteLen = Atomics.load(sharedLength, 0)
          const bytes = sharedData.slice(0, byteLen)
          return textDecoder.decode(bytes)
        }

        return ''
      },
      error: false,
      isatty: true,
    })

    // Register tracing harness
    await pyodide.runPythonAsync(TRACE_HARNESS_PY)

    const version = pyodide.version
    const pythonVersion = pyodide.runPython('import sys; sys.version.split()[0]') as string

    self.postMessage({
      type: 'READY',
      version,
      pythonVersion,
    } satisfies WorkerToMainMessage)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    self.postMessage({
      type: 'EXECUTION_ERROR',
      runId: 'init',
      errorType: 'PyodideInitError',
      message: `Failed to load Pyodide WebAssembly runtime: ${message}`,
      durationMs: 0,
    } satisfies WorkerToMainMessage)
  }
}

async function runCode(code: string, runId: string, trace = true) {
  if (!pyodide) {
    self.postMessage({
      type: 'EXECUTION_ERROR',
      runId,
      errorType: 'RuntimeNotReady',
      message: 'Python runtime is still initializing. Please wait a moment.',
      durationMs: 0,
    } satisfies WorkerToMainMessage)
    return
  }

  currentRunId = runId
  const startTime = performance.now()

  // Reset interrupt signal
  if (interruptArray) {
    interruptArray[0] = 0
  }

  let capturedTrace: TraceResult | undefined

  try {
    if (trace) {
      // Execute through the Python trace harness
      pyodide.globals.set('__cc_user_code', code)
      const res = await pyodide.runPythonAsync(
        'res_json, err_obj = _run_with_trace(__cc_user_code)\n(res_json, err_obj)'
      )

      const traceJson = res.get(0) as string
      const errObj = res.get(1)

      if (traceJson) {
        try {
          capturedTrace = JSON.parse(traceJson) as TraceResult
        } catch {
          // Fallback if parsing fails
        }
      }

      if (errObj) {
        throw errObj
      }
    } else {
      // Normal execution without trace hook
      await pyodide.runPythonAsync(code)
    }

    const durationMs = Math.round(performance.now() - startTime)

    self.postMessage({
      type: 'EXECUTION_SUCCESS',
      runId,
      durationMs,
      trace: capturedTrace,
    } satisfies WorkerToMainMessage)
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - startTime)
    const errObj = err as { name?: string; message?: string; type?: string }
    const rawMessage = errObj.message || String(err)

    // Check for KeyboardInterrupt / Interrupted execution
    if (
      rawMessage.includes('KeyboardInterrupt') ||
      (interruptArray && interruptArray[0] !== 0)
    ) {
      self.postMessage({
        type: 'INTERRUPTED',
        runId,
        durationMs,
        trace: capturedTrace,
      } satisfies WorkerToMainMessage)
      return
    }

    // Parse Python error type and traceback
    let errorType = errObj.type || 'RuntimeError'
    if (!errObj.type) {
      const match = rawMessage.match(/(\w+Error|\w+Exception):/)
      if (match) {
        errorType = match[1]
      }
    }

    // Enhance ModuleNotFoundError with honest Phase 2 context
    let formattedMessage = rawMessage
    if (errorType === 'ModuleNotFoundError') {
      const modMatch = rawMessage.match(/No module named ['"]([^'"]+)['"]/)
      const modName = modMatch ? modMatch[1] : 'requested package'
      formattedMessage = `${rawMessage}\n\n[Note: '${modName}' is a third-party package not available in the current browser runtime. The Python standard library (math, json, re, random, collections, sys, etc.) is fully supported. Third-party package installation via micropip will be added in a future phase.]`
    }

    self.postMessage({
      type: 'EXECUTION_ERROR',
      runId,
      errorType,
      message: formattedMessage,
      traceback: rawMessage,
      durationMs,
      trace: capturedTrace,
    } satisfies WorkerToMainMessage)
  } finally {
    if (currentRunId === runId) {
      currentRunId = null
    }
  }
}

// Handle messages from main thread
self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const msg = event.data
  switch (msg.type) {
    case 'INIT':
      initPyodide(msg.indexURL, msg.sharedBuffer, msg.interruptBuffer)
      break
    case 'RUN':
      runCode(msg.code, msg.runId, msg.trace !== false)
      break
    case 'INTERRUPT':
      if (interruptArray) {
        interruptArray[0] = 2 // SIGINT
      }
      break
    case 'STDIN_INPUT':
      // Fallback
      break
  }
}
