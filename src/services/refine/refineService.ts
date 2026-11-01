// ============================================================================
// CodeCraft — CodeRefine API Client Service
// ============================================================================

import type {
  RefineGoal,
  RefineAnalysisResponse,
  RefineHintResponse,
} from './types'
import { getApiUrl } from '../api/apiClient'

export function computeCodeHash(code: string): string {
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i)
    hash |= 0
  }
  return `hash_${Math.abs(hash)}_${code.length}`
}

function normalizeRefineError(
  errJson: { error?: { code?: string; message?: string; retryable?: boolean } },
  status: number
): Error & { code?: string; retryable?: boolean } {
  const code = errJson.error?.code || 'AI_ERROR'
  const rawMsg = errJson.error?.message || ''
  const retryable = errJson.error?.retryable ?? (status === 429 || status >= 500)

  let friendlyMessage = rawMsg

  if (code === 'RATE_LIMITED' || status === 429) {
    friendlyMessage = 'The AI service is experiencing high traffic. Please wait a moment and try again.'
  } else if (code === 'TIMEOUT' || status === 504) {
    friendlyMessage = 'The refinement request timed out. Please try with a smaller code snippet or click Retry.'
  } else if (code === 'MALFORMED_RESPONSE') {
    friendlyMessage = 'The AI generated an incomplete response. Please click Retry to analyze your code again.'
  } else if (code === 'AUTHENTICATION_ERROR' || code === 'MISSING_API_KEY' || status === 401) {
    friendlyMessage = 'AI service authentication is not configured. Please check the backend server configuration.'
  } else if (code === 'NETWORK_ERROR' || status === 503) {
    friendlyMessage = 'Unable to connect to the AI service. Please check your network connection.'
  } else if (code === 'MODEL_UNAVAILABLE' || status === 404) {
    friendlyMessage = 'The configured AI model is currently unavailable on this account.'
  } else if (
    rawMsg.includes('failed_generation') ||
    rawMsg.includes('Failed to generate JSON')
  ) {
    friendlyMessage = 'The AI model could not format its response properly. Please click Retry to generate again.'
  }

  if (!friendlyMessage) {
    friendlyMessage = `CodeRefine server error (${status})`
  }

  const err = new Error(friendlyMessage)
  ;(err as unknown as { code?: string; retryable?: boolean }).code = code
  ;(err as unknown as { code?: string; retryable?: boolean }).retryable = retryable
  return err as Error & { code?: string; retryable?: boolean }
}

class RefineService {
  private activeRefineController: AbortController | null = null
  private activeHintController: AbortController | null = null

  public async refineCode(options: {
    code: string
    goal: RefineGoal
    customGoalPrompt?: string
  }): Promise<RefineAnalysisResponse> {
    if (options.code.length > 50000) {
      throw new Error(
        'Code exceeds the 50,000 character limit. Please shorten your snippet before refining.'
      )
    }

    if (this.activeRefineController) {
      this.activeRefineController.abort()
    }

    const controller = new AbortController()
    this.activeRefineController = controller
    const sourceHash = computeCodeHash(options.code)

    try {
      const res = await fetch(getApiUrl('/api/ai/refine'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: options.code,
          goal: options.goal,
          customGoalPrompt: options.customGoalPrompt,
          sourceHash,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw normalizeRefineError(errJson, res.status)
      }

      const data: RefineAnalysisResponse = await res.json()
      return data
    } finally {
      if (this.activeRefineController === controller) {
        this.activeRefineController = null
      }
    }
  }

  public async getHint(options: {
    code: string
    goal: RefineGoal
    hintLevel: number
    customGoalPrompt?: string
  }): Promise<RefineHintResponse> {
    if (options.code.length > 50000) {
      throw new Error('Code exceeds 50,000 character limit.')
    }

    if (this.activeHintController) {
      this.activeHintController.abort()
    }

    const controller = new AbortController()
    this.activeHintController = controller
    const sourceHash = computeCodeHash(options.code)

    try {
      const res = await fetch(getApiUrl('/api/ai/refine-hint'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: options.code,
          goal: options.goal,
          hintLevel: options.hintLevel,
          customGoalPrompt: options.customGoalPrompt,
          sourceHash,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw normalizeRefineError(errJson, res.status)
      }

      const data: RefineHintResponse = await res.json()
      return data
    } finally {
      if (this.activeHintController === controller) {
        this.activeHintController = null
      }
    }
  }
}

export const refineService = new RefineService()

