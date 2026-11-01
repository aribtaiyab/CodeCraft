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
  whyUsed?: string
  example?: string
}

export interface WhyConceptItem {
  concept: string
  benefit: string
}

export interface InputOutputDetail {
  input?: string
  processing?: string
  output?: string
  explanation?: string
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
  summary: string // Section 1: What does this code do?
  howItWorks?: string[] // Section 2: How does it work?
  mainIdeaSteps?: string[] // Backward compatibility
  conceptDetails?: ConceptDetail[] // Section 3: Important keywords and concepts
  keyConcepts: string[]
  whyConceptsUsed?: WhyConceptItem[] // Section 4: Why are these concepts used?
  lineExplanations: LineExplanation[] // Section 5: Line-by-line explanation
  inputOutput?: InputOutputDetail // Section 6: Input and output
  expectedOutput?: ExpectedOutput // Backward compatibility
  takeaway?: string // Section 7: Remember this
  detailedExplanation: string
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
// 5. CodeRefine Endpoint Types
// ----------------------------------------------------------------------------
export type RefineGoal =
  | 'performance'
  | 'easy_to_understand'
  | 'shortest_code'
  | 'readability'
  | 'dry'
  | 'structure'
  | 'naming'
  | 'simplify'
  | 'custom'

export interface RefineChangeItem {
  id: string
  originalSnippet: string
  improvedSnippet: string
  lineStart?: number
  lineEnd?: number
  whatChanged: string
  whyChanged: string
  howItWorks: string
  benefit: string
  tradeOff?: string
}

export interface RefineAnalysisResponse {
  id: string
  sourceHash: string
  isStale: boolean
  model: string
  goal: RefineGoal
  summary: string
  improvedCode: string
  changes: RefineChangeItem[]
  benefits: string[]
  tradeOffs: string[]
  behaviourNotes?: string
  verificationNotes?: string
  progressiveHints?: string[]
  isAlreadyClean?: boolean
}

export interface RefineRequest {
  code: string
  goal: RefineGoal
  customGoalPrompt?: string
  sourceHash: string
}

export interface RefineHintRequest {
  code: string
  goal: RefineGoal
  hintLevel: number // 1, 2, or 3
  customGoalPrompt?: string
  sourceHash: string
}

export interface RefineHintResponse {
  hintLevel: number
  hint: string
  focusArea?: string
  nextAvailable: boolean
}

// ----------------------------------------------------------------------------
// 6. Standard Error Response
// ----------------------------------------------------------------------------
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'MISSING_API_KEY'
  | 'AUTHENTICATION_ERROR'
  | 'RATE_LIMITED'
  | 'INSUFFICIENT_QUOTA'
  | 'MODEL_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'EMPTY_RESPONSE'
  | 'MALFORMED_RESPONSE'
  | 'VALIDATION_FAILED'
  | 'GROQ_API_ERROR'
  | 'INTERNAL_ERROR'

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode
    message: string
    retryable?: boolean
    details?: unknown
  }
}
