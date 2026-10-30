// ============================================================================
// Automated Tests: Intelligent Test Case Generator for Test Fix
// ============================================================================

import { describe, it, expect } from 'vitest'
import { generateSuggestedTestCases, explainFailure } from '../testCaseGenerator'
import type { TestCaseAssertion, TestAssertionResult } from '../types'

describe('Intelligent Test Case Generator', () => {
  it('suggests normal, zero, decimal, negative, and edge cases for an average calculator', () => {
    const averageCode = `
def calculate_average(numbers: list[float]) -> float:
    total = sum(numbers)
    return total / len(numbers)
`
    const testCases = generateSuggestedTestCases(averageCode)

    expect(testCases.length).toBeGreaterThanOrEqual(5)

    // Check normal positive case
    const posCase = testCases.find((tc) => tc.category === 'normal')
    expect(posCase).toBeDefined()
    expect(posCase?.callExpr).toContain('calculate_average')
    expect(posCase?.inputDescription).toContain('10, 20, 30')
    expect(posCase?.expected).toBe('20.0')

    // Check zero values
    const zeroCase = testCases.find((tc) => tc.category === 'zero')
    expect(zeroCase).toBeDefined()
    expect(zeroCase?.expected).toBe('0.0')

    // Check decimal numbers
    const decCase = testCases.find((tc) => tc.category === 'decimal')
    expect(decCase).toBeDefined()
    expect(decCase?.inputDescription).toContain('1.5')

    // Check negative numbers
    const negCase = testCases.find((tc) => tc.category === 'negative')
    expect(negCase).toBeDefined()
    expect(negCase?.inputDescription).toContain('-5')
    expect(negCase?.expected).toBe('-10.0')

    // Check empty list edge case
    const emptyCase = testCases.find((tc) => tc.inputDescription === '[]')
    expect(emptyCase).toBeDefined()
    expect(emptyCase?.expected).toBe('0.0')
  })

  it('suggests test cases for dictionary counting (process_inventory)', () => {
    const inventoryCode = `
def process_inventory(items: list[str]) -> dict:
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts
`
    const testCases = generateSuggestedTestCases(inventoryCode)
    expect(testCases.length).toBeGreaterThanOrEqual(3)

    const batchCase = testCases.find((tc) => tc.name.includes('Batch'))
    expect(batchCase).toBeDefined()
    expect(batchCase?.callExpr).toContain('process_inventory')

    const emptyCase = testCases.find((tc) => tc.name.includes('Empty'))
    expect(emptyCase).toBeDefined()
    expect(emptyCase?.expected).toBe('{}')
  })

  it('suggests test cases for palindrome checker', () => {
    const palindromeCode = `
def is_palindrome(s: str) -> bool:
    clean = s.lower()
    return clean == clean[::-1]
`
    const testCases = generateSuggestedTestCases(palindromeCode)
    expect(testCases.length).toBeGreaterThanOrEqual(4)

    const mixedCase = testCases.find((tc) => tc.name.includes('Mixed'))
    expect(mixedCase).toBeDefined()
    expect(mixedCase?.expected).toBe('True')

    const nonPalCase = testCases.find((tc) => tc.name.includes('Non-palindrome'))
    expect(nonPalCase).toBeDefined()
    expect(nonPalCase?.expected).toBe('False')
  })

  it('suggests test cases for binary search', () => {
    const searchCode = `
def binary_search(nums, target):
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
`
    const testCases = generateSuggestedTestCases(searchCode)
    expect(testCases.length).toBeGreaterThanOrEqual(4)

    const midCase = testCases.find((tc) => tc.name.toLowerCase().includes('middle'))
    expect(midCase).toBeDefined()
    expect(midCase?.expected).toBe('3')

    const missingCase = testCases.find((tc) => tc.name.toLowerCase().includes('missing'))
    expect(missingCase).toBeDefined()
    expect(missingCase?.expected).toBe('-1')
  })

  it('returns empty array for empty code', () => {
    const testCases = generateSuggestedTestCases('')
    expect(testCases).toEqual([])
  })
})

describe('Plain-English Failure Explanations', () => {
  it('formats failed return value mismatches clearly with input, expected, and actual', () => {
    const testCase: TestCaseAssertion = {
      id: 'tc-neg',
      name: 'Negative numbers',
      callExpr: 'calculate_average([-5, -10, -15])',
      inputDescription: '-5, -10, -15',
      expected: '-10.0',
    }
    const result: TestAssertionResult = {
      id: 'tc-neg',
      name: 'Negative numbers',
      status: 'failed',
      expected: '-10.0',
      actual: '10.0',
    }

    const explanation = explainFailure(testCase, result)
    expect(explanation).toContain('Negative numbers; input -5, -10, -15; expected -10.0; actual 10.0; failed.')
  })

  it('explains ZeroDivisionError in beginner-friendly terms', () => {
    const testCase: TestCaseAssertion = {
      id: 'tc-empty',
      name: 'Empty list',
      callExpr: 'calculate_average([])',
      inputDescription: '[]',
      expected: '0.0',
    }
    const result: TestAssertionResult = {
      id: 'tc-empty',
      name: 'Empty list',
      status: 'error',
      expected: '0.0',
      error: 'ZeroDivisionError: division by zero',
    }

    const explanation = explainFailure(testCase, result)
    expect(explanation).toContain('Runtime Error: Division by zero')
    expect(explanation).toContain('guard against zero')
  })

  it('returns empty string for passed tests', () => {
    const testCase: TestCaseAssertion = {
      id: 'tc-1',
      name: 'Positive numbers',
      callExpr: 'add(2, 3)',
      expected: '5',
    }
    const result: TestAssertionResult = {
      id: 'tc-1',
      name: 'Positive numbers',
      status: 'passed',
      expected: '5',
      actual: '5',
    }

    expect(explainFailure(testCase, result)).toBe('')
  })
})
