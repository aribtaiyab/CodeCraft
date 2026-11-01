// ============================================================================
// CodeCraft Backend — Express Application & API Routes
// ============================================================================

import path from 'node:path'
import fs from 'node:fs'
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
  RefineRequest,
  RefineHintRequest,
  ApiErrorResponse,
} from './types.ts'

export function createApp(groqClientInstance?: GroqClient): Express {
  const app = express()
  const client = groqClientInstance || new GroqClient()

  // Default allowed origins for local dev / preview
  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ]
  const allowedOrigins = [...defaultOrigins, ...config.allowedOrigins]

  // CORS configured with local defaults and optional environment origins
  // Cross-Origin Isolation headers for SharedArrayBuffer & Pyodide execution
  app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
    next()
  })

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true)
        }
        return callback(null, false)
      },
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


  // --------------------------------------------------------------------------
  // 5. CodeRefine — Code Analysis & Refinement
  // --------------------------------------------------------------------------
  app.post(
    '/api/ai/refine',
    rateLimiter,
    validateCodePayload,
    async (req, res, next) => {
      try {
        const payload = req.body as RefineRequest
        if (!payload.goal) {
          payload.goal = 'readability'
        }
        const result = await client.refineCode(payload)
        res.json(result)
      } catch (err) {
        next(err)
      }
    }
  )

  // --------------------------------------------------------------------------
  // 6. CodeRefine — Progressive Hint for Manual Mode
  // --------------------------------------------------------------------------
  app.post(
    '/api/ai/refine-hint',
    rateLimiter,
    validateCodePayload,
    async (req, res, next) => {
      try {
        const payload = req.body as RefineHintRequest
        if (!payload.goal) {
          payload.goal = 'readability'
        }
        if (!payload.hintLevel || payload.hintLevel < 1) {
          payload.hintLevel = 1
        }
        const result = await client.getRefineHint(payload)
        res.json(result)
      } catch (err) {
        next(err)
      }
    }
  )

  // Production static asset serving & SPA fallback (active when dist/ exists)
  const distPath = path.resolve(process.cwd(), 'dist')
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next()
      }
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  // Central error handling
  app.use(errorHandler)

  return app
}

export const app = createApp()
