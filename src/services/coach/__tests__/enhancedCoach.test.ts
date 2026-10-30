// ============================================================================
// Automated Tests: Enhanced Smart Debugging Coach (Phase 4 / Release Req)
// Tests f-string braces, quotes, indentation, runtime errors, progressive levels,
// and line-level targeted fix precision.
// ============================================================================

import { describe, it, expect } from 'vitest'
import { diagnoseBug } from '../bugTaxonomy'

describe('Enhanced Smart Debugging Coach: Precision Diagnosis & Progressive Levels', () => {
  it('diagnoses missing opening f-string brace with line-level precision and 3 non-contradictory levels', () => {
    const code = [
      'def main():',
      '    total_unique = 4',
      '    print(f"Discovered total_unique} unique items:")',
      '    print("Done")',
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'SyntaxError',
        message: "f-string: single '}' is not allowed",
        traceback: 'File "<string>", line 3\nSyntaxError: f-string: single \'}\' is not allowed',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('syntax-error')
    expect(diagnosis?.line).toBe(3)

    const issue = diagnosis!.issues[0]
    expect(issue).toBeDefined()
    expect(issue.line).toBe(3)
    expect(issue.title).toContain('Missing Opening Brace')

    // Level 1: Hint
    expect(issue.levels.level1.hint).toContain('f-string')
    expect(issue.levels.level1.line).toBe(3)

    // Level 2: Explain
    expect(issue.levels.level2.problematicSnippet).toBe('total_unique}')
    expect(issue.levels.level2.whyPythonErrors).toContain('single')
    expect(issue.levels.level2.correctExample).toContain('f"')

    // Level 3: Solution
    expect(issue.levels.level3.suggestedFix).toBeDefined()
    expect(issue.levels.level3.suggestedFix?.startLine).toBe(3)
    expect(issue.levels.level3.suggestedFix?.originalText).toBe('    print(f"Discovered total_unique} unique items:")')
    expect(issue.levels.level3.suggestedFix?.replacementText).toBe('    print(f"Discovered {total_unique} unique items:")')

    // Try It Yourself question
    expect(issue.tryItYourself).toBeDefined()
    expect(issue.tryItYourself?.options.length).toBeGreaterThanOrEqual(3)
    expect(issue.tryItYourself?.correctIndex).toBe(1)
  })

  it('diagnoses extra closing brace in f-string with compact line diff', () => {
    const code = [
      'def show_stats():',
      '    score = 98',
      '    print(f"Final Score: {score}} pts")',
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'SyntaxError',
        message: "f-string: single '}' is not allowed",
        traceback: 'File "<string>", line 3\nSyntaxError: f-string: single \'}\' is not allowed',
      },
    })

    expect(diagnosis).not.toBeNull()
    const issue = diagnosis!.issues[0]
    expect(issue.title).toContain('Extra Closing Brace')
    expect(issue.levels.level2.problematicSnippet).toBe('{score}}')
    expect(issue.levels.level3.suggestedFix?.replacementText).toBe('    print(f"Final Score: {score} pts")')
  })

  it('diagnoses unterminated string literal (missing quote)', () => {
    const code = [
      'def greet():',
      '    print("Hello, World!)',
      '    return True',
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'SyntaxError',
        message: 'unterminated string literal (detected at line 2)',
        traceback: 'File "<string>", line 2\nSyntaxError: unterminated string literal',
      },
    })

    expect(diagnosis).not.toBeNull()
    const issue = diagnosis!.issues[0]
    expect(issue.category).toBe('syntax-error')
    expect(issue.title).toContain('Unterminated String Literal')
    expect(issue.levels.level3.suggestedFix?.replacementText).toContain('"Hello, World!"')
  })

  it('diagnoses IndentationError and produces aligned 4-space indentation fix', () => {
    const code = [
      'def compute():',
      '  total = 0',
      '      total += 1',
      '  return total',
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'IndentationError',
        message: 'unexpected indent',
        traceback: 'File "<string>", line 3\nIndentationError: unexpected indent',
      },
    })

    expect(diagnosis).not.toBeNull()
    const issue = diagnosis!.issues[0]
    expect(issue.category).toBe('indentation-error')
    expect(issue.line).toBe(3)
    expect(issue.levels.level3.suggestedFix?.startLine).toBe(3)
  })

  it('diagnoses assignment inside conditional (= instead of ==)', () => {
    const code = [
      'x = 10',
      'if x = 10:',
      '    print("Ten")',
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'SyntaxError',
        message: 'invalid syntax',
        traceback: 'File "<string>", line 2\nSyntaxError: invalid syntax',
      },
    })

    expect(diagnosis).not.toBeNull()
    const issue = diagnosis!.issues[0]
    expect(issue.category).toBe('comparison-assignment')
    expect(issue.levels.level3.suggestedFix?.replacementText).toBe('if x == 10:')
  })

  it('diagnoses missing colon on compound statement headers', () => {
    const code = [
      'for item in items',
      '    print(item)',
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'SyntaxError',
        message: "expected ':'",
        traceback: 'File "<string>", line 1\nSyntaxError: expected \':\'',
      },
    })

    expect(diagnosis).not.toBeNull()
    const issue = diagnosis!.issues[0]
    expect(issue.title).toContain("Missing Colon ':'")
    expect(issue.levels.level3.suggestedFix?.replacementText).toBe('for item in items:')
  })

  it('diagnoses execution timeout caused by infinite while loop', () => {
    const code = [
      'i = 0',
      'while i < 10:',
      '    print(i)',
      '    # forgot i += 1',
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'TimeoutError',
        message: 'Execution timed out after 15 seconds. The process was terminated to prevent freezing.',
        traceback: '',
      },
    })

    expect(diagnosis).not.toBeNull()
    const issue = diagnosis!.issues[0]
    expect(issue.category).toBe('timeout-infinite-loop')
    expect(issue.title).toContain('Timeout')
    expect(issue.levels.level1.hint).toContain('while')
  })

  it('diagnoses AttributeError when calling incorrect data structure method', () => {
    const code = [
      'items = [1, 2, 3]',
      'items.add(4)',
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'AttributeError',
        message: "'list' object has no attribute 'add'",
        traceback: 'File "<string>", line 2\nAttributeError: \'list\' object has no attribute \'add\'',
      },
    })

    expect(diagnosis).not.toBeNull()
    const issue = diagnosis!.issues[0]
    expect(issue.category).toBe('attribute-error')
    expect(issue.levels.level3.suggestedFix?.replacementText).toContain('items.append(4)')
  })

  it('diagnoses RecursionError when base case is missing', () => {
    const code = [
      'def fib(n):',
      '    return fib(n - 1) + fib(n - 2)',
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'RecursionError',
        message: 'maximum recursion depth exceeded',
        traceback: 'File "<string>", line 2\nRecursionError: maximum recursion depth exceeded',
      },
    })

    expect(diagnosis).not.toBeNull()
    const issue = diagnosis!.issues[0]
    expect(issue.category).toBe('recursion-error')
    expect(issue.levels.level1.hint).toContain('base case')
  })

  it('never replaces the entire student program when suggesting a line fix', () => {
    const code = [
      '# Line 1: Header comment',
      'def calculate_tax(income):',
      '    rate = 0.2',
      '    if rate = 0.2:',
      '        return income * rate',
      '    return 0',
      '# Line 7: Footer comment',
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'SyntaxError',
        message: 'invalid syntax',
        traceback: 'File "<string>", line 4\nSyntaxError: invalid syntax',
      },
    })

    expect(diagnosis).not.toBeNull()
    const fix = diagnosis!.issues[0].levels.level3.suggestedFix
    expect(fix).toBeDefined()
    expect(fix?.startLine).toBe(4)
    expect(fix?.endLine).toBe(4)

    // Verify fix contains ONLY line 4, NOT lines 1, 2, 3, 5, 6, 7
    expect(fix?.originalText).toBe('    if rate = 0.2:')
    expect(fix?.replacementText).toBe('    if rate == 0.2:')
    expect(fix?.replacementText).not.toContain('calculate_tax')
    expect(fix?.replacementText).not.toContain('Line 7')
  })

  it('detects multiple issue cards across different lines when multiple errors exist', () => {
    const code = [
      'def process():',
      '    print(f"Start: {x}}")',      // Line 2: extra brace
      '    for i in range(5):',
      '        pass',
      '    print(f"End: {y}}")',        // Line 5: extra brace
    ].join('\n')

    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'SyntaxError',
        message: "f-string: single '}' is not allowed",
        traceback: 'File "<string>", line 2\nSyntaxError: f-string: single \'}\' is not allowed',
      },
    })

    expect(diagnosis).not.toBeNull()
    // Multi-line scan identifies line 2 and line 5 as separate issue cards
    expect(diagnosis!.issues.length).toBeGreaterThanOrEqual(2)
    expect(diagnosis!.issues[0].line).toBe(2)
    expect(diagnosis!.issues[1].line).toBe(5)
    expect(diagnosis!.issues[0].levels.level3.suggestedFix?.replacementText).toBe('    print(f"Start: {x}")')
    expect(diagnosis!.issues[1].levels.level3.suggestedFix?.replacementText).toBe('    print(f"End: {y}")')
  })
})
