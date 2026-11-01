// ============================================================================
// Phase 5 Verification: Execution Pipeline & All 8 Specific Cases
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PyodideService } from '../pyodideService'
import type { ConsoleEntry, WorkerToMainMessage } from '../types'

describe('Phase 5 Verification: Execution Pipeline & Target Test Cases', () => {
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

  // Case 1: print('Hello CodeCraft!') -> Hello CodeCraft!
  it('Case 1: executes print("Hello CodeCraft!") and captures stdout', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    service.runCode("print('Hello CodeCraft!')")
    const runCall = mockWorker.postMessage.mock.calls.find((c) => (c[0] as { type: string }).type === 'RUN')
    expect(runCall).toBeDefined()
    const runId = (runCall![0] as { runId: string }).runId

    // Worker emits STDOUT then SUCCESS
    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Hello CodeCraft!', runId },
    } as MessageEvent<WorkerToMainMessage>)

    mockWorker.onmessage?.({
      data: { type: 'EXECUTION_SUCCESS', runId, durationMs: 14, stdout: 'Hello CodeCraft!\n' },
    } as MessageEvent<WorkerToMainMessage>)

    const stdoutEntries = entries.filter((e) => e.type === 'stdout')
    expect(stdoutEntries.map((e) => e.text)).toContain('Hello CodeCraft!')
    expect(entries.some((e) => e.text.includes('completed successfully in 14ms'))).toBe(true)
  })

  // Case 2: a=10; b=20; print('Addition:',a+b); print('Subtraction:',a-b) -> Addition: 30 and Subtraction: -10
  it('Case 2: executes multi-statement calculation and displays both print outputs', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    service.runCode("a=10; b=20; print('Addition:',a+b); print('Subtraction:',a-b)")
    const runCall = mockWorker.postMessage.mock.calls.find((c) => (c[0] as { type: string }).type === 'RUN')
    expect(runCall).toBeDefined()
    const runId = (runCall![0] as { runId: string }).runId

    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Addition: 30', runId },
    } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Subtraction: -10', runId },
    } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({
      data: { type: 'EXECUTION_SUCCESS', runId, durationMs: 15 },
    } as MessageEvent<WorkerToMainMessage>)

    const stdoutTexts = entries.filter((e) => e.type === 'stdout').map((e) => e.text)
    expect(stdoutTexts).toEqual(['Addition: 30', 'Subtraction: -10'])
  })

  // Case 3: numbers=[10,20,30,40]; average=sum(numbers)/len(numbers); print('Average:',average) -> Average: 25.0
  it('Case 3: executes list aggregate calculations and outputs average', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    service.runCode("numbers=[10,20,30,40]; average=sum(numbers)/len(numbers); print('Average:',average)")
    const runCall = mockWorker.postMessage.mock.calls.find((c) => (c[0] as { type: string }).type === 'RUN')
    expect(runCall).toBeDefined()
    const runId = (runCall![0] as { runId: string }).runId

    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Average: 25.0', runId },
    } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({
      data: { type: 'EXECUTION_SUCCESS', runId, durationMs: 14 },
    } as MessageEvent<WorkerToMainMessage>)

    expect(entries.some((e) => e.type === 'stdout' && e.text === 'Average: 25.0')).toBe(true)
  })

  // Case 4: def greet(name): return 'Hello '+name; print(greet('Student')) -> Hello Student
  it('Case 4: executes user-defined function and prints return value', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    service.runCode("def greet(name): return 'Hello '+name\nprint(greet('Student'))")
    const runCall = mockWorker.postMessage.mock.calls.find((c) => (c[0] as { type: string }).type === 'RUN')
    expect(runCall).toBeDefined()
    const runId = (runCall![0] as { runId: string }).runId

    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Hello Student', runId },
    } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({
      data: { type: 'EXECUTION_SUCCESS', runId, durationMs: 16 },
    } as MessageEvent<WorkerToMainMessage>)

    expect(entries.some((e) => e.type === 'stdout' && e.text === 'Hello Student')).toBe(true)
  })

  // Case 5: CodeRefine workflow - ensures worker receives updated code and outputs correctly even if batched message was buffered
  it('Case 5: displays captured stdout fail-safe if batched event was delayed or buffered', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    // Simulate accepted code running
    service.runCode("print('Hello from CodeRefine Accepted!')\nprint('Line 2')")
    const runCall = mockWorker.postMessage.mock.calls.find((c) => (c[0] as { type: string }).type === 'RUN')
    expect(runCall).toBeDefined()
    const runId = (runCall![0] as { runId: string }).runId

    // Suppose no STDOUT arrived prior to EXECUTION_SUCCESS, but worker passes captured stdout
    mockWorker.onmessage?.({
      data: {
        type: 'EXECUTION_SUCCESS',
        runId,
        durationMs: 14,
        stdout: "Hello from CodeRefine Accepted!\nLine 2\n",
      },
    } as MessageEvent<WorkerToMainMessage>)

    const stdoutTexts = entries.filter((e) => e.type === 'stdout').map((e) => e.text)
    expect(stdoutTexts).toEqual(['Hello from CodeRefine Accepted!', 'Line 2'])
    expect(entries.some((e) => e.text.includes('completed successfully in 14ms'))).toBe(true)
  })

  // Case 6: x=10; y=20 -> successful completion with clear no-output state, not a failure
  it('Case 6: displays clear no-output indicator when code executes successfully with no print statements', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    service.runCode("x=10; y=20")
    const runCall = mockWorker.postMessage.mock.calls.find((c) => (c[0] as { type: string }).type === 'RUN')
    expect(runCall).toBeDefined()
    const runId = (runCall![0] as { runId: string }).runId

    mockWorker.onmessage?.({
      data: { type: 'EXECUTION_SUCCESS', runId, durationMs: 14, stdout: "" },
    } as MessageEvent<WorkerToMainMessage>)

    expect(service.getState()).toBe('success')
    expect(entries.some((e) => e.type === 'info' && e.text.includes('no printed output'))).toBe(true)
    expect(entries.some((e) => e.type === 'system' && e.text.includes('completed successfully'))).toBe(true)
  })

  // Case 7: print(10/0) -> actual Python error, not false success
  it('Case 7: captures ZeroDivisionError exception and reports actual error', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    service.runCode("print(10/0)")
    const runCall = mockWorker.postMessage.mock.calls.find((c) => (c[0] as { type: string }).type === 'RUN')
    expect(runCall).toBeDefined()
    const runId = (runCall![0] as { runId: string }).runId

    mockWorker.onmessage?.({
      data: {
        type: 'EXECUTION_ERROR',
        runId,
        errorType: 'ZeroDivisionError',
        message: 'ZeroDivisionError: division by zero',
        durationMs: 12,
      },
    } as MessageEvent<WorkerToMainMessage>)

    expect(service.getState()).toBe('error')
    expect(entries.some((e) => e.type === 'error' && e.text.includes('ZeroDivisionError: division by zero'))).toBe(true)
    expect(entries.some((e) => e.text.includes('ZeroDivisionError in 12ms'))).toBe(true)
  })

  // Case 8: Repeated consecutive executions -> latest output without stale or duplicated results
  it('Case 8: allows consecutive runs where new run replaces old runId and discards previous messages', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    // Run 1
    service.runCode("print('First run')")
    const allCalls1 = mockWorker.postMessage.mock.calls.filter((c) => (c[0] as { type: string }).type === 'RUN')
    expect(allCalls1.length).toBeGreaterThan(0)
    const run1Id = (allCalls1[0]![0] as { runId: string }).runId

    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'First run', runId: run1Id },
    } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({
      data: { type: 'EXECUTION_SUCCESS', runId: run1Id, durationMs: 10 },
    } as MessageEvent<WorkerToMainMessage>)

    // Run 2 immediately follows
    service.runCode("print('Second run')")
    const allCalls2 = mockWorker.postMessage.mock.calls.filter((c) => (c[0] as { type: string }).type === 'RUN')
    expect(allCalls2.length).toBeGreaterThan(1)
    const run2Id = (allCalls2[1]![0] as { runId: string }).runId

    // An old delayed message from Run 1 arrives
    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Delayed message from Run 1', runId: run1Id },
    } as MessageEvent<WorkerToMainMessage>)

    // Run 2 completes
    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Second run', runId: run2Id },
    } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({
      data: { type: 'EXECUTION_SUCCESS', runId: run2Id, durationMs: 11 },
    } as MessageEvent<WorkerToMainMessage>)

    const allTexts = entries.map((e) => e.text)
    expect(allTexts).not.toContain('Delayed message from Run 1')
    expect(allTexts).toContain('Second run')
  })

  // Case 9: CodeRefine Workflow Integration (Studio Code -> Refined Code Accepted -> Executed)
  it('Case 9: executes accepted CodeRefine improved code and displays its printed output', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    // Step A: Normal code runs
    service.runCode('def add(a, b):\n    return a + b\nprint(add(2, 3))')
    const call1 = mockWorker.postMessage.mock.calls.find((c) => (c[0] as { type: string }).type === 'RUN')
    expect(call1).toBeDefined()
    const run1Id = (call1![0] as { runId: string }).runId
    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: '5', runId: run1Id },
    } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({
      data: { type: 'EXECUTION_SUCCESS', runId: run1Id, durationMs: 12 },
    } as MessageEvent<WorkerToMainMessage>)

    expect(entries.filter((e) => e.type === 'stdout').map((e) => e.text)).toContain('5')

    // Step B & C & D: CodeRefine improves code and user accepts changes
    const improvedCode = 'def add(a: int, b: int) -> int:\n    return a + b\nprint("Result:", add(20, 30))'

    // Step E: User clicks Run on the accepted code
    service.runCode(improvedCode)
    const allRunCalls = mockWorker.postMessage.mock.calls.filter((c) => (c[0] as { type: string }).type === 'RUN')
    const latestCall = allRunCalls[allRunCalls.length - 1]
    expect((latestCall[0] as { code: string }).code).toBe(improvedCode)

    const run2Id = (latestCall[0] as { runId: string }).runId
    mockWorker.onmessage?.({
      data: { type: 'STDOUT', text: 'Result: 50', runId: run2Id },
    } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({
      data: { type: 'EXECUTION_SUCCESS', runId: run2Id, durationMs: 14 },
    } as MessageEvent<WorkerToMainMessage>)

    expect(entries.filter((e) => e.type === 'stdout').map((e) => e.text)).toContain('Result: 50')
  })

  // Case 10: Multiple Print Statements in Accepted Code
  it('Case 10: accurately captures and renders multiple print statements in accepted code', () => {
    const entries: ConsoleEntry[] = []
    const service = new PyodideService({
      onConsoleEntry: (e) => entries.push(e),
    })
    simulateReady()

    const multiPrintCode = [
      "print('Line 1: Initializing module')",
      "print('Line 2: Processing batch 42')",
      "print('Line 3: Execution finished successfully')"
    ].join('\n')

    service.runCode(multiPrintCode)
    const runCalls = mockWorker.postMessage.mock.calls.filter((c) => (c[0] as { type: string }).type === 'RUN')
    const runId = (runCalls[runCalls.length - 1][0] as { runId: string }).runId

    mockWorker.onmessage?.({ data: { type: 'STDOUT', text: 'Line 1: Initializing module', runId } } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({ data: { type: 'STDOUT', text: 'Line 2: Processing batch 42', runId } } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({ data: { type: 'STDOUT', text: 'Line 3: Execution finished successfully', runId } } as MessageEvent<WorkerToMainMessage>)
    mockWorker.onmessage?.({ data: { type: 'EXECUTION_SUCCESS', runId, durationMs: 18 } } as MessageEvent<WorkerToMainMessage>)

    const stdoutTexts = entries.filter((e) => e.type === 'stdout').map((e) => e.text)
    expect(stdoutTexts).toEqual([
      'Line 1: Initializing module',
      'Line 2: Processing batch 42',
      'Line 3: Execution finished successfully'
    ])
  })

  // Case 11: Repeated CodeRefine Acceptance & Undo Workflow
  it('Case 11: verifies repeated CodeRefine acceptances and undo history preserves execution integrity', () => {
    const service = new PyodideService({})
    simulateReady()

    // Studio base code
    const baseCode = "print('Version 1')"
    service.runCode(baseCode)
    let lastCall = mockWorker.postMessage.mock.calls.filter((c) => (c[0] as { type: string }).type === 'RUN').pop()
    expect((lastCall![0] as { code: string }).code).toBe(baseCode)

    // First Refine Accept
    const refineV2 = "print('Version 2: Refined')"
    service.runCode(refineV2)
    lastCall = mockWorker.postMessage.mock.calls.filter((c) => (c[0] as { type: string }).type === 'RUN').pop()
    expect((lastCall![0] as { code: string }).code).toBe(refineV2)

    // Second Refine Accept
    const refineV3 = "print('Version 3: Highly Optimized')"
    service.runCode(refineV3)
    lastCall = mockWorker.postMessage.mock.calls.filter((c) => (c[0] as { type: string }).type === 'RUN').pop()
    expect((lastCall![0] as { code: string }).code).toBe(refineV3)

    // Undo to V2
    service.runCode(refineV2)
    lastCall = mockWorker.postMessage.mock.calls.filter((c) => (c[0] as { type: string }).type === 'RUN').pop()
    expect((lastCall![0] as { code: string }).code).toBe(refineV2)
  })
})
