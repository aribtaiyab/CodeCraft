// ============================================================================
// CodeCraft — Assessment System Domain Types
// Phase 6: Complete AI Test Lab & Assessment Experience
// ============================================================================

export type AssessmentTopic =
  | 'python_fundamentals'
  | 'control_flow'
  | 'functions_scope'
  | 'data_structures'
  | 'algorithms_logic'

export type AssessmentDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type AssessmentQuestionType = 'mcq' | 'coding'

export type QuestionTypeSelection = 'mcq_only' | 'coding_only' | 'mixed'

export interface AssessmentConfig {
  topic: AssessmentTopic
  difficulty: AssessmentDifficulty
  questionTypes: QuestionTypeSelection
  questionCount: number
  timeLimitMinutes: number
  mode: 'curated' | 'ai_generated'
}

export interface AssessmentMcqOption {
  id: string
  text: string
}

export interface AssessmentMcqQuestion {
  id: string
  type: 'mcq'
  topic: AssessmentTopic
  difficulty: AssessmentDifficulty
  points: number
  prompt: string
  codeSnippet?: string
  options: AssessmentMcqOption[]
  correctOptionId: string
  explanation: string
  isConceptual?: boolean
  verifiedByExecution?: boolean
}

export interface AssessmentTestCase {
  id: string
  name: string
  callExpr: string
  expected: string
  isHidden?: boolean
}

export interface AssessmentCodingQuestion {
  id: string
  type: 'coding'
  topic: AssessmentTopic
  difficulty: AssessmentDifficulty
  points: number
  prompt: string
  starterCode: string
  solutionStub?: string
  functionName?: string
  testCases: AssessmentTestCase[]
  explanation: string
}

export type AssessmentQuestion = AssessmentMcqQuestion | AssessmentCodingQuestion

export interface AssessmentDefinition {
  id: string
  version: string
  title: string
  description: string
  topic: AssessmentTopic
  difficulty: AssessmentDifficulty
  timeLimitMinutes: number
  totalPoints: number
  questions: AssessmentQuestion[]
  createdAt: number
  isAiGenerated?: boolean
}

export interface StudentAnswer {
  questionId: string
  questionType: AssessmentQuestionType
  selectedOptionId?: string
  codeAnswer?: string
  isFlagged?: boolean
  lastUpdated: number
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'expired' | 'abandoned'

export interface StudentAttempt {
  id: string
  assessmentId: string
  assessmentDefinition: AssessmentDefinition
  startedAt: number
  deadlineAt: number
  timeLimitMinutes: number
  status: AttemptStatus
  answers: Record<string, StudentAnswer>
  completedAt?: number
}

export interface CodingTestCaseOutcome {
  testCaseId: string
  name: string
  passed: boolean
  expected: string
  actual?: string
  error?: string
  durationMs?: number
  isHidden?: boolean
}

export interface QuestionEvaluation {
  questionId: string
  questionType: AssessmentQuestionType
  earnedPoints: number
  maxPoints: number
  isCorrect: boolean
  isUnanswered: boolean
  selectedOptionId?: string
  correctOptionId?: string
  submittedCode?: string
  testOutcomes?: CodingTestCaseOutcome[]
  hasSyntaxError?: boolean
  hasRuntimeError?: boolean
  isSystemError?: boolean
  errorMessage?: string
  explanation: string
}

export interface TopicPerformance {
  topic: AssessmentTopic
  topicLabel: string
  totalPoints: number
  earnedPoints: number
  percentage: number
  status: 'strength' | 'satisfactory' | 'needs_review'
}

export interface AssessmentResult {
  attemptId: string
  assessmentId: string
  assessmentTitle: string
  topic: AssessmentTopic
  difficulty: AssessmentDifficulty
  startedAt: number
  completedAt: number
  durationSeconds: number
  isExpiredTimeout: boolean
  totalPointsEarned: number
  totalPointsMax: number
  scorePercentage: number
  mcqSummary: {
    total: number
    correct: number
    incorrect: number
    unanswered: number
  }
  codingSummary: {
    total: number
    passed: number
    failed: number
    partial: number
    unanswered: number
    systemError: number
  }
  questionEvaluations: Record<string, QuestionEvaluation>
  topicBreakdown: Record<string, TopicPerformance>
  recommendations: string[]
}

export const TOPIC_METADATA: Record<
  AssessmentTopic,
  { label: string; description: string; icon: string }
> = {
  python_fundamentals: {
    label: 'Python Fundamentals',
    description: 'Variables, primitive data types, expressions, print output, and string operations.',
    icon: 'Terminal',
  },
  control_flow: {
    label: 'Control Flow & Loops',
    description: 'If-elif-else branching, for and while loops, break, continue, and condition logic.',
    icon: 'GitFork',
  },
  functions_scope: {
    label: 'Functions & Scope',
    description: 'Function definitions, parameters, return values, variable scope, and lambdas.',
    icon: 'Braces',
  },
  data_structures: {
    label: 'Data Structures',
    description: 'Lists, dictionaries, tuples, sets, indexing, slicing, and mutations.',
    icon: 'Layers',
  },
  algorithms_logic: {
    label: 'Algorithms & Problem Solving',
    description: 'Iterative patterns, searching, sorting, edge cases, and algorithmic reasoning.',
    icon: 'Cpu',
  },
}
