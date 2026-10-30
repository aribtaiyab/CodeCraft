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
  | 'syntax-error'
  | 'indentation-error'
  | 'attribute-error'
  | 'import-error'
  | 'recursion-error'
  | 'timeout-infinite-loop'
  | 'test-failure'
  | 'general-runtime-error'

export interface ProgressiveLevel1 {
  title: string
  hint: string
  concept: string
  line: number
}

export interface ProgressiveLevel2 {
  title: string
  explanation: string
  problematicSnippet: string
  whyPythonErrors: string
  conceptTeaching: string
  correctExample: string
  evidence?: {
    line?: number
    observedValue?: string
    expectedBehavior?: string
    traceSnippet?: string
  }
}

export interface ProgressiveLevel3 {
  title: string
  solution: string
  whyItWorks: string
  expectedOutput?: string
  preventionTip: string
  suggestedFix?: {
    originalText: string
    replacementText: string
    startLine: number
    endLine?: number
    startColumn?: number
    endColumn?: number
    explanation: string
  }
}

export interface TryItYourselfQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface DiagnosedIssue {
  id: string
  line: number
  endLine?: number
  startColumn?: number
  endColumn?: number
  title: string
  category: BugCategory
  summary: string
  levels: {
    level1: ProgressiveLevel1
    level2: ProgressiveLevel2
    level3: ProgressiveLevel3
  }
  tryItYourself?: TryItYourselfQuestion
  isApplied?: boolean
}

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
    startLine?: number
    endLine?: number
    startColumn?: number
    endColumn?: number
    explanation: string
  }
}

export interface BugDiagnosis {
  id: string
  category: BugCategory
  title: string
  line: number
  summary: string
  hints: [ProgressiveHint, ProgressiveHint, ProgressiveHint] // Preserved for backwards compatibility
  issues: DiagnosedIssue[] // 1 or more specific line-level issues
  isStale: boolean
  codeHash: string
}

export interface TestCaseAssertion {
  id: string
  name: string
  callExpr: string // e.g., "safe_average([10, 20, 30])"
  expected: string // formatted string representation of expected result
  description?: string
  inputDescription?: string
  category?: 'normal' | 'zero' | 'decimal' | 'negative' | 'edge' | 'custom'
  isCustom?: boolean
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
  inputDescription?: string
  failureReason?: string
  isCustom?: boolean
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
