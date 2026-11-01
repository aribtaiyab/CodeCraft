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
