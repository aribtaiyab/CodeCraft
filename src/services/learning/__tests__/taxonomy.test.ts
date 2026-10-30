// ============================================================================
// Automated Tests: Phase 7 Shared Concept & Mistake Taxonomy
// ============================================================================

import { describe, it, expect } from 'vitest'
import {
  classifyBugCategory,
  classifyAssessmentQuestion,
  CONCEPT_REGISTRY,
  type ConceptId,
} from '../taxonomy'
import type { BugCategory } from '../../coach/types'
import type { AssessmentQuestion } from '../../assessment/types'

describe('Phase 7: Shared Concept & Mistake Taxonomy', () => {
  it('registers all canonical concepts with complete metadata', () => {
    const canonicalIds: ConceptId[] = [
      'var_assignment_types',
      'operators_arithmetic',
      'type_conversion',
      'string_operations',
      'boolean_expressions',
      'conditional_branching',
      'loops_iteration',
      'loop_boundary_conditions',
      'function_definition',
      'return_values',
      'variable_scope',
      'list_operations',
      'dictionary_operations',
      'tuples_immutability',
      'zero_division_guard',
      'accumulator_patterns',
      'search_filtering',
    ]

    for (const id of canonicalIds) {
      const def = CONCEPT_REGISTRY[id]
      expect(def).toBeDefined()
      expect(def.id).toBe(id)
      expect(def.name).toBeTruthy()
      expect(def.topic).toBeTruthy()
      expect(def.topicLabel).toBeTruthy()
    }
  })

  it('deterministically classifies known bug categories to canonical concepts with high confidence', () => {
    const testCases: { category: BugCategory; expectedConcept: ConceptId; expectedTopic: string }[] = [
      { category: 'zero-division', expectedConcept: 'zero_division_guard', expectedTopic: 'algorithms_logic' },
      { category: 'index-out-of-bounds', expectedConcept: 'list_operations', expectedTopic: 'data_structures' },
      { category: 'key-error', expectedConcept: 'dictionary_operations', expectedTopic: 'data_structures' },
      { category: 'name-error-typo', expectedConcept: 'variable_scope', expectedTopic: 'functions_scope' },
      { category: 'type-mismatch', expectedConcept: 'type_conversion', expectedTopic: 'python_fundamentals' },
      { category: 'early-return-loop', expectedConcept: 'loop_boundary_conditions', expectedTopic: 'control_flow' },
      { category: 'missing-return', expectedConcept: 'return_values', expectedTopic: 'functions_scope' },
      { category: 'comparison-assignment', expectedConcept: 'boolean_expressions', expectedTopic: 'control_flow' },
    ]

    for (const tc of testCases) {
      const res = classifyBugCategory(tc.category)
      expect(res.conceptId).toBe(tc.expectedConcept)
      expect(res.topicId).toBe(tc.expectedTopic)
      expect(res.confidence).toBe('high')
      expect(res.explanation).toBeTruthy()
    }
  })

  it('labels unknown or general runtime errors with low confidence instead of guessing', () => {
    const res = classifyBugCategory('general-runtime-error')
    expect(res.confidence).toBe('low')
    expect(res.conceptId).toBe('var_assignment_types')
  })

  it('accurately maps assessment questions to canonical concepts', () => {
    const q1: AssessmentQuestion = {
      id: 'mcq_fund_01',
      type: 'mcq',
      topic: 'python_fundamentals',
      difficulty: 'beginner',
      points: 10,
      prompt: 'What is the output of floor division in Python?',
      options: [],
      correctOptionId: 'opt_1',
      explanation: '',
    }
    expect(classifyAssessmentQuestion(q1).conceptId).toBe('operators_arithmetic')

    const q2: AssessmentQuestion = {
      id: 'code_algo_01',
      type: 'coding',
      topic: 'algorithms_logic',
      difficulty: 'beginner',
      points: 25,
      prompt: 'Write a safe divide function handling zero division',
      starterCode: '',
      testCases: [],
      explanation: '',
    }
    expect(classifyAssessmentQuestion(q2).conceptId).toBe('zero_division_guard')
  })
})
