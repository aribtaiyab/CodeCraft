// ============================================================================
// Automated Tests: Phase 7 Full End-to-End Learning Loop Integration
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  recordLearningEvent,
  getLearningHistory,
  recordAssessmentResult,
  getHistoricalResults,
  getHistoricalResultById,
  classifyBugCategory,
  classifyAssessmentQuestion,
  computeConceptMastery,
  generateRecommendations,
} from '../index'
import type { AssessmentResult, AssessmentCodingQuestion } from '../../assessment/types'

describe('Phase 7 Acceptance Criterion: End-to-End Learning Loop', () => {
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

  it('completes the entire integrated learning journey end to end', () => {
    // ------------------------------------------------------------------------
    // Step 1: Student makes a mistake in Code Studio (e.g. ZeroDivisionError)
    // ------------------------------------------------------------------------
    const studioBugCategory = 'zero-division'
    const classification = classifyBugCategory(studioBugCategory)

    expect(classification.conceptId).toBe('zero_division_guard')
    expect(classification.topicId).toBe('algorithms_logic')
    expect(classification.confidence).toBe('high')

    // Record the diagnosed mistake in local learning history
    const studioEventRecorded = recordLearningEvent({
      id: 'ev_studio_01',
      timestamp: 1000,
      source: 'code_studio',
      activityType: 'coach_diagnosis',
      conceptId: classification.conceptId,
      topicId: classification.topicId,
      outcome: 'failed',
      evidenceQuality: classification.confidence,
      errorCategory: studioBugCategory,
      title: 'ZeroDivisionError in Studio',
      summary: 'Division by zero occurred when list was empty.',
      dedupKey: 'studio_diag:code_v1:zero-division',
      schemaVersion: 1,
    })
    expect(studioEventRecorded).toBe(true)

    // Second failure to establish enough evidence of difficulty
    recordLearningEvent({
      id: 'ev_studio_02',
      timestamp: 2000,
      source: 'code_studio',
      activityType: 'test_your_fix',
      conceptId: classification.conceptId,
      topicId: classification.topicId,
      outcome: 'failed',
      evidenceQuality: 'high',
      errorCategory: studioBugCategory,
      title: 'Failed Test Assertion: Safe Average',
      summary: 'Assertion failed: expected 0.0 on empty input.',
      dedupKey: 'studio_fix:code_v1:zero-division',
      schemaVersion: 1,
    })

    // ------------------------------------------------------------------------
    // Step 2: Mastery engine identifies 'needs_practice' and generates recommendation
    // ------------------------------------------------------------------------
    const initialEvents = getLearningHistory()
    const initialMastery = computeConceptMastery(initialEvents)
    expect(initialMastery.zero_division_guard.status).toBe('needs_practice')

    const recs = generateRecommendations(initialMastery)
    expect(recs.length).toBeGreaterThan(0)
    const targetedRec = recs[0]
    expect(targetedRec.conceptId).toBe('zero_division_guard')
    expect(targetedRec.actionUrl).toMatch(/\/studio|\/testlab/)

    // ------------------------------------------------------------------------
    // Step 3: Student follows recommendation and completes exercise in AI Test Lab
    // ------------------------------------------------------------------------
    const targetCodingQuestion: AssessmentCodingQuestion = {
      id: 'code_algo_01',
      type: 'coding',
      topic: 'algorithms_logic',
      difficulty: 'beginner',
      points: 25,
      prompt: 'Write a safe divide function handling zero division',
      starterCode: 'def safe_divide(a, b): pass',
      testCases: [
        { id: 'tc_1', name: 'Standard division', callExpr: 'safe_divide(10, 2)', expected: '5.0' },
        { id: 'tc_2', name: 'Zero divisor guard', callExpr: 'safe_divide(10, 0)', expected: 'None' },
      ],
      explanation: 'Guard against division by zero.',
    }

    const questionConcept = classifyAssessmentQuestion(targetCodingQuestion)
    expect(questionConcept.conceptId).toBe('zero_division_guard')

    // Simulate authoritative evaluator scoring the completed assessment
    const evaluatedAssessmentResult: AssessmentResult = {
      attemptId: 'att_journey_100',
      assessmentId: 'test_targeted_retest',
      assessmentTitle: 'Algorithms & Problem Solving Assessment',
      topic: 'algorithms_logic',
      difficulty: 'beginner',
      startedAt: 3000,
      completedAt: 3300,
      durationSeconds: 300,
      isExpiredTimeout: false,
      totalPointsEarned: 100,
      totalPointsMax: 100,
      scorePercentage: 100,
      mcqSummary: { total: 0, correct: 0, incorrect: 0, unanswered: 0 },
      codingSummary: { total: 1, passed: 1, failed: 0, partial: 0, unanswered: 0, systemError: 0 },
      questionEvaluations: {
        code_algo_01: {
          questionId: 'code_algo_01',
          questionType: 'coding',
          earnedPoints: 25,
          maxPoints: 25,
          isCorrect: true,
          isUnanswered: false,
          explanation: 'Safe divide correctly implemented guard clause.',
        },
      },
      topicBreakdown: {
        algorithms_logic: {
          topic: 'algorithms_logic',
          topicLabel: 'Algorithms & Problem Solving',
          totalPoints: 25,
          earnedPoints: 25,
          percentage: 100,
          status: 'strength',
        },
      },
      recommendations: ['Concept mastered.'],
    }

    // Save assessment result into local history
    recordAssessmentResult(evaluatedAssessmentResult)

    // Record question evaluation event
    recordLearningEvent({
      id: 'ev_testlab_retest_success',
      timestamp: 3350,
      source: 'ai_test_lab',
      activityType: 'assessment_question_evaluated',
      conceptId: questionConcept.conceptId,
      topicId: questionConcept.topicId,
      outcome: 'passed',
      evidenceQuality: 'high',
      title: 'Safe Division Test Lab Assessment',
      summary: 'All test assertions passed successfully.',
      metadata: {
        attemptId: 'att_journey_100',
        questionId: 'code_algo_01',
      },
      dedupKey: 'testlab_q:att_journey_100:code_algo_01',
      schemaVersion: 1,
    })

    // ------------------------------------------------------------------------
    // Step 4: Progress updates from new evidence; next recommendation updates
    // ------------------------------------------------------------------------
    const updatedEvents = getLearningHistory()
    const updatedMastery = computeConceptMastery(updatedEvents)
    const updatedZeroDiv = updatedMastery.zero_division_guard

    // 2 failures + 1 success = 3 evaluations
    expect(updatedZeroDiv.evidenceCount).toBe(3)
    // Recent success moved status out of 'needs_practice' to 'developing'
    expect(updatedZeroDiv.status).toBe('developing')

    // Recommendation engine updates based on the recorded progress
    const updatedRecs = generateRecommendations(updatedMastery)
    expect(updatedRecs).toBeDefined()

    // ------------------------------------------------------------------------
    // Step 5: Student can revisit previous attempt and result anytime
    // ------------------------------------------------------------------------
    const historicalAttempts = getHistoricalResults()
    expect(historicalAttempts).toHaveLength(1)
    expect(historicalAttempts[0].attemptId).toBe('att_journey_100')

    const revisitedAttempt = getHistoricalResultById('att_journey_100')
    expect(revisitedAttempt).toBeDefined()
    expect(revisitedAttempt?.scorePercentage).toBe(100)
    expect(revisitedAttempt?.questionEvaluations['code_algo_01'].isCorrect).toBe(true)
  })
})
