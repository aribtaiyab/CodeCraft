// ============================================================================
// Automated Tests: CodeCraft Phase 5 Backend API Endpoints & Security
// ============================================================================

import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.ts'
import { GroqClient } from '../groqClient.ts'
import { verifyAndFilterMcqs, executePythonSnippet } from '../verificationEngine.ts'
import type { McqQuestion } from '../types.ts'

describe('Phase 5 Backend API & Security Gates', () => {
  // --------------------------------------------------------------------------
  // 1. Health Endpoint
  // --------------------------------------------------------------------------
  it('GET /api/ai/health returns status and configured model without leaking credentials', async () => {
    const app = createApp()
    const res = await request(app).get('/api/ai/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.model).toBeDefined()
    expect(typeof res.body.hasGroqKey).toBe('boolean')
    // Security check: ensure no secret or API key string is exposed
    expect(res.body.groqApiKey).toBeUndefined()
    expect(res.body.apiKey).toBeUndefined()
    expect(JSON.stringify(res.body)).not.toContain('gsk_')
  })

  // --------------------------------------------------------------------------
  // 2. Request Validation
  // --------------------------------------------------------------------------
  it('rejects explain requests without code', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/ai/explain')
      .send({ sourceHash: 'hash123' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
    expect(res.body.error.message).toContain("'code'")
  })

  it('rejects ask requests without question string', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/ai/ask')
      .send({ code: 'x = 1', sourceHash: 'hash123' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
    expect(res.body.error.message).toContain("'question'")
  })

  it('rejects oversized code payloads over 50,000 characters', async () => {
    const app = createApp()
    const oversizedCode = 'a = 1\n'.repeat(10000)
    const res = await request(app)
      .post('/api/ai/explain')
      .send({ code: oversizedCode, sourceHash: 'hash123' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
    expect(res.body.error.message).toContain('character limit')
  })

  it('rejects oversized JSON payloads exceeding 100KB with clean JSON error', async () => {
    const app = createApp()
    const largePayload = {
      code: 'x = 1\n',
      sourceHash: 'h',
      padding: 'a'.repeat(120 * 1024), // 120KB
    }
    const res = await request(app)
      .post('/api/ai/explain')
      .send(largePayload)

    expect(res.status).toBe(413)
    expect(res.body.error.code).toBe('BAD_REQUEST')
    expect(res.body.error.message).toContain('100KB')
  })

  // --------------------------------------------------------------------------
  // 3. Missing Groq API Key Handling
  // --------------------------------------------------------------------------
  it('returns 401 MISSING_API_KEY with beginner-friendly instructions when key is missing', async () => {
    // Client initialized with empty API key
    const unconfiguredClient = new GroqClient({ apiKey: '' })
    const app = createApp(unconfiguredClient)

    const res = await request(app)
      .post('/api/ai/explain')
      .send({ code: 'print("hello")', sourceHash: 'hash123' })

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('MISSING_API_KEY')
    expect(res.body.error.message).toContain('GROQ_API_KEY in your local .env file')
  })

  // --------------------------------------------------------------------------
  // 4. Mocked Groq Code Explanation (Deterministic Unit Test)
  // --------------------------------------------------------------------------
  it('POST /api/ai/explain returns structured explanation and line breakdown (Mocked Groq)', async () => {
    const mockFetch = async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Calculates the factorial of a number iteratively.',
                detailedExplanation: 'Initializes result to 1 and iterates through 1 to n.',
                lineExplanations: [
                  { line: 1, code: 'def fact(n):', explanation: 'Defines the factorial function' },
                  { line: 2, code: '    res = 1', explanation: 'Initializes accumulator' },
                ],
                keyConcepts: ['Functions', 'Accumulator pattern'],
              }),
            },
          },
        ],
      }
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const mockClient = new GroqClient({
      customFetch: mockFetch as unknown as typeof fetch,
      apiKey: 'gsk_mock_valid_test_key_for_unit_tests',
    })
    const app = createApp(mockClient)

    const res = await request(app)
      .post('/api/ai/explain')
      .send({
        code: 'def fact(n):\n    res = 1\n    return res\n',
        sourceHash: 'source_abc123',
      })

    expect(res.status).toBe(200)
    expect(res.body.id).toContain('exp_')
    expect(res.body.sourceHash).toBe('source_abc123')
    expect(res.body.summary).toContain('factorial')
    expect(res.body.lineExplanations.length).toBe(2)
    expect(res.body.keyConcepts).toContain('Functions')
  })

  // --------------------------------------------------------------------------
  // 5. Selected Lines Explanation
  // --------------------------------------------------------------------------
  it('POST /api/ai/explain flags selected line range correctly', async () => {
    let capturedBody: string = ''
    const mockFetch = async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = String(init?.body || '')
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Explains selected slice',
                detailedExplanation: 'Lines 2-3 increment the counter.',
                lineExplanations: [{ line: 2, code: 'counter += 1', explanation: 'Increments counter' }],
                keyConcepts: ['Variables'],
              }),
            },
          },
        ],
      }
      return new Response(JSON.stringify(mockResponse), { status: 200 })
    }

    const mockClient = new GroqClient({
      customFetch: mockFetch as unknown as typeof fetch,
      apiKey: 'gsk_mock_test_key',
    })
    const app = createApp(mockClient)

    const res = await request(app)
      .post('/api/ai/explain')
      .send({
        code: 'counter = 0\ncounter += 1\nprint(counter)\n',
        selection: { startLine: 2, endLine: 2 },
        sourceHash: 'hash_lines2',
      })

    expect(res.status).toBe(200)
    expect(res.body.isSelectionOnly).toBe(true)
    expect(res.body.selectedRange.startLine).toBe(2)
    expect(capturedBody).toContain('lines 2 to 2')
  })

  // --------------------------------------------------------------------------
  // 6. Contextual Follow-up Q&A with Runtime Context
  // --------------------------------------------------------------------------
  it('POST /api/ai/ask incorporates runtime context and returns follow-ups (Mocked Groq)', async () => {
    let sentUserContent = ''
    const mockFetch = async (_url: string | URL | Request, init?: RequestInit) => {
      const parsedBody = JSON.parse(String(init?.body || '{}'))
      sentUserContent = parsedBody.messages?.find((m: { role: string }) => m.role === 'user')?.content || ''
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                answer: 'The ZeroDivisionError occurred because `len(nums)` was 0 when called with `[]`.',
                relevantLines: [3],
                followUpSuggestions: ['How to add a guard clause?', 'What is a default return value?'],
              }),
            },
          },
        ],
      }
      return new Response(JSON.stringify(mockResponse), { status: 200 })
    }

    const mockClient = new GroqClient({
      customFetch: mockFetch as unknown as typeof fetch,
      apiKey: 'gsk_mock_test_key',
    })
    const app = createApp(mockClient)

    const res = await request(app)
      .post('/api/ai/ask')
      .send({
        code: 'def avg(nums):\n    return sum(nums) / len(nums)\n',
        question: 'Why did my program crash on empty input?',
        runtimeContext: {
          lastError: 'ZeroDivisionError: division by zero',
          lastStdout: '',
        },
        sourceHash: 'hash_ask123',
      })

    expect(res.status).toBe(200)
    expect(res.body.id).toContain('ask_')
    expect(res.body.answer).toContain('ZeroDivisionError')
    expect(res.body.relevantLines).toContain(3)
    expect(res.body.followUpSuggestions.length).toBe(2)
    // Check that runtime error was passed to model
    expect(sentUserContent).toContain('ZeroDivisionError: division by zero')
  })

  // --------------------------------------------------------------------------
  // 7. MCQ Generation and Verification Engine
  // --------------------------------------------------------------------------
  it('POST /api/ai/generate-mcqs generates distinct options and verifies literal print output', async () => {
    const mockFetch = async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    id: 'q1',
                    question: 'What is printed to stdout when this script runs?',
                    options: ['Hello, CodeCraft!', 'Welcome', 'None', 'Error'],
                    correctIndex: 0,
                    explanation: 'The print statement outputs the literal string.',
                    conceptTag: 'output-print',
                  },
                  {
                    id: 'q2',
                    question: 'What type is the printed message?',
                    options: ['str', 'int', 'bool', 'list'],
                    correctIndex: 0,
                    explanation: 'Text inside quotes is a Python string.',
                    conceptTag: 'data-types',
                  },
                ],
              }),
            },
          },
        ],
      }
      return new Response(JSON.stringify(mockResponse), { status: 200 })
    }

    const mockClient = new GroqClient({
      customFetch: mockFetch as unknown as typeof fetch,
      apiKey: 'gsk_mock_test_key',
    })
    const app = createApp(mockClient)

    const sourceCode = 'print("Hello, CodeCraft!")\n'
    const res = await request(app)
      .post('/api/ai/generate-mcqs')
      .send({
        code: sourceCode,
        count: 2,
        sourceHash: 'hash_mcq1',
      })

    expect(res.status).toBe(200)
    expect(res.body.questions.length).toBe(2)

    const q1 = res.body.questions[0]
    expect(q1.options.length).toBe(4)
    // Question 1 asks for output and should be verified by the verification engine
    expect(q1.verifiedByExecution).toBe(true)
    expect(q1.verificationNote).toContain('Hello, CodeCraft!')

    const q2 = res.body.questions[1]
    expect(q2.verifiedByExecution).toBe(false)
    expect(q2.verificationNote).toContain('Conceptual reasoning')
  })

  // --------------------------------------------------------------------------
  // 8. Verification Engine Direct Unit Tests
  // --------------------------------------------------------------------------
  it('verificationEngine filters duplicate options and sets correct index', () => {
    const sampleQuestions: McqQuestion[] = [
      {
        id: 'q_test',
        question: 'What is the return value of compute()?',
        options: ['42', '42', '10', '0'], // Duplicates present
        correctIndex: 1,
        explanation: 'Returns 42',
        conceptTag: 'returns',
        verifiedByExecution: false,
      },
    ]

    const result = verifyAndFilterMcqs(sampleQuestions, 'def compute():\n    return 42\n')
    expect(result.questions[0].options.length).toBe(3) // deduplicated
    expect(result.questions[0].verifiedByExecution).toBe(true)
    expect(result.questions[0].verificationNote).toContain('42')
  })

  it('executePythonSnippet safely denies host execution to protect server isolation', () => {
    const res = executePythonSnippet('print(10 + 25)')
    expect(res.success).toBe(false)
    expect(res.error).toContain('disabled for isolation and security')
  })

  it('verificationEngine clearly labels conceptual questions and never presents them as execution-verified', () => {
    const conceptualQuestions: McqQuestion[] = [
      {
        id: 'q_concept',
        question: 'Which keyword in Python is used to define a function?',
        options: ['def', 'func', 'function', 'fn'],
        correctIndex: 0,
        explanation: 'The def keyword begins a function definition.',
        conceptTag: 'functions',
        verifiedByExecution: false,
      },
    ]

    const result = verifyAndFilterMcqs(conceptualQuestions, 'def greet():\n    pass\n')
    const q = result.questions[0]
    expect(q.verifiedByExecution).toBe(false)
    expect(q.verificationNote).toBe('Conceptual reasoning question — not evaluated by execution.')
  })

  // --------------------------------------------------------------------------
  // 9. Rate Limit & Timeout Handling
  // --------------------------------------------------------------------------
  it('handles Groq API 429 rate limit gracefully', async () => {
    const mockFetch = async () => {
      return new Response(
        JSON.stringify({ error: { message: 'Rate limit reached on Groq', type: 'rate_limit_exceeded' } }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const mockClient = new GroqClient({
      customFetch: mockFetch as unknown as typeof fetch,
      apiKey: 'gsk_mock_test_key',
    })
    const app = createApp(mockClient)

    const res = await request(app)
      .post('/api/ai/explain')
      .send({ code: 'x = 1', sourceHash: 'hash_rl' })

    expect(res.status).toBe(429)
    expect(res.body.error.code).toBe('RATE_LIMITED')
    expect(res.body.error.message).toContain('Rate limit reached')
  })
})
