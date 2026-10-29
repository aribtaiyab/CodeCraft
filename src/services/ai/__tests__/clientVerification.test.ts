// ============================================================================
// Automated Tests: Client-Side MCQ Verification (Browser Pyodide Runtime)
// ============================================================================

import { describe, it, expect } from 'vitest'
import { verifyMcqsWithBrowserRuntime } from '../clientVerification.ts'
import type { McqQuestion } from '../types.ts'

describe('Client-Side MCQ Verification via Browser Pyodide Sandbox', () => {
  it('strictly preserves conceptual questions as unverified by execution', () => {
    const questions: McqQuestion[] = [
      {
        id: 'q_concept',
        question: 'Which keyword defines a function in Python?',
        options: ['def', 'function', 'fn', 'func'],
        correctIndex: 0,
        explanation: 'def is the keyword.',
        conceptTag: 'functions',
        verifiedByExecution: false,
      },
    ]

    const verified = verifyMcqsWithBrowserRuntime(questions, 'def foo(): pass', 'hello')
    expect(verified[0].verifiedByExecution).toBe(false)
    expect(verified[0].verificationNote).toBe(
      'Conceptual reasoning question — not evaluated by execution.'
    )
  })

  it('verifies dynamic output questions against Pyodide runtime stdout', () => {
    const questions: McqQuestion[] = [
      {
        id: 'q_out',
        question: 'What is the output of this code?',
        options: ['42', '10', '0', 'Error'],
        correctIndex: 0,
        explanation: 'The code prints 42',
        conceptTag: 'output-print',
        verifiedByExecution: false,
        verificationNote: 'Output question — requires browser Pyodide execution to verify.',
      },
    ]

    const verified = verifyMcqsWithBrowserRuntime(questions, 'print(42)', '42\n')
    expect(verified[0].verifiedByExecution).toBe(true)
    expect(verified[0].verificationNote).toContain('Verified through browser Pyodide execution (Output: \'42\')')
    expect(verified[0].correctIndex).toBe(0)
  })

  it('labels output question as unverified if Pyodide stdout does not match options', () => {
    const questions: McqQuestion[] = [
      {
        id: 'q_mismatch',
        question: 'What will be printed to stdout?',
        options: ['apple', 'banana', 'cherry', 'orange'],
        correctIndex: 0,
        explanation: 'Prints a fruit',
        conceptTag: 'output-print',
        verifiedByExecution: false,
        verificationNote: 'Output question — requires browser Pyodide execution to verify.',
      },
    ]

    const verified = verifyMcqsWithBrowserRuntime(questions, 'print("grape")', 'grape')
    expect(verified[0].verifiedByExecution).toBe(false)
    expect(verified[0].verificationNote).toContain('Pyodide output was \'grape\', but options did not directly match')
  })

  it('prompts user to run code in Code Studio if Pyodide output is not yet available', () => {
    const questions: McqQuestion[] = [
      {
        id: 'q_no_run',
        question: 'What will this code output?',
        options: ['1', '2', '3', '4'],
        correctIndex: 0,
        explanation: 'Outputs 1',
        conceptTag: 'output-print',
        verifiedByExecution: false,
        verificationNote: 'Output question — requires browser Pyodide execution to verify.',
      },
    ]

    const verified = verifyMcqsWithBrowserRuntime(questions, 'print(1)', '')
    expect(verified[0].verifiedByExecution).toBe(false)
    expect(verified[0].verificationNote).toBe(
      'Output question — run code in Code Studio to verify against Pyodide output.'
    )
  })

  it('preserves static literal verification from server without modification', () => {
    const questions: McqQuestion[] = [
      {
        id: 'q_literal',
        question: 'What is printed to stdout?',
        options: ['Hello, CodeCraft!', 'Hi', 'Hey', 'None'],
        correctIndex: 0,
        explanation: 'Literal print',
        conceptTag: 'output-print',
        verifiedByExecution: true,
        verificationNote: "Verified against literal print output: 'Hello, CodeCraft!'",
      },
    ]

    const verified = verifyMcqsWithBrowserRuntime(questions, 'print("Hello, CodeCraft!")', '')
    expect(verified[0].verifiedByExecution).toBe(true)
    expect(verified[0].verificationNote).toBe("Verified against literal print output: 'Hello, CodeCraft!'")
  })

  it('marks output questions as unverified and stale when isStale is true', () => {
    const questions: McqQuestion[] = [
      {
        id: 'q_stale',
        question: 'What is the output?',
        options: ['42', '10', '0'],
        correctIndex: 0,
        explanation: 'Outputs 42',
        conceptTag: 'output-print',
        verifiedByExecution: true,
        verificationNote: "Verified through browser Pyodide execution (Output: '42').",
      },
    ]

    const verified = verifyMcqsWithBrowserRuntime(questions, 'print(42)', {
      lastStdout: '42',
      isStale: true,
    })
    expect(verified[0].verifiedByExecution).toBe(false)
    expect(verified[0].verificationNote).toContain('Verification stale')
  })

  it('marks output questions as unverified when last execution resulted in an error', () => {
    const questions: McqQuestion[] = [
      {
        id: 'q_err',
        question: 'What is the output?',
        options: ['42', '10', '0'],
        correctIndex: 0,
        explanation: 'Outputs 42',
        conceptTag: 'output-print',
        verifiedByExecution: true,
      },
    ]

    const verified = verifyMcqsWithBrowserRuntime(questions, 'print(42)', {
      lastStdout: '42',
      lastError: 'ZeroDivisionError: division by zero',
    })
    expect(verified[0].verifiedByExecution).toBe(false)
    expect(verified[0].verificationNote).toContain('ended with an error')
  })

  it('marks output questions as unverified when sourceHash differs from currentSourceHash', () => {
    const questions: McqQuestion[] = [
      {
        id: 'q_hash_diff',
        question: 'What is the output?',
        options: ['42', '10', '0'],
        correctIndex: 0,
        explanation: 'Outputs 42',
        conceptTag: 'output-print',
        verifiedByExecution: true,
      },
    ]

    const verified = verifyMcqsWithBrowserRuntime(questions, 'print(42)', {
      lastStdout: '42',
      sourceHash: 'hash_v1',
      currentSourceHash: 'hash_v2',
    })
    expect(verified[0].verifiedByExecution).toBe(false)
    expect(verified[0].verificationNote).toContain('Verification stale')
  })
})

