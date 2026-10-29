// ============================================================================
// CodeCraft — Deterministic Evidence-Based Bug Taxonomy Analyzer
// ============================================================================

import type { BugDiagnosis, CoachAnalysisContext } from './types'

function computeSimpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

function extractLineFromTraceback(traceback?: string): number {
  if (!traceback) return 1
  const matches = [...traceback.matchAll(/line (\d+)/g)]
  if (matches.length > 0) {
    return parseInt(matches[matches.length - 1][1], 10)
  }
  return 1
}

function findSimilarIdentifier(target: string, code: string): string | null {
  const tokens = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []
  const uniqueTokens = Array.from(new Set(tokens)).filter(
    (t) => t !== target && t.length >= 2 && !['def', 'for', 'if', 'else', 'elif', 'in', 'return', 'print', 'range', 'len'].includes(t)
  )

  let bestMatch: string | null = null
  let bestDist = 3 // max allowed edit distance

  for (const token of uniqueTokens) {
    const dist = levenshtein(target.toLowerCase(), token.toLowerCase())
    if (dist < bestDist) {
      bestDist = dist
      bestMatch = token
    }
  }

  return bestMatch
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

export function diagnoseBug(context: CoachAnalysisContext): BugDiagnosis | null {
  const { code, lastError, trace: _trace, testFailures } = context
  if (!code || (!lastError && (!testFailures || testFailures.length === 0))) {
    return null
  }

  const codeHash = computeSimpleHash(code)
  const lines = code.split('\n')
  const errorType = lastError?.errorType || ''
  const errorMessage = lastError?.message || ''
  const traceback = lastError?.traceback || ''
  const errorLine = extractLineFromTraceback(traceback)

  // --------------------------------------------------------------------------
  // 1. Division by Zero (ZeroDivisionError)
  // --------------------------------------------------------------------------
  if (
    errorType === 'ZeroDivisionError' ||
    errorMessage.includes('division by zero') ||
    errorMessage.includes('integer division or modulo by zero')
  ) {
    const lineContent = lines[errorLine - 1] || ''
    return {
      id: `diag_${Date.now()}_zerodiv`,
      category: 'zero-division',
      title: 'Division by Zero Guard Missing',
      line: errorLine,
      summary: `Line ${errorLine} attempted division or modulo where denominator evaluated to zero.`,
      codeHash,
      isStale: false,
      hints: [
        {
          level: 1,
          title: 'Guiding Question',
          content: 'What happens when dividing by zero in Python? How can you verify the denominator is positive before dividing?',
        },
        {
          level: 2,
          title: 'Evidence & Diagnosis',
          content: `On line ${errorLine}: '${lineContent.trim()}', the divisor evaluated to 0 during execution. In Python, division by zero halts the program.`,
          evidence: {
            line: errorLine,
            observedValue: 'Divisor = 0',
            expectedBehavior: 'Divisor > 0 or default value handled',
          },
        },
        {
          level: 3,
          title: 'Suggested Fix',
          content: 'Add a guard check before dividing to return 0 or a default value when the collection or denominator is 0.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: lineContent.includes('total') || lineContent.includes('sum')
              ? `    if not numbers:\n        return 0.0\n${lineContent}`
              : `    if count == 0:\n        return 0\n${lineContent}`,
            explanation: 'Check if the denominator is 0 before performing division.',
          },
        },
      ],
    }
  }

  // --------------------------------------------------------------------------
  // 2. Off-by-One in Loops / IndexError
  // --------------------------------------------------------------------------
  if (
    errorType === 'IndexError' ||
    errorMessage.includes('list index out of range') ||
    code.includes('range(len(') && (code.includes('+ 1') || code.includes('+1'))
  ) {
    let targetLine = errorLine > 0 && errorLine <= lines.length ? errorLine : 1
    // Check if the loop header immediately preceding this line has the off-by-one range
    for (let i = targetLine - 1; i >= Math.max(0, targetLine - 4); i--) {
      if (lines[i] && lines[i].includes('range(len(') && (lines[i].includes('+ 1') || lines[i].includes('+1'))) {
        targetLine = i + 1
        break
      }
    }
    const lineContent = lines[targetLine - 1] || ''

    return {
      id: `diag_${Date.now()}_indexerror`,
      category: 'index-out-of-bounds',
      title: 'Off-by-One Loop Boundary / Index Error',
      line: targetLine,
      summary: `Line ${targetLine} accessed a sequence index outside the valid range.`,
      codeHash,
      isStale: false,
      hints: [
        {
          level: 1,
          title: 'Guiding Question',
          content: 'Python sequences use 0-based indexing. For a list with length N, what is the maximum valid index?',
        },
        {
          level: 2,
          title: 'Evidence & Diagnosis',
          content: `Line ${targetLine} attempted to access an element beyond the list boundaries. If a list has N elements, valid indices are 0 to N - 1. Using range(len(items) + 1) or <= len(items) causes an IndexError.`,
          evidence: {
            line: errorLine,
            observedValue: 'Index >= len(sequence)',
            expectedBehavior: 'Index < len(sequence)',
          },
        },
        {
          level: 3,
          title: 'Suggested Fix',
          content: 'Change the loop range to range(len(sequence)) or iterate directly over items.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: lineContent.replace(/\s*\+\s*1\)/g, ')').replace(/<= len\(/g, '< len('),
            explanation: 'Remove + 1 from range(len(...)) so indices stop at len - 1.',
          },
        },
      ],
    }
  }

  // --------------------------------------------------------------------------
  // 3. NameError (Undefined Variable / Typo)
  // --------------------------------------------------------------------------
  if (errorType === 'NameError' || errorMessage.includes('is not defined')) {
    const match = errorMessage.match(/name ['"]([^'"]+)['"] is not defined/)
    const varName = match ? match[1] : 'variable'
    const similar = findSimilarIdentifier(varName, code)
    const lineContent = lines[errorLine - 1] || ''

    return {
      id: `diag_${Date.now()}_nameerror`,
      category: 'name-error-typo',
      title: `Undefined Identifier '${varName}'`,
      line: errorLine,
      summary: `Line ${errorLine} referenced '${varName}' which has not been defined in scope.`,
      codeHash,
      isStale: false,
      hints: [
        {
          level: 1,
          title: 'Guiding Question',
          content: `Check the exact spelling of '${varName}'. Was it defined before this line?`,
        },
        {
          level: 2,
          title: 'Evidence & Diagnosis',
          content: `Python raised NameError on line ${errorLine}. Identifier '${varName}' was not found in local or global scope.${
            similar ? ` Did you mean '${similar}'?` : ''
          }`,
          evidence: {
            line: errorLine,
            observedValue: `'${varName}' is undefined`,
            expectedBehavior: similar ? `'${similar}'` : 'Defined variable',
          },
        },
        {
          level: 3,
          title: 'Suggested Fix',
          content: similar
            ? `Replace misspelled '${varName}' with '${similar}'.`
            : `Initialize '${varName}' before referencing it.`,
          suggestedFix: {
            originalText: lineContent,
            replacementText: similar ? lineContent.replace(new RegExp(`\\b${varName}\\b`, 'g'), similar) : lineContent,
            explanation: similar ? `Correct spelling from '${varName}' to '${similar}'.` : `Initialize variable before use.`,
          },
        },
      ],
    }
  }

  // --------------------------------------------------------------------------
  // 4. TypeError (Type Mismatch / Incompatible concatenation)
  // --------------------------------------------------------------------------
  if (
    errorType === 'TypeError' ||
    errorMessage.includes('can only concatenate str') ||
    errorMessage.includes('unsupported operand type')
  ) {
    const lineContent = lines[errorLine - 1] || ''
    return {
      id: `diag_${Date.now()}_typeerror`,
      category: 'type-mismatch',
      title: 'Incompatible Type Operation',
      line: errorLine,
      summary: `Line ${errorLine} attempted an operation between incompatible types.`,
      codeHash,
      isStale: false,
      hints: [
        {
          level: 1,
          title: 'Guiding Question',
          content: 'Python does not automatically convert strings to numbers. Are both operands the expected type?',
        },
        {
          level: 2,
          title: 'Evidence & Diagnosis',
          content: `Line ${errorLine}: '${lineContent.trim()}'. Python raised TypeError because an operator (such as + or *) cannot combine these types without explicit conversion (e.g. int() or str()).`,
          evidence: {
            line: errorLine,
            observedValue: errorMessage,
            expectedBehavior: 'Explicit type conversion before operation',
          },
        },
        {
          level: 3,
          title: 'Suggested Fix',
          content: 'Convert values explicitly using int(...) or str(...) as needed.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: lineContent.replace(/([a-zA-Z_][a-zA-Z0-9_]*\[[^\]]+\]|\bitem\b|\bval\b)/g, 'int($1)'),
            explanation: 'Convert string elements to integers with int() before numeric calculation.',
          },
        },
      ],
    }
  }

  // --------------------------------------------------------------------------
  // 5. Early Return Inside Loop
  // --------------------------------------------------------------------------
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.match(/^\s*(for|while)\s+/)) {
      const loopIndent = line.search(/\S/)
      // Check subsequent lines
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const nextLine = lines[j]
        const nextIndent = nextLine.search(/\S/)
        if (nextIndent > loopIndent && nextLine.trim().startsWith('return ')) {
          // Check if not preceded by an if statement
          const prevLine = lines[j - 1].trim()
          if (!prevLine.startsWith('if ') && !prevLine.startsWith('elif ')) {
            return {
              id: `diag_${Date.now()}_earlyreturn`,
              category: 'early-return-loop',
              title: 'Premature Return Inside Loop',
              line: j + 1,
              summary: `Line ${j + 1} returns inside the loop body, terminating the function on the first iteration.`,
              codeHash,
              isStale: false,
              hints: [
                {
                  level: 1,
                  title: 'Guiding Question',
                  content: 'Check the indentation of the return statement. Should the function return on the very first iteration, or after the loop finishes?',
                },
                {
                  level: 2,
                  title: 'Evidence & Diagnosis',
                  content: `Line ${j + 1}: '${nextLine.trim()}' is indented directly under the loop. This causes the function to return immediately after examining only the first item, ignoring remaining elements.`,
                  evidence: {
                    line: j + 1,
                    observedValue: 'Loop exits on iteration 1',
                    expectedBehavior: 'Loop processes all items before returning',
                  },
                },
                {
                  level: 3,
                  title: 'Suggested Fix',
                  content: 'Dedent the return statement so it sits at the same indentation level as the loop header.',
                  suggestedFix: {
                    originalText: nextLine,
                    replacementText: ' '.repeat(loopIndent) + nextLine.trim(),
                    explanation: 'Dedent return statement outside the loop body.',
                  },
                },
              ],
            }
          }
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 6. KeyError (Missing Dictionary Key)
  // --------------------------------------------------------------------------
  if (errorType === 'KeyError' || errorMessage.includes('KeyError')) {
    const match = errorMessage.match(/KeyError:\s*['"]?([^'"\n]+)['"]?/)
    const key = match ? match[1] : 'key'
    const lineContent = lines[errorLine - 1] || ''

    return {
      id: `diag_${Date.now()}_keyerror`,
      category: 'key-error',
      title: `Missing Dictionary Key '${key}'`,
      line: errorLine,
      summary: `Line ${errorLine} attempted to access dictionary key '${key}' which does not exist.`,
      codeHash,
      isStale: false,
      hints: [
        {
          level: 1,
          title: 'Guiding Question',
          content: `What happens if key '${key}' is not in the dictionary? How can you look up a key safely with a fallback value?`,
        },
        {
          level: 2,
          title: 'Evidence & Diagnosis',
          content: `Direct dictionary indexing dict[key] raises KeyError if key is missing. Line ${errorLine} accessed '${key}' without checking if it exists.`,
          evidence: {
            line: errorLine,
            observedValue: `Key '${key}' missing`,
            expectedBehavior: `dict.get(key, 0) or 'if key in dict'`,
          },
        },
        {
          level: 3,
          title: 'Suggested Fix',
          content: `Use dict.get(key, default) instead of direct indexing.`,
          suggestedFix: {
            originalText: lineContent,
            replacementText: lineContent.replace(/\[([^\]]+)\]/, '.get($1, 0)'),
            explanation: `Replace direct lookup with .get() to provide a safe default value.`,
          },
        },
      ],
    }
  }

  // --------------------------------------------------------------------------
  // 7. Missing Return Statement (Test Failure: actual is None)
  // --------------------------------------------------------------------------
  if (testFailures && testFailures.length > 0) {
    const noneFailure = testFailures.find((f) => f.actual === 'None' && f.expected !== 'None')
    if (noneFailure) {
      return {
        id: `diag_${Date.now()}_missingreturn`,
        category: 'missing-return',
        title: 'Missing Return Statement in Function',
        line: lines.length,
        summary: `Function completed without a return statement, returning None instead of expected '${noneFailure.expected}'.`,
        codeHash,
        isStale: false,
        hints: [
          {
            level: 1,
            title: 'Guiding Question',
            content: 'In Python, a function without an explicit return statement returns None by default. Did you return your calculated result?',
          },
          {
            level: 2,
            title: 'Evidence & Diagnosis',
            content: `Test '${noneFailure.name}' expected '${noneFailure.expected}' but received 'None'. The function calculated a value but forgot to return it.`,
            evidence: {
              line: lines.length,
              observedValue: 'Returned None',
              expectedBehavior: `Return ${noneFailure.expected}`,
            },
          },
          {
            level: 3,
            title: 'Suggested Fix',
            content: 'Add an explicit return statement returning the calculated variable.',
            suggestedFix: {
              originalText: lines[lines.length - 1],
              replacementText: `${lines[lines.length - 1]}\n    return result`,
              explanation: 'Add return statement at the end of the function body.',
            },
          },
        ],
      }
    }
  }

  // --------------------------------------------------------------------------
  // 8. General Syntax & Runtime Fallback
  // --------------------------------------------------------------------------
  if (errorType || errorMessage) {
    const lineContent = lines[errorLine - 1] || ''
    return {
      id: `diag_${Date.now()}_general`,
      category: 'general-runtime-error',
      title: `${errorType || 'Runtime Error'} on Line ${errorLine}`,
      line: errorLine,
      summary: errorMessage || 'An unexpected error occurred during execution.',
      codeHash,
      isStale: false,
      hints: [
        {
          level: 1,
          title: 'Guiding Question',
          content: `Inspect line ${errorLine}. What operation or syntax is being performed on this line?`,
        },
        {
          level: 2,
          title: 'Evidence & Diagnosis',
          content: `Python raised ${errorType || 'an error'} on line ${errorLine}: '${lineContent.trim()}'.\nMessage: ${errorMessage}`,
          evidence: {
            line: errorLine,
            observedValue: errorMessage,
            expectedBehavior: 'Valid Python statement execution',
          },
        },
        {
          level: 3,
          title: 'Suggested Fix',
          content: 'Review the line of code and ensure all syntax, variable names, and data types match Python specifications.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: lineContent,
            explanation: 'Review line syntax and variable scopes.',
          },
        },
      ],
    }
  }

  return null
}
