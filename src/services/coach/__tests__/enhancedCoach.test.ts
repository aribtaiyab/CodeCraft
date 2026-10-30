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

  it('diagnoses prnt("heloo") correctly as NameError and suggests print("heloo")', () => {
    const code = 'prnt("heloo")'
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'NameError',
        message: "name 'prnt' is not defined",
        traceback: 'File "<string>", line 1\nNameError: name \'prnt\' is not defined',
      },
    })

    expect(diagnosis).not.toBeNull()
    const issue = diagnosis!.issues[0]
    expect(issue.category).toBe('name-error-typo')
    expect(issue.title).toContain("Misspelled Function Name 'prnt'")
    expect(issue.line).toBe(1)

    // Level 1: Hint
    expect(issue.levels.level1.hint).toContain('print')

    // Level 2: Explain
    expect(issue.levels.level2.explanation).toContain('print')

    // Level 3: Solution
    expect(issue.levels.level3.suggestedFix).toBeDefined()
    expect(issue.levels.level3.suggestedFix?.originalText).toBe('prnt("heloo")')
    expect(issue.levels.level3.suggestedFix?.replacementText).toBe('print("heloo")')
    // Genuinely changes the erroneous part (never identical!)
    expect(issue.levels.level3.suggestedFix?.replacementText).not.toBe(issue.levels.level3.suggestedFix?.originalText)
  })

  it('diagnoses missing closing parenthesis and bracket as SyntaxError', () => {
    // Parenthesis test
    const parenCode = 'print("hello"'
    const parenDiag = diagnoseBug({
      code: parenCode,
      lastError: {
        errorType: 'SyntaxError',
        message: "'(' was never closed",
        traceback: 'File "<string>", line 1\nSyntaxError: \'(\' was never closed',
      },
    })

    expect(parenDiag).not.toBeNull()
    expect(parenDiag!.issues[0].category).toBe('syntax-error')
    expect(parenDiag!.issues[0].title).toContain('Parenthesis')
    expect(parenDiag!.issues[0].levels.level3.suggestedFix?.replacementText).toBe('print("hello")')

    // Bracket test
    const bracketCode = 'nums = [1, 2, 3'
    const bracketDiag = diagnoseBug({
      code: bracketCode,
      lastError: {
        errorType: 'SyntaxError',
        message: "'[' was never closed",
        traceback: 'File "<string>", line 1\nSyntaxError: \'[\' was never closed',
      },
    })

    expect(bracketDiag).not.toBeNull()
    expect(bracketDiag!.issues[0].category).toBe('syntax-error')
    expect(bracketDiag!.issues[0].title).toContain('Bracket')
    expect(bracketDiag!.issues[0].levels.level3.suggestedFix?.replacementText).toBe('nums = [1, 2, 3]')
  })

  it('diagnoses undefined variable without inventing a fake fix or repeating identical code', () => {
    const code = 'print(mystery_variable)'
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'NameError',
        message: "name 'mystery_variable' is not defined",
        traceback: 'File "<string>", line 1\nNameError: name \'mystery_variable\' is not defined',
      },
    })

    expect(diagnosis).not.toBeNull()
    const issue = diagnosis!.issues[0]
    expect(issue.category).toBe('name-error-typo')
    expect(issue.title).toContain("Undefined Variable 'mystery_variable'")
    // Level 3 explains the limitation and does not repeat identical line
    expect(issue.levels.level3.solution).toContain('mystery_variable')
    expect(issue.levels.level3.suggestedFix?.replacementText).not.toBe(code)
  })

  it('diagnoses ZeroDivisionError with guard solution and line-level focus', () => {
    const code = 'result = 100 / 0'
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'ZeroDivisionError',
        message: 'division by zero',
        traceback: 'File "<string>", line 1\nZeroDivisionError: division by zero',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis!.issues[0].category).toBe('zero-division')
    expect(diagnosis!.issues[0].line).toBe(1)
  })

  it('diagnoses TypeError when adding string and integer', () => {
    const code = 'msg = "Score: " + 99'
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'TypeError',
        message: 'can only concatenate str (not "int") to str',
        traceback: 'File "<string>", line 1\nTypeError: can only concatenate str',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis!.issues[0].category).toBe('type-mismatch')
    expect(diagnosis!.issues[0].line).toBe(1)
  })

  it('diagnoses IndexError on out-of-bounds list index', () => {
    const code = 'items = [10, 20]\nval = items[5]'
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'IndexError',
        message: 'list index out of range',
        traceback: 'File "<string>", line 2\nIndexError: list index out of range',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis!.issues[0].category).toBe('index-out-of-bounds')
    expect(diagnosis!.issues[0].line).toBe(2)
  })

  // ==========================================================================
  // Targeted Verification: User Requirements for Diagnosis Quality
  // ==========================================================================
  it('accurately diagnoses print("kkk" with exact 3 levels and valid correction', () => {
    const code = 'print("kkk"'
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'PythonError',
        message: "SyntaxError: '(' was never closed",
        traceback: 'File "<string>", line 1\n    print("kkk"\n    ^\nSyntaxError: \'(\' was never closed',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('syntax-error')
    expect(diagnosis?.line).toBe(1)

    const issue = diagnosis!.issues[0]
    expect(issue.line).toBe(1)
    expect(issue.title).toContain('Parenthesis')
    expect(issue.summary).toContain("opening '(' has no matching closing ')'")

    // Level 1 Hint: Check whether you closed the parenthesis.
    expect(issue.levels.level1.hint).toBe('Check whether you closed the parenthesis.')

    // Level 2 Explanation: Your print statement starts with ( but does not end with ). Python needs both.
    expect(issue.levels.level2.explanation).toBe(
      'Your print statement starts with ( but does not end with ). Python needs both.'
    )

    // Level 3 Correct Answer: Incorrect line and corrected line
    expect(issue.levels.level3.suggestedFix).toBeDefined()
    expect(issue.levels.level3.suggestedFix?.originalText).toBe('print("kkk"')
    expect(issue.levels.level3.suggestedFix?.replacementText).toBe('print("kkk")')
    expect(issue.levels.level3.suggestedFix?.originalText).not.toBe(
      issue.levels.level3.suggestedFix?.replacementText
    )
    expect(issue.levels.level3.solution).toContain('closing parenthesis')
  })

  it('accurately diagnoses missing square bracket: numbers = [1, 2, 3', () => {
    const code = 'numbers = [1, 2, 3'
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'SyntaxError',
        message: "'[' was never closed",
        traceback: 'File "<string>", line 1\nSyntaxError: \'[\' was never closed',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('syntax-error')
    expect(diagnosis?.line).toBe(1)
    const issue = diagnosis!.issues[0]
    expect(issue.title).toContain('Bracket')
    expect(issue.levels.level3.suggestedFix?.replacementText).toBe('numbers = [1, 2, 3]')
  })

  it('accurately diagnoses unclosed curly brace: data = {"a": 1', () => {
    const code = 'data = {"a": 1'
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'SyntaxError',
        message: "'{' was never closed",
        traceback: 'File "<string>", line 1\nSyntaxError: \'{\' was never closed',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('syntax-error')
    expect(diagnosis?.line).toBe(1)
    const issue = diagnosis!.issues[0]
    expect(issue.title).toContain('Brace')
    expect(issue.levels.level3.suggestedFix?.replacementText).toBe('data = {"a": 1}')
  })

  it('accurately diagnoses misspelled function name: prnt("hello")', () => {
    const code = 'prnt("hello")'
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'NameError',
        message: "name 'prnt' is not defined",
        traceback: 'File "<string>", line 1\nNameError: name \'prnt\' is not defined',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('name-error-typo')
    expect(diagnosis?.line).toBe(1)
    const issue = diagnosis!.issues[0]
    expect(issue.title).toContain('Misspelled Function')
    expect(issue.levels.level3.suggestedFix?.replacementText).toBe('print("hello")')
  })

  it('accurately diagnoses undefined variable without inventing invalid fix: x = mystery_value + 1', () => {
    const code = 'x = mystery_value + 1'
    const diagnosis = diagnoseBug({
      code,
      lastError: {
        errorType: 'NameError',
        message: "name 'mystery_value' is not defined",
        traceback: 'File "<string>", line 1\nNameError: name \'mystery_value\' is not defined',
      },
    })

    expect(diagnosis).not.toBeNull()
    expect(diagnosis?.category).toBe('name-error-typo')
    expect(diagnosis?.line).toBe(1)
    const issue = diagnosis!.issues[0]
    expect(issue.title).toContain("Undefined Variable 'mystery_value'")
    // Must NOT propose invalid code or identical replacement
    expect(issue.levels.level3.suggestedFix).toBeUndefined()
    expect(issue.levels.level3.solution).toContain('mystery_value')
  })
})
