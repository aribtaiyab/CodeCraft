// ============================================================================
// CodeCraft — Assessment Validation Service
// Phase 6: Runtime schema and invariant validation for tests & submissions
// ============================================================================

import type {
  AssessmentDefinition,
  AssessmentConfig,
  AssessmentQuestion,
  AssessmentMcqQuestion,
  AssessmentCodingQuestion,
  AssessmentTopic,
  AssessmentDifficulty,
  StudentAnswer,
} from './types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const VALID_TOPICS: AssessmentTopic[] = [
  'python_fundamentals',
  'control_flow',
  'functions_scope',
  'data_structures',
  'algorithms_logic',
]

const VALID_DIFFICULTIES: AssessmentDifficulty[] = [
  'beginner',
  'intermediate',
  'advanced',
]

export function validateAssessmentConfig(config: unknown): ValidationResult {
  const errors: string[] = []
  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Configuration must be a non-null object.'] }
  }

  const c = config as Partial<AssessmentConfig>

  if (!c.topic || !VALID_TOPICS.includes(c.topic)) {
    errors.push(`Invalid topic '${String(c.topic)}'. Must be one of: ${VALID_TOPICS.join(', ')}.`)
  }

  if (!c.difficulty || !VALID_DIFFICULTIES.includes(c.difficulty)) {
    errors.push(
      `Invalid difficulty '${String(c.difficulty)}'. Must be one of: ${VALID_DIFFICULTIES.join(', ')}.`
    )
  }

  if (!c.questionTypes || !['mcq_only', 'coding_only', 'mixed'].includes(c.questionTypes)) {
    errors.push("Invalid questionTypes. Must be 'mcq_only', 'coding_only', or 'mixed'.")
  }

  if (typeof c.questionCount !== 'number' || c.questionCount < 1 || c.questionCount > 25) {
    errors.push('Question count must be an integer between 1 and 25.')
  }

  if (
    typeof c.timeLimitMinutes !== 'number' ||
    c.timeLimitMinutes < 1 ||
    c.timeLimitMinutes > 180
  ) {
    errors.push('Time limit must be an integer between 1 and 180 minutes.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateAssessmentDefinition(def: unknown): ValidationResult {
  const errors: string[] = []

  if (!def || typeof def !== 'object') {
    return { valid: false, errors: ['Assessment definition must be an object.'] }
  }

  const d = def as Partial<AssessmentDefinition>

  if (!d.id || typeof d.id !== 'string' || d.id.trim().length === 0) {
    errors.push("Assessment 'id' must be a non-empty string.")
  }

  if (!d.version || typeof d.version !== 'string') {
    errors.push("Assessment 'version' must be specified.")
  }

  if (!d.title || typeof d.title !== 'string' || d.title.trim().length === 0) {
    errors.push("Assessment 'title' must be a non-empty string.")
  }

  if (!d.topic || !VALID_TOPICS.includes(d.topic)) {
    errors.push(`Invalid topic '${String(d.topic)}'.`)
  }

  if (!d.difficulty || !VALID_DIFFICULTIES.includes(d.difficulty)) {
    errors.push(`Invalid difficulty '${String(d.difficulty)}'.`)
  }

  if (
    typeof d.timeLimitMinutes !== 'number' ||
    d.timeLimitMinutes < 1 ||
    d.timeLimitMinutes > 180
  ) {
    errors.push('Time limit must be between 1 and 180 minutes.')
  }

  if (!Array.isArray(d.questions) || d.questions.length === 0) {
    errors.push('Assessment must contain at least one question.')
    return { valid: false, errors }
  }

  const seenQuestionIds = new Set<string>()
  let calculatedTotalPoints = 0

  d.questions.forEach((q: AssessmentQuestion, index: number) => {
    const prefix = `Question [${index + 1}]`

    if (!q || typeof q !== 'object') {
      errors.push(`${prefix} is not a valid question object.`)
      return
    }

    if (!q.id || typeof q.id !== 'string' || q.id.trim().length === 0) {
      errors.push(`${prefix} missing stable unique 'id'.`)
    } else if (seenQuestionIds.has(q.id)) {
      errors.push(`${prefix} duplicate question ID '${q.id}' detected.`)
    } else {
      seenQuestionIds.add(q.id)
    }

    if (!q.prompt || typeof q.prompt !== 'string' || q.prompt.trim().length === 0) {
      errors.push(`${prefix} missing non-empty prompt.`)
    }

    if (typeof q.points !== 'number' || q.points <= 0) {
      errors.push(`${prefix} points must be a positive number.`)
    } else {
      calculatedTotalPoints += q.points
    }

    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
      errors.push(`${prefix} missing learning explanation.`)
    }

    if (q.type === 'mcq') {
      const mcq = q as AssessmentMcqQuestion
      if (!Array.isArray(mcq.options) || mcq.options.length < 2) {
        errors.push(`${prefix} MCQ must have at least 2 options.`)
      } else {
        const seenOptionIds = new Set<string>()
        const seenOptionTexts = new Set<string>()

        mcq.options.forEach((opt, optIdx) => {
          if (!opt.id || typeof opt.id !== 'string') {
            errors.push(`${prefix} Option [${optIdx + 1}] missing 'id'.`)
          } else if (seenOptionIds.has(opt.id)) {
            errors.push(`${prefix} Duplicate option ID '${opt.id}'.`)
          } else {
            seenOptionIds.add(opt.id)
          }

          if (!opt.text || typeof opt.text !== 'string' || opt.text.trim().length === 0) {
            errors.push(`${prefix} Option [${optIdx + 1}] text is empty.`)
          } else {
            const normalizedText = opt.text.trim().toLowerCase()
            if (seenOptionTexts.has(normalizedText)) {
              errors.push(`${prefix} Duplicate option text '${opt.text}' detected.`)
            }
            seenOptionTexts.add(normalizedText)
          }
        })

        if (!mcq.correctOptionId || !seenOptionIds.has(mcq.correctOptionId)) {
          errors.push(
            `${prefix} correctOptionId '${mcq.correctOptionId}' does not match any valid option ID.`
          )
        }
      }
    } else if (q.type === 'coding') {
      const coding = q as AssessmentCodingQuestion
      if (
        !coding.starterCode ||
        typeof coding.starterCode !== 'string' ||
        coding.starterCode.trim().length === 0
      ) {
        errors.push(`${prefix} coding question must provide starter code.`)
      }

      if (!Array.isArray(coding.testCases) || coding.testCases.length === 0) {
        errors.push(`${prefix} coding question must have at least 1 test case.`)
      } else {
        const seenCaseIds = new Set<string>()
        coding.testCases.forEach((tc, tcIdx) => {
          if (!tc.id || typeof tc.id !== 'string') {
            errors.push(`${prefix} Test case [${tcIdx + 1}] missing 'id'.`)
          } else if (seenCaseIds.has(tc.id)) {
            errors.push(`${prefix} Duplicate test case ID '${tc.id}'.`)
          } else {
            seenCaseIds.add(tc.id)
          }

          if (!tc.callExpr || typeof tc.callExpr !== 'string' || tc.callExpr.trim().length === 0) {
            errors.push(`${prefix} Test case [${tcIdx + 1}] missing 'callExpr'.`)
          }

          if (typeof tc.expected !== 'string') {
            errors.push(`${prefix} Test case [${tcIdx + 1}] missing 'expected' representation.`)
          }
        })
      }
    } else {
      errors.push(`${prefix} invalid question type '${String((q as { type?: unknown }).type)}'.`)
    }
  })

  if (typeof d.totalPoints === 'number' && d.totalPoints !== calculatedTotalPoints) {
    errors.push(
      `Assessment totalPoints (${d.totalPoints}) does not match sum of question points (${calculatedTotalPoints}).`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateStudentAnswer(answer: unknown): ValidationResult {
  const errors: string[] = []

  if (!answer || typeof answer !== 'object') {
    return { valid: false, errors: ['Answer must be an object.'] }
  }

  const a = answer as Partial<StudentAnswer>
  if (!a.questionId || typeof a.questionId !== 'string') {
    errors.push("Answer must contain a valid 'questionId'.")
  }

  if (!a.questionType || !['mcq', 'coding'].includes(a.questionType)) {
    errors.push("Answer questionType must be 'mcq' or 'coding'.")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
