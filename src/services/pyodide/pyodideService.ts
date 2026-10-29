// ============================================================================
// CodeCraft — Pyodide Execution Engine Service
// ============================================================================

import type {
  ExecutionState,
  ConsoleEntry,
  MainToWorkerMessage,
  WorkerToMainMessage,
  TraceResult,
} from './types'

export interface PyodideServiceListeners {
  onStateChange?: (state: ExecutionState) => void
  onConsoleEntry?: (entry: ConsoleEntry) => void
  onReady?: (info: { version: string; pythonVersion: string }) => void
  onTrace?: (trace: TraceResult | null, runId: string) => void
}

const DEFAULT_TIMEOUT_MS = 15000
const MAX_OUTPUT_LINES = 2000
const MAX_LINE_LENGTH = 10000

export class PyodideService {
  private worker: Worker | null = null
  private listeners: PyodideServiceListeners = {}
  private state: ExecutionState = 'uninitialized'
  private activeRunId: string | null = null
  private runCounter = 0
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null
  private lineCount = 0
  private limitReached = false

  // SharedArrayBuffer synchronization for stdin & interrupt
  private sharedBuffer: SharedArrayBuffer | null = null
  private sharedStatus: Int32Array | null = null
  private sharedLength: Int32Array | null = null
  private sharedData: Uint8Array | null = null

  private interruptBuffer: SharedArrayBuffer | null = null
  private interruptArray: Int32Array | null = null

  private pyodideInfo: { version: string; pythonVersion: string } | null = null
  private textEncoder = new TextEncoder()

  constructor(listeners: PyodideServiceListeners = {}) {
    this.listeners = listeners
    this.initBuffers()
    this.spawnWorker()
  }

  public setListeners(listeners: PyodideServiceListeners) {
    this.listeners = { ...this.listeners, ...listeners }
  }

  public getState(): ExecutionState {
    return this.state
  }

  public getPyodideInfo() {
    return this.pyodideInfo
  }

  private setState(newState: ExecutionState) {
    this.state = newState
    this.listeners.onStateChange?.(newState)
  }

  private initBuffers() {
    // Check for Cross-Origin Isolation and SharedArrayBuffer availability
    const hasSAB =
      typeof SharedArrayBuffer !== 'undefined' &&
      (typeof crossOriginIsolated === 'undefined' || crossOriginIsolated)

    if (hasSAB) {
      try {
        // 64KB shared buffer for interactive stdin
        this.sharedBuffer = new SharedArrayBuffer(65536)
        this.sharedStatus = new Int32Array(this.sharedBuffer, 0, 1)
        this.sharedLength = new Int32Array(this.sharedBuffer, 4, 1)
        this.sharedData = new Uint8Array(this.sharedBuffer, 8)

        // 4-byte buffer for SIGINT signal
        this.interruptBuffer = new SharedArrayBuffer(4)
        this.interruptArray = new Int32Array(this.interruptBuffer)
      } catch (e) {
        console.warn('CodeCraft: SharedArrayBuffer creation failed, falling back.', e)
        this.sharedBuffer = null
        this.interruptBuffer = null
      }
    }
  }

  private spawnWorker(keepCurrentState = false) {
    if (this.worker) {
      try {
        this.worker.terminate()
      } catch {
        // Ignore termination error on stale worker
      }
      this.worker = null
    }

    if (!keepCurrentState) {
      this.setState('loading')
    }

    this.worker = new Worker(
      new URL('./pyodide.worker.ts', import.meta.url),
      { type: 'module' }
    )

    this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      this.handleWorkerMessage(event.data)
    }

    this.worker.onerror = (error) => {
      console.error('Pyodide Worker Error:', error)
      this.addConsoleEntry({
        type: 'error',
        text: `Worker Error: ${error.message || 'An unexpected worker failure occurred.'}`,
      })
      this.setState('error')
    }

    // Initialize worker with buffers and local pyodide indexURL
    const localIndexURL =
      typeof window !== 'undefined' ? `${window.location.origin}/pyodide/` : '/pyodide/'

