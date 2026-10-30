// ============================================================================
// Automated Tests: Phase 7 Targeted Practice Recommendation Engine
// ============================================================================

import { describe, it, expect } from 'vitest'
import { generateRecommendations } from '../recommendationEngine'
import { computeConceptMastery } from '../masteryService'
import type { LearningEvent } from '../types'
import { CURATED_QUESTIONS } from '../../assessment/curatedBank'
import { DEBUGGING_EXERCISES } from '../../coach/exercises'

describe('Phase 7: Targeted Practice Recommendation Engine', () => {
  it('recommends an exploratory baseline assessment when no evidence exists', () => {
    const emptyMasteries = computeConceptMastery([])
    const recs = generateRecommendations(emptyMasteries)

    expect(recs).toHaveLength(1)
    expect(recs[0].actionUrl).toContain('/testlab')
    expect(recs[0].priority).toBe(3)
  })

  it('prioritizes concepts in needs_practice and links to real verified exercises', () => {
    const mistakeEvents: LearningEvent[] = [
      {
        id: 'ev_1',
        timestamp: 1000,
        source: 'code_studio',
        activityType: 'coach_diagnosis',
        conceptId: 'zero_division_guard',
        topicId: 'algorithms_logic',
        outcome: 'failed',
        evidenceQuality: 'high',
        errorCategory: 'zero-division',
        title: 'Zero Division Guard',
        summary: 'ZeroDivisionError in studio',
        dedupKey: 'd1',
        schemaVersion: 1,
      },
      {
        id: 'ev_2',
        timestamp: 2000,
        source: 'ai_test_lab',
        activityType: 'assessment_question_evaluated',
        conceptId: 'zero_division_guard',
        topicId: 'algorithms_logic',
        outcome: 'failed',
        evidenceQuality: 'high',
        title: 'Safe Division Test',
        summary: 'Failed',
        dedupKey: 'd2',
        schemaVersion: 1,
      },
    ]

    const masteries = computeConceptMastery(mistakeEvents)
    const recs = generateRecommendations(masteries)

    expect(recs.length).toBeGreaterThan(0)
    const topRec = recs[0]
    expect(topRec.conceptId).toBe('zero_division_guard')
    expect(topRec.priority).toBe(1)
    expect(topRec.actionUrl).toBeTruthy()

    // Verify target exercise actually exists in curriculum / exercise bank
    if (topRec.exerciseType === 'coach_exercise') {
      const exists = DEBUGGING_EXERCISES.some((e) => e.id === topRec.targetExerciseId)
      expect(exists).toBe(true)
    } else if (topRec.exerciseType === 'testlab_coding' || topRec.exerciseType === 'testlab_mcq') {
      const exists = CURATED_QUESTIONS.some((q) => q.id === topRec.targetExerciseId)
      expect(exists).toBe(true)
    }
  })
})
