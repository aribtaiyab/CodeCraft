// ============================================================================
// CodeCraft Backend — Resilient Groq API Client with Auto-Repair & Safe Fallbacks
// ============================================================================

import { config } from './config.ts'
import type {
  ExplainRequest,
  ExplainResponse,
  AskRequest,
  AskResponse,
  GenerateMcqsRequest,
  GenerateMcqsResponse,
  McqQuestion,
  RefineGoal,
  RefineChangeItem,
  RefineAnalysisResponse,
  RefineRequest,
  RefineHintRequest,
  RefineHintResponse,
  ApiErrorCode,
} from './types.ts'

export type FetchFn = typeof fetch

export interface AppError extends Error {
  code: ApiErrorCode
  status: number
  retryable?: boolean
  details?: unknown
}

export function createAppError(
  message: string,
  code: ApiErrorCode,
  status = 500,
  retryable = false,
  details?: unknown
): AppError {
  const err = new Error(message) as AppError
  err.code = code
  err.status = status
  err.retryable = retryable
  err.details = details
  return err
}

/**
 * Robust JSON Extractor & Repairer
 * 
 * Safely handles:
 * - Markdown fences (```json ... ```)
 * - Leading/trailing conversational text
 * - Truncated JSON caused by token budget ceilings
 * - Unclosed string literals, unclosed arrays, and unclosed braces
 */
export function cleanAndRepairJson<T = Record<string, unknown>>(raw: string | undefined | null): T | null {
  if (!raw || typeof raw !== 'string') return null

  let text = raw.trim()

  // 1. Strip markdown code fences if wrapped
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '')
    const lastFence = text.lastIndexOf('```')
    if (lastFence !== -1) {
      text = text.slice(0, lastFence).trim()
    }
  }

  // 2. Direct JSON.parse
  try {
    return JSON.parse(text) as T
  } catch {
    // Proceed to structural repair
  }

  // 3. Extract outermost { ... } or [ ... ]
  const firstBrace = text.indexOf('{')
  const firstBracket = text.indexOf('[')
  const startIndex =
    firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)
      ? firstBrace
      : firstBracket

  if (startIndex === -1) return null
  text = text.slice(startIndex)

  const isArray = text.startsWith('[')
  const closingChar = isArray ? ']' : '}'
  const lastClosing = text.lastIndexOf(closingChar)
  if (lastClosing > 0) {
    try {
      return JSON.parse(text.slice(0, lastClosing + 1)) as T
    } catch {
      // Proceed to deeper backtrack repair
    }
  }

  // 4. Backtracking repair for cut-off / truncated JSON
  const candidate = text
  for (let len = candidate.length; len > 10; len--) {
    let sub = candidate.slice(0, len)

    // Check if within an unclosed string
    let inString = false
    for (let i = 0; i < sub.length; i++) {
      if (sub[i] === '"' && (i === 0 || sub[i - 1] !== '\\')) {
        inString = !inString
      }
    }
    if (inString) {
      sub += '"'
    }

    // Strip trailing commas before closing
    sub = sub.replace(/,\s*$/, '')

    // Balance open braces and brackets in LIFO order
    const stack: string[] = []
    inString = false
    for (let i = 0; i < sub.length; i++) {
      if (sub[i] === '"' && (i === 0 || sub[i - 1] !== '\\')) {
        inString = !inString
      } else if (!inString) {
        if (sub[i] === '{') stack.push('}')
        else if (sub[i] === '[') stack.push(']')
        else if (sub[i] === '}' || sub[i] === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === sub[i]) {
            stack.pop()
          }
        }
      }
    }

    let closing = ''
    while (stack.length > 0) {
      closing += stack.pop()
    }

    try {
      const repaired = JSON.parse(sub + closing) as T
      return repaired
    } catch {
      // Continue trimming
    }
  }

  return null
}

export class GroqClient {
  private customFetch?: FetchFn
  private overrideApiKey?: string
  private overrideModel?: string
  private triedModels = new Set<string>()

  constructor(options?: { customFetch?: FetchFn; apiKey?: string; model?: string }) {
    this.customFetch = options?.customFetch
    this.overrideApiKey = options?.apiKey
    this.overrideModel = options?.model
  }

