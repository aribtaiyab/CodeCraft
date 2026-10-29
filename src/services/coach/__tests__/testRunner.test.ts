// ============================================================================
// Automated Tests: Test Your Fix Script Builder & Output Parser
// ============================================================================

import { describe, it, expect } from 'vitest'
import { buildTestRunnerScript, parseTestResultsFromOutput } from '../testRunner'
import type { TestCaseAssertion } from '../types'

describe('TestRunner Script Generator & Parser', () => {
  const sampleTests: TestCaseAssertion[] = [
    {
      id: 't1',
      name: 'Basic Sum',
      callExpr: 'add(2, 3)',
      expected: '5',
    },
    {
      id: 't2',
      name: 'Zero check',
      callExpr: 'add(0, 0)',
      expected: '0',
    },
  ]

  it('builds a valid Python test runner harness script', () => {
    const userCode = 'def add(a, b): return a + b\n'
    const script = buildTestRunnerScript(userCode, sampleTests)

    expect(script).toContain('__CODECRAFT_TEST_RESULTS__:')
    expect(script).toContain('user_code =')
    expect(script).toContain('test_cases =')
  })

  it('parses structured JSON test results from Python stdout', () => {
    const rawStdout = `Some stdout\n__CODECRAFT_TEST_RESULTS__:[{"id":"t1","name":"Basic Sum","status":"passed","expected":"5","actual":"5","durationMs":0.4},{"id":"t2","name":"Zero check","status":"passed","expected":"0","actual":"0","durationMs":0.3}]\n`

    const parsed = parseTestResultsFromOutput(rawStdout)
    expect(parsed).not.toBeNull()
    expect(parsed?.length).toBe(2)
    expect(parsed?.[0].status).toBe('passed')
    expect(parsed?.[1].name).toBe('Zero check')
  })

  it('returns null if test results marker is absent', () => {
    const rawStdout = 'Standard output without test results marker\n'
    const parsed = parseTestResultsFromOutput(rawStdout)
    expect(parsed).toBeNull()
  })
})
