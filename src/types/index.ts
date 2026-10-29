// ==============================================
// CodeCraft — Shared Type Definitions
// ==============================================

export type NavRoute = {
  path: string
  label: string
  icon?: string
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'bronze'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export type TabItem = {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

// Code Studio
export type Language = 'python' | 'javascript' | 'typescript' | 'json' | 'markdown'

export type CodeFile = {
  id: string
  name: string
  language: Language
  content: string
}

export type OutputLine = {
  id: string
  type: 'stdout' | 'stderr' | 'info' | 'system'
  content: string
  timestamp: Date
}

// AI Test Lab
export type TestCaseStatus = 'idle' | 'running' | 'passed' | 'failed' | 'error'

export type TestCase = {
  id: string
  name: string
  input: string
  expectedOutput: string
  status: TestCaseStatus
  actualOutput?: string
  executionTimeMs?: number
}

export type TestSuite = {
  id: string
  name: string
  description: string
  testCases: TestCase[]
  language: Language
}

// Learning
export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed'

export type LessonType = 'concept' | 'practice' | 'challenge' | 'quiz'

export type Lesson = {
  id: string
  title: string
  type: LessonType
  estimatedMinutes: number
  status: ModuleStatus
  xp: number
}

export type Module = {
  id: string
  title: string
  description: string
  lessons: Lesson[]
  difficulty: DifficultyLevel
  status: ModuleStatus
  totalXp: number
  completedXp: number
  estimatedHours: number
}

export type LearningPath = {
  id: string
  title: string
  description: string
  modules: Module[]
  difficulty: DifficultyLevel
  totalHours: number
  enrolled: boolean
}
