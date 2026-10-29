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
        model: data.model || 'llama-3.3-70b-versatile',
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

    // Abort previous pending explain request to prevent race conditions
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
        const message = errJson.error?.message || `AI Server Error (${res.status})`
        const err = new Error(message)
        ;(err as unknown as { code?: string }).code = errJson.error?.code
        throw err
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
        const message = errJson.error?.message || `AI Server Error (${res.status})`
        const err = new Error(message)
        ;(err as unknown as { code?: string }).code = errJson.error?.code
        throw err
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
        const message = errJson.error?.message || `AI Server Error (${res.status})`
        const err = new Error(message)
        ;(err as unknown as { code?: string }).code = errJson.error?.code
        throw err
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
