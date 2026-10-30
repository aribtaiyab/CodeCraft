// ============================================================================
// CodeCraft Frontend — AI Mentor Data Types & Interfaces (Phase 5)
// ============================================================================

export interface LineRange {
  startLine: number
  endLine: number
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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  relevantLines?: number[]
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

export interface AiHealthStatus {
  status: 'ok' | 'error' | 'unreachable'
  hasGroqKey: boolean
  model: string
  version?: string
}
