// ============================================================================
// CodeCraft — Targeted Practice Recommendation Engine
// Phase 7: Connects student mistakes and concept evidence to real exercises
// ============================================================================

import type { ConceptId } from './taxonomy'
import type { ConceptMastery, PracticeRecommendation } from './types'
import { CURATED_QUESTIONS } from '../assessment/curatedBank'

interface ConceptExerciseMapping {
  conceptId: ConceptId
  testLabQuestionId?: string
  coachExerciseId?: string
  fallbackTopic: 'python_fundamentals' | 'control_flow' | 'functions_scope' | 'data_structures' | 'algorithms_logic'
  actionHeadline: string
  actionReason: string
}

const EXERCISE_MAP: Record<ConceptId, ConceptExerciseMapping> = {
  zero_division_guard: {
    conceptId: 'zero_division_guard',
    testLabQuestionId: 'code_algo_01',
    coachExerciseId: 'ex-safe-average',
    fallbackTopic: 'algorithms_logic',
    actionHeadline: 'Safe Division & Empty Input Guard',
    actionReason: 'You encountered a division error on empty/zero inputs. Practice guard clauses to handle edge cases safely.',
  },
  list_operations: {
    conceptId: 'list_operations',
    testLabQuestionId: 'mcq_ds_01',
    coachExerciseId: 'ex-index-bounds',
    fallbackTopic: 'data_structures',
    actionHeadline: 'List Index Boundary Safety',
    actionReason: 'Sequence access exceeded length boundaries. Practice zero-based indexing and boundary limits.',
  },
  dictionary_operations: {
    conceptId: 'dictionary_operations',
    testLabQuestionId: 'code_ds_01',
    coachExerciseId: 'ex-dict-key',
    fallbackTopic: 'data_structures',
    actionHeadline: 'Dictionary Key Lookups & Frequency Counts',
    actionReason: 'Encountered KeyError or missing key check. Practice safe .get() and key membership verification.',
  },
  type_conversion: {
    conceptId: 'type_conversion',
    testLabQuestionId: 'code_fund_01',
    coachExerciseId: 'ex-type-concat',
    fallbackTopic: 'python_fundamentals',
    actionHeadline: 'Explicit Type Conversion & Numeric Logic',
    actionReason: 'Type mismatch or unconverted input detected. Practice explicit int/float/str conversions.',
  },
  loop_boundary_conditions: {
    conceptId: 'loop_boundary_conditions',
    testLabQuestionId: 'code_flow_01',
    coachExerciseId: 'ex-loop-early-return',
    fallbackTopic: 'control_flow',
    actionHeadline: 'Loop Iteration & Return Scope',
    actionReason: 'Loop returned prematurely or encountered off-by-one bounds. Strengthen full collection iteration.',
  },
  variable_scope: {
    conceptId: 'variable_scope',
    testLabQuestionId: 'mcq_func_02',
    coachExerciseId: 'ex-name-scope',
    fallbackTopic: 'functions_scope',
    actionHeadline: 'Scope Resolution & Variable Naming',
    actionReason: 'NameError or variable shadowed outside scope. Review local vs outer variable access.',
  },
  return_values: {
    conceptId: 'return_values',
    testLabQuestionId: 'mcq_func_01',
    coachExerciseId: 'ex-missing-return',
    fallbackTopic: 'functions_scope',
    actionHeadline: 'Function Return Values & None Handling',
    actionReason: 'Function completed without returning expected value. Practice explicit returns in all branches.',
  },
  boolean_expressions: {
    conceptId: 'boolean_expressions',
    testLabQuestionId: 'mcq_flow_02',
    coachExerciseId: 'ex-comparison-assign',
    fallbackTopic: 'control_flow',
    actionHeadline: 'Equality Comparisons vs Assignment',
    actionReason: 'Condition used assignment (=) or evaluated boolean truthiness incorrectly. Review comparison operators.',
  },
  var_assignment_types: {
    conceptId: 'var_assignment_types',
    testLabQuestionId: 'mcq_fund_02',
    fallbackTopic: 'python_fundamentals',
    actionHeadline: 'Python Types & Dynamic Bindings',
    actionReason: 'Strengthen fundamental understanding of Python types, truthiness, and variables.',
  },
  operators_arithmetic: {
    conceptId: 'operators_arithmetic',
    testLabQuestionId: 'mcq_fund_01',
    fallbackTopic: 'python_fundamentals',
    actionHeadline: 'Floor Division & Modulo Operations',
    actionReason: 'Review integer floor division (//) and remainder calculation (%).',
  },
  string_operations: {
    conceptId: 'string_operations',
    testLabQuestionId: 'mcq_fund_03',
    fallbackTopic: 'python_fundamentals',
    actionHeadline: 'String Slicing [start:stop:step]',
    actionReason: 'Master step slicing and zero-based index substrings.',
  },
  conditional_branching: {
    conceptId: 'conditional_branching',
    testLabQuestionId: 'code_flow_01',
    fallbackTopic: 'control_flow',
    actionHeadline: 'Branching Conditions & Parity Logic',
    actionReason: 'Practice if-elif-else branching on collections of data.',
  },
  loops_iteration: {
    conceptId: 'loops_iteration',
    testLabQuestionId: 'mcq_flow_01',
    fallbackTopic: 'control_flow',
    actionHeadline: 'Loop Termination & Range Counters',
    actionReason: 'Trace loop execution to avoid off-by-one counting errors.',
  },
  function_definition: {
    conceptId: 'function_definition',
    testLabQuestionId: 'code_func_01',
    fallbackTopic: 'functions_scope',
    actionHeadline: 'Function Signatures & Default Parameters',
    actionReason: 'Write structured, reusable functions with proper parameters.',
  },
  tuples_immutability: {
    conceptId: 'tuples_immutability',
    testLabQuestionId: 'mcq_ds_02',
    fallbackTopic: 'data_structures',
    actionHeadline: 'Tuples & Immutability Patterns',
    actionReason: 'Learn when to use immutable sequence types.',
  },
  accumulator_patterns: {
    conceptId: 'accumulator_patterns',
    testLabQuestionId: 'mcq_algo_01',
    fallbackTopic: 'algorithms_logic',
    actionHeadline: 'Accumulator Patterns & Summation',
    actionReason: 'Practice stateful accumulation across lists.',
  },
  search_filtering: {
    conceptId: 'search_filtering',
    testLabQuestionId: 'code_algo_01',
    fallbackTopic: 'algorithms_logic',
    actionHeadline: 'Filtering Logic & Predicates',
    actionReason: 'Select elements matching criteria and handle edge cases.',
  },
}

