// ============================================================================
// CodeCraft Backend — Express Application & API Routes
// ============================================================================

import express, { type Express } from 'express'
import cors from 'cors'
import { config, hasGroqKey } from './config.ts'
import { GroqClient } from './groqClient.ts'
import { verifyAndFilterMcqs } from './verificationEngine.ts'
import { rateLimiter, validateCodePayload, errorHandler } from './middleware.ts'
import type {
  HealthResponse,
  ExplainRequest,
  AskRequest,
  GenerateMcqsRequest,
  ApiErrorResponse,
} from './types.ts'

export function createApp(groqClientInstance?: GroqClient): Express {
  const app = express()
  const client = groqClientInstance || new GroqClient()

  // CORS restricted to frontend dev/preview servers
  app.use(
    cors({
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
        'http://127.0.0.1:4173',
      ],
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // Request body parser with 100KB limit
  app.use(express.json({ limit: '100kb' }))

  // --------------------------------------------------------------------------
  // 1. Health & Status Check
  // --------------------------------------------------------------------------
  app.get('/api/ai/health', (_req, res) => {
    const health: HealthResponse = {
      status: 'ok',
      hasGroqKey: client.isConfigured() || hasGroqKey(),
      model: config.groqModel,
      version: '1.0.0',
    }
    res.json(health)
  })

  // --------------------------------------------------------------------------
  // 2. Explain Code or Selected Lines
  // --------------------------------------------------------------------------
  app.post(
    '/api/ai/explain',
    rateLimiter,
    validateCodePayload,
    async (req, res, next) => {
      try {
        const payload = req.body as ExplainRequest
        const result = await client.explainCode(payload)
        res.json(result)
      } catch (err) {
        next(err)
      }
    }
  )

  // --------------------------------------------------------------------------
  // 3. Contextual Follow-up Q&A
  // --------------------------------------------------------------------------
  app.post(
    '/api/ai/ask',
    rateLimiter,
    validateCodePayload,
    async (req, res, next) => {
      try {
        const payload = req.body as AskRequest
        if (!payload.question || typeof payload.question !== 'string' || payload.question.trim().length === 0) {
          const errPayload: ApiErrorResponse = {
            error: {
              code: 'BAD_REQUEST',
              message: "Missing or empty 'question' string in request body.",
            },
          }
          res.status(400).json(errPayload)
          return
        }

        const result = await client.askQuestion(payload)
        res.json(result)
      } catch (err) {
        next(err)
      }
    }
  )

  // --------------------------------------------------------------------------
  // 4. Generate & Verify Code-Specific MCQs
  // --------------------------------------------------------------------------
  app.post(
    '/api/ai/generate-mcqs',
    rateLimiter,
    validateCodePayload,
    async (req, res, next) => {
      try {
        const payload = req.body as GenerateMcqsRequest
        const rawResult = await client.generateMcqs(payload)

        // Verify and filter options through the verification engine
        const verified = verifyAndFilterMcqs(rawResult.questions, payload.code)

        res.json({
          ...rawResult,
          questions: verified.questions,
        })
      } catch (err) {
        next(err)
      }
    }
  )

  // Central error handling
  app.use(errorHandler)

  return app
}

export const app = createApp()