  private get apiKey(): string {
    return this.overrideApiKey ?? config.groqApiKey
  }

  public get model(): string {
    return this.overrideModel ?? config.groqModel
  }

  private get fetchFn(): FetchFn {
    return this.customFetch ?? fetch
  }

  public isConfigured(): boolean {
    const key = this.apiKey
    return key.length > 0 && key !== 'your_groq_api_key_here'
  }

  private isReasoningModel(modelName: string): boolean {
    const lower = modelName.toLowerCase()
    return (
      lower.includes('oss') ||
      lower.includes('r1') ||
      lower.includes('reasoning') ||
      lower.includes('deepseek')
    )
  }

  public async callGroqChat(
    messages: Array<{ role: string; content: string }>,
    responseFormat?: { type: 'json_object' },
    isRetry = false
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw createAppError(
        'Groq API key is not configured on the CodeCraft backend server. Please configure GROQ_API_KEY in your local .env file.',
        'MISSING_API_KEY',
        401,
        false
      )
    }

    this.triedModels.add(this.model)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs)

    try {
      const bodyPayload: Record<string, unknown> = {
        model: this.model,
        messages,
        temperature: 0.2,
        max_tokens: config.maxTokens,
      }

      if (responseFormat) {
        bodyPayload.response_format = responseFormat
      }

      // If calling a reasoning model, output reasoning in parsed mode so content stays clean JSON
      if (this.isReasoningModel(this.model)) {
        bodyPayload.reasoning_format = 'parsed'
      }

      const res = await this.fetchFn(config.groqApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errorText = await res.text()
        let errorData: {
          error?: {
            message?: string
            type?: string
            code?: string
            failed_generation?: string
          }
        } = {}

        try {
          errorData = JSON.parse(errorText)
        } catch {
          // Non-JSON error payload
        }

        const rawMessage = errorData.error?.message || `Groq API HTTP ${res.status}: ${res.statusText}`
        const errorCode = errorData.error?.code || ''

        // 1. Model Availability / Not Found -> Controlled Fallback
        const isModelUnavailable =
          res.status === 404 ||
          errorCode === 'model_not_found' ||
          rawMessage.includes('does not exist or you do not have access')

        if (isModelUnavailable) {
          const fallbackCandidates = [
            'openai/gpt-oss-120b',
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
          ]
          const nextModel = fallbackCandidates.find((m) => !this.triedModels.has(m))

          if (nextModel) {
            console.warn(
              `[GroqClient] Model '${this.model}' is not available on this account. Falling back to '${nextModel}'...`
            )
            this.overrideModel = nextModel
            return this.callGroqChat(messages, responseFormat, true)
          }

          throw createAppError(
            `The configured AI model '${this.model}' is unavailable on your Groq account.`,
            'MODEL_UNAVAILABLE',
            404,
            false
          )
        }

        // 2. Groq JSON validation error with failed_generation -> Attempt In-Memory Repair
        if (
          res.status === 400 &&
          (errorCode === 'json_validate_failed' || rawMessage.includes('Failed to generate JSON'))
        ) {
          const failedGen = errorData.error?.failed_generation
          if (failedGen) {
            const repaired = cleanAndRepairJson<Record<string, unknown>>(failedGen)
            if (repaired && typeof repaired === 'object' && Object.keys(repaired).length > 0) {
              console.warn(
                `[GroqClient] Successfully recovered valid structured data from Groq failed_generation payload.`
              )
              return JSON.stringify(repaired)
            }
          }

          // If recovery from failed_generation didn't work and we haven't retried yet, retry once with plain extraction
          if (!isRetry) {
            console.warn(
              `[GroqClient] JSON mode rejected by Groq. Retrying without strict json_object response_format...`
            )
            return this.callGroqChat(messages, undefined, true)
          }

          throw createAppError(
            'The AI service generated an incomplete response. Please click Retry.',
            'MALFORMED_RESPONSE',
            502,
            true
          )
        }

        // 3. Authentication & Credential Errors
        if (res.status === 401 || rawMessage.toLowerCase().includes('invalid api key')) {
          throw createAppError(
            'Invalid Groq API key. Please check your credentials in the server configuration.',
            'AUTHENTICATION_ERROR',
            401,
            false
          )
        }

        // 4. Rate Limits
        if (res.status === 429) {
          throw createAppError(
            'Rate limit reached on Groq AI service. Please wait a moment and try again.',
            'RATE_LIMITED',
            429,
            true
          )
        }

        // 5. Quota / Billing Exceeded
        if (
          res.status === 402 ||
          rawMessage.toLowerCase().includes('quota') ||
          rawMessage.toLowerCase().includes('billing')
        ) {
          throw createAppError(
            'Groq API quota or billing limit exceeded. Please check your account usage.',
            'INSUFFICIENT_QUOTA',
            402,
            false
          )
        }

        // 6. Provider 5xx Server Errors
        if (res.status >= 500) {
          throw createAppError(
            'Groq AI service is temporarily unavailable. Please retry in a moment.',
            'PROVIDER_ERROR',
            502,
            true
          )
        }

        // Generic Provider Error
        throw createAppError(
          'An error occurred while communicating with the AI service. Please try again.',
          'GROQ_API_ERROR',
          res.status,
          true
        )
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = data.choices?.[0]?.message?.content
      if (!content || content.trim().length === 0) {
        throw createAppError(
          'The AI service returned an empty response. Please retry.',
          'EMPTY_RESPONSE',
          502,
          true
        )
      }

      return content
    } catch (err: unknown) {
      clearTimeout(timeoutId)

      // Preserve custom AppErrors
      if ((err as AppError).code && (err as AppError).status) {
        throw err
      }

      // Abort / Timeout
      if ((err as Error).name === 'AbortError') {
        throw createAppError(
          `Groq API request timed out after ${config.requestTimeoutMs / 1000}s. Please retry with a smaller code snippet.`,
          'TIMEOUT',
          504,
          true
        )
      }

      // Network / Fetch failure
      if (
        (err as Error).message?.includes('fetch failed') ||
        (err as Error).message?.includes('ENOTFOUND') ||
        (err as Error).message?.includes('ECONNREFUSED')
      ) {
        throw createAppError(
          'Unable to connect to the Groq AI service. Please check network connectivity.',
          'NETWORK_ERROR',
          503,
          true
        )
      }

      throw createAppError(
        (err as Error).message || 'An unexpected error occurred during AI generation.',
        'INTERNAL_ERROR',
        500,
        false
      )
    }
  }

  // --------------------------------------------------------------------------
  // 1. Explain Code / Selected Lines
  // --------------------------------------------------------------------------
  public async explainCode(req: ExplainRequest): Promise<ExplainResponse> {
    const lines = req.code.split('\n')
    const isSelectionOnly =
      req.selection !== undefined &&
      req.selection.startLine >= 1 &&
      req.selection.endLine <= lines.length &&
      req.selection.startLine <= req.selection.endLine

    let targetCodeDescription: string
    let systemPrompt: string

    if (isSelectionOnly) {
      const startLine = req.selection!.startLine
      const endLine = req.selection!.endLine
      const selectedSlice = lines.slice(startLine - 1, endLine).join('\n')

      const contextStart = Math.max(1, startLine - 4)
      const contextEnd = Math.min(lines.length, endLine + 4)
      const surroundingSlice = lines
        .slice(contextStart - 1, contextEnd)
        .map((l, idx) => `Line ${contextStart + idx}: ${l}`)
        .join('\n')

      targetCodeDescription = `The student selected lines ${startLine} to ${endLine} within their Python program:
\`\`\`python
${selectedSlice}
\`\`\`
Surrounding context (lines ${contextStart} to ${contextEnd}):
\`\`\`python
${surroundingSlice}
\`\`\`
Full program:
\`\`\`python
${req.code}
\`\`\``

      systemPrompt = `You are CodeCraft's Expert Computer Science Teacher.
The student selected specific lines (${startLine} to ${endLine}) in their Python code.
Explain these lines clearly, how they interact with surrounding code, and which concepts they demonstrate.

Rules:
1. Explain what happens, why, and how variables/functions are affected.
2. Provide line-by-line breakdown for the selected lines.
3. Return ONLY a valid JSON object starting with { and ending with }.

Required JSON Schema:
{
  "summary": "1-2 sentence overview of what the selected lines do",
  "detailedExplanation": "Clear, step-by-step contextual explanation.",
  "lineExplanations": [
    { "line": ${startLine}, "code": "line code", "explanation": "clear explanation" }
  ],
  "keyConcepts": ["Concept 1", "Concept 2"]
}`
    } else {
      targetCodeDescription = `Full Python program:
\`\`\`python
${req.code}
\`\`\``

      systemPrompt = `You are CodeCraft's Expert Computer Science Teacher.
Teach Python with pedagogical excellence: explain WHAT happens, HOW it works, and WHY it is written this way.

Structure your response clearly and concisely:
A) WHAT IT DOES: 2-3 sentence high-level overview.
B) EXECUTION STEPS: Numbered logical steps in order of execution.
C) CONCEPTS USED: Key programming concepts actually demonstrated in this code.
D) LINE-BY-LINE BREAKDOWN: Line number, code, and 1-2 sentence explanation for meaningful lines.
E) FINAL OUTPUT: Expected terminal output and a short reason why.

Return ONLY a valid JSON object starting with { and ending with }.

Required JSON Schema:
{
  "summary": "2-3 sentence overview of what the program accomplishes",
  "mainIdeaSteps": [
    "1. First step in execution order...",
    "2. Next step explaining what happens..."
  ],
  "conceptDetails": [
    {
      "name": "Concept Name",
      "meaning": "Simple plain English definition",
      "codeUsage": "How it is used in this code"
    }
  ],
  "keyConcepts": ["Concept 1", "Concept 2"],
  "lineExplanations": [
    { "line": 1, "code": "code snippet", "explanation": "what this line does" }
  ],
  "detailedExplanation": "Synthesized 1-2 paragraph overview connecting the execution logic together.",
  "expectedOutput": {
    "output": "Expected terminal output",
    "explanation": "Why this output is produced"
  }
}`
    }

    const rawOutput = await this.callGroqChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: targetCodeDescription },
      ],
      { type: 'json_object' }
    )

    const parsed = cleanAndRepairJson<{
      summary?: string
      detailedExplanation?: string
      lineExplanations?: Array<{ line: number; code?: string; explanation: string }>
      keyConcepts?: string[]
      conceptDetails?: Array<{ name: string; meaning: string; codeUsage: string; example?: string }>
      mainIdeaSteps?: string[]
      expectedOutput?: { output: string; explanation: string }
    }>(rawOutput)

    if (!parsed || typeof parsed !== 'object') {
      throw createAppError(
        'The AI model response could not be parsed into valid JSON. Please try again.',
        'MALFORMED_RESPONSE',
        502,
        true
      )
    }

    // Sanitize and format lineExplanations
    const formattedLines = (parsed.lineExplanations || []).map((le) => ({
      line: Number(le.line) || 1,
      code: le.code || lines[Number(le.line) - 1] || '',
      explanation: le.explanation || '',
    }))

    const keyConcepts =
      parsed.keyConcepts && parsed.keyConcepts.length > 0
        ? parsed.keyConcepts
        : (parsed.conceptDetails || []).map((c) => c.name)

    const summary = parsed.summary || 'Code analysis complete.'
    const detailedExplanation =
      parsed.detailedExplanation ||
      (parsed.mainIdeaSteps && parsed.mainIdeaSteps.length > 0
        ? parsed.mainIdeaSteps.join('\n')
        : summary)

    return {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sourceHash: req.sourceHash,
      isStale: false,
      model: this.model,
      summary,
      detailedExplanation,
      lineExplanations: formattedLines,
      keyConcepts,
      conceptDetails: parsed.conceptDetails,
      mainIdeaSteps: parsed.mainIdeaSteps,
      expectedOutput: parsed.expectedOutput
        ? {
            output: String(parsed.expectedOutput.output ?? ''),
            explanation: String(parsed.expectedOutput.explanation ?? ''),
          }
        : undefined,
      isSelectionOnly: !!isSelectionOnly,
      selectedRange: isSelectionOnly ? req.selection : undefined,
    }
  }

  // --------------------------------------------------------------------------
  // 2. Contextual Follow-up Q&A
  // --------------------------------------------------------------------------
  public async askQuestion(req: AskRequest): Promise<AskResponse> {
    const systemPrompt = `You are CodeCraft's Interactive Python Coding Assistant.
The student is asking a follow-up question about their Python code.
Ground your answer directly in the student's code and provided runtime output.
Return ONLY a valid JSON object starting with { and ending with }.

Required JSON Schema:
{
  "answer": "Clear, markdown-formatted answer directly addressing the question",
  "relevantLines": [1, 2],
  "followUpSuggestions": ["Helpful suggestion 1", "Helpful suggestion 2"]
}`

    let userContext = `Student's Code:
\`\`\`python
${req.code}
\`\`\``

    if (req.selection) {
      userContext += `\nSelected Lines: ${req.selection.startLine} to ${req.selection.endLine}`
    }

    if (req.runtimeContext) {
      if (req.runtimeContext.lastStdout) {
        userContext += `\nLast Program Output (stdout):\n${req.runtimeContext.lastStdout}`
      }
      if (req.runtimeContext.lastError) {
        userContext += `\nLast Program Error / Traceback:\n${req.runtimeContext.lastError}`
      }
      if (req.runtimeContext.traceSummary) {
        userContext += `\nExecution Trace Summary:\n${req.runtimeContext.traceSummary}`
      }
    }

    userContext += `\n\nStudent Question: ${req.question}`

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    if (req.conversationHistory && req.conversationHistory.length > 0) {
      for (const msg of req.conversationHistory.slice(-4)) {
        messages.push({ role: msg.role, content: msg.content })
      }
    }

    messages.push({ role: 'user', content: userContext })

    const rawOutput = await this.callGroqChat(messages, { type: 'json_object' })

    const parsed = cleanAndRepairJson<{
      answer?: string
      relevantLines?: number[]
      followUpSuggestions?: string[]
    }>(rawOutput)

    if (!parsed || typeof parsed !== 'object') {
      throw createAppError(
        'The AI service could not format the answer. Please try asking again.',
        'MALFORMED_RESPONSE',
        502,
        true
      )
    }

    return {
      id: `ask_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sourceHash: req.sourceHash,
      isStale: false,
      model: this.model,
      answer: parsed.answer || 'No response generated.',
      relevantLines: parsed.relevantLines || [],
      followUpSuggestions: parsed.followUpSuggestions || [
        'How does this work with different inputs?',
        'Can this be optimized?',
      ],
    }
  }

  // --------------------------------------------------------------------------
  // 3. Generate Code-Specific MCQs
  // --------------------------------------------------------------------------
  public async generateMcqs(req: GenerateMcqsRequest): Promise<GenerateMcqsResponse> {
    const questionCount = Math.min(Math.max(req.count || 3, 1), 5)

    const systemPrompt = `You are CodeCraft's Python Assessment Engine.
Create ${questionCount} multiple-choice questions strictly based on the provided Python code.
Every question must have exactly 4 distinct options and an integer correctIndex (0-3).
Return ONLY a valid JSON object starting with { and ending with }.

Required JSON Schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why Option A is correct",
      "conceptTag": "control-flow"
    }
  ]
}`

    const rawOutput = await this.callGroqChat(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate ${questionCount} MCQs for this code:\n\`\`\`python\n${req.code}\n\`\`\`${
            req.conceptTag ? `\nTarget Concept: ${req.conceptTag}` : ''
          }`,
        },
      ],
      { type: 'json_object' }
    )

    const parsed = cleanAndRepairJson<{ questions?: McqQuestion[] }>(rawOutput)

    if (!parsed || !Array.isArray(parsed.questions)) {
      throw createAppError(
        'The AI service could not format the quiz questions. Please try again.',
        'MALFORMED_RESPONSE',
        502,
        true
      )
    }

    const rawQuestions = parsed.questions || []
    const validatedQuestions: McqQuestion[] = []

    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i]
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) continue

      const uniqueOptions = Array.from(new Set(q.options.map((opt) => String(opt).trim())))
      if (uniqueOptions.length < 2) continue

      let correctIndex = Number(q.correctIndex)
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= uniqueOptions.length) {
        correctIndex = 0
      }

      validatedQuestions.push({
        id: q.id || `q_${i + 1}`,
        question: q.question,
        options: uniqueOptions,
        correctIndex,
        explanation: q.explanation || 'Verified correct answer.',
        conceptTag: q.conceptTag || 'general-python',
        verifiedByExecution: false,
      })
    }

    if (validatedQuestions.length === 0) {
      throw createAppError(
        'Unable to generate valid multiple choice questions for this code snippet. Please try again.',
        'VALIDATION_FAILED',
        502,
        true
      )
    }

    return {
      id: `mcq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sourceHash: req.sourceHash,
      isStale: false,
      model: this.model,
      questions: validatedQuestions,
    }
  }
  // --------------------------------------------------------------------------
  // 4. CodeRefine: Code Analysis & Improvement
  // --------------------------------------------------------------------------
  public async refineCode(req: RefineRequest): Promise<RefineAnalysisResponse> {
    const goal = req.goal || 'readability'
    const goalDescriptions: Record<RefineGoal, string> = {
      readability: 'Improve code clarity, readability, Pythonic idioms, and self-documenting structure without changing behaviour.',
      dry: "Eliminate duplicate code or repeated logic (Don't Repeat Yourself) by extracting clean helper functions or parameters.",
      structure: 'Improve overall function structure, separation of concerns, and single-responsibility organization.',
      naming: 'Improve variable and function names to be clear, descriptive, and follow PEP 8 snake_case conventions.',
      simplify: 'Simplify complicated logic, flatten nested if/else ladders using guard clauses, and remove redundant boolean checks.',
      custom: req.customGoalPrompt || 'Follow the specific refinement request supplied by the student.',
    }

    const goalDesc = goalDescriptions[goal] || goalDescriptions.readability

    const systemPrompt = `You are CodeCraft's Expert Python Architect & CodeRefine Mentor.
Tagline: "Write better. Understand why."
Your mission: Analyze working Python code, generate an improved version aligned with the user's selected improvement goal, and explain EVERY important change in beginner-friendly language with honest trade-off analysis.

Crucial Pedagogical Rules:
1. Preserve intended program behaviour.
2. Focus strictly on this improvement goal: ${goal.toUpperCase()} (${goalDesc})
3. Only make purposeful, high-value improvements. Never make pointless cosmetic changes or "code golf" one-liners that harm clarity.
4. If the student's code is already clean, idiomatic, and well-structured for this goal, set "isAlreadyClean": true and explain honestly why it is already good, offering only small optional polish suggestions.
5. Never claim that shorter code is automatically faster or better. Explain honest trade-offs (e.g. readability vs debugging step-through, memory, or function call overhead).
6. Explain each meaningful change individually:
   - What changed
   - Why it was changed
   - How the improved code works under the hood
   - The concrete benefit
   - Any trade-off or limitation
7. Provide 3 progressive hints for students who want to attempt the improvement manually.
8. Return ONLY a valid JSON object starting with { and ending with }.

Required JSON Schema:
{
  "summary": "1-2 sentence high-level overview of the improvement",
  "improvedCode": "Complete, valid improved Python program",
  "isAlreadyClean": false,
  "changes": [
    {
      "id": "c1",
      "originalSnippet": "original code block",
      "improvedSnippet": "improved code block",
      "whatChanged": "What specifically changed",
      "whyChanged": "Why this improvement was made",
      "howItWorks": "How the improved version works under the hood",
      "benefit": "Why this approach is beneficial for the student",
      "tradeOff": "Any limitation, nuance, or trade-off to keep in mind"
    }
  ],
  "benefits": ["Key benefit 1", "Key benefit 2"],
  "tradeOffs": ["Trade-off or consideration 1"],
  "behaviourNotes": "Notes on how original behaviour is preserved",
  "verificationNotes": "Guidance on how this change can be verified with test inputs",
  "progressiveHints": [
    "Level 1: General observation about what to look for",
    "Level 2: Concrete strategy or Python concept to apply",
    "Level 3: Specific pattern or function to write"
  ]
}`

    const userPrompt = `Original Python Code:
\`\`\`python
${req.code}
\`\`\`
Selected Goal: ${goal}
Goal Description: ${goalDesc}
${req.customGoalPrompt ? `Additional Student Request: ${req.customGoalPrompt}` : ''}
Analyze this code, generate the improved version, and provide the structured explanation.`

    const rawOutput = await this.callGroqChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { type: 'json_object' }
    )

    const parsed = cleanAndRepairJson<{
      summary?: string
      improvedCode?: string
      isAlreadyClean?: boolean
      changes?: RefineChangeItem[]
      benefits?: string[]
      tradeOffs?: string[]
      behaviourNotes?: string
      verificationNotes?: string
      progressiveHints?: string[]
    }>(rawOutput)

    if (!parsed || typeof parsed !== 'object') {
      throw createAppError(
        'The AI service could not format the code refinement. Please try again.',
        'MALFORMED_RESPONSE',
        502,
        true
      )
    }

    const improvedCode = parsed.improvedCode || req.code
    const summary = parsed.summary || 'Code refinement analysis complete.'
    const changes: RefineChangeItem[] = Array.isArray(parsed.changes)
      ? parsed.changes.map((c, idx) => ({
          id: c.id || `c_${idx + 1}`,
          originalSnippet: c.originalSnippet || '',
          improvedSnippet: c.improvedSnippet || '',
          whatChanged: c.whatChanged || 'Refactored code structure.',
          whyChanged: c.whyChanged || 'Improves clarity and maintainability.',
          howItWorks: c.howItWorks || 'Applies standard Python conventions.',
          benefit: c.benefit || 'Cleaner, more readable implementation.',
          tradeOff: c.tradeOff,
        }))
      : []

    const benefits = Array.isArray(parsed.benefits) && parsed.benefits.length > 0
      ? parsed.benefits
      : ['Improved code clarity and maintainability.']

    const tradeOffs = Array.isArray(parsed.tradeOffs) && parsed.tradeOffs.length > 0
      ? parsed.tradeOffs
      : ['Ensure all edge cases and variable types are tested thoroughly.']

    const progressiveHints = Array.isArray(parsed.progressiveHints) && parsed.progressiveHints.length > 0
      ? parsed.progressiveHints
      : [
          'Look for code sections that perform manual work where Python provides cleaner idioms.',
          'Consider extracting repeated logic into a helper function or using built-in methods.',
          'Focus on naming and guard clauses to reduce nesting depth.',
        ]

    return {
      id: `refine_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sourceHash: req.sourceHash,
      isStale: false,
      model: this.model,
      goal,
      summary,
      improvedCode,
      changes,
      benefits,
      tradeOffs,
      behaviourNotes: parsed.behaviourNotes || 'Input and output behaviour remains identical.',
      verificationNotes: parsed.verificationNotes || 'Verify by testing with standard and boundary inputs.',
      progressiveHints,
      isAlreadyClean: !!parsed.isAlreadyClean,
    }
  }

  // --------------------------------------------------------------------------
  // 5. CodeRefine: Progressive Hints for Manual Mode
  // --------------------------------------------------------------------------
  public async getRefineHint(req: RefineHintRequest): Promise<RefineHintResponse> {
    const hintLevel = Math.min(Math.max(req.hintLevel || 1, 1), 3)
    const goal = req.goal || 'readability'

    const levelDescriptions = {
      1: 'Level 1 (Subtle nudge): Point out where the opportunity lies without revealing the technique.',
      2: 'Level 2 (Conceptual strategy): Explain the Python concept, standard library tool, or pattern that helps.',
      3: 'Level 3 (Actionable guidance): Give concrete pseudocode or pattern structure without writing out the exact entire solution.',
    }

    const systemPrompt = `You are CodeCraft's CodeRefine Mentor guiding a student who is improving their code manually.
The student selected the goal: ${goal.toUpperCase()}.
Provide a hint at ${levelDescriptions[hintLevel as 1 | 2 | 3]}.
Keep it encouraging, direct, and concise (2-3 sentences).
Return ONLY a valid JSON object:
{
  "hint": "The hint message for the student",
  "focusArea": "Optional line range or function name to focus on"
}`

    const userPrompt = `Code:
\`\`\`python
${req.code}
\`\`\`
Goal: ${goal}
Hint Level: ${hintLevel}`

    const rawOutput = await this.callGroqChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { type: 'json_object' }
    )

    const parsed = cleanAndRepairJson<{ hint?: string; focusArea?: string }>(rawOutput)

    return {
      hintLevel,
      hint: parsed?.hint || 'Review lines where logic can be expressed more directly or functions can be simplified.',
      focusArea: parsed?.focusArea,
      nextAvailable: hintLevel < 3,
    }
  }

}
