// ============================================================================
// CodeCraft Frontend — AI Service Client (Communicates with Backend API)
// ============================================================================

import type {
  AiHealthStatus,
  ExplainResponse,
  AskResponse,
  GenerateMcqsResponse,
  LineRange,
  ChatMessage,
} from './types.ts'

export function computeCodeHash(code: string): string {
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i)
    hash |= 0
  }
  return `hash_${Math.abs(hash)}_${code.length}`
}

function normalizeAiError(
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
    friendlyMessage = 'The AI request timed out. Please try with a smaller code snippet or click Retry.'
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
    friendlyMessage = `AI Server Error (${status})`
  }

  const err = new Error(friendlyMessage)
  ;(err as unknown as { code?: string; retryable?: boolean }).code = code
  ;(err as unknown as { code?: string; retryable?: boolean }).retryable = retryable
  return err as Error & { code?: string; retryable?: boolean }
}

class AiService {
  private activeExplainController: AbortController | null = null
  private activeAskController: AbortController | null = null
  private activeMcqController: AbortController | null = null

  public async checkHealth(): Promise<AiHealthStatus> {
    try {
      const res = await fetch('/api/ai/health', {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        return { status: 'error', hasGroqKey: false, model: 'unknown' }
      }
      const data = await res.json()
      return {
        status: data.status || 'ok',
        hasGroqKey: !!data.hasGroqKey,
        model: data.model || 'openai/gpt-oss-120b',
        version: data.version,
      }
    } catch {
      return { status: 'unreachable', hasGroqKey: false, model: 'offline' }
    }
  }

  public async explainCode(
    code: string,
    selection?: LineRange
  ): Promise<ExplainResponse> {
    if (code.length > 50000) {
      throw new Error(
        'Code exceeds the 50,000 character limit. Please shorten your snippet before requesting an AI explanation.'
      )
    }

    if (this.activeExplainController) {
      this.activeExplainController.abort()
    }

    const controller = new AbortController()
    this.activeExplainController = controller
    const sourceHash = computeCodeHash(code)

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          selection,
          sourceHash,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw normalizeAiError(errJson, res.status)
      }

      const data: ExplainResponse = await res.json()
      return data
    } finally {
      if (this.activeExplainController === controller) {
        this.activeExplainController = null
      }
    }
  }

  public async askQuestion(options: {
    code: string
    question: string
    selection?: LineRange
    runtimeContext?: {
      lastStdout?: string
      lastError?: string
      traceSummary?: string
    }
    conversationHistory?: ChatMessage[]
  }): Promise<AskResponse> {
    if (options.code.length > 50000) {
      throw new Error(
        'Code exceeds the 50,000 character limit. Please shorten your snippet before asking.'
      )
    }

    if (this.activeAskController) {
      this.activeAskController.abort()
    }

    const controller = new AbortController()
    this.activeAskController = controller
    const sourceHash = computeCodeHash(options.code)

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: options.code,
          question: options.question,
          selection: options.selection,
          runtimeContext: options.runtimeContext,
          conversationHistory: options.conversationHistory?.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          sourceHash,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw normalizeAiError(errJson, res.status)
      }

      const data: AskResponse = await res.json()
      return data
    } finally {
      if (this.activeAskController === controller) {
        this.activeAskController = null
      }
    }
  }

  public async generateMcqs(
    code: string,
    count = 3,
    conceptTag?: string
  ): Promise<GenerateMcqsResponse> {
    if (code.length > 50000) {
      throw new Error(
        'Code exceeds the 50,000 character limit. Please shorten your snippet before generating a quiz.'
      )
    }

    if (this.activeMcqController) {
      this.activeMcqController.abort()
    }

    const controller = new AbortController()
    this.activeMcqController = controller
    const sourceHash = computeCodeHash(code)

    try {
      const res = await fetch('/api/ai/generate-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          count,
          conceptTag,
          sourceHash,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw normalizeAiError(errJson, res.status)
      }

      const data: GenerateMcqsResponse = await res.json()
      return data
    } finally {
      if (this.activeMcqController === controller) {
        this.activeMcqController = null
      }
    }
  }
}

export const aiService = new AiService()