    const initMsg: MainToWorkerMessage = {
      type: 'INIT',
      sharedBuffer: this.sharedBuffer || undefined,
      interruptBuffer: this.interruptBuffer || undefined,
      indexURL: localIndexURL,
    }
    this.worker.postMessage(initMsg)
  }

  private handleWorkerMessage(msg: WorkerToMainMessage) {
    switch (msg.type) {
      case 'LOADING_PROGRESS':
        this.setState('loading')
        break

      case 'READY':
        this.pyodideInfo = {
          version: msg.version,
          pythonVersion: msg.pythonVersion,
        }
        this.setState('ready')
        this.listeners.onReady?.(this.pyodideInfo)
        break

      case 'STDOUT':
        if (msg.runId !== this.activeRunId) return
        this.addConsoleEntry({
          type: 'stdout',
          text: msg.text,
          runId: msg.runId,
        })
        break

      case 'STDERR':
        if (msg.runId !== this.activeRunId) return
        this.addConsoleEntry({
          type: 'stderr',
          text: msg.text,
          runId: msg.runId,
        })
        break

      case 'STDIN_PROMPT':
        if (msg.runId !== this.activeRunId) return
        this.setState('waiting_input')
        if (msg.prompt) {
          this.addConsoleEntry({
            type: 'prompt',
            text: msg.prompt,
            runId: msg.runId,
          })
        }
        break

      case 'EXECUTION_SUCCESS':
        if (msg.runId !== this.activeRunId) return
        this.clearTimeoutTimer()
        this.activeRunId = null
        this.setState('success')
        this.listeners.onTrace?.(msg.trace ?? null, msg.runId)
        this.addConsoleEntry({
          type: 'system',
          text: `\n[Process completed successfully in ${msg.durationMs}ms]`,
        })
        break

      case 'EXECUTION_ERROR':
        if (msg.runId !== this.activeRunId) return
        this.clearTimeoutTimer()
        this.activeRunId = null
        this.setState('error')
        this.listeners.onTrace?.(msg.trace ?? null, msg.runId)
        this.addConsoleEntry({
          type: 'error',
          text: msg.message,
        })
        this.addConsoleEntry({
          type: 'system',
          text: `\n[Process exited with ${msg.errorType} in ${msg.durationMs}ms]`,
        })
        break

      case 'INTERRUPTED':
        if (msg.runId !== this.activeRunId) return
        this.clearTimeoutTimer()
        this.activeRunId = null
        this.setState('stopped')
        this.listeners.onTrace?.(msg.trace ?? null, msg.runId)
        this.addConsoleEntry({
          type: 'system',
          text: `\n[Execution interrupted by user after ${msg.durationMs}ms]`,
        })
        break
    }
  }

  public runCode(
    code: string,
    options: { timeoutMs?: number; trace?: boolean } = {}
  ) {
    if (!this.worker || this.state === 'loading') {
      this.addConsoleEntry({
        type: 'error',
        text: 'Python execution engine is still loading. Please wait a moment.',
      })
      return
    }

    // Generate unique runId for stale-run protection
    const runId = `run_${++this.runCounter}_${Date.now()}`
    this.activeRunId = runId
    this.lineCount = 0
    this.limitReached = false

    this.setState('running')

    // Reset interrupt buffer if present
    if (this.interruptArray) {
      this.interruptArray[0] = 0
    }

    // Setup execution timeout
    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS
    this.clearTimeoutTimer()
    this.timeoutTimer = setTimeout(() => {
      if (this.activeRunId === runId) {
        this.stopExecution('timeout', timeoutMs)
      }
    }, timeoutMs)

    this.worker.postMessage({
      type: 'RUN',
      code,
      runId,
      trace: options.trace !== false,
    } satisfies MainToWorkerMessage)
  }

  public submitInput(input: string) {
    if (this.state !== 'waiting_input' || !this.activeRunId) return

    // Display user input in console like a terminal prompt
    this.addConsoleEntry({
      type: 'input',
      text: `${input}`,
      runId: this.activeRunId,
    })

    if (this.sharedStatus && this.sharedLength && this.sharedData) {
      const encoded = this.textEncoder.encode(input + '\n')
      this.sharedData.set(encoded)
      Atomics.store(this.sharedLength, 0, encoded.byteLength)
      Atomics.store(this.sharedStatus, 0, 1) // ready
      Atomics.notify(this.sharedStatus, 0, 1)
      this.setState('running')
    } else {
      // Fallback message
      if (this.worker) {
        this.worker.postMessage({
          type: 'STDIN_INPUT',
          value: input,
          runId: this.activeRunId,
        } satisfies MainToWorkerMessage)
      }
      this.setState('running')
    }
  }

  public stopExecution(reason: 'user' | 'timeout' = 'user', timeoutMs?: number) {
    if (!this.activeRunId && this.state !== 'running' && this.state !== 'waiting_input') {
      return
    }

    const stoppedRunId = this.activeRunId
    this.activeRunId = null
    this.clearTimeoutTimer()

    // 1. Signal interrupt buffer if worker is checking it
    if (this.interruptArray) {
      this.interruptArray[0] = 2
    }

    // 2. Wake up any blocked Atomics.wait if waiting for input
    if (this.sharedStatus) {
      Atomics.store(this.sharedStatus, 0, 2) // aborted
      Atomics.notify(this.sharedStatus, 0, 1)
    }

    // 3. For genuine infinite loop stoppage or timeout, terminate and re-spawn worker
    try {
      this.worker?.terminate()
    } catch {
      // Ignore termination error
    }

    this.setState('stopped')

    if (reason === 'timeout') {
      const sec = Math.round((timeoutMs || DEFAULT_TIMEOUT_MS) / 1000)
      this.addConsoleEntry({
        type: 'error',
        text: `Execution timed out after ${sec} seconds. The process was terminated to prevent freezing.`,
        runId: stoppedRunId || undefined,
      })
    } else {
      this.addConsoleEntry({
        type: 'system',
        text: '[Execution stopped by user]',
        runId: stoppedRunId || undefined,
      })
    }

    // Recreate clean worker so engine is immediately ready for next run
    this.spawnWorker(true)
  }

  public resetEngine() {
    this.clearTimeoutTimer()
    this.activeRunId = null
    this.lineCount = 0
    this.limitReached = false
    this.spawnWorker()
  }

  public dispose() {
    this.clearTimeoutTimer()
    this.activeRunId = null
    if (this.worker) {
      try {
        this.worker.terminate()
      } catch {
        // Ignore
      }
      this.worker = null
    }
  }

  private clearTimeoutTimer() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer)
      this.timeoutTimer = null
    }
  }

  private addConsoleEntry(data: {
    type: ConsoleEntry['type']
    text: string
    runId?: string
  }) {
    if (this.limitReached) return

    this.lineCount++
    if (this.lineCount > MAX_OUTPUT_LINES) {
      this.limitReached = true
      this.listeners.onConsoleEntry?.({
        id: crypto.randomUUID(),
        type: 'system',
        text: `\n[Output limit of ${MAX_OUTPUT_LINES} lines reached. Remaining output truncated to protect performance.]`,
        timestamp: this.formatTimestamp(),
      })
      return
    }

    let text = data.text
    if (text.length > MAX_LINE_LENGTH) {
      text = text.slice(0, MAX_LINE_LENGTH) + '... [Line truncated]'
    }

    const entry: ConsoleEntry = {
      id: crypto.randomUUID(),
      type: data.type,
      text,
      timestamp: this.formatTimestamp(),
      runId: data.runId,
    }

    this.listeners.onConsoleEntry?.(entry)
  }

  private formatTimestamp(): string {
    return new Date().toLocaleTimeString('en-US', { hour12: false })
  }
}
