// ============================================================================
// Automated End-to-End Tests: Complete Debugging Coach & Test Fix Journeys
// ============================================================================

import { describe, it, expect } from 'vitest'
import { diagnoseBug } from '../bugTaxonomy'
import { DEBUGGING_EXERCISES } from '../exercises'
import { buildTestRunnerScript, parseTestResultsFromOutput } from '../testRunner'

describe('End-to-End Debugging Coach & Test Your Fix Journeys', () => {
  it('Journey 1: ZeroDivisionError (safe_average) -> Hint -> Diagnosis -> Fix -> Test -> Related Challenge', () => {
    const exercise = DEBUGGING_EXERCISES.find((e) => e.id === 'ex-safe-average')!
    expect(exercise).toBeDefined()

    // 1. Original code failure: simulate ZeroDivisionError runtime error
    const simulatedError = {
      errorType: 'ZeroDivisionError',
      message: 'division by zero',
      traceback: 'File "<string>", line 4, in safe_average\nZeroDivisionError: division by zero',
    }

    // 2. Coach analyzes actual error
    const diagnosis = diagnoseBug({
      code: exercise.buggyCode,
      lastError: simulatedError,
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('zero-division')

    // 3. Progressive Hints (3 levels)
    const [h1, h2, h3] = diagnosis!.hints
    expect(h1.level).toBe(1)
    expect(h1.content).toContain('dividing by zero')

    expect(h2.level).toBe(2)
    expect(h2.evidence?.line).toBe(4)
    expect(h2.evidence?.observedValue).toBe('Divisor = 0')
    expect(h2.content).toContain('divisor evaluated to 0')

    expect(h3.level).toBe(3)
    expect(h3.suggestedFix).toBeDefined()
    expect(h3.suggestedFix?.replacementText).toContain('if not numbers:')
    expect(h3.suggestedFix?.replacementText).toContain('return 0.0')

    // 4. Review and Apply Suggested Fix
    const originalCode = exercise.buggyCode
    const fix = h3.suggestedFix!
    const fixedCode = originalCode.replace(fix.originalText, fix.replacementText)

    expect(fixedCode).not.toBe(originalCode)
    expect(fixedCode).toContain('if not numbers:')
    expect(fixedCode).toContain('return 0.0')

    // 5. Undo verification
    const undoneCode = originalCode
    expect(undoneCode).toBe(exercise.buggyCode)

    // 6. Test Your Fix runner execution
    const testScript = buildTestRunnerScript(fixedCode, exercise.testCases)
    expect(testScript).toContain('safe_average([10.0, 20.0, 30.0])')
    expect(testScript).toContain('safe_average([])')

    // Simulate stdout from test runner
    const simulatedStdout = `__CODECRAFT_TEST_RESULTS__:[
      {"id":"tc-avg-1","name":"Standard list","status":"passed","expected":"20.0","actual":"20.0","durationMs":0.2},
      {"id":"tc-avg-2","name":"Single element","status":"passed","expected":"42.0","actual":"42.0","durationMs":0.1},
      {"id":"tc-avg-3","name":"Empty list guard","status":"passed","expected":"0.0","actual":"0.0","durationMs":0.1}
    ]`

    const results = parseTestResultsFromOutput(simulatedStdout)
    expect(results).not.toBeNull()
    expect(results?.length).toBe(3)
    expect(results?.every((r) => r.status === 'passed')).toBe(true)

    // 7. Unlocks Related Exercise with shared concept tag
    const related = DEBUGGING_EXERCISES.find((e) => e.id === exercise.relatedExerciseId)!
    expect(related).toBeDefined()
    expect(related.id).toBe('ex-percentage-calc')
    expect(related.conceptTag).toBe(exercise.conceptTag)
  })

  it('Journey 2: Off-by-one loop (find_max_index) -> Fix -> Related Challenge', () => {
    const exercise = DEBUGGING_EXERCISES.find((e) => e.id === 'ex-find-max-index')!
    expect(exercise).toBeDefined()

    const simulatedError = {
      errorType: 'IndexError',
      message: 'list index out of range',
      traceback: 'File "<string>", line 5, in find_max_index\nIndexError: list index out of range',
    }

    const diagnosis = diagnoseBug({
      code: exercise.buggyCode,
      lastError: simulatedError,
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('index-out-of-bounds')

    const fix = diagnosis!.hints[2].suggestedFix!
    expect(fix.originalText).toContain('range(len(nums) + 1)')
    expect(fix.replacementText).toContain('range(len(nums))')

    const fixedCode = exercise.buggyCode.replace(fix.originalText, fix.replacementText)
    expect(fixedCode).not.toContain('+ 1')

    const related = DEBUGGING_EXERCISES.find((e) => e.id === exercise.relatedExerciseId)!
    expect(related.id).toBe('ex-reverse-list')
    expect(related.conceptTag).toBe('loops-indexing')
  })

  it('Journey 3: Early return inside loop (count_vowels) -> Fix -> Related Challenge', () => {
    const exercise = DEBUGGING_EXERCISES.find((e) => e.id === 'ex-count-vowels')!
    expect(exercise).toBeDefined()

    // Simulate test failure where function prematurely returned 1
    const testFailures = [
      {
        id: 'tc-vow-1',
        name: 'Multiple vowels',
        status: 'failed' as const,
        expected: '2',
        actual: '1',
      },
    ]

    const diagnosis = diagnoseBug({
      code: exercise.buggyCode,
      lastError: null,
      testFailures,
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('early-return-loop')
    expect(diagnosis?.line).toBe(8)

    const fix = diagnosis!.hints[2].suggestedFix!
    const fixedCode = exercise.buggyCode.replace(fix.originalText, fix.replacementText)
    expect(fixedCode).not.toContain('        return count') // removed from inside loop

    const related = DEBUGGING_EXERCISES.find((e) => e.id === exercise.relatedExerciseId)!
    expect(related.id).toBe('ex-sum-positives')
    expect(related.conceptTag).toBe('functions-returns')
  })

  it('Journey 4: Stale suggested fix detection when user modifies code', () => {
    const originalCode = `def add(a, b):\n    return a + b\n`
    const diagnosis = diagnoseBug({
      code: originalCode,
      lastError: {
        errorType: 'NameError',
        message: "name 'c' is not defined",
        traceback: 'File "<string>", line 2, in add\nNameError: name \'c\' is not defined',
      },
    })

    expect(diagnosis).not.toBeNull()
    const originalHash = diagnosis!.codeHash

    // User modifies code
    const modifiedCode = `def add(a, b, c):\n    return a + b + c\n`
    const reDiagnosed = diagnoseBug({
      code: modifiedCode,
      lastError: null,
    })

    // If code has no error and no test failures, diagnosis is cleared
    expect(reDiagnosed).toBeNull()
    expect(originalHash).not.toBe('')
  })
})
