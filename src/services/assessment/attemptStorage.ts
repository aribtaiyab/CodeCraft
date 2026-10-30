// ============================================================================
// CodeCraft — Local Assessment Attempt Storage & Recovery
// Phase 6: Resilient local attempt recovery across page reloads & navigation
// ============================================================================

import type { StudentAttempt, AssessmentResult } from './types'

const ATTEMPT_KEY = 'codecraft_assessment_attempt'
const LAST_RESULT_KEY = 'codecraft_assessment_last_result'

export function saveAttempt(attempt: StudentAttempt): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt))
    }
  } catch (err) {
    console.warn('Failed to save assessment attempt to localStorage:', err)
  }
}

export function loadAttempt(): StudentAttempt | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(ATTEMPT_KEY)
    if (!raw) return null

    const attempt = JSON.parse(raw) as StudentAttempt
    if (
      !attempt ||
      typeof attempt !== 'object' ||
      !attempt.id ||
      typeof attempt.deadlineAt !== 'number' ||
      !attempt.assessmentDefinition ||
      !Array.isArray(attempt.assessmentDefinition.questions) ||
      typeof attempt.answers !== 'object' ||
      attempt.answers === null
    ) {
      return null
    }

    // If deadline has expired while closed/reloading, mark expired
    if (attempt.status === 'in_progress' && Date.now() > attempt.deadlineAt) {
      attempt.status = 'expired'
    }

    return attempt
  } catch (err) {
    console.warn('Failed to recover assessment attempt from localStorage:', err)
    return null
  }
}

export function clearAttempt(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ATTEMPT_KEY)
    }
  } catch {
    // Ignore storage clear error
  }
}

export function saveLastResult(result: AssessmentResult): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result))
    }
  } catch (err) {
    console.warn('Failed to save assessment result to localStorage:', err)
  }
}

export function loadLastResult(): AssessmentResult | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(LAST_RESULT_KEY)
    if (!raw) return null
    const res = JSON.parse(raw) as AssessmentResult
    if (
      !res ||
      typeof res !== 'object' ||
      !res.attemptId ||
      typeof res.scorePercentage !== 'number' ||
      !res.topicBreakdown ||
      !res.questionEvaluations
    ) {
      return null
    }
    return res
  } catch {
    return null
  }
}

export function clearLastResult(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LAST_RESULT_KEY)
    }
  } catch {
    // Ignore storage clear error
  }
}

const SERVED_FINGERPRINTS_KEY = 'codecraft_served_question_fingerprints_v1'

export function getServedQuestionFingerprints(): Set<string> {
  try {
    if (typeof localStorage === 'undefined') return new Set()
    const raw = localStorage.getItem(SERVED_FINGERPRINTS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return new Set()
  }
}

export function recordServedQuestionFingerprints(fingerprints: string[]): void {
  try {
    if (typeof localStorage === 'undefined' || fingerprints.length === 0) return
    const current = getServedQuestionFingerprints()
    fingerprints.forEach((fp) => current.add(fp))
    // Cap at most recent 200 fingerprints to bound localStorage usage
    const list = Array.from(current).slice(-200)
    localStorage.setItem(SERVED_FINGERPRINTS_KEY, JSON.stringify(list))
  } catch (err) {
    console.warn('Failed to record served question fingerprints:', err)
  }
}

export function clearServedQuestionHistory(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SERVED_FINGERPRINTS_KEY)
    }
  } catch {
    // Ignore storage clear error
  }
}