/**
 * Generates prioritized, evidence-backed practice recommendations.
 *
 * Rules:
 * 1. Prioritizes concepts in 'needs_practice' status.
 * 2. Next prioritizes concepts in 'developing' status with recorded failures.
 * 3. Links ONLY to verified, existing exercises (in AI Test Lab or Code Studio).
 * 4. If all concepts are consistent or no evidence exists, suggests exploring an untouched topic.
 */
export function generateRecommendations(
  masteries: Record<ConceptId, ConceptMastery>
): PracticeRecommendation[] {
  const recommendations: PracticeRecommendation[] = []

  // 1. Check for 'needs_practice' concepts
  const needsPractice = Object.values(masteries)
    .filter((m) => m.status === 'needs_practice')
    .sort((a, b) => (b.failureCount - a.failureCount) || ((b.lastEvaluatedAt || 0) - (a.lastEvaluatedAt || 0)))

  for (const m of needsPractice) {
    const mapping = EXERCISE_MAP[m.conceptId]
    if (!mapping) continue

    // Determine target exercise
    let exerciseId = mapping.testLabQuestionId || mapping.coachExerciseId || 'test_lab_session'
    let exerciseType: PracticeRecommendation['exerciseType'] = 'testlab_coding'
    let actionUrl = `/testlab?topic=${mapping.fallbackTopic}`
    let actionLabel = 'Retest in AI Test Lab'

    if (mapping.coachExerciseId && m.recentErrorCategory) {
      exerciseId = mapping.coachExerciseId
      exerciseType = 'coach_exercise'
      actionUrl = `/studio?exerciseId=${mapping.coachExerciseId}`
      actionLabel = 'Practice in Code Studio'
    } else if (mapping.testLabQuestionId) {
      const q = CURATED_QUESTIONS.find((item) => item.id === mapping.testLabQuestionId)
      if (q) {
        exerciseType = q.type === 'coding' ? 'testlab_coding' : 'testlab_mcq'
        actionUrl = `/testlab?topic=${q.topic}&targetQuestion=${q.id}`
      }
    }

    recommendations.push({
      id: `rec_${m.conceptId}_${Date.now()}`,
      conceptId: m.conceptId,
      conceptName: m.name,
      topic: m.topic,
      topicLabel: m.topicLabel,
      targetExerciseId: exerciseId,
      exerciseType,
      title: mapping.actionHeadline,
      reason: mapping.actionReason,
      suggestedDifficulty: 'beginner',
      actionUrl,
      actionLabel,
      evidenceSource: `Based on ${m.failureCount} recorded issues (${m.winRate}% success rate).`,
      priority: 1,
    })
  }

  // 2. Check for 'developing' concepts with some failures
  const developing = Object.values(masteries)
    .filter((m) => m.status === 'developing' && m.failureCount > 0)
    .sort((a, b) => (b.failureCount - a.failureCount))

  for (const m of developing) {
    if (recommendations.some((r) => r.conceptId === m.conceptId)) continue
    const mapping = EXERCISE_MAP[m.conceptId]
    if (!mapping) continue

    const targetQ = mapping.testLabQuestionId
      ? CURATED_QUESTIONS.find((item) => item.id === mapping.testLabQuestionId)
      : null

    recommendations.push({
      id: `rec_${m.conceptId}_${Date.now()}`,
      conceptId: m.conceptId,
      conceptName: m.name,
      topic: m.topic,
      topicLabel: m.topicLabel,
      targetExerciseId: mapping.testLabQuestionId || 'developing_test',
      exerciseType: targetQ?.type === 'coding' ? 'testlab_coding' : 'testlab_mcq',
      title: mapping.actionHeadline,
      reason: `Solidify your understanding of ${m.name} to achieve consistent performance.`,
      suggestedDifficulty: 'intermediate',
      actionUrl: `/testlab?topic=${mapping.fallbackTopic}`,
      actionLabel: 'Take Practice Assessment',
      evidenceSource: `Developing skill: ${m.successCount}/${m.evidenceCount} passed.`,
      priority: 2,
    })
  }

  // 3. Fallback: If no weaknesses, suggest a fresh assessment topic
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec_explore_fundamentals',
      conceptId: 'var_assignment_types',
      conceptName: 'Python Fundamentals',
      topic: 'python_fundamentals',
      topicLabel: 'Python Fundamentals',
      targetExerciseId: 'curated_fundamentals',
      exerciseType: 'testlab_assessment',
      title: 'Baseline Assessment: Python Fundamentals',
      reason: 'Take a comprehensive assessment to evaluate your knowledge and establish verified concept mastery.',
      suggestedDifficulty: 'beginner',
      actionUrl: '/testlab?topic=python_fundamentals',
      actionLabel: 'Start Assessment',
      evidenceSource: 'Initial diagnostic recommendation.',
      priority: 3,
    })
  }

  return recommendations.slice(0, 3)
}
