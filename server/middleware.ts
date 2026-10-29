// ============================================================================
// CodeCraft Backend — Security Middleware, Rate Limiting & Validation
// ============================================================================

import type { Request, Response, NextFunction } from 'express'
import type { ApiErrorResponse } from './types.ts'

// In-memory rate limiter tracker
interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()
const WINDOW_MS = 15 * 60 * 1000 // 15 minute window
const MAX_REQUESTS_PER_WINDOW = 60 // 60 requests per 15 min per IP

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip'
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return next()
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000)
    res.setHeader('Retry-After', retryAfterSec.toString())
    const errPayload: ApiErrorResponse = {
      error: {
        code: 'RATE_LIMITED',
        message: `Too many AI requests. Please slow down and try again in ${retryAfterSec}s.`,
      },
    }
    res.status(429).json(errPayload)
    return
  }

  record.count++
  next()
}

/**
 * Validates request payload size and basic structure
 */
export function validateCodePayload(req: Request, res: Response, next: NextFunction): void {
  const body = req.body
  if (!body || typeof body !== 'object') {
    const errPayload: ApiErrorResponse = {
      error: {
        code: 'BAD_REQUEST',
        message: 'Request body must be a valid JSON object.',
      },
    }
    res.status(400).json(errPayload)
    return
  }

  if (typeof body.code !== 'string') {
    const errPayload: ApiErrorResponse = {
      error: {
        code: 'BAD_REQUEST',
        message: "Missing or invalid 'code' string field in request body.",
      },
    }
    res.status(400).json(errPayload)
    return
  }

  // 100KB code length cap
  if (body.code.length > 50000) {
    const errPayload: ApiErrorResponse = {
      error: {
        code: 'BAD_REQUEST',
        message: 'Submitted code exceeds the 50,000 character limit.',
      },
    }
    res.status(400).json(errPayload)
    return
  }

  next()
}

/**
 * Global Error Handler: Prevents leaking stack traces or credentials
 */
export function errorHandler(
  err: Error & { code?: string; status?: number; type?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle 100KB body-parser payload limit exceeded
  if (err.type === 'entity.too.large' || err.status === 413) {
    const errPayload: ApiErrorResponse = {
      error: {
        code: 'BAD_REQUEST',
        message: 'Request payload exceeds the 100KB size limit.',
      },
    }
    res.status(413).json(errPayload)
    return
  }

  const status = err.status || (err.code === 'MISSING_API_KEY' ? 401 : err.code === 'RATE_LIMITED' ? 429 : 500)
  const code = (err.code || 'INTERNAL_ERROR') as ApiErrorResponse['error']['code']

  const errResponse: ApiErrorResponse = {
    error: {
      code,
      message: err.message || 'An unexpected server error occurred.',
    },
  }

  res.status(status).json(errResponse)
}
