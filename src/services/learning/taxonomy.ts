// ============================================================================
// CodeCraft — Shared Concept and Mistake Taxonomy
// Phase 7: Canonical concepts across Code Studio, Coach, Test Lab, and Progress
// ============================================================================

import type { BugCategory } from '../coach/types'
import type { AssessmentTopic, AssessmentQuestion } from '../assessment/types'

export type ConceptId =
  // Python Fundamentals
  | 'var_assignment_types'
  | 'operators_arithmetic'
  | 'type_conversion'
  | 'string_operations'
  // Control Flow
  | 'boolean_expressions'
  | 'conditional_branching'
  | 'loops_iteration'
  | 'loop_boundary_conditions'
  // Functions & Scope
  | 'function_definition'
  | 'return_values'
  | 'variable_scope'
  // Data Structures
  | 'list_operations'
  | 'dictionary_operations'
  | 'tuples_immutability'
  // Algorithms & Logic
  | 'zero_division_guard'
  | 'accumulator_patterns'
  | 'search_filtering'

export interface ConceptDefinition {
  id: ConceptId
  name: string
  topic: AssessmentTopic
  topicLabel: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export const CONCEPT_REGISTRY: Record<ConceptId, ConceptDefinition> = {
  var_assignment_types: {
    id: 'var_assignment_types',
    name: 'Variables & Data Types',
    topic: 'python_fundamentals',
    topicLabel: 'Python Fundamentals',
    description: 'Variable bindings, integers, floats, booleans, and dynamic typing.',
    difficulty: 'beginner',
  },
  operators_arithmetic: {
    id: 'operators_arithmetic',
    name: 'Operators & Floor Division',
    topic: 'python_fundamentals',
    topicLabel: 'Python Fundamentals',
    description: 'Floor division (//), modulo (%), exponentiation, and precedence.',
    difficulty: 'beginner',
  },
  type_conversion: {
    id: 'type_conversion',
    name: 'Type Conversion & Casting',
    topic: 'python_fundamentals',
    topicLabel: 'Python Fundamentals',
    description: 'Explicit conversion between str, int, and float, input parsing.',
    difficulty: 'beginner',
  },
  string_operations: {
    id: 'string_operations',
    name: 'String Slicing & Methods',
    topic: 'python_fundamentals',
    topicLabel: 'Python Fundamentals',
    description: 'Substrings, step indexing [start:stop:step], and string formatting.',
    difficulty: 'intermediate',
  },
  boolean_expressions: {
    id: 'boolean_expressions',
    name: 'Boolean Logic & Comparisons',
    topic: 'control_flow',
    topicLabel: 'Control Flow & Loops',
    description: 'Equality (==), identity (is), logical and/or/not truthiness.',
    difficulty: 'beginner',
  },
  conditional_branching: {
    id: 'conditional_branching',
    name: 'Conditional Branching (if/elif/else)',
    topic: 'control_flow',
    topicLabel: 'Control Flow & Loops',
    description: 'Multi-branch decision trees, guard clauses, and fallthrough order.',
    difficulty: 'beginner',
  },
  loops_iteration: {
    id: 'loops_iteration',
    name: 'Loops & Iteration (for/while)',
    topic: 'control_flow',
    topicLabel: 'Control Flow & Loops',
    description: 'Iteration over ranges, break, continue, and loop termination.',
    difficulty: 'beginner',
  },
  loop_boundary_conditions: {
    id: 'loop_boundary_conditions',
    name: 'Loop Boundaries & Premature Return',
    topic: 'control_flow',
    topicLabel: 'Control Flow & Loops',
    description: 'Off-by-one errors, loop boundaries, and early return bugs.',
    difficulty: 'intermediate',
  },
  function_definition: {
    id: 'function_definition',
    name: 'Function Definitions & Parameters',
    topic: 'functions_scope',
    topicLabel: 'Functions & Scope',
    description: 'Def statement, positional vs keyword arguments, and defaults.',
    difficulty: 'beginner',
  },
  return_values: {
    id: 'return_values',
    name: 'Return Values & None Handling',
    topic: 'functions_scope',
    topicLabel: 'Functions & Scope',
    description: 'Explicit returns, implicit None, and returning compound types.',
    difficulty: 'beginner',
  },
  variable_scope: {
    id: 'variable_scope',
    name: 'Variable Scope & Name Resolution',
    topic: 'functions_scope',
    topicLabel: 'Functions & Scope',
    description: 'Local vs global variables, NameError prevention, and shadowing.',
    difficulty: 'intermediate',
  },
  list_operations: {
    id: 'list_operations',
    name: 'List Indexing & Slicing',
    topic: 'data_structures',
    topicLabel: 'Data Structures',
    description: 'Zero-based indices, negative indexing, and out-of-bounds safety.',
    difficulty: 'beginner',
  },
  dictionary_operations: {
    id: 'dictionary_operations',
    name: 'Dictionary Keys & Lookups',
    topic: 'data_structures',
    topicLabel: 'Data Structures',
    description: 'Key-value mapping, KeyError handling, and .get() safety.',
    difficulty: 'intermediate',
  },
  tuples_immutability: {
    id: 'tuples_immutability',
    name: 'Tuples & Immutability',
    topic: 'data_structures',
    topicLabel: 'Data Structures',
    description: 'Fixed sequences, immutable properties, and tuple unpacking.',
    difficulty: 'intermediate',
  },
  zero_division_guard: {
    id: 'zero_division_guard',
    name: 'Division Safety & Empty Cases',
    topic: 'algorithms_logic',
    topicLabel: 'Algorithms & Problem Solving',
    description: 'ZeroDivisionError guard, empty sequence checks, and edge cases.',
    difficulty: 'beginner',
  },
  accumulator_patterns: {
    id: 'accumulator_patterns',
    name: 'Accumulator Patterns & Counting',
    topic: 'algorithms_logic',
    topicLabel: 'Algorithms & Problem Solving',
    description: 'Iterative running totals, count tallies, and state aggregation.',
    difficulty: 'beginner',
  },
  search_filtering: {
    id: 'search_filtering',
    name: 'Search, Filter & Predicates',
    topic: 'algorithms_logic',
    topicLabel: 'Algorithms & Problem Solving',
    description: 'Filtering elements satisfying conditions and linear search.',
    difficulty: 'intermediate',
  },
}

export interface ConceptClassification {
  conceptId: ConceptId
  topicId: AssessmentTopic
  confidence: 'high' | 'medium' | 'low'
  explanation: string
}

/**
 * Deterministically classifies a Debugging Coach bug category into canonical concept
 */
export function classifyBugCategory(category: BugCategory): ConceptClassification {
  switch (category) {
    case 'zero-division':
      return {
        conceptId: 'zero_division_guard',
        topicId: 'algorithms_logic',
        confidence: 'high',
        explanation: 'Division by zero or unhandled empty container during averaging/division.',
      }
    case 'index-out-of-bounds':
      return {
        conceptId: 'list_operations',
        topicId: 'data_structures',
        confidence: 'high',
        explanation: 'Sequence index was accessed outside valid length boundaries.',
      }
    case 'key-error':
      return {
        conceptId: 'dictionary_operations',
        topicId: 'data_structures',
        confidence: 'high',
        explanation: 'Dictionary key was accessed without confirming key existence.',
      }
    case 'name-error-typo':
      return {
        conceptId: 'variable_scope',
        topicId: 'functions_scope',
        confidence: 'high',
        explanation: 'Variable referenced before assignment or identifier typo outside scope.',
      }
    case 'type-mismatch':
    case 'value-error':
    case 'unconverted-input':
      return {
        conceptId: 'type_conversion',
        topicId: 'python_fundamentals',
        confidence: 'high',
        explanation: 'Incompatible types used in operation or missing explicit type casting.',
      }
    case 'early-return-loop':
      return {
        conceptId: 'loop_boundary_conditions',
        topicId: 'control_flow',
        confidence: 'high',
        explanation: 'Function returned prematurely on the first iteration of a loop.',
      }
    case 'missing-return':
      return {
        conceptId: 'return_values',
        topicId: 'functions_scope',
        confidence: 'high',
        explanation: 'Function completed without returning expected value, yielding None.',
      }
    case 'comparison-assignment':
      return {
        conceptId: 'boolean_expressions',
        topicId: 'control_flow',
        confidence: 'high',
        explanation: 'Assignment (=) mistakenly used where equality comparison (==) was intended.',
      }
    case 'syntax-indentation':
    case 'syntax-error':
      return {
        conceptId: 'string_operations',
        topicId: 'python_fundamentals',
        confidence: 'high',
        explanation: 'Syntax error such as unmatched braces, quotes, or missing colons.',
      }
    case 'indentation-error':
      return {
        conceptId: 'var_assignment_types',
        topicId: 'python_fundamentals',
        confidence: 'high',
        explanation: 'Indentation mismatch or unexpected block indentation level in Python.',
      }
    case 'attribute-error':
      return {
        conceptId: 'list_operations',
        topicId: 'data_structures',
        confidence: 'high',
        explanation: 'Attempted to access non-existent attribute or method on data structure.',
      }
    case 'import-error':
      return {
        conceptId: 'var_assignment_types',
        topicId: 'python_fundamentals',
        confidence: 'high',
        explanation: 'Imported module or symbol is not found or unsupported.',
      }
    case 'recursion-error':
      return {
        conceptId: 'function_definition',
        topicId: 'functions_scope',
        confidence: 'high',
        explanation: 'Recursive function called itself indefinitely without reaching a base case.',
      }
    case 'timeout-infinite-loop':
      return {
        conceptId: 'loops_iteration',
        topicId: 'control_flow',
        confidence: 'high',
        explanation: 'Loop ran indefinitely without terminating, exceeding execution timeout.',
      }
    case 'test-failure':
      return {
        conceptId: 'search_filtering',
        topicId: 'algorithms_logic',
        confidence: 'high',
        explanation: 'Assertion failure where test case outputs did not match expected solution.',
      }
    case 'general-runtime-error':
    default:
      return {
        conceptId: 'var_assignment_types',
        topicId: 'python_fundamentals',
        confidence: 'low',
        explanation: 'Unclassified runtime exception during student execution.',
      }
  }
}

/**
 * Maps an AssessmentQuestion from curated bank to canonical concept
 */
export function classifyAssessmentQuestion(q: AssessmentQuestion): {
  conceptId: ConceptId
  topicId: AssessmentTopic
} {
  const id = q.id.toLowerCase()
  const prompt = q.prompt.toLowerCase()

  // Specific question ID mappings (check code_* IDs first to prevent substring overlap)
  if (id.includes('code_fund_01')) return { conceptId: 'type_conversion', topicId: 'python_fundamentals' }
  if (id.includes('fund_01')) return { conceptId: 'operators_arithmetic', topicId: 'python_fundamentals' }
  if (id.includes('fund_02')) return { conceptId: 'var_assignment_types', topicId: 'python_fundamentals' }
  if (id.includes('fund_03')) return { conceptId: 'string_operations', topicId: 'python_fundamentals' }

  if (id.includes('code_flow_01')) return { conceptId: 'conditional_branching', topicId: 'control_flow' }
  if (id.includes('flow_01')) return { conceptId: 'loops_iteration', topicId: 'control_flow' }
  if (id.includes('flow_02')) return { conceptId: 'boolean_expressions', topicId: 'control_flow' }

  if (id.includes('code_func_01')) return { conceptId: 'function_definition', topicId: 'functions_scope' }
  if (id.includes('func_01')) return { conceptId: 'return_values', topicId: 'functions_scope' }
  if (id.includes('func_02')) return { conceptId: 'variable_scope', topicId: 'functions_scope' }

  if (id.includes('code_ds_01')) return { conceptId: 'dictionary_operations', topicId: 'data_structures' }
  if (id.includes('ds_01') || id.includes('ds_02')) return { conceptId: 'list_operations', topicId: 'data_structures' }

  if (id.includes('code_algo_01')) return { conceptId: 'zero_division_guard', topicId: 'algorithms_logic' }
  if (id.includes('algo_01') || id.includes('algo_02')) return { conceptId: 'accumulator_patterns', topicId: 'algorithms_logic' }

  // Heuristic prompt content fallback
  if (prompt.includes('zero') || prompt.includes('division') || prompt.includes('empty')) {
    return { conceptId: 'zero_division_guard', topicId: 'algorithms_logic' }
  }
  if (prompt.includes('dictionary') || prompt.includes('key')) {
    return { conceptId: 'dictionary_operations', topicId: 'data_structures' }
  }
  if (prompt.includes('list') || prompt.includes('index')) {
    return { conceptId: 'list_operations', topicId: 'data_structures' }
  }
  if (prompt.includes('return')) {
    return { conceptId: 'return_values', topicId: 'functions_scope' }
  }
  if (prompt.includes('loop') || prompt.includes('while') || prompt.includes('for')) {
    return { conceptId: 'loops_iteration', topicId: 'control_flow' }
  }

  // Default to topic standard
  switch (q.topic) {
    case 'control_flow':
      return { conceptId: 'loops_iteration', topicId: 'control_flow' }
    case 'functions_scope':
      return { conceptId: 'function_definition', topicId: 'functions_scope' }
    case 'data_structures':
      return { conceptId: 'list_operations', topicId: 'data_structures' }
    case 'algorithms_logic':
      return { conceptId: 'search_filtering', topicId: 'algorithms_logic' }
    case 'python_fundamentals':
    default:
      return { conceptId: 'var_assignment_types', topicId: 'python_fundamentals' }
  }
}
