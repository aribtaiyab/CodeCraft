// ============================================================================
// Automated Tests: Assessment Attempt Storage & Recovery
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveAttempt,
  loadAttempt,
  clearAttempt,
  saveLastResult,
  loadLastResult,
  clearLastResult,
  getServedQuestionFingerprints,
  recordServedQuestionFingerprints,
  clearServedQuestionHistory,
} from '../attemptStorage'
import type { StudentAttempt, AssessmentResult } from '../types'

describe('Assessment Attempt Storage Service', () => {
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

  const mockAttempt: StudentAttempt = {
    id: 'att_test_1',
    assessmentId: 'test_1',
    assessmentDefinition: {
      id: 'test_1',
      version: '1.0.0',
      title: 'Python Test',
      description: 'Storage test',
      topic: 'python_fundamentals',
      difficulty: 'beginner',
      timeLimitMinutes: 10,
      totalPoints: 10,
      questions: [],
      createdAt: Date.now(),
    },
    startedAt: Date.now(),
    deadlineAt: Date.now() + 600000,
    timeLimitMinutes: 10,
    status: 'in_progress',
    answers: {
      q1: {
        questionId: 'q1',
        questionType: 'mcq',
        selectedOptionId: 'opt_1',
        lastUpdated: Date.now(),
      },
    },
  }

  it('saves and loads in-progress attempt accurately', () => {
    saveAttempt(mockAttempt)
    const recovered = loadAttempt()
    expect(recovered).toBeDefined()
    expect(recovered?.id).toBe('att_test_1')
    expect(recovered?.answers.q1.selectedOptionId).toBe('opt_1')
    expect(recovered?.status).toBe('in_progress')
  })

  it('automatically marks attempt as expired if deadline passed', () => {
    const expiredAttempt: StudentAttempt = {
      ...mockAttempt,
      deadlineAt: Date.now() - 5000, // 5 seconds in the past
    }
    saveAttempt(expiredAttempt)

    const recovered = loadAttempt()
    expect(recovered?.status).toBe('expired')
  })

  it('clears attempt properly', () => {
    saveAttempt(mockAttempt)
    clearAttempt()
    expect(loadAttempt()).toBeNull()
  })

  it('saves and retrieves last completed result', () => {
    const sampleResult: AssessmentResult = {
      attemptId: 'att_test_1',
      assessmentId: 'test_1',
      assessmentTitle: 'Python Test',
      topic: 'python_fundamentals',
      difficulty: 'beginner',
      startedAt: Date.now() - 300000,
      completedAt: Date.now(),
      durationSeconds: 300,
      isExpiredTimeout: false,
      totalPointsEarned: 80,
      totalPointsMax: 100,
      scorePercentage: 80,
      mcqSummary: { total: 4, correct: 3, incorrect: 1, unanswered: 0 },
      codingSummary: { total: 1, passed: 1, failed: 0, partial: 0, unanswered: 0, systemError: 0 },
      questionEvaluations: {},
      topicBreakdown: {},
      recommendations: ['Great work'],
    }

    saveLastResult(sampleResult)
    const recovered = loadLastResult()
    expect(recovered).toBeDefined()
    expect(recovered?.scorePercentage).toBe(80)

    clearLastResult()
    expect(loadLastResult()).toBeNull()
  })

  it('safely handles corrupted or malformed localStorage attempts without throwing', () => {
    // Malformed JSON string
    storageMap.set('codecraft_assessment_attempt', '{ invalid JSON string ...')
    expect(loadAttempt()).toBeNull()

    // Missing required questions array
    storageMap.set(
      'codecraft_assessment_attempt',
      JSON.stringify({ id: 'att_corrupt', deadlineAt: Date.now() + 100000, assessmentDefinition: {} })
    )
    expect(loadAttempt()).toBeNull()

    // Non-object attempt
    storageMap.set('codecraft_assessment_attempt', JSON.stringify('not an object'))
    expect(loadAttempt()).toBeNull()
  })

  it('safely handles corrupted or malformed localStorage results without throwing', () => {
    storageMap.set('codecraft_assessment_last_result', '{ bad json')
    expect(loadLastResult()).toBeNull()

    storageMap.set(
      'codecraft_assessment_last_result',
      JSON.stringify({ scorePercentage: 'not a number' })
    )
    expect(loadLastResult()).toBeNull()
  })

  it('records, retrieves, and clears served question fingerprints', () => {
    expect(getServedQuestionFingerprints().size).toBe(0)

    recordServedQuestionFingerprints(['fp_101', 'fp_102', 'fp_101'])
    const fingerprints = getServedQuestionFingerprints()
    expect(fingerprints.size).toBe(2)
    expect(fingerprints.has('fp_101')).toBe(true)
    expect(fingerprints.has('fp_102')).toBe(true)

    clearServedQuestionHistory()
    expect(getServedQuestionFingerprints().size).toBe(0)
  })
})


