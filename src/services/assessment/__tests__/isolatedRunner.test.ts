// ============================================================================
// Automated Tests: Isolated Assessment Python Execution Runner
// ============================================================================

import { describe, it, expect } from 'vitest'
import {
  buildAssessmentTestScript,
  parseAssessmentTestResults,
  simulateNodeEvaluation,
} from '../isolatedRunner'
import type { AssessmentTestCase } from '../types'

describe('Isolated Assessment Python Runner', () => {
  const testCases: AssessmentTestCase[] = [
    {
      id: 'tc_1',
      name: 'Square 4',
      callExpr: 'square(4)',
      expected: '16',
    },
    {
      id: 'tc_2',
      name: 'Square 0',
      callExpr: 'square(0)',
      expected: '0',
    },
  ]

  it('builds test runner script with user code, test cases, and result marker', () => {
    const studentCode = 'def square(n):\n    return n * n\n'
    const script = buildAssessmentTestScript(studentCode, testCases)

    expect(script).toContain('__CODECRAFT_ASSESSMENT_RESULTS__:')
    expect(script).toContain('def square(n):')
    expect(script).toContain('square(4)')
    expect(script).toContain('16')
  })

  it('parses valid assessment test results from output stream', () => {
    const mockOutput = `Initializing test harness...
__CODECRAFT_ASSESSMENT_RESULTS__:[{"testCaseId":"tc_1","name":"Square 4","passed":true,"expected":"16","actual":"16","durationMs":1.2}]
Execution completed.`

    const outcomes = parseAssessmentTestResults(mockOutput, testCases)
    expect(outcomes).toHaveLength(1)
    expect(outcomes[0].passed).toBe(true)
    expect(outcomes[0].actual).toBe('16')
  })

  it('gracefully handles timeout or crashed output by marking test cases as incomplete', () => {
    const brokenOutput = 'Execution timed out (timeout limit exceeded)'
    const outcomes = parseAssessmentTestResults(brokenOutput, testCases)

    expect(outcomes).toHaveLength(2)
    expect(outcomes[0].passed).toBe(false)
    expect(outcomes[0].error).toContain('timed out')
  })

  it('detects syntax errors in student code', () => {
    const syntaxErrorCode = 'def square(n)\n    return n * n' // missing colon
    const outcomes = simulateNodeEvaluation(syntaxErrorCode, testCases)

    expect(outcomes).toHaveLength(2)
    expect(outcomes[0].passed).toBe(false)
    expect(outcomes[0].error).toContain('SyntaxError')
  })

  it('preserves isHidden metadata and correctly isolates visible from hidden test cases', () => {
    const mixedCases: AssessmentTestCase[] = [
      { id: 'tc_vis', name: 'Visible Case', callExpr: 'square(2)', expected: '4', isHidden: false },
      { id: 'tc_hid', name: 'Secret Case', callExpr: 'square(99)', expected: '9801', isHidden: true },
    ]

    // Sandbox test runner filters out hidden cases
    const visibleOnly = mixedCases.filter((tc) => !tc.isHidden)
    const script = buildAssessmentTestScript('def square(n): return n * n', visibleOnly)

    expect(script).toContain('square(2)')
    expect(script).not.toContain('square(99)')
    expect(script).not.toContain('9801')

    // Parse results should correctly preserve isHidden flag
    const rawResult = `__CODECRAFT_ASSESSMENT_RESULTS__:[{"testCaseId":"tc_vis","name":"Visible Case","passed":true,"expected":"4","actual":"4","durationMs":1},{"testCaseId":"tc_hid","name":"Secret Case","passed":true,"expected":"9801","actual":"9801","durationMs":1}]`
    const outcomes = parseAssessmentTestResults(rawResult, mixedCases)
    expect(outcomes[0].isHidden).toBe(false)
    expect(outcomes[1].isHidden).toBe(true)
  })

  it('immediately returns failure without creating workers when student submits empty code', async () => {
    const { evaluateCodingSubmission } = await import('../isolatedRunner')
    const outcomes = await evaluateCodingSubmission('', testCases)
    expect(outcomes).toHaveLength(2)
    expect(outcomes[0].passed).toBe(false)
    expect(outcomes[0].error).toContain('No code submitted')
  })
})
