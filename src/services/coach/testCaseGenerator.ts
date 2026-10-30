// ============================================================================
// CodeCraft — Intelligent Test Case Generator for Test Fix
// Generates contextual, educational test cases tailored to user's Python code
// ============================================================================

import type { TestCaseAssertion, TestAssertionResult } from './types'
import { DEBUGGING_EXERCISES } from './exercises'

interface FunctionSignature {
  name: string
  params: string[]
  rawParams: string
}

/**
 * Extracts function signatures defined in the Python code
 */
function extractFunctions(code: string): FunctionSignature[] {
  const funcs: FunctionSignature[] = []
  // Matches "def func_name(param1, param2, ...):"
  const regex = /def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(code)) !== null) {
    const name = match[1]
    // Skip runner entrypoints or helper functions if other functions exist
    const rawParams = match[2].trim()
    const params = rawParams
      ? rawParams.split(',').map((p) => p.split(':')[0].trim())
      : []

    funcs.push({ name, params, rawParams })
  }

  return funcs
}

/**
 * Analyzes Python code and produces relevant suggested test cases
 */
export function generateSuggestedTestCases(code: string): TestCaseAssertion[] {
  const trimmedCode = code.trim()
  if (!trimmedCode) {
    return []
  }

  // 1. Check if the code directly corresponds to or derives from a curated exercise
  const exerciseMatch = DEBUGGING_EXERCISES.find((ex) => {
    // Check if the exercise function or signature is present in the code
    const funcMatch = ex.buggyCode.match(/def\s+([a-zA-Z_]\w*)/)
    if (funcMatch && code.includes(`def ${funcMatch[1]}`)) {
      return true
    }
    return code.includes(ex.id) || code.includes(ex.conceptTag)
  })

  const funcs = extractFunctions(code)
  // Pick primary function (prefer non-main)
  const primaryFunc = funcs.find((f) => f.name !== 'main') || funcs[0]

  // If matched a curated exercise, use and expand its test cases
  if (exerciseMatch) {
    const baseCases: TestCaseAssertion[] = exerciseMatch.testCases.map((tc) => ({
      ...tc,
      inputDescription: tc.callExpr.replace(/^[^(]*\((.*)\)$/, '$1'),
      category: 'normal',
    }))

    // Check if we can add negative numbers, decimals, or zero edge cases for average/rate
    if (exerciseMatch.id.includes('average') || exerciseMatch.id.includes('rate')) {
      const funcName = primaryFunc ? primaryFunc.name : 'safe_average'
      const hasNeg = baseCases.some((c) => c.inputDescription?.includes('-'))
      if (!hasNeg) {
        baseCases.push(
          {
            id: 'tc-auto-dec',
            name: 'Decimal numbers',
            callExpr: `${funcName}([1.5, 2.5, 3.5])`,
            inputDescription: '[1.5, 2.5, 3.5]',
            expected: '2.5',
            description: 'Verifies correct mean calculation with floating-point decimals.',
            category: 'decimal',
          },
          {
            id: 'tc-auto-neg',
            name: 'Negative numbers',
            callExpr: `${funcName}([-5.0, -10.0, -15.0])`,
            inputDescription: '[-5, -10, -15]',
            expected: '-10.0',
            description: 'Verifies mean calculation with negative inputs without flipping sign.',
            category: 'negative',
          }
        )
      }
    }

    return baseCases
  }

  if (primaryFunc) {
    const fnName = primaryFunc.name
    const lowerName = fnName.toLowerCase()
    const lowerCode = code.toLowerCase()

    // 2. Average / Mean / Sum calculators
    if (
      lowerName.includes('avg') ||
      lowerName.includes('average') ||
      lowerName.includes('mean') ||
      lowerCode.includes('sum(') && lowerCode.includes('/ len(')
    ) {
      const isMultiParam = primaryFunc.params.length > 1
      if (isMultiParam) {
        return [
          {
            id: 'tc-avg-pos',
            name: 'Positive numbers',
            inputDescription: '10, 20, 30',
            callExpr: `${fnName}(10, 20, 30)`,
            expected: '20.0',
            category: 'normal',
          },
          {
            id: 'tc-avg-zero',
            name: 'Zero values',
            inputDescription: '0, 0, 0',
            callExpr: `${fnName}(0, 0, 0)`,
            expected: '0.0',
            category: 'zero',
          },
          {
            id: 'tc-avg-dec',
            name: 'Decimal numbers',
            inputDescription: '1.5, 2.5, 3.5',
            callExpr: `${fnName}(1.5, 2.5, 3.5)`,
            expected: '2.5',
            category: 'decimal',
          },
          {
            id: 'tc-avg-neg',
            name: 'Negative numbers',
            inputDescription: '-5, -10, -15',
            callExpr: `${fnName}(-5, -10, -15)`,
            expected: '-10.0',
            category: 'negative',
          },
          {
            id: 'tc-avg-mixed',
            name: 'Mixed signs',
            inputDescription: '-10, 0, 10',
            callExpr: `${fnName}(-10, 0, 10)`,
            expected: '0.0',
            category: 'edge',
          },
        ]
      }

      // Single list param: e.g. calculate_average(numbers)
      return [
        {
          id: 'tc-avg-pos',
          name: 'Positive numbers',
          inputDescription: '[10, 20, 30]',
          callExpr: `${fnName}([10, 20, 30])`,
          expected: '20.0',
          category: 'normal',
        },
        {
          id: 'tc-avg-zero',
          name: 'Zero values',
          inputDescription: '[0, 0, 0]',
          callExpr: `${fnName}([0, 0, 0])`,
          expected: '0.0',
          category: 'zero',
        },
        {
          id: 'tc-avg-dec',
          name: 'Decimal numbers',
          inputDescription: '[1.5, 2.5, 3.5]',
          callExpr: `${fnName}([1.5, 2.5, 3.5])`,
          expected: '2.5',
          category: 'decimal',
        },
        {
          id: 'tc-avg-neg',
          name: 'Negative numbers',
          inputDescription: '[-5, -10, -15]',
          callExpr: `${fnName}([-5, -10, -15])`,
          expected: '-10.0',
          category: 'negative',
        },
        {
          id: 'tc-avg-single',
          name: 'Single element',
          inputDescription: '[42]',
          callExpr: `${fnName}([42])`,
          expected: '42.0',
          category: 'edge',
        },
        {
          id: 'tc-avg-empty',
          name: 'Empty list (Safety Guard)',
          inputDescription: '[]',
          callExpr: `${fnName}([])`,
          expected: '0.0',
          category: 'edge',
        },
      ]
    }

    // 3. Inventory / Frequency / Counter (like starter code)
    if (
      lowerName.includes('inventory') ||
      lowerName.includes('count') ||
      lowerName.includes('freq') ||
      lowerCode.includes('counts[') ||
      lowerName.includes('occurrences')
    ) {
      return [
        {
          id: 'tc-inv-1',
          name: 'Batch with duplicates',
          inputDescription: '["bronze", "charcoal", "ivory", "bronze"]',
          callExpr: `${fnName}(["bronze", "charcoal", "ivory", "bronze"])`,
          expected: "{'bronze': 2, 'charcoal': 1, 'ivory': 1}",
          category: 'normal',
        },
        {
          id: 'tc-inv-2',
          name: 'Single item batch',
          inputDescription: '["bronze"]',
          callExpr: `${fnName}(["bronze"])`,
          expected: "{'bronze': 1}",
          category: 'normal',
        },
        {
          id: 'tc-inv-3',
          name: 'Empty inventory',
          inputDescription: '[]',
          callExpr: `${fnName}([])`,
          expected: '{}',
          category: 'edge',
        },
        {
          id: 'tc-inv-4',
          name: 'All unique items',
          inputDescription: '["gold", "silver", "graphite"]',
          callExpr: `${fnName}(["gold", "silver", "graphite"])`,
          expected: "{'gold': 1, 'silver': 1, 'graphite': 1}",
          category: 'normal',
        },
      ]
    }

    // 4. Palindrome / String Reversal
    if (
      lowerName.includes('palindrome') ||
      lowerName.includes('reverse') ||
      lowerCode.includes('[::-1]')
    ) {
      return [
        {
          id: 'tc-pal-1',
          name: 'Lowercase palindrome',
          inputDescription: '"racecar"',
          callExpr: `${fnName}("racecar")`,
          expected: 'True',
          category: 'normal',
        },
        {
          id: 'tc-pal-2',
          name: 'Mixed case word',
          inputDescription: '"Racecar"',
          callExpr: `${fnName}("Racecar")`,
          expected: 'True',
          category: 'normal',
        },
        {
          id: 'tc-pal-3',
          name: 'Non-palindrome word',
          inputDescription: '"python"',
          callExpr: `${fnName}("python")`,
          expected: 'False',
          category: 'normal',
        },
        {
          id: 'tc-pal-4',
          name: 'Single character',
          inputDescription: '"a"',
          callExpr: `${fnName}("a")`,
          expected: 'True',
          category: 'edge',
        },
        {
          id: 'tc-pal-5',
          name: 'Empty string',
          inputDescription: '""',
          callExpr: `${fnName}("")`,
          expected: 'True',
          category: 'edge',
        },
      ]
    }

    // 5. Binary Search / Search
    if (
      lowerName.includes('search') ||
      lowerName.includes('find_index') ||
      lowerName.includes('binary')
    ) {
      return [
        {
          id: 'tc-srch-mid',
          name: 'Target in middle',
          inputDescription: '[4, 9, 15, 21, 34, 50], 21',
          callExpr: `${fnName}([4, 9, 15, 21, 34, 50], 21)`,
          expected: '3',
          category: 'normal',
        },
        {
          id: 'tc-srch-start',
          name: 'Target at start',
          inputDescription: '[4, 9, 15, 21, 34, 50], 4',
          callExpr: `${fnName}([4, 9, 15, 21, 34, 50], 4)`,
          expected: '0',
          category: 'normal',
        },
        {
          id: 'tc-srch-end',
          name: 'Target at end',
          inputDescription: '[4, 9, 15, 21, 34, 50], 50',
          callExpr: `${fnName}([4, 9, 15, 21, 34, 50], 50)`,
          expected: '5',
          category: 'normal',
        },
        {
          id: 'tc-srch-missing',
          name: 'Missing target',
          inputDescription: '[4, 9, 15, 21, 34, 50], 99',
          callExpr: `${fnName}([4, 9, 15, 21, 34, 50], 99)`,
          expected: '-1',
          category: 'edge',
        },
        {
          id: 'tc-srch-empty',
          name: 'Empty list',
          inputDescription: '[], 10',
          callExpr: `${fnName}([], 10)`,
          expected: '-1',
          category: 'edge',
        },
      ]
    }

    // 6. Max / Min finder
    if (lowerName.includes('max') || lowerName.includes('min')) {
      const isMin = lowerName.includes('min')
      return [
        {
          id: 'tc-mm-pos',
          name: 'Positive numbers',
          inputDescription: '[3, 7, 2, 9, 5]',
          callExpr: `${fnName}([3, 7, 2, 9, 5])`,
          expected: isMin ? '2' : '9',
          category: 'normal',
        },
        {
          id: 'tc-mm-neg',
          name: 'Negative numbers',
          inputDescription: '[-10, -5, -20, -1]',
          callExpr: `${fnName}([-10, -5, -20, -1])`,
          expected: isMin ? '-20' : '-1',
          category: 'negative',
        },
        {
          id: 'tc-mm-zero',
          name: 'Zero and mixed numbers',
          inputDescription: '[-5, 0, 5]',
          callExpr: `${fnName}([-5, 0, 5])`,
          expected: isMin ? '-5' : '5',
          category: 'zero',
        },
        {
          id: 'tc-mm-single',
          name: 'Single element list',
          inputDescription: '[42]',
          callExpr: `${fnName}([42])`,
          expected: '42',
          category: 'edge',
        },
      ]
    }

    // 7. General 2-argument math/arithmetic function
    if (primaryFunc.params.length === 2) {
      const [p1, p2] = primaryFunc.params
      const isStringFunc =
        p1.toLowerCase().includes('str') || p2.toLowerCase().includes('str')

      if (isStringFunc) {
        return [
          {
            id: 'tc-gen-s1',
            name: 'Standard strings',
            inputDescription: '"hello", "world"',
            callExpr: `${fnName}("hello", "world")`,
            expected: '"hello world"',
            category: 'normal',
          },
          {
            id: 'tc-gen-s2',
            name: 'Empty second string',
            inputDescription: '"test", ""',
            callExpr: `${fnName}("test", "")`,
            expected: '"test"',
            category: 'edge',
          },
        ]
      }

      return [
        {
          id: 'tc-gen-pos',
          name: 'Positive numbers',
          inputDescription: '10, 5',
          callExpr: `${fnName}(10, 5)`,
          expected: '15',
          category: 'normal',
        },
        {
          id: 'tc-gen-zero',
          name: 'Zero values',
          inputDescription: '0, 5',
          callExpr: `${fnName}(0, 5)`,
          expected: '5',
          category: 'zero',
        },
        {
          id: 'tc-gen-neg',
          name: 'Negative numbers',
          inputDescription: '-5, -10',
          callExpr: `${fnName}(-5, -10)`,
          expected: '-15',
          category: 'negative',
        },
        {
          id: 'tc-gen-dec',
          name: 'Decimal numbers',
          inputDescription: '2.5, 1.5',
          callExpr: `${fnName}(2.5, 1.5)`,
          expected: '4.0',
          category: 'decimal',
        },
      ]
    }

    // 8. General 1-argument function
    if (primaryFunc.params.length === 1) {
      const p = primaryFunc.params[0].toLowerCase()
      if (p.includes('list') || p.includes('nums') || p.includes('arr') || p.includes('items')) {
        return [
          {
            id: 'tc-l-pos',
            name: 'Standard list',
            inputDescription: '[1, 2, 3]',
            callExpr: `${fnName}([1, 2, 3])`,
            expected: '[1, 2, 3]',
            category: 'normal',
          },
          {
            id: 'tc-l-single',
            name: 'Single element list',
            inputDescription: '[10]',
            callExpr: `${fnName}([10])`,
            expected: '[10]',
            category: 'normal',
          },
          {
            id: 'tc-l-empty',
            name: 'Empty list',
            inputDescription: '[]',
            callExpr: `${fnName}([])`,
            expected: '[]',
            category: 'edge',
          },
        ]
      }

      if (p.includes('str') || p.includes('text') || p.includes('word') || p.includes('s')) {
        return [
          {
            id: 'tc-s-std',
            name: 'Standard word',
            inputDescription: '"CodeCraft"',
            callExpr: `${fnName}("CodeCraft")`,
            expected: '"CodeCraft"',
            category: 'normal',
          },
          {
            id: 'tc-s-empty',
            name: 'Empty string',
            inputDescription: '""',
            callExpr: `${fnName}("")`,
            expected: '""',
            category: 'edge',
          },
          {
            id: 'tc-s-spaces',
            name: 'Word with spaces',
            inputDescription: '"hello world"',
            callExpr: `${fnName}("hello world")`,
            expected: '"hello world"',
            category: 'normal',
          },
        ]
      }

      // Default numeric 1-arg
      return [
        {
          id: 'tc-n-pos',
          name: 'Positive integer',
          inputDescription: '5',
          callExpr: `${fnName}(5)`,
          expected: '5',
          category: 'normal',
        },
        {
          id: 'tc-n-zero',
          name: 'Zero value',
          inputDescription: '0',
          callExpr: `${fnName}(0)`,
          expected: '0',
          category: 'zero',
        },
        {
          id: 'tc-n-neg',
          name: 'Negative integer',
          inputDescription: '-3',
          callExpr: `${fnName}(-3)`,
          expected: '-3',
          category: 'negative',
        },
        {
          id: 'tc-n-edge',
          name: 'Edge value (1)',
          inputDescription: '1',
          callExpr: `${fnName}(1)`,
          expected: '1',
          category: 'edge',
        },
      ]
    }
  }

  // Fallback for code without functions (e.g. script that executes statements)
  return [
    {
      id: 'tc-script-1',
      name: 'Default Execution Check',
      inputDescription: 'Standard script execution',
      callExpr: 'True',
      expected: 'True',
      description: 'Verifies the script executes to completion without unhandled exceptions.',
      category: 'normal',
    },
  ]
}

/**
 * Generates beginner-friendly plain-English failure and error explanations
 */
export function explainFailure(
  test: TestCaseAssertion,
  result?: TestAssertionResult
): string {
  if (!result || result.status === 'passed') {
    return ''
  }

  const inputStr = test.inputDescription || test.callExpr
  const expectedStr = test.expected
  const actualStr = result.actual ?? 'None'

  if (result.status === 'error') {
    const err = result.error || 'Runtime error'
    if (err.includes('ZeroDivisionError')) {
      return `Runtime Error: Division by zero. When given input ${inputStr}, the program divided by zero. Add a check (e.g., if not numbers or total == 0) to guard against zero.`
    }
    if (err.includes('IndexError')) {
      return `Runtime Error: Index out of range. The code attempted to access an item index that doesn't exist for input ${inputStr}.`
    }
    if (err.includes('KeyError')) {
      return `Runtime Error: Key error. A dictionary key was accessed before being created for input ${inputStr}. Use in check or .get() with a default.`
    }
    if (err.includes('TypeError')) {
      return `Runtime Error: Type mismatch (${err}). Check that variables have the expected types (e.g. integer vs string) when processing ${inputStr}.`
    }
    if (err.includes('NameError')) {
      return `Runtime Error: Undefined name (${err}). Check for typos in function or variable names.`
    }
    if (err.includes('SyntaxError')) {
      return `Syntax Error: Python could not compile the code (${err}). Check for missing colons, parenthesis, or quotes.`
    }
    return `Runtime Error: ${err} when running with input ${inputStr}.`
  }

  // Failed result mismatch: e.g. Negative numbers; input -5, -10, -15; expected -10; actual 10; failed.
  return `${test.name}; input ${inputStr}; expected ${expectedStr}; actual ${actualStr}; failed. The returned output does not match the expected result.`
}
