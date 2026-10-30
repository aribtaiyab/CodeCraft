// ============================================================================
// CodeCraft — Local Learning History Storage & Event Pipeline
// Phase 7: Resilient, versioned persistence of learning events and attempts
// ============================================================================

import type { LearningEvent } from './types'
import type { AssessmentResult } from '../assessment/types'
import { loadLastResult, saveLastResult, clearLastResult } from '../assessment/attemptStorage'

const EVENTS_STORAGE_KEY = 'codecraft_learning_events_v1'
const HISTORY_STORAGE_KEY = 'codecraft_assessment_history_v1'

const MAX_STORED_EVENTS = 500
const MAX_STORED_RESULTS = 30

export function recordLearningEvent(event: LearningEvent): boolean {
  try {
    if (typeof localStorage === 'undefined') return false

    const existing = getLearningHistory()

    // Deduplication check: ignore duplicate events with matching dedupKey
    if (existing.some((e) => e.dedupKey === event.dedupKey)) {
      return false
    }

    const updated = [event, ...existing].slice(0, MAX_STORED_EVENTS)
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch (err) {
    console.warn('CodeCraft: Failed to record learning event:', err)
    return false
  }
}

export function getLearningHistory(): LearningEvent[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    // Defensive schema filter
    return parsed.filter(
      (item): item is LearningEvent =>
        Boolean(item && typeof item === 'object' && item.id && item.conceptId && item.outcome)
    )
  } catch (err) {
    console.warn('CodeCraft: Failed to load learning history:', err)
    return []
  }
}

export function clearLearningHistory(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(EVENTS_STORAGE_KEY)
    }
  } catch {
    // Ignore storage clear error
  }
}

/**
 * Saves a completed assessment result to history, migrating legacy results if needed
 */
export function recordAssessmentResult(result: AssessmentResult): void {
  try {
    // 1. Maintain Phase 6 legacy compatibility
    saveLastResult(result)

    if (typeof localStorage === 'undefined') return

    const existing = getHistoricalResults()
    const filtered = existing.filter((r) => r.attemptId !== result.attemptId)
    const updated = [result, ...filtered].slice(0, MAX_STORED_RESULTS)

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.warn('CodeCraft: Failed to record assessment result in history:', err)
  }
}

/**
 * Returns all historical assessment results, migrating legacy single result if empty
 */
export function getHistoricalResults(): AssessmentResult[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)

    if (!raw) {
      // Safe Migration from Phase 6 single last result
      const legacyLast = loadLastResult()
      if (legacyLast && legacyLast.attemptId) {
        const initial = [legacyLast]
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(initial))
        return initial
      }
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const valid = parsed.filter(
      (item): item is AssessmentResult =>
        Boolean(
          item &&
            typeof item === 'object' &&
            item.attemptId &&
            typeof item.scorePercentage === 'number' &&
            item.topicBreakdown &&
            item.questionEvaluations
        )
    )

    // Check if legacyLast is not present in history yet
    const legacyLast = loadLastResult()
    if (legacyLast && !valid.some((r) => r.attemptId === legacyLast.attemptId)) {
      valid.unshift(legacyLast)
    }

    return valid
  } catch (err) {
    console.warn('CodeCraft: Failed to load historical assessment results:', err)
    return []
  }
}

export function getHistoricalResultById(attemptId: string): AssessmentResult | null {
  const all = getHistoricalResults()
  return all.find((r) => r.attemptId === attemptId) ?? null
}

export function clearAllAssessmentHistory(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
      clearLastResult()
    }
  } catch {
    // Ignore storage clear error
  }
}
