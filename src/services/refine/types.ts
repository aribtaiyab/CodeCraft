// ============================================================================
// CodeCraft — CodeRefine Data Contracts & Types
// "Write better. Understand why."
// ============================================================================

export type RefineGoal =
  | 'performance'
  | 'easy_to_understand'
  | 'readability'
  | 'dry'
  | 'structure'
  | 'naming'
  | 'simplify'
  | 'custom'

export interface RefineGoalOption {
  id: RefineGoal
  label: string
  shortLabel: string
  description: string
  iconName: string
}

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

export interface RefineHintResponse {
  hintLevel: number
  hint: string
  focusArea?: string
  nextAvailable: boolean
}

export interface RefineTestCaseResult {
  id: string
  description: string
  inputLabel: string
  originalOutput: string
  improvedOutput: string
  passed: boolean
  originalError?: string
  improvedError?: string
  executionTimeMs: {
    original: number
    improved: number
  }
}

export interface RefineVerificationResult {
  passedCount: number
  totalCount: number
  areOutputsIdentical: boolean
  hasErrors: boolean
  testCases: RefineTestCaseResult[]
  summary: string
  limitationsNote: string
}

export interface RefineCuratedExample {
  id: string
  goal: RefineGoal
  title: string
  description: string
  originalCode: string
  suggestedGoal: RefineGoal
}

