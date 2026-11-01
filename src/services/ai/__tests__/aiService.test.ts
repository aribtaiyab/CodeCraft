// ============================================================================
// Automated Tests: Frontend AI Service Client (Phase 5)
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiService, computeCodeHash } from '../aiService.ts'

describe('Frontend AiService Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('computes deterministic code hashes based on content and length', () => {
    const codeA = 'def add(a, b): return a + b\n'
    const codeB = 'def add(a, b): return a + b\n'
    const codeC = 'def sub(a, b): return a - b\n'

    expect(computeCodeHash(codeA)).toBe(computeCodeHash(codeB))
    expect(computeCodeHash(codeA)).not.toBe(computeCodeHash(codeC))
  })

  it('checkHealth returns ok status and model info from backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          hasGroqKey: true,
          model: 'llama-3.3-70b-versatile',
          version: '1.0.0',
        }),
      })
    )

    const health = await aiService.checkHealth()
    expect(health.status).toBe('ok')
    expect(health.hasGroqKey).toBe(true)
    expect(health.model).toBe('llama-3.3-70b-versatile')
  })

  it('checkHealth gracefully returns unreachable when backend server is offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Connection refused'))
    )

    const health = await aiService.checkHealth()
    expect(health.status).toBe('unreachable')
    expect(health.hasGroqKey).toBe(false)
  })

  it('explainCode sends code and selection payload to /api/ai/explain', async () => {
    let capturedBody = ''
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url, init) => {
        if (url === '/api/ai/explain') {
          capturedBody = String(init.body)
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'exp_123',
              sourceHash: 'hash_test',
              isStale: false,
              model: 'llama-3.3-70b-versatile',
              summary: 'Test summary',
              detailedExplanation: 'Test detail',
              lineExplanations: [],
              keyConcepts: ['Variables'],
              isSelectionOnly: true,
            }),
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })
    )

    const res = await aiService.explainCode('x = 10\ny = 20\n', { startLine: 1, endLine: 1 })
    expect(res.id).toBe('exp_123')
    expect(res.isSelectionOnly).toBe(true)
    expect(capturedBody).toContain('startLine":1')
  })

  it('explainCode parses full-program CS teacher explanation with 5 structured sections', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url === '/api/ai/explain') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'exp_full_456',
              sourceHash: 'hash_full',
              isStale: false,
              model: 'llama-3.3-70b-versatile',
              summary: 'Checks if text is a palindrome.',
              mainIdeaSteps: [
                '1. Receive argument.',
                '2. Lowercase text.',
                '3. Reverse with [::-1].',
                '4. Compare and return Boolean.',
              ],
              conceptDetails: [
                {
                  name: 'String Slicing',
                  meaning: 'Reverses text with [::-1]',
                  codeUsage: 'clean[::-1]',
                  example: '"a"[::-1]',
                },
              ],
              keyConcepts: ['String Slicing'],
              lineExplanations: [
                { line: 1, code: 'def is_pal(s):', explanation: 'Defines function.' },
              ],
              detailedExplanation: 'Full walkthrough.',
              expectedOutput: {
                output: 'Racecar is a palindrome',
                explanation: 'Condition is True.',
              },
              isSelectionOnly: false,
            }),
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })
    )

    const res = await aiService.explainCode('def is_pal(s):\n    return s == s[::-1]\n')
    expect(res.id).toBe('exp_full_456')
    expect(res.isSelectionOnly).toBe(false)
    expect(res.mainIdeaSteps?.length).toBe(4)
    expect(res.conceptDetails?.[0].name).toBe('String Slicing')
    expect(res.expectedOutput?.output).toBe('Racecar is a palindrome')
  })

  it('askQuestion sends question and runtimeContext to /api/ai/ask', async () => {
    let capturedBody = ''
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url, init) => {
        if (url === '/api/ai/ask') {
          capturedBody = String(init.body)
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'ask_123',
              sourceHash: 'hash_ask',
              isStale: false,
              model: 'llama-3.3-70b-versatile',
              answer: 'This is the answer',
              relevantLines: [2],
              followUpSuggestions: ['Next step?'],
            }),
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })
    )

    const res = await aiService.askQuestion({
      code: 'print("hello")',
      question: 'What does this print?',
      runtimeContext: { lastStdout: 'hello\n' },
    })

    expect(res.answer).toBe('This is the answer')
    expect(capturedBody).toContain('lastStdout":"hello\\n"')
  })

  it('generateMcqs requests code-specific MCQs from /api/ai/generate-mcqs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url) => {
        if (url === '/api/ai/generate-mcqs') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'mcq_123',
              sourceHash: 'hash_mcq',
              isStale: false,
              model: 'llama-3.3-70b-versatile',
              questions: [
                {
                  id: 'q1',
                  question: 'What is the value of x?',
                  options: ['1', '2', '3', '4'],
                  correctIndex: 0,
                  explanation: 'x is 1',
                  conceptTag: 'variables',
                  verifiedByExecution: true,
                },
              ],
            }),
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })
    )

    const res = await aiService.generateMcqs('x = 1', 1, 'variables')
    expect(res.questions.length).toBe(1)
    expect(res.questions[0].verifiedByExecution).toBe(true)
  })

  it('rejects oversized code payloads over 50,000 characters in explainCode without network request', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const longCode = 'a = 1\n'.repeat(10000)

    await expect(aiService.explainCode(longCode)).rejects.toThrow('50,000 character limit')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects oversized code payloads over 50,000 characters in askQuestion without network request', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const longCode = 'a = 1\n'.repeat(10000)

    await expect(
      aiService.askQuestion({ code: longCode, question: 'What is a?' })
    ).rejects.toThrow('50,000 character limit')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects oversized code payloads over 50,000 characters in generateMcqs without network request', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const longCode = 'a = 1\n'.repeat(10000)

    await expect(aiService.generateMcqs(longCode, 2)).rejects.toThrow('50,000 character limit')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
  it('normalizes raw Groq JSON validation errors to clean, actionable advice', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 'GROQ_API_ERROR',
            message: "Failed to generate JSON. Please adjust your prompt. See 'failed_generation' for more details.",
          },
        }),
      })
    )

    await expect(aiService.explainCode('print(1)')).rejects.toThrow(
      'The AI model could not format its response properly. Please click Retry to generate again.'
    )
  })

  it('normalizes 429 rate limit errors with friendly message and retryable flag', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests.',
            retryable: true,
          },
        }),
      })
    )

    try {
      await aiService.explainCode('print(1)')
      expect.fail('Should have thrown an error')
    } catch (err: unknown) {
      expect((err as Error).message).toContain('high traffic')
      expect((err as { retryable?: boolean }).retryable).toBe(true)
    }
  })

  it('aborts prior pending explain request when a new request is triggered concurrently', async () => {
    let abortSignalObserved = false

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url, init) => {
        const signal = init.signal as AbortSignal
        signal.addEventListener('abort', () => {
          abortSignalObserved = true
        })
        return new Promise(() => {}) // never resolves to keep first request pending
      })
    )

    // Trigger first request (do not await)
    aiService.explainCode('first = 1')

    // Trigger second request (will abort the first)
    aiService.explainCode('second = 2')

    expect(abortSignalObserved).toBe(true)
  })

})
