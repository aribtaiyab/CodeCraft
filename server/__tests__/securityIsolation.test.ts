// ============================================================================
// Automated Security Audit Tests: Server Execution Isolation & Credentials
// ============================================================================

import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.ts'
import { GroqClient } from '../groqClient.ts'
import { executePythonSnippet } from '../verificationEngine.ts'

describe('Security Audit: Server-Side Host Execution Isolation', () => {
  it('denies host Python execution for arbitrary code snippets', () => {
    // Test safe mock payload representing os/subprocess attempt
    const res = executePythonSnippet('import os; os.listdir(".")')
    expect(res.success).toBe(false)
    expect(res.stdout).toBeUndefined()
    expect(res.error).toContain('disabled for isolation and security')
  })

  it('denies host filesystem access attempts via executePythonSnippet', () => {
    const res = executePythonSnippet('f = open(".env", "r"); content = f.read()')
    expect(res.success).toBe(false)
    expect(res.stdout).toBeUndefined()
    expect(res.error).toContain('disabled for isolation and security')
  })

  it('POST /api/ai/generate-mcqs does not execute arbitrary hostile code on host', async () => {
    const mockFetch = async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                questions: [
                  {
                    id: 'q1',
                    question: 'What is printed by this code?',
                    options: ['output1', 'output2', 'output3', 'output4'],
                    correctIndex: 0,
                    explanation: 'Explanation',
                    conceptTag: 'output-print',
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
      apiKey: 'gsk_mock_valid_key',
    })
    const app = createApp(mockClient)

    // Send code with mock OS / environment probing syntax
    const res = await request(app)
      .post('/api/ai/generate-mcqs')
      .send({
        code: 'import os\nprint(os.environ.get("GROQ_API_KEY"))\n',
        count: 1,
        sourceHash: 'sec_test_hash',
      })

    expect(res.status).toBe(200)
    expect(res.body.questions.length).toBe(1)
    const q = res.body.questions[0]
    // Crucial check: Question is NOT execution-verified on the server
    expect(q.verifiedByExecution).toBe(false)
    expect(q.verificationNote).toContain('requires browser Pyodide execution')
    // Crucial check: No secret or environment variable is leaked in any response field
    expect(JSON.stringify(res.body)).not.toContain('gsk_')
  })

  it('GET /api/ai/health never exposes API keys or credential strings', async () => {
    const app = createApp()
    const res = await request(app).get('/api/ai/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.hasGroqKey).toBeDefined()
    // No sensitive properties
    expect(res.body.groqApiKey).toBeUndefined()
    expect(res.body.apiKey).toBeUndefined()
    expect(res.body.key).toBeUndefined()
    expect(res.body.env).toBeUndefined()
    expect(JSON.stringify(res.body)).not.toContain('gsk_')
  })

  it('rejects oversized code requests (>50,000 characters) before processing', async () => {
    const app = createApp()
    const oversizedCode = 'print("x")\n'.repeat(6000) // 72,000 chars
    const res = await request(app)
      .post('/api/ai/explain')
      .send({ code: oversizedCode, sourceHash: 'hash_oversized' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
    expect(res.body.error.message).toContain('50,000 character limit')
  })

  it('rejects oversized payload bodies (>100KB) with clean JSON error and no stack traces', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/ai/explain')
      .send({ code: 'x = 1', padding: 'a'.repeat(120 * 1024) })

    expect(res.status).toBe(413)
    expect(res.body.error.code).toBe('BAD_REQUEST')
    expect(res.body.error.message).toContain('100KB size limit')
    expect(res.body.stack).toBeUndefined()
  })
})
