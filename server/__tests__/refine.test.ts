// ============================================================================
// Automated Tests: CodeCraft Signature Feature CodeRefine Backend Engine
// ============================================================================

import { describe, it, expect, vi } from 'vitest'
import { GroqClient } from '../groqClient.ts'
import type { RefineAnalysisResponse } from '../types.ts'

describe('CodeRefine Backend Engine & Groq Integration', () => {
  const sampleCode = `def calc(nums):\n    total = 0\n    for n in nums:\n        total = total + n\n    return total`

  const mockRefineResponse: RefineAnalysisResponse = {
    id: 'refine_test_1',
    sourceHash: 'test_hash',
    isStale: false,
    model: 'llama-3.3-70b-versatile',
    goal: 'simplify',
    summary: 'Refactored to idiomatic Python using the built-in sum() function.',
    improvedCode: `def calc(nums):\n    return sum(nums)`,
    benefits: ['Cleaner, more readable implementation.'],
    tradeOffs: ['Ensure elements are iterable.'],
    changes: [
      {
        id: 'ch-1',
        originalSnippet: 'total = 0\nfor n in nums:\n    total = total + n\nreturn total',
        improvedSnippet: 'return sum(nums)',
        whatChanged: 'Replaced 4 lines of manual accumulation with a single built-in call.',
        whyChanged: 'Python provides an optimized C-level sum() function designed specifically for adding iterables.',
        howItWorks: 'sum() accepts any iterable, traverses it at the interpreter C-layer without bytecode overhead.',
        benefit: 'Reduces boilerplate and clarifies intent.',
      },
    ],
    progressiveHints: [
      'Look at lines 2 to 4 where a total is being accumulated.',
      'Python includes a powerful built-in function that sums all items in an iterable.',
      'Replace the loop entirely with: return sum(nums)',
    ],
  }

  // --------------------------------------------------------------------------
  // 1. Authentication check
  // --------------------------------------------------------------------------
  it('throws 401 MISSING_API_KEY if Groq client lacks API key', async () => {
    const client = new GroqClient({ apiKey: '' })

    await expect(
      client.refineCode({ code: sampleCode, goal: 'simplify', sourceHash: 'test_hash' })
    ).rejects.toMatchObject({
      code: 'MISSING_API_KEY',
      status: 401,
    })
  })

  // --------------------------------------------------------------------------
  // 2. Successful Refinement Analysis
  // --------------------------------------------------------------------------
  it('successfully analyzes and returns structured RefineAnalysisResponse', async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockRefineResponse),
                },
              },
            ],
          }),
          { status: 200 }
        )
      )
    )

    const client = new GroqClient({
      apiKey: 'gsk_mock_valid_key',
      customFetch: mockFetch as unknown as typeof fetch,
    })

    const res = await client.refineCode({
      code: sampleCode,
      goal: 'simplify',
      sourceHash: 'test_hash',
    })

    expect(res.summary).toContain('idiomatic Python')
    expect(res.improvedCode).toContain('return sum(nums)')
    expect(res.changes).toHaveLength(1)
    expect(res.changes[0].whyChanged).toContain('sum()')
    expect(res.tradeOffs).toBeDefined()
    expect(res.progressiveHints).toHaveLength(3)
  })

  // --------------------------------------------------------------------------
  // 3. Custom Goal Prompt Support
  // --------------------------------------------------------------------------
  it('incorporates custom goal prompt into user message sent to Groq', async () => {
    let capturedBody = ''
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      capturedBody = init.body
      return Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockRefineResponse),
                },
              },
            ],
          }),
          { status: 200 }
        )
      )
    })

    const client = new GroqClient({
      apiKey: 'gsk_mock_valid_key',
      customFetch: mockFetch as unknown as typeof fetch,
    })

    await client.refineCode({
      code: sampleCode,
      goal: 'custom',
      customGoalPrompt: 'Convert into a one-liner lambda expression',
      sourceHash: 'test_hash',
    })

    expect(capturedBody).toContain('Convert into a one-liner lambda expression')
  })

  // --------------------------------------------------------------------------
  // 4. Progressive Hints for Manual Mode
  // --------------------------------------------------------------------------
  it('successfully generates progressive hint from getRefineHint', async () => {
    const mockHint = {
      hint: 'Python provides a built-in sum() function that eliminates the accumulator loop.',
      focusArea: 'lines 2-4',
    }

    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockHint),
                },
              },
            ],
          }),
          { status: 200 }
        )
      )
    )

    const client = new GroqClient({
      apiKey: 'gsk_mock_valid_key',
      customFetch: mockFetch as unknown as typeof fetch,
    })

    const res = await client.getRefineHint({
      code: sampleCode,
      goal: 'simplify',
      hintLevel: 2,
      sourceHash: 'test_hash',
    })

    expect(res.hintLevel).toBe(2)
    expect(res.hint).toContain('sum()')
    expect(res.focusArea).toBe('lines 2-4')
    expect(res.nextAvailable).toBe(true)
  })

  it('clamps hintLevel between 1 and 3', async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({ hint: 'Nudge' }),
                },
              },
            ],
          }),
          { status: 200 }
        )
      )
    )

    const client = new GroqClient({
      apiKey: 'gsk_mock_valid_key',
      customFetch: mockFetch as unknown as typeof fetch,
    })

    const resMax = await client.getRefineHint({
      code: sampleCode,
      goal: 'simplify',
      hintLevel: 10,
      sourceHash: 'test_hash',
    })
    expect(resMax.hintLevel).toBe(3)
    expect(resMax.nextAvailable).toBe(false)
  })

  // --------------------------------------------------------------------------
  // 5. Verification of the Two Distinct Goals (Performance vs Easy to Understand)
  // --------------------------------------------------------------------------
  it('differentiates prompt behaviour between Performance Optimization and Easy to Understand in AI Assistance mode', async () => {
    let capturedSystemPrompt = ''
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      const parsedBody = JSON.parse(init.body)
      capturedSystemPrompt = parsedBody.messages[0].content
      return Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(mockRefineResponse) } }],
          }),
          { status: 200 }
        )
      )
    })

    const client = new GroqClient({
      apiKey: 'gsk_mock_valid_key',
      customFetch: mockFetch as unknown as typeof fetch,
    })

    // Test Goal 1: Performance Optimization in AI Assistance
    await client.refineCode({
      code: sampleCode,
      goal: 'performance',
      sourceHash: 'perf_hash',
    })
    expect(capturedSystemPrompt).toContain('PERFORMANCE')
    expect(capturedSystemPrompt).toContain('execution efficiency')
    expect(capturedSystemPrompt).toContain('NEVER claim code is faster without concrete algorithmic or complexity evidence')

    // Test Goal 2: Easy to Understand in AI Assistance
    await client.refineCode({
      code: sampleCode,
      goal: 'easy_to_understand',
      sourceHash: 'easy_hash',
    })
    expect(capturedSystemPrompt).toContain('EASY_TO_UNDERSTAND')
    expect(capturedSystemPrompt).toContain('Make code cleaner, simpler, and easier for beginners to understand')
    expect(capturedSystemPrompt).toContain('beginner-friendly language')
  })

  it('differentiates prompt guidance between Performance Optimization and Easy to Understand in Manual Practice mode', async () => {
    let capturedSystemPrompt = ''
    const mockFetch = vi.fn().mockImplementation((_url, init) => {
      const parsedBody = JSON.parse(init.body)
      capturedSystemPrompt = parsedBody.messages[0].content
      return Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify({ hint: 'Nudge' }) } }],
          }),
          { status: 200 }
        )
      )
    })

    const client = new GroqClient({
      apiKey: 'gsk_mock_valid_key',
      customFetch: mockFetch as unknown as typeof fetch,
    })

    // Test Goal 1 in Manual Practice (Hint Level 1)
    const perfHint = await client.getRefineHint({
      code: sampleCode,
      goal: 'performance',
      hintLevel: 1,
      sourceHash: 'perf_hash',
    })
    expect(perfHint.hintLevel).toBe(1)
    expect(capturedSystemPrompt).toContain('PERFORMANCE')
    expect(capturedSystemPrompt).toContain('inefficient operations')

    // Test Goal 2 in Manual Practice (Hint Level 2)
    const easyHint = await client.getRefineHint({
      code: sampleCode,
      goal: 'easy_to_understand',
      hintLevel: 2,
      sourceHash: 'easy_hash',
    })
    expect(easyHint.hintLevel).toBe(2)
    expect(capturedSystemPrompt).toContain('EASY_TO_UNDERSTAND')
    expect(capturedSystemPrompt).toContain('variable names, complicated conditionals')
  })
})
