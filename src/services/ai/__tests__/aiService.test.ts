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
})

