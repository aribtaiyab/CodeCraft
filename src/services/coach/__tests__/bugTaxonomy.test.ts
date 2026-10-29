// ============================================================================
// Automated Tests: Smart Debugging Coach Bug Taxonomy
// ============================================================================

import { describe, it, expect } from 'vitest'
import { diagnoseBug } from '../bugTaxonomy'

describe('Smart Debugging Coach Bug Taxonomy', () => {
  it('diagnoses ZeroDivisionError with evidence and guard fix', () => {
    const code = `def average(nums):\n    return sum(nums) / len(nums)\n`
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'ZeroDivisionError',
        message: 'division by zero',
        traceback: 'File "<string>", line 2, in average\nZeroDivisionError: division by zero',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('zero-division')
    expect(diagnosis?.line).toBe(2)
    expect(diagnosis?.hints[0].level).toBe(1)
    expect(diagnosis?.hints[1].level).toBe(2)
    expect(diagnosis?.hints[2].level).toBe(3)
    expect(diagnosis?.hints[2].suggestedFix).toBeDefined()
  })

  it('diagnoses IndexError and off-by-one loop boundary', () => {
    const code = `def get_item(items):\n    for i in range(len(items) + 1):\n        print(items[i])\n`
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'IndexError',
        message: 'list index out of range',
        traceback: 'File "<string>", line 3, in get_item\nIndexError: list index out of range',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('index-out-of-bounds')
    expect(diagnosis?.hints[1].evidence?.line).toBe(3)
    expect(diagnosis?.hints[2].suggestedFix?.replacementText).toContain('range(len(items))')
  })

  it('diagnoses NameError and suggests existing similar identifier', () => {
    const code = `def tally(numbers):\n    total_sum = 0\n    for n in numbers:\n        totl_sum += n\n    return total_sum\n`
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'NameError',
        message: "name 'totl_sum' is not defined",
        traceback: 'File "<string>", line 4, in tally\nNameError: name \'totl_sum\' is not defined',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('name-error-typo')
    expect(diagnosis?.hints[1].evidence?.expectedBehavior).toBe("'total_sum'")
    expect(diagnosis?.hints[2].suggestedFix?.replacementText).toContain('total_sum')
  })

  it('diagnoses TypeError when adding string and int', () => {
    const code = `def sum_items(items):\n    total = 0\n    for item in items:\n        total += item\n    return total\n`
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'TypeError',
        message: "unsupported operand type(s) for +=: 'int' and 'str'",
        traceback: 'File "<string>", line 4, in sum_items\nTypeError: unsupported operand',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('type-mismatch')
    expect(diagnosis?.hints[2].suggestedFix?.explanation).toContain('int()')
  })

  it('diagnoses early return inside loop body', () => {
    const code = `def count_items(items):\n    count = 0\n    for x in items:\n        count += 1\n        return count\n    return count\n`
    const diagnosis = diagnoseBug({
      code,
      lastError: null,
      testFailures: [
        {
          id: 't1',
          name: 'Count all items',
          status: 'failed',
          expected: '3',
          actual: '1',
        },
      ],
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('early-return-loop')
    expect(diagnosis?.line).toBe(5)
  })

  it('diagnoses KeyError in dictionary lookups', () => {
    const code = `def lookup(d, k):\n    return d[k]\n`
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'KeyError',
        message: "KeyError: 'gold'",
        traceback: 'File "<string>", line 2, in lookup\nKeyError: \'gold\'',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('key-error')
    expect(diagnosis?.hints[2].suggestedFix?.replacementText).toContain('.get(k, 0)')
  })

  it('diagnoses missing return statement when function returns None', () => {
    const code = `def compute(a, b):\n    result = a + b\n`
    const diagnosis = diagnoseBug({
      code,
      lastError: null,
      testFailures: [
        {
          id: 't1',
          name: 'Sum check',
          status: 'failed',
          expected: '15',
          actual: 'None',
        },
      ],
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('missing-return')
    expect(diagnosis?.hints[2].suggestedFix?.replacementText).toContain('return result')
  })
})
