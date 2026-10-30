// ============================================================================
// Automated Tests: Phase 7 Learning History Storage & Migration Pipeline
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  recordLearningEvent,
  getLearningHistory,
  clearLearningHistory,
  recordAssessmentResult,
  getHistoricalResults,
  getHistoricalResultById,
  clearAllAssessmentHistory,
} from '../learningHistoryStorage'
import type { LearningEvent } from '../types'
import type { AssessmentResult } from '../../assessment/types'

describe('Phase 7: Learning History Storage & Migration', () => {
  const storageMap = new Map<string, string>()

  beforeEach(() => {
    storageMap.clear()
    const mockStorage = {
      getItem: (key: string) => storageMap.get(key) ?? null,
      setItem: (key: string, val: string) => storageMap.set(key, String(val)),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
    }
    vi.stubGlobal('localStorage', mockStorage)
  })

  const sampleEvent: LearningEvent = {
    id: 'ev_test_1',
    timestamp: Date.now(),
    source: 'code_studio',
    activityType: 'coach_diagnosis',
    conceptId: 'zero_division_guard',
    topicId: 'algorithms_logic',
    outcome: 'failed',
    evidenceQuality: 'high',
    errorCategory: 'zero-division',
    title: 'ZeroDivisionError Guard',
    summary: 'Divided by zero on empty list',
    dedupKey: 'studio_diag:hash123:zero-division',
    schemaVersion: 1,
  }

  const sampleResult: AssessmentResult = {
    attemptId: 'att_hist_1',
    assessmentId: 'test_1',
    assessmentTitle: 'Python Test Lab Assessment',
    topic: 'algorithms_logic',
    difficulty: 'beginner',
    startedAt: Date.now() - 60000,
    completedAt: Date.now(),
    durationSeconds: 60,
    isExpiredTimeout: false,
    totalPointsEarned: 90,
    totalPointsMax: 100,
    scorePercentage: 90,
    mcqSummary: { total: 4, correct: 4, incorrect: 0, unanswered: 0 },
    codingSummary: { total: 1, passed: 1, failed: 0, partial: 0, unanswered: 0, systemError: 0 },
    questionEvaluations: {},
    topicBreakdown: {},
    recommendations: ['Great job'],
  }

  it('records learning events and prevents duplicate writes via dedupKey', () => {
    const firstWrite = recordLearningEvent(sampleEvent)
    expect(firstWrite).toBe(true)

    // Second write with identical dedupKey should be rejected (idempotent)
    const secondWrite = recordLearningEvent({
      ...sampleEvent,
      id: 'ev_test_2_duplicate',
    })
    expect(secondWrite).toBe(false)

    const history = getLearningHistory()
    expect(history).toHaveLength(1)
    expect(history[0].id).toBe('ev_test_1')
  })

  it('safely handles corrupted localStorage strings without throwing', () => {
    storageMap.set('codecraft_learning_events_v1', '{ invalid JSON corrupted...')
    expect(getLearningHistory()).toEqual([])

    storageMap.set('codecraft_assessment_history_v1', 'not an array')
    expect(getHistoricalResults()).toEqual([])
  })

  it('records assessment results into history and retrieves them by ID', () => {
    recordAssessmentResult(sampleResult)
    const list = getHistoricalResults()
    expect(list).toHaveLength(1)
    expect(list[0].attemptId).toBe('att_hist_1')

    const byId = getHistoricalResultById('att_hist_1')
    expect(byId).toBeDefined()
    expect(byId?.scorePercentage).toBe(90)
  })

  it('migrates legacy Phase 6 single last result into history on first access', () => {
    // Simulate legacy storage containing Phase 6 last result
    storageMap.set('codecraft_assessment_last_result', JSON.stringify(sampleResult))

    // Historical array is initially empty
    expect(storageMap.get('codecraft_assessment_history_v1')).toBeUndefined()

    // Accessing historical results should seamlessly migrate legacy result
    const list = getHistoricalResults()
    expect(list).toHaveLength(1)
    expect(list[0].attemptId).toBe('att_hist_1')
  })

  it('clears learning history and assessment attempts cleanly', () => {
    recordLearningEvent(sampleEvent)
    recordAssessmentResult(sampleResult)

    clearLearningHistory()
    expect(getLearningHistory()).toHaveLength(0)

    clearAllAssessmentHistory()
    expect(getHistoricalResults()).toHaveLength(0)
  })
})
