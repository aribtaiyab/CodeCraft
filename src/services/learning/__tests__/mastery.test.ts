// ============================================================================
// Automated Tests: Phase 7 Evidence-Based Concept Mastery Engine
// ============================================================================

import { describe, it, expect } from 'vitest'
import { computeConceptMastery } from '../masteryService'
import type { LearningEvent } from '../types'

describe('Phase 7: Concept Mastery Engine', () => {
  it('initializes all canonical concepts in no_evidence status when no events exist', () => {
    const masteries = computeConceptMastery([])
    for (const m of Object.values(masteries)) {
      expect(m.status).toBe('no_evidence')
      expect(m.evidenceCount).toBe(0)
      expect(m.confidence).toBe('none')
    }
  })

  it('leaves concept in no_evidence when only 1 evaluation exists (avoids hasty conclusions)', () => {
    const singleFailure: LearningEvent = {
      id: 'ev_1',
      timestamp: 1000,
      source: 'code_studio',
      activityType: 'coach_diagnosis',
      conceptId: 'zero_division_guard',
      topicId: 'algorithms_logic',
      outcome: 'failed',
      evidenceQuality: 'high',
      errorCategory: 'zero-division',
      title: 'Zero Division',
      summary: 'Divided by zero',
      dedupKey: 'dedup_1',
      schemaVersion: 1,
    }

    const masteries = computeConceptMastery([singleFailure])
    const zeroDiv = masteries.zero_division_guard
    expect(zeroDiv.status).toBe('no_evidence')
    expect(zeroDiv.evidenceCount).toBe(1)
    expect(zeroDiv.confidence).toBe('low')
  })

  it('excludes system errors and unasserted runs from penalizing or inflating mastery', () => {
    const systemError: LearningEvent = {
      id: 'ev_sys',
      timestamp: 1000,
      source: 'ai_test_lab',
      activityType: 'assessment_question_evaluated',
      conceptId: 'zero_division_guard',
      topicId: 'algorithms_logic',
      outcome: 'system_error',
      evidenceQuality: 'high',
      title: 'Worker Timeout',
      summary: 'Pyodide execution timeout exceeded',
      metadata: { isSystemError: true },
      dedupKey: 'dedup_sys',
      schemaVersion: 1,
    }

    const inconclusiveRun: LearningEvent = {
      id: 'ev_inconc',
      timestamp: 2000,
      source: 'code_studio',
      activityType: 'code_execution',
      conceptId: 'zero_division_guard',
      topicId: 'algorithms_logic',
      outcome: 'inconclusive',
      evidenceQuality: 'low',
      title: 'Print Output',
      summary: 'Standard stdout execution',
      dedupKey: 'dedup_inconc',
      schemaVersion: 1,
    }

    const masteries = computeConceptMastery([systemError, inconclusiveRun])
    expect(masteries.zero_division_guard.status).toBe('no_evidence')
    expect(masteries.zero_division_guard.evidenceCount).toBe(0)
  })

  it('classifies concept as needs_practice when repeated failures occur', () => {
    const events: LearningEvent[] = [
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
        title: 'Zero Division in Studio',
        summary: 'Crashed on empty list',
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
        title: 'Safe Division Test Lab Question',
        summary: 'Failed edge case assertion',
        dedupKey: 'd2',
        schemaVersion: 1,
      },
    ]

    const masteries = computeConceptMastery(events)
    const m = masteries.zero_division_guard
    expect(m.status).toBe('needs_practice')
    expect(m.evidenceCount).toBe(2)
    expect(m.failureCount).toBe(2)
    expect(m.winRate).toBe(0)
    expect(m.confidence).toBe('medium')
  })

  it('classifies concept as consistent when student demonstrates repeated success', () => {
    const events: LearningEvent[] = [
      {
        id: 'ev_1',
        timestamp: 1000,
        source: 'ai_test_lab',
        activityType: 'assessment_question_evaluated',
        conceptId: 'list_operations',
        topicId: 'data_structures',
        outcome: 'passed',
        evidenceQuality: 'high',
        title: 'List Indexing MCQ',
        summary: 'Correct',
        dedupKey: 'd1',
        schemaVersion: 1,
      },
      {
        id: 'ev_2',
        timestamp: 2000,
        source: 'code_studio',
        activityType: 'test_your_fix',
        conceptId: 'list_operations',
        topicId: 'data_structures',
        outcome: 'passed',
        evidenceQuality: 'high',
        title: 'Index Bounds Fix',
        summary: 'Test assertion passed',
        dedupKey: 'd2',
        schemaVersion: 1,
      },
      {
        id: 'ev_3',
        timestamp: 3000,
        source: 'ai_test_lab',
        activityType: 'assessment_question_evaluated',
        conceptId: 'list_operations',
        topicId: 'data_structures',
        outcome: 'passed',
        evidenceQuality: 'high',
        title: 'List Slicing Question',
        summary: 'Correct',
        dedupKey: 'd3',
        schemaVersion: 1,
      },
    ]

    const masteries = computeConceptMastery(events)
    const m = masteries.list_operations
    expect(m.status).toBe('consistent')
    expect(m.evidenceCount).toBe(3)
    expect(m.successCount).toBe(3)
    expect(m.winRate).toBe(100)
    expect(m.confidence).toBe('high')
  })
})
