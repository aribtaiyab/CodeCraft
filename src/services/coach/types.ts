// ============================================================================
// CodeCraft — Smart Debugging Coach & Test Your Fix Types
// ============================================================================

import type { TraceResult } from '../pyodide/types'

export type BugCategory =
  | 'zero-division'
  | 'index-out-of-bounds'
  | 'name-error-typo'
  | 'type-mismatch'
  | 'value-error'
  | 'early-return-loop'
  | 'key-error'
  | 'missing-return'
  | 'unconverted-input'
  | 'comparison-assignment'
  | 'syntax-indentation'
  | 'general-runtime-error'

export interface ProgressiveHint {
  level: 1 | 2 | 3
  title: string
  content: string
  evidence?: {
    line?: number
    observedValue?: string
    expectedBehavior?: string
    traceSnippet?: string
  }
  suggestedFix?: {
    originalText: string
    replacementText: string
    explanation: string
  }
}

export interface BugDiagnosis {
  id: string
  category: BugCategory
  title: string
  line: number
  summary: string
  hints: [ProgressiveHint, ProgressiveHint, ProgressiveHint] // Level 1, 2, 3
  isStale: boolean
  codeHash: string
}

export interface TestCaseAssertion {
  id: string
  name: string
  callExpr: string // e.g., "safe_average([10, 20, 30])"
  expected: string // formatted string representation of expected result
  description?: string
}

export type TestAssertionStatus =
  | 'idle'
  | 'running'
  | 'passed'
  | 'failed'
  | 'error'
  | 'timeout'

export interface TestAssertionResult {
  id: string
  name: string
  status: TestAssertionStatus
  expected: string
  actual?: string
  error?: string
  durationMs?: number
}

export interface DebuggingExercise {
  id: string
  title: string
  conceptTag: string
  conceptLabel: string
  difficulty: 'beginner' | 'intermediate'
  description: string
  buggyCode: string
  expectedSolutionCode: string
  hints: [string, string, { originalText: string; replacementText: string; explanation: string }]
  testCases: TestCaseAssertion[]
  relatedExerciseId?: string
}

export interface CoachAnalysisContext {
  code: string
  lastError?: {
    errorType: string
    message: string
    traceback?: string
  } | null
  trace?: TraceResult | null
  testFailures?: TestAssertionResult[]
}
