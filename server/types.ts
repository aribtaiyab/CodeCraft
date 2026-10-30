// ============================================================================
// CodeCraft Backend — Phase 5 Data Contracts & Types
// ============================================================================

export interface LineRange {
  startLine: number
  endLine: number
}

// ----------------------------------------------------------------------------
// 1. Health
// ----------------------------------------------------------------------------
export interface HealthResponse {
  status: 'ok' | 'error'
  hasGroqKey: boolean
  model: string
  version: string
}

// ----------------------------------------------------------------------------
// 2. Explain Endpoint
// ----------------------------------------------------------------------------
export interface ExplainRequest {
  code: string
  selection?: LineRange
  language?: string
  sourceHash: string
}

export interface LineExplanation {
  line: number
  code: string
  explanation: string
}

export interface ConceptDetail {
  name: string
  meaning: string
  codeUsage: string
  example?: string
}

export interface ExpectedOutput {
  output: string
  explanation: string
}

export interface ExplainResponse {
  id: string
  sourceHash: string
  isStale: boolean
  model: string
  summary: string
  detailedExplanation: string
  lineExplanations: LineExplanation[]
  keyConcepts: string[]
  conceptDetails?: ConceptDetail[]
  mainIdeaSteps?: string[]
  expectedOutput?: ExpectedOutput
  isSelectionOnly: boolean
  selectedRange?: LineRange
}

// ----------------------------------------------------------------------------
// 3. Contextual Ask / Q&A Endpoint
// ----------------------------------------------------------------------------
export interface RuntimeContext {
  lastStdout?: string
  lastError?: string
  traceSummary?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AskRequest {
  code: string
  question: string
  selection?: LineRange
  runtimeContext?: RuntimeContext
  conversationHistory?: ChatMessage[]
  sourceHash: string
}

export interface AskResponse {
  id: string
  sourceHash: string
  isStale: boolean
  model: string
  answer: string
  relevantLines?: number[]
  followUpSuggestions: string[]
}

// ----------------------------------------------------------------------------
// 4. Code-Specific MCQ Generation & Verification
// ----------------------------------------------------------------------------
export interface GenerateMcqsRequest {
  code: string
  count?: number
  conceptTag?: string
  sourceHash: string
}

export interface McqQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  conceptTag: string
  verifiedByExecution: boolean
  verificationNote?: string
}

export interface GenerateMcqsResponse {
  id: string
  sourceHash: string
  isStale: boolean
  model: string
  questions: McqQuestion[]
}

// ----------------------------------------------------------------------------
// 5. Standard Error Response
// ----------------------------------------------------------------------------
export interface ApiErrorResponse {
  error: {
    code: 'MISSING_API_KEY' | 'RATE_LIMITED' | 'BAD_REQUEST' | 'GROQ_API_ERROR' | 'TIMEOUT' | 'INTERNAL_ERROR'
    message: string
    details?: unknown
  }
}
