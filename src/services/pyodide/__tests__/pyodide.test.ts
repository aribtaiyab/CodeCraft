// ============================================================================
// Automated Tests: Pyodide Protocol, State Transitions & Stale Results
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PyodideService, DEFAULT_TIMEOUT_MS } from '../pyodideService'
import type { ConsoleEntry, ExecutionState, WorkerToMainMessage } from '../types'

describe('PyodideService Protocol and State Management', () => {
  let mockWorker: {
    postMessage: ReturnType<typeof vi.fn>
    terminate: ReturnType<typeof vi.fn>
    onmessage: ((event: MessageEvent<WorkerToMainMessage>) => void) | null
    onerror: ((error: ErrorEvent) => void) | null
  }

  function simulateReady() {
    mockWorker.onmessage?.({
      data: {
        type: 'READY',
        version: '0.27.2',
        pythonVersion: '3.12.7',
      },
    } as MessageEvent<WorkerToMainMessage>)
  }

  beforeEach(() => {
    vi.restoreAllMocks()

    mockWorker = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
    }

    class MockWorker {
      postMessage = mockWorker.postMessage
      terminate = mockWorker.terminate
      onmessage: ((event: MessageEvent<WorkerToMainMessage>) => void) | null = null
      onerror: ((error: ErrorEvent) => void) | null = null

      constructor() {
        mockWorker.onmessage = (e) => this.onmessage?.(e)
        mockWorker.onerror = (e) => this.onerror?.(e)
      }
    }

    vi.stubGlobal('Worker', MockWorker)
  })

  it('initializes worker and transitions from loading to ready', () => {
    const states: ExecutionState[] = []
    const service = new PyodideService({
      onStateChange: (s) => states.push(s),
    })

    expect(states).toContain('loading')
    expect(mockWorker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INIT' })
    )

    simulateReady()

    expect(service.getState()).toBe('ready')
    expect(service.getPyodideInfo()).toEqual({
      version: '0.27.2',
      pythonVersion: '3.12.7',
    })

    service.dispose()
  })

  it('runs code, posts RUN message with unique runId, and handles success', () => {
    const states: ExecutionState[] = []
    const entries: ConsoleEntry[] = []

    const service = new PyodideService({
      onStateChange: (s) => states.push(s),
      onConsoleEntry: (e) => entries.push(e),
    })

    simulateReady()

    service.runCode('print("Hello CodeCraft")')

    expect(states[states.length - 1]).toBe('running')
    expect(mockWorker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RUN',
        code: 'print("Hello CodeCraft")',
        runId: expect.stringMatching(/^run_\d+_\d+$/),
      })
    )

    const lastCall = mockWorker.postMessage.mock.calls.find(
      (c) => (c[0] as { type: string }).type === 'RUN'
    )
    const runId = (lastCall?.[0] as { runId: string } | undefined)?.runId ?? ''

    // Simulate STDOUT
    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Hello CodeCraft', runId },
    } as MessageEvent<WorkerToMainMessage>)

    expect(entries.some((e) => e.type === 'stdout' && e.text === 'Hello CodeCraft')).toBe(true)

    // Simulate SUCCESS
    mockWorker.onmessage?.({
      data: { type: 'EXECUTION_SUCCESS', runId, durationMs: 12 },
    } as MessageEvent<WorkerToMainMessage>)

    expect(service.getState()).toBe('success')
    expect(entries.some((e) => e.text.includes('completed successfully'))).toBe(true)

    service.dispose()
  })

  it('discards stale results from previous runs (stale-run protection)', () => {
    const entries: ConsoleEntry[] = []

    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })

    simulateReady()

    // Run 1
    service.runCode('print("Run 1")')
    const run1Call = mockWorker.postMessage.mock.calls.find(
      (c) => (c[0] as { type: string }).type === 'RUN'
    )
    const run1Id = (run1Call?.[0] as { runId: string } | undefined)?.runId ?? ''

    // Run 2 immediately replaces Run 1
    service.runCode('print("Run 2")')
    const allRunCalls = mockWorker.postMessage.mock.calls.filter(
      (c) => (c[0] as { type: string }).type === 'RUN'
    )
    const run2Id = (allRunCalls[1]?.[0] as { runId: string } | undefined)?.runId ?? ''

    expect(run1Id).not.toBe(run2Id)

    // Late message arrives from Run 1
    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Late output from Run 1', runId: run1Id },
    } as MessageEvent<WorkerToMainMessage>)

    // Must NOT be added to console!
    expect(entries.some((e) => e.text === 'Late output from Run 1')).toBe(false)

    // Message from Run 2 arrives
    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Output from Run 2', runId: run2Id },
    } as MessageEvent<WorkerToMainMessage>)

    expect(entries.some((e) => e.text === 'Output from Run 2')).toBe(true)

    service.dispose()
  })

  it('receives trace data on execution success and notifies onTrace listener', () => {
    let capturedTrace: unknown = null
    const service = new PyodideService({
      onTrace: (t) => {
        capturedTrace = t
      },
    })
    simulateReady()

    service.runCode('x = 10\nprint(x)')
    const runCall = mockWorker.postMessage.mock.calls.find(
      (c) => (c[0] as { type: string }).type === 'RUN'
    )
    const runId = (runCall?.[0] as { runId: string } | undefined)?.runId ?? ''

    mockWorker.onmessage?.({
      data: {
        type: 'EXECUTION_SUCCESS',
        runId,
        durationMs: 15,
        trace: {
          steps: [
            {
              step: 1,
              line: 1,
              event: 'line',
              func: '<module>',
              locals: { x: 10 },
              changedVars: ['x'],
              outputSoFar: '',
            },
          ],
          isTruncated: false,
          maxSteps: 500,
          supported: true,
        },
      },
    } as unknown as MessageEvent<WorkerToMainMessage>)

    expect(capturedTrace).not.toBeNull()
    expect((capturedTrace as { steps: unknown[] }).steps.length).toBe(1)

    service.dispose()
  })

  it('handles execution stop and restarts worker safely', () => {
    const service = new PyodideService()
    simulateReady()

    service.runCode('while True: pass')
    expect(service.getState()).toBe('running')

    // Stop execution
    service.stopExecution('user')

    expect(mockWorker.terminate).toHaveBeenCalled()
    expect(service.getState()).toBe('stopped')

    service.dispose()
  })

  it('handles execution error with formatted traceback', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    service.runCode('1 / 0')
    const runCall = mockWorker.postMessage.mock.calls.find(
      (c) => (c[0] as { type: string }).type === 'RUN'
    )
    const runId = (runCall?.[0] as { runId: string } | undefined)?.runId ?? ''

    mockWorker.onmessage?.({
      data: {
        type: 'EXECUTION_ERROR',
        runId,
        errorType: 'ZeroDivisionError',
        message: 'division by zero',
        durationMs: 4,
      },
    } as MessageEvent<WorkerToMainMessage>)

    expect(service.getState()).toBe('error')
    expect(entries.some((e) => e.type === 'error' && e.text.includes('division by zero'))).toBe(true)

    service.dispose()
  })

  it('transitions to waiting_input when STDIN_PROMPT is received and submits input', () => {
    const service = new PyodideService()
    simulateReady()

    service.runCode('name = input("Enter name: ")')
    const runCall = mockWorker.postMessage.mock.calls.find(
      (c) => (c[0] as { type: string }).type === 'RUN'
    )
    const runId = (runCall?.[0] as { runId: string } | undefined)?.runId ?? ''

    mockWorker.onmessage?.({
      data: {
        type: 'STDIN_PROMPT',
        prompt: 'Enter name: ',
        runId,
      },
    } as MessageEvent<WorkerToMainMessage>)

    expect(service.getState()).toBe('waiting_input')

    // Submit input
    service.submitInput('Alice')
    expect(service.getState()).toBe('running')

    service.dispose()
  })

  it('enforces maximum output line limit to protect performance', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    service.runCode('for i in range(3000): print(i)')
    const runCall = mockWorker.postMessage.mock.calls.find(
      (c) => (c[0] as { type: string }).type === 'RUN'
    )
    const runId = (runCall?.[0] as { runId: string } | undefined)?.runId ?? ''

    // Send 2500 stdout lines
    for (let i = 0; i < 2500; i++) {
      mockWorker.onmessage?.({
        data: { type: 'STDOUT', text: `line ${i}`, runId },
      } as MessageEvent<WorkerToMainMessage>)
    }

    // Must be capped at 2001 (2000 lines + 1 truncation warning)
    expect(entries.length).toBe(2001)
    expect(entries[entries.length - 1].text).toContain('Output limit of 2000 lines reached')

    service.dispose()
  })

  it('triggers execution timeout when code runs past timeoutMs', () => {
    vi.useFakeTimers()
    const service = new PyodideService()
    simulateReady()

    service.runCode('while True: pass', { timeoutMs: 5000 })
    expect(service.getState()).toBe('running')

    // Advance time past 5000ms
    vi.advanceTimersByTime(5001)

    expect(mockWorker.terminate).toHaveBeenCalled()
    expect(service.getState()).toBe('stopped')

    vi.useRealTimers()
    service.dispose()
  })

  it('enforces default 30-second timeout (30000ms) when timeoutMs is not explicitly specified', () => {
    vi.useFakeTimers()
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    expect(DEFAULT_TIMEOUT_MS).toBe(30000)

    service.runCode('while True: pass')
    expect(service.getState()).toBe('running')

    // At 29.9s, still running
    vi.advanceTimersByTime(29900)
    expect(mockWorker.terminate).not.toHaveBeenCalled()
    expect(service.getState()).toBe('running')

    // Advance past 30 seconds
    vi.advanceTimersByTime(200)
    expect(mockWorker.terminate).toHaveBeenCalled()
    expect(service.getState()).toBe('stopped')
    expect(entries.some((e) => e.type === 'error' && e.text.includes('Execution timed out after 30 seconds'))).toBe(true)

    vi.useRealTimers()
    service.dispose()
  })

  it('safely disposes worker and cancels active timeout timers idempotently', () => {
    vi.useFakeTimers()
    const service = new PyodideService()
    simulateReady()

    service.runCode('import time; time.sleep(10)', { timeoutMs: 10000 })
    expect(service.getState()).toBe('running')

    // Disposing should terminate worker and clear timers
    service.dispose()
    expect(mockWorker.terminate).toHaveBeenCalled()

    // Advancing timers should not cause any errors or state transitions
    vi.advanceTimersByTime(12000)
    expect(() => service.dispose()).not.toThrow()

    vi.useRealTimers()
  })
})
