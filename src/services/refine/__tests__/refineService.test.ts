// ============================================================================
// Automated Tests: CodeRefine Frontend Service & Verification Engine
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  refineService,
  buildVerificationScript,
  parseVerificationOutput,
  executeRefineVerification,
} from '../index'

describe('CodeRefine Service & Verification Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // --------------------------------------------------------------------------
  // 1. Frontend Refine Service API Client
  // --------------------------------------------------------------------------
  it('calls POST /api/ai/refine and returns parsed response', async () => {
    const mockData = {
      summary: 'Replaced loop with list comprehension',
      improvedCode: 'squares = [x*x for x in nums]',
      changes: [
        {
          id: 'ch-1',
          title: 'List comprehension',
          category: 'idiomatic',
          lineRange: { original: '1-3', improved: '1' },
          originalSnippet: 'res = []\nfor x in nums:\n    res.append(x*x)',
          improvedSnippet: 'squares = [x*x for x in nums]',
          whatChanged: 'Replaced loop append with list comp',
          whyChanged: 'More Pythonic',
          howItWorks: 'Evaluates in C bytecode loop',
          whyUseful: 'Clearer intent',
          tradeoffs: 'Avoid if expressions get too complex',
        },
      ],
      tradeoffs: {
        readability: 'Much higher',
        performance: 'Faster',
        limitations: 'Memory allocated at once',
        honestAssessment: 'Great for simple transforms',
      },
      testSuggestions: [],
      progressiveHints: ['Hint 1', 'Hint 2', 'Hint 3'],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const res = await refineService.refineCode({
      code: 'res = []\nfor x in nums:\n    res.append(x*x)',
      goal: 'simplify',
    })

    expect(res.summary).toBe('Replaced loop with list comprehension')
    expect(res.improvedCode).toBe('squares = [x*x for x in nums]')
    expect(res.changes).toHaveLength(1)
  })

  it('handles backend error responses gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          error: { code: 'BAD_REQUEST', message: 'Invalid Python syntax' },
        }),
    })

    await expect(
      refineService.refineCode({
        code: 'def bad(',
        goal: 'readability',
      })
    ).rejects.toThrow('Invalid Python syntax')
  })

  // --------------------------------------------------------------------------
  // 2. Verification Script Generation
  // --------------------------------------------------------------------------
  it('generates a valid isolated Python verification script comparing original & improved', () => {
    const orig = 'def add(a, b):\n    return a + b\nprint(add(2, 3))'
    const impr = 'def add(a, b):\n    """Docstring"""\n    return a + b\nprint(add(2, 3))'

    const script = buildVerificationScript(orig, impr)
    expect(script).toContain('orig_code =')
    expect(script).toContain('impr_code =')
    expect(script).toContain('__CODECRAFT_VERIFICATION_JSON__:')
    expect(script).toContain('run_isolated')
  })

  // --------------------------------------------------------------------------
  // 3. Verification Output Parser
  // --------------------------------------------------------------------------
  it('correctly parses raw Pyodide verification JSON output', () => {
    const rawPayload = JSON.stringify([
      {
        id: 'tc_1',
        description: 'Baseline Output & Return Value Check',
        inputLabel: 'Module execution',
        originalOutput: 'Hello World',
        improvedOutput: 'Hello World',
        passed: true,
        originalError: null,
        improvedError: null,
        executionTimeMs: { original: 15, improved: 12 },
      },
      {
        id: 'tc_2',
        description: 'Function call test',
        inputLabel: 'add(1, 2)',
        originalOutput: '3',
        improvedOutput: '3',
        passed: true,
        originalError: null,
        improvedError: null,
        executionTimeMs: { original: 8, improved: 6 },
      },
    ])

    const stdout = `Some Python logs...\n__CODECRAFT_VERIFICATION_JSON__:${rawPayload}\nDone.`
    const parsed = parseVerificationOutput(stdout)

    expect(parsed.totalCount).toBe(2)
    expect(parsed.passedCount).toBe(2)
    expect(parsed.areOutputsIdentical).toBe(true)
    expect(parsed.hasErrors).toBe(false)
    expect(parsed.summary).toContain('2/2 verification checks passed')
  })

  it('detects behavioral discrepancies and errors in verification output', () => {
    const rawPayload = JSON.stringify([
      {
        id: 'tc_1',
        description: 'Baseline Output Check',
        inputLabel: 'Module execution',
        originalOutput: 'Total: 10',
        improvedOutput: 'Total: 15',
        passed: false,
        originalError: null,
        improvedError: null,
        executionTimeMs: { original: 15, improved: 12 },
      },
    ])

    const stdout = `__CODECRAFT_VERIFICATION_JSON__:${rawPayload}`
    const parsed = parseVerificationOutput(stdout)

    expect(parsed.totalCount).toBe(1)
    expect(parsed.passedCount).toBe(0)
    expect(parsed.areOutputsIdentical).toBe(false)
    expect(parsed.hasErrors).toBe(false)
    expect(parsed.summary).toContain('Observable differences or errors detected')
  })

  // --------------------------------------------------------------------------
  // 4. Simulated Environment Verification Execution
  // --------------------------------------------------------------------------
  it('executes in Node / test environment returning simulated result', async () => {
    const res = await executeRefineVerification('print(1)', 'print(1)')
    expect(res.totalCount).toBeGreaterThan(0)
    expect(res.passedCount).toBeGreaterThan(0)
    expect(res.areOutputsIdentical).toBe(true)
  })
})
