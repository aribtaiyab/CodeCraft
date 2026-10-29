// ============================================================================
// Automated Tests: Curated Debugging Exercises Catalog
// ============================================================================

import { describe, it, expect } from 'vitest'
import { DEBUGGING_EXERCISES } from '../exercises'

describe('Debugging Exercises Catalog', () => {
  it('contains curated exercises covering core taxonomy concepts', () => {
    expect(DEBUGGING_EXERCISES.length).toBeGreaterThanOrEqual(5)

    const conceptTags = DEBUGGING_EXERCISES.map((e) => e.conceptTag)
    expect(conceptTags).toContain('zero-division-guard')
    expect(conceptTags).toContain('loops-indexing')
    expect(conceptTags).toContain('functions-returns')
    expect(conceptTags).toContain('dict-key-lookup')
    expect(conceptTags).toContain('type-conversion')
  })

  it('ensures each exercise has 3-level hints and valid test cases', () => {
    for (const ex of DEBUGGING_EXERCISES) {
      expect(ex.id).toBeTruthy()
      expect(ex.title).toBeTruthy()
      expect(ex.buggyCode).toBeTruthy()
      expect(ex.expectedSolutionCode).toBeTruthy()
      expect(ex.hints.length).toBe(3)
      expect(ex.testCases.length).toBeGreaterThanOrEqual(2)

      // Test cases have expected results
      for (const tc of ex.testCases) {
        expect(tc.id).toBeTruthy()
        expect(tc.name).toBeTruthy()
        expect(tc.callExpr).toBeTruthy()
        expect(tc.expected).toBeDefined()
      }

      // Related exercise must exist if specified
      if (ex.relatedExerciseId) {
        const related = DEBUGGING_EXERCISES.find((r) => r.id === ex.relatedExerciseId)
        expect(related).toBeDefined()
        expect(related?.conceptTag).toBe(ex.conceptTag)
      }
    }
  })
})
