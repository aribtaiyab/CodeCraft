// ============================================================================
// CodeCraft — Deterministic Evidence-Based Bug Taxonomy Analyzer
// Line-Level Error Diagnosis & Progressive Explanations
// ============================================================================

import type {
  BugDiagnosis,
  CoachAnalysisContext,
  DiagnosedIssue,
  ProgressiveHint,
} from './types'

function computeSimpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

export function extractLineFromTraceback(traceback?: string): number {
  if (!traceback) return 1
  const matches = [...traceback.matchAll(/line (\d+)/g)]
  if (matches.length > 0) {
    return parseInt(matches[matches.length - 1][1], 10)
  }
  return 1
}

const COMMON_PYTHON_BUILTINS_AND_KEYWORDS = [
  'print', 'range', 'len', 'input', 'str', 'int', 'float', 'list', 'dict', 'set',
  'tuple', 'bool', 'sum', 'min', 'max', 'sorted', 'type', 'open', 'round', 'abs',
  'enumerate', 'zip', 'map', 'filter', 'all', 'any', 'True', 'False', 'None',
  'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'import', 'from',
  'class', 'try', 'except', 'finally', 'with', 'as', 'pass', 'break', 'continue',
]

export function findSimilarIdentifier(target: string, code: string): { name: string; isBuiltin: boolean } | null {
  const targetLower = target.toLowerCase()

  // 1. Check Python built-ins & keywords first (e.g. prnt -> print, rang -> range)
  let bestBuiltin: string | null = null
  let bestBuiltinDist = 3

  for (const item of COMMON_PYTHON_BUILTINS_AND_KEYWORDS) {
    if (item.toLowerCase() === targetLower) {
      return { name: item, isBuiltin: true } // case fix e.g. Print -> print, true -> True
    }
    const dist = levenshtein(targetLower, item.toLowerCase())
    const maxAllowed = target.length <= 4 ? 1 : 2
    if (dist <= maxAllowed && dist < bestBuiltinDist) {
      bestBuiltinDist = dist
      bestBuiltin = item
    }
  }

  if (bestBuiltin) {
    return { name: bestBuiltin, isBuiltin: true }
  }

  // 2. Check tokens in user code (user-defined variables, functions)
  const tokens = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []
  const uniqueTokens = Array.from(new Set(tokens)).filter((t) => t !== target && t.length >= 2)

  let bestUserMatch: string | null = null
  let bestUserDist = 3

  for (const token of uniqueTokens) {
    if (token.toLowerCase() === targetLower) {
      return { name: token, isBuiltin: false }
    }
    const dist = levenshtein(targetLower, token.toLowerCase())
    const maxAllowed = target.length <= 4 ? 1 : 2
    if (dist <= maxAllowed && dist < bestUserDist) {
      bestUserDist = dist
      bestUserMatch = token
    }
  }

  if (bestUserMatch) {
    return { name: bestUserMatch, isBuiltin: false }
  }

  return null
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

function buildLegacyHints(issue: DiagnosedIssue): [ProgressiveHint, ProgressiveHint, ProgressiveHint] {
  return [
    {
      level: 1,
      title: issue.levels.level1.title,
      content: issue.levels.level1.hint,
    },
    {
      level: 2,
      title: issue.levels.level2.title,
      content: `${issue.levels.level2.explanation}\n\nConcept: ${issue.levels.level2.conceptTeaching}\n\nExample:\n${issue.levels.level2.correctExample}`,
      evidence: issue.levels.level2.evidence,
    },
    {
      level: 3,
      title: issue.levels.level3.title,
      content: `${issue.levels.level3.solution}\n\nWhy it works: ${issue.levels.level3.whyItWorks}\n\nPrevention: ${issue.levels.level3.preventionTip}`,
      suggestedFix: issue.levels.level3.suggestedFix,
    },
  ]
}

export function diagnoseBug(context: CoachAnalysisContext): BugDiagnosis | null {
  const { code, lastError, trace: _trace, testFailures } = context
  if (!code || (!lastError && (!testFailures || testFailures.length === 0))) {
    return null
  }

  const codeHash = computeSimpleHash(code)
  const lines = code.split('\n')
  const rawErrorType = lastError?.errorType || ''
  const errorMessage = lastError?.message || ''
  const traceback = lastError?.traceback || ''
  const fullErrorText = `${rawErrorType}\n${errorMessage}\n${traceback}`

  // Normalize true Python error type
  const typeMatch = fullErrorText.match(
    /\b(SyntaxError|IndentationError|NameError|TypeError|ValueError|IndexError|KeyError|ZeroDivisionError|AttributeError|ImportError|ModuleNotFoundError|RecursionError|TimeoutError)\b/
  )
  const errorType = typeMatch
    ? typeMatch[1]
    : fullErrorText.includes('was never closed') || fullErrorText.includes('invalid syntax')
      ? 'SyntaxError'
      : rawErrorType || 'SyntaxError'

  const errorLine = Math.max(1, Math.min(extractLineFromTraceback(traceback), lines.length))
  let lineContent = lines[errorLine - 1] || ''

  const issues: DiagnosedIssue[] = []

  // ==========================================================================
  // 1. Missing Opening f-string Brace or Extra Closing Brace
  // ==========================================================================
  if (
    (errorType === 'SyntaxError' || errorMessage.includes('SyntaxError')) &&
    (errorMessage.includes("f-string: single '}' is not allowed") ||
      (lineContent.includes('f"') || lineContent.includes("f'")))
  ) {
    // Check if line has an extra closing brace: {var}}
    const extraClosingMatch = lineContent.match(/\{([a-zA-Z0-9_.]+)\}\}/)
    // Check if line has a missing opening brace: var} without { before it
    const missingOpeningMatch = lineContent.match(/(^|[^a-zA-Z0-9_{])([a-zA-Z_][a-zA-Z0-9_]*)\}(?!\})/)

    if (extraClosingMatch) {
      const varName = extraClosingMatch[1]
      const problematic = `{${varName}}}`
      const fixedSnippet = `{${varName}}`
      const replacementLine = lineContent.replace(problematic, fixedSnippet)

      issues.push({
        id: `issue_${Date.now()}_fstring_extra_brace`,
        line: errorLine,
        title: 'Extra Closing Brace in f-string',
        category: 'syntax-error',
        summary: `Line ${errorLine} contains an extra '}' closing brace in an f-string expression.`,
        levels: {
          level1: {
            title: 'Helpful Hint',
            hint: `Look closely at the f-string on line ${errorLine}. Count the curly braces around '${varName}'. Does every opening brace '{' have exactly one matching closing brace '}'?`,
            concept: 'f-string expression formatting',
            line: errorLine,
          },
          level2: {
            title: 'Explain the Error',
            explanation: `Python raises a SyntaxError on line ${errorLine} because it encountered a duplicate closing brace '}'. In Python f-strings, a single pair of braces {expr} is used to evaluate an expression. An extra brace causes Python's parser to interpret it as an illegal single '}'.`,
            problematicSnippet: problematic,
            whyPythonErrors: "In f-strings, single '}' characters are forbidden outside of expressions. Python cannot determine whether you intended to close an expression or print a literal brace.",
            conceptTeaching: "To interpolate a variable into an f-string, enclose it in exactly one pair of braces: f'{variable}'. If you need to print a literal brace character, escape it by doubling: '{{' or '}}'.",
            correctExample: `name = "Ada"\nprint(f"Hello, {name}!")`,
            evidence: {
              line: errorLine,
              observedValue: problematic,
              expectedBehavior: fixedSnippet,
            },
          },
          level3: {
            title: 'Complete Solution',
            solution: `Remove the redundant closing brace from '${problematic}' so it becomes '${fixedSnippet}'.`,
            whyItWorks: `Matching exactly one '{' with one '}' provides a valid f-string replacement field that Python can parse and evaluate.`,
            expectedOutput: 'The variable value evaluated and printed within the string without SyntaxError.',
            preventionTip: 'Double-check brace symmetry when writing f-strings. Never put two closing braces unless you intend to print a literal brace with {{ }}.',
            suggestedFix: {
              originalText: lineContent,
              replacementText: replacementLine,
              startLine: errorLine,
              endLine: errorLine,
              explanation: `Remove the extra closing brace '}' from '${problematic}'.`,
            },
          },
        },
        tryItYourself: {
          question: 'Which of the following is a valid Python f-string?',
          options: [
            'print(f"Count: {count}}")',
            'print(f"Count: {count}")',
            'print(f"Count: count}")',
            'print(f"Count: {{count}")',
          ],
          correctIndex: 1,
          explanation: 'In Python, variable expressions inside an f-string must be wrapped in exactly one pair of matching curly braces: {count}.',
        },
      })
    } else if (missingOpeningMatch || lineContent.includes('}')) {
      const varName = missingOpeningMatch ? missingOpeningMatch[2] : 'item'
      const problematic = `${varName}}`
      const fixedSnippet = `{${varName}}`
      const replacementLine = lineContent.includes(problematic)
        ? lineContent.replace(problematic, fixedSnippet)
        : lineContent.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\}/, '{$1}')

      issues.push({
        id: `issue_${Date.now()}_fstring_missing_brace`,
        line: errorLine,
        title: 'Missing Opening Brace in f-string',
        category: 'syntax-error',
        summary: `Line ${errorLine} has a closing brace '}' without its matching opening brace '{'.`,
        levels: {
          level1: {
            title: 'Helpful Hint',
            hint: `Check the placeholder on line ${errorLine}. Variable names in f-strings must start with an opening '{' and end with a closing '}'. Notice how '${varName}}' is missing its opening brace.`,
            concept: 'f-string replacement fields',
            line: errorLine,
          },
          level2: {
            title: 'Explain the Error',
            explanation: `Python raised SyntaxError: f-string: single '}' is not allowed on line ${errorLine}. Python saw '${varName}}' and encountered a closing brace that was never opened.`,
            problematicSnippet: problematic,
            whyPythonErrors: "In Python f-strings, single '}' characters are strictly forbidden outside of expressions. When Python encounters a single '}' without a preceding '{', it raises a SyntaxError.",
            conceptTeaching: "Every dynamic value in an f-string must be enclosed in opening and closing braces: {expression}. Missing either brace triggers a SyntaxError.",
            correctExample: `score = 95\nprint(f"Final score: {score}")`,
            evidence: {
              line: errorLine,
              observedValue: problematic,
              expectedBehavior: fixedSnippet,
            },
          },
          level3: {
            title: 'Complete Solution',
            solution: `Add the opening brace '{' before '${varName}' to make it '${fixedSnippet}'.`,
            whyItWorks: `Enclosing the identifier with '{' and '}' marks it as a valid expression block that Python evaluates at runtime.`,
            expectedOutput: 'The variable value evaluated seamlessly into the printed string.',
            preventionTip: 'When typing variable names in f-strings, type both braces {} first, then type the variable name inside.',
            suggestedFix: {
              originalText: lineContent,
              replacementText: replacementLine,
              startLine: errorLine,
              endLine: errorLine,
              explanation: `Add opening brace '{' before '${varName}'.`,
            },
          },
        },
        tryItYourself: {
          question: 'What happens when Python encounters a single unmatched "}" inside an f-string?',
          options: [
            'It ignores the brace and prints the variable name literally.',
            'It raises a SyntaxError: f-string: single "}" is not allowed.',
            'It converts the string to an integer.',
            'It prints None.',
          ],
          correctIndex: 1,
          explanation: "In Python, single '}' characters are strictly forbidden in f-strings and immediately trigger a SyntaxError.",
        },
      })
    }
  }

  // ==========================================================================
  // 2. Unterminated String Literal / Missing Quote
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'SyntaxError' || errorMessage.includes('SyntaxError')) &&
    (errorMessage.includes('unterminated string literal') ||
      errorMessage.includes('EOL while scanning string literal') ||
      errorMessage.includes('unterminated f-string literal'))
  ) {
    let quoteChar = '"'
    if (lineContent.includes("'") && !lineContent.includes('"')) quoteChar = "'"
    let replacementLine = lineContent.trimEnd()
    if (!replacementLine.endsWith(quoteChar) && !replacementLine.endsWith(`${quoteChar})`)) {
      replacementLine = replacementLine.endsWith(')')
        ? replacementLine.slice(0, -1) + quoteChar + ')'
        : replacementLine + quoteChar
    }

    issues.push({
      id: `issue_${Date.now()}_unterminated_string`,
      line: errorLine,
      title: 'Unterminated String Literal (Missing Quote)',
      category: 'syntax-error',
      summary: `Line ${errorLine} has an opened string literal that is missing its closing quotation mark.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `Look at the quotation marks on line ${errorLine}. Did you start a string with ${quoteChar} but forget to close it before the end of the line?`,
          concept: 'string literals & delimiters',
          line: errorLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Python raised SyntaxError: unterminated string literal on line ${errorLine}. A string literal was opened with ${quoteChar} but the line ended before a matching ${quoteChar} was found.`,
          problematicSnippet: lineContent.trim(),
          whyPythonErrors: 'In Python, single-line strings delimited by single or double quotes cannot span multiple lines. Reaching the end of the line with an open string triggers a syntax error.',
          conceptTeaching: `Always close strings with the same type of quote used to open them. For multi-line strings, use triple quotes (''' or """).`,
          correctExample: `message = ${quoteChar}Hello, World!${quoteChar}\nprint(message)`,
          evidence: {
            line: errorLine,
            observedValue: 'Missing closing quote',
            expectedBehavior: `Matching ${quoteChar} at string end`,
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: `Add the closing ${quoteChar} before the closing parenthesis or end of line.`,
          whyItWorks: 'Closing the string literal allows Python to identify where the string data ends and subsequent code begins.',
          expectedOutput: 'The string literal terminates cleanly and the statement executes.',
          preventionTip: 'Look for code editor syntax highlighting changes: when a string is unclosed, the remainder of the line changes color.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: replacementLine,
            startLine: errorLine,
            endLine: errorLine,
            explanation: `Add matching closing quote ${quoteChar} to line ${errorLine}.`,
          },
        },
      },
      tryItYourself: {
        question: 'Which string literal is properly closed in Python?',
        options: [
          'title = "Python',
          "title = 'Python\"",
          'title = "Python"',
          'title = "Python\n"',
        ],
        correctIndex: 2,
        explanation: 'A string must begin and end with the exact same quotation delimiter on the same line.',
      },
    })
  }

  // ==========================================================================
  // 2B. Unclosed Parenthesis, Bracket, or Brace
  // ==========================================================================
  let targetParenLine = errorLine
  let hasUnclosedParen =
    (errorType === 'SyntaxError' || fullErrorText.includes('SyntaxError')) &&
    (fullErrorText.includes("'(' was never closed") ||
      (lineContent.split('(').length > lineContent.split(')').length))
  let hasUnclosedBracket =
    (errorType === 'SyntaxError' || fullErrorText.includes('SyntaxError')) &&
    (fullErrorText.includes("'[' was never closed") ||
      (lineContent.split('[').length > lineContent.split(']').length))
  let hasUnclosedBrace =
    (errorType === 'SyntaxError' || fullErrorText.includes('SyntaxError')) &&
    !lineContent.includes('f"') &&
    !lineContent.includes("f'") &&
    (fullErrorText.includes("'{' was never closed") ||
      (lineContent.split('{').length > lineContent.split('}').length))

  // If errorLine doesn't have the unclosed symbol, scan backwards to find the exact line
  if (hasUnclosedParen && (lines[targetParenLine - 1]?.split('(').length || 0) <= (lines[targetParenLine - 1]?.split(')').length || 0)) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].split('(').length > lines[i].split(')').length) {
        targetParenLine = i + 1
        lineContent = lines[i]
        break
      }
    }
  } else if (!hasUnclosedParen && (errorType === 'SyntaxError' || fullErrorText.includes('SyntaxError'))) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].split('(').length > lines[i].split(')').length) {
        hasUnclosedParen = true
        targetParenLine = i + 1
        lineContent = lines[i]
        break
      }
    }
  }

  if (hasUnclosedBracket && (lines[targetParenLine - 1]?.split('[').length || 0) <= (lines[targetParenLine - 1]?.split(']').length || 0)) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].split('[').length > lines[i].split(']').length) {
        targetParenLine = i + 1
        lineContent = lines[i]
        break
      }
    }
  }

  if (hasUnclosedBrace && (lines[targetParenLine - 1]?.split('{').length || 0) <= (lines[targetParenLine - 1]?.split('}').length || 0)) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].includes('f"') && !lines[i].includes("f'") && lines[i].split('{').length > lines[i].split('}').length) {
        targetParenLine = i + 1
        lineContent = lines[i]
        break
      }
    }
  }

  if (issues.length === 0 && (hasUnclosedParen || hasUnclosedBracket || hasUnclosedBrace)) {
    const symbol = hasUnclosedParen ? 'parenthesis' : hasUnclosedBracket ? 'square bracket' : 'curly brace'
    const closingChar = hasUnclosedParen ? ')' : hasUnclosedBracket ? ']' : '}'
    const openingChar = hasUnclosedParen ? '(' : hasUnclosedBracket ? '[' : '{'
    let quotePrefix = ''
    const doubleQuoteCount = (lineContent.match(/"/g) || []).length
    const singleQuoteCount = (lineContent.match(/'/g) || []).length
    if (doubleQuoteCount % 2 === 1) {
      quotePrefix = '"'
    } else if (singleQuoteCount % 2 === 1) {
      quotePrefix = "'"
    }

    const fixedLine = lineContent.trimEnd() + quotePrefix + closingChar

    const isPrintStmt = lineContent.includes('print(') || lineContent.startsWith('print(')
    const explanationText = hasUnclosedParen
      ? (isPrintStmt
          ? 'Your print statement starts with ( but does not end with ). Python needs both.'
          : `Your statement on line ${targetParenLine} starts with ( but does not end with ). Python needs both.`)
      : `Your statement on line ${targetParenLine} starts with ${openingChar} but does not end with ${closingChar}. Python needs both.`

    issues.push({
      id: `issue_${Date.now()}_missing_closing_${hasUnclosedParen ? 'paren' : hasUnclosedBracket ? 'bracket' : 'brace'}`,
      line: targetParenLine,
      title: `Missing Closing ${hasUnclosedParen ? 'Parenthesis ")"' : hasUnclosedBracket ? 'Bracket "]"' : 'Brace "}"'}`,
      category: 'syntax-error',
      summary: `Line ${targetParenLine}: Missing closing ${symbol}. The opening '${openingChar}' has no matching closing '${closingChar}'.`,
      levels: {
        level1: {
          title: 'Hint',
          hint: hasUnclosedParen
            ? 'Check whether you closed the parenthesis.'
            : `Check whether you closed the ${symbol} on line ${targetParenLine}.`,
          concept: 'parenthesis & bracket matching',
          line: targetParenLine,
        },
        level2: {
          title: 'Explanation',
          explanation: explanationText,
          problematicSnippet: lineContent.trim(),
          whyPythonErrors: `Python reached the end of the line (or file) while still waiting for '${closingChar}' to close the statement.`,
          conceptTeaching: `In Python, every opening '${openingChar}' must have a matching closing '${closingChar}'.`,
          correctExample: hasUnclosedParen
            ? `print("hello")`
            : hasUnclosedBracket
              ? `items = [1, 2, 3]`
              : `data = {"a": 1}`,
          evidence: {
            line: targetParenLine,
            observedValue: `Missing '${closingChar}'`,
            expectedBehavior: `Add '${closingChar}' at line end`,
          },
        },
        level3: {
          title: 'Correct Answer',
          solution: hasUnclosedParen
            ? `Add a closing parenthesis ')' at the end of line ${targetParenLine}.`
            : `Add a closing ${symbol} '${closingChar}' at the end of line ${targetParenLine}.`,
          whyItWorks: `Matching '${openingChar}' with '${closingChar}' cleanly closes the expression so Python can parse it.`,
          expectedOutput: `Line ${targetParenLine} compiles and executes without SyntaxError.`,
          preventionTip: `Check whether you closed all opened parentheses before running your code.`,
          suggestedFix: {
            originalText: lineContent,
            replacementText: fixedLine,
            startLine: targetParenLine,
            endLine: targetParenLine,
            explanation: `Add closing '${closingChar}' at end of line ${targetParenLine}.`,
          },
        },
      },
      tryItYourself: {
        question: `Which statement correctly closes all brackets?`,
        options: [
          hasUnclosedParen ? 'print("hello"' : 'nums = [1, 2',
          hasUnclosedParen ? 'print("hello")' : 'nums = [1, 2]',
          hasUnclosedParen ? 'print("hello"]' : 'nums = (1, 2]',
          hasUnclosedParen ? 'print "hello"' : 'nums = [1, 2}',
        ],
        correctIndex: 1,
        explanation: `Every opening symbol must be paired with its matching closing partner.`,
      },
    })
  }

  // ==========================================================================
  // 3. IndentationError (Unexpected Indent or Expected Indented Block)
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'IndentationError' || errorMessage.includes('IndentationError'))
  ) {
    const isUnexpected = errorMessage.includes('unexpected indent')
    let fixedLine = lineContent
    if (isUnexpected) {
      // Find previous non-empty line indentation
      let prevIndent = 0
      for (let i = errorLine - 2; i >= 0; i--) {
        if (lines[i].trim().length > 0) {
          prevIndent = lines[i].search(/\S/)
          break
        }
      }
      fixedLine = ' '.repeat(Math.max(0, prevIndent)) + lineContent.trim()
    } else {
      fixedLine = '    ' + lineContent.trim()
    }

    issues.push({
      id: `issue_${Date.now()}_indentation`,
      line: errorLine,
      title: isUnexpected ? 'Unexpected Indentation' : 'Missing Indented Block',
      category: 'indentation-error',
      summary: `Line ${errorLine} has an indentation mismatch with Python's block structure.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `Check the whitespace at the start of line ${errorLine}. Python uses indentation (usually 4 spaces) to define code blocks. Does this line align with surrounding statements?`,
          concept: 'Python block indentation',
          line: errorLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Python raised IndentationError on line ${errorLine}: '${lineContent.trim()}'. Unlike languages that use curly braces {}, Python uses whitespace indentation to know which statements belong inside functions, loops, and if-statements.`,
          problematicSnippet: lineContent,
          whyPythonErrors: isUnexpected
            ? 'This line has more leading spaces than the statement preceding it, but no block header (like if, for, def) was opened.'
            : 'A block header was opened on the previous line with a colon (:), but no indented statement followed it.',
          conceptTeaching: 'Standard Python style (PEP 8) uses 4 spaces per indentation level. All statements within the same block must have the exact same indentation.',
          correctExample: `def greet():\n    # Exactly 4 spaces\n    print("Hello")`,
          evidence: {
            line: errorLine,
            observedValue: `Line ${errorLine} leading spaces: ${lineContent.search(/\S/)}`,
            expectedBehavior: isUnexpected ? 'Align with outer block' : 'Indent 4 spaces inside block',
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: isUnexpected
            ? `Dedent line ${errorLine} so its leading spaces match the surrounding block level.`
            : `Indent line ${errorLine} by 4 spaces.`,
          whyItWorks: 'Uniform 4-space indentation conforms to Python block grammar.',
          expectedOutput: 'The code block parses and executes in correct sequence.',
          preventionTip: 'Use your editor’s Tab or Shift+Tab shortcuts to adjust indentation in uniform 4-space increments.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: fixedLine,
            startLine: errorLine,
            endLine: errorLine,
            explanation: `Adjust indentation of line ${errorLine} to match block structure.`,
          },
        },
      },
      tryItYourself: {
        question: 'What is the Python standard (PEP 8) number of spaces for each indentation level?',
        options: ['1 space', '2 spaces', '4 spaces', '8 spaces'],
        correctIndex: 2,
        explanation: 'PEP 8 recommends 4 spaces per indentation level for readable and consistent Python code.',
      },
    })
  }

  // ==========================================================================
  // 4. Missing Colon after if/for/while/def/class
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'SyntaxError' || errorMessage.includes('SyntaxError')) &&
    (errorMessage.includes("expected ':'") || errorMessage.includes('invalid syntax')) &&
    lineContent.match(/^\s*(if|elif|else|for|while|def|class)\b/) &&
    !lineContent.trim().endsWith(':')
  ) {
    const fixedLine = lineContent.trimEnd() + ':'
    issues.push({
      id: `issue_${Date.now()}_missing_colon`,
      line: errorLine,
      title: "Missing Colon ':' at End of Statement Header",
      category: 'syntax-error',
      summary: `Line ${errorLine} opens a compound statement header without a trailing colon.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `Look at the very end of line ${errorLine}. What punctuation mark is required in Python after an 'if', 'for', 'while', or 'def' header?`,
          concept: 'compound statement syntax',
          line: errorLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Python compound statements like 'if', 'for', and 'def' must always end with a colon (:). Line ${errorLine} is missing this required colon.`,
          problematicSnippet: lineContent.trim(),
          whyPythonErrors: "In Python grammar, the colon ':' signals the end of the header and indicates that an indented suite of code follows.",
          conceptTeaching: "Always append a colon at the end of lines starting with def, if, elif, else, for, while, try, except, finally, and class.",
          correctExample: `if score >= 60:\n    print("Passed")`,
          evidence: {
            line: errorLine,
            observedValue: lineContent.trim(),
            expectedBehavior: lineContent.trim() + ':',
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: `Add a colon ':' at the end of line ${errorLine}.`,
          whyItWorks: 'The colon satisfies Python header syntax and introduces the indented block.',
          expectedOutput: 'The header compiles and begins executing its indented block.',
          preventionTip: 'Say "then" in your head when writing if/for headers, and let that remind you to type the colon.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: fixedLine,
            startLine: errorLine,
            endLine: errorLine,
            explanation: `Add colon ':' to the end of line ${errorLine}.`,
          },
        },
      },
      tryItYourself: {
        question: 'Which statement header is syntactically correct in Python?',
        options: [
          'if total > 0',
          'if total > 0:',
          'if total > 0 then',
          'if (total > 0) {',
        ],
        correctIndex: 1,
        explanation: 'Python headers must end with a colon (:), not braces or the word "then".',
      },
    })
  }

  // ==========================================================================
  // 5. Comparison vs Assignment in Conditionals (if x = 5:)
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'SyntaxError' || errorMessage.includes('SyntaxError')) &&
    (errorMessage.includes('cannot assign to expression') ||
      errorMessage.includes('invalid syntax') ||
      lineContent.match(/^\s*(if|elif|while)\s+[^=!<>]=[^=]/))
  ) {
    const fixedLine = lineContent.replace(/([^=!<>]|^)=([^=]|$)/, '$1==$2')
    issues.push({
      id: `issue_${Date.now()}_comparison_assignment`,
      line: errorLine,
      title: "Assignment '=' Used in Conditional Instead of Equality '=='",
      category: 'comparison-assignment',
      summary: `Line ${errorLine} used a single assignment operator '=' where equality comparison '==' was needed.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `In Python, '=' is used to assign values to variables, while '==' is used to test if two values are equal. Check your operator on line ${errorLine}.`,
          concept: 'comparison operators vs assignment',
          line: errorLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Line ${errorLine}: '${lineContent.trim()}'. A single equals sign '=' is an assignment statement. In an 'if' condition, Python expects a boolean expression that evaluates to True or False.`,
          problematicSnippet: lineContent.trim(),
          whyPythonErrors: "Python does not allow standard assignment statements inside simple if-condition headers to prevent accidental bugs.",
          conceptTeaching: "Use '==' to check equality, '!=' for inequality, and '=' solely for variable assignment.",
          correctExample: `if status == 'active':\n    print("Running")`,
          evidence: {
            line: errorLine,
            observedValue: 'Single = in condition',
            expectedBehavior: 'Double == equality comparison',
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: `Replace the single '=' with double '==' on line ${errorLine}.`,
          whyItWorks: "The '==' operator evaluates equality between both sides and produces a boolean result for the 'if' condition.",
          expectedOutput: 'The condition evaluates correctly based on value equality.',
          preventionTip: 'Remember: Single = gives a value; double == asks a question.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: fixedLine,
            startLine: errorLine,
            endLine: errorLine,
            explanation: `Change '=' to '==' in condition on line ${errorLine}.`,
          },
        },
      },
      tryItYourself: {
        question: 'Which operator should you use to check if variable x equals 10?',
        options: ['x = 10', 'x == 10', 'x === 10', 'x is equal 10'],
        correctIndex: 1,
        explanation: 'In Python, equality comparison is performed using "==" (double equals).',
      },
    })
  }

  // ==========================================================================
  // 6. Division by Zero (ZeroDivisionError)
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'ZeroDivisionError' ||
      errorMessage.includes('division by zero') ||
      errorMessage.includes('integer division or modulo by zero'))
  ) {
    const isSumLenAverage = lineContent.includes('total') || lineContent.includes('sum') || lineContent.includes('len(')
    const fixedReplacement = isSumLenAverage
      ? `    if not numbers:\n        return 0.0\n${lineContent}`
      : `    if count == 0:\n        return 0\n${lineContent}`

    issues.push({
      id: `issue_${Date.now()}_zerodiv`,
      line: errorLine,
      title: 'Division by Zero Guard Missing',
      category: 'zero-division',
      summary: `Line ${errorLine} attempted division or modulo where denominator evaluated to zero.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `What happens when dividing by zero in Python? Check the denominator on line ${errorLine}. How can you verify it is non-zero before dividing?`,
          concept: 'division safety & empty collections',
          line: errorLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Line ${errorLine}: '${lineContent.trim()}'. The divisor evaluated to 0 during execution. In Python and mathematics, division by zero is undefined and immediately raises ZeroDivisionError.`,
          problematicSnippet: lineContent.trim(),
          whyPythonErrors: 'Dividing by zero has no finite mathematical result. Python halts execution rather than producing invalid data.',
          conceptTeaching: 'Before dividing by a variable or the length of a collection (len), check whether the denominator is 0 and handle the default case early.',
          correctExample: `if len(items) == 0:\n    return 0.0\naverage = total / len(items)`,
          evidence: {
            line: errorLine,
            observedValue: 'Divisor = 0',
            expectedBehavior: 'Divisor > 0 or default returned',
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: 'Add a guard check before dividing to return 0 or 0.0 when the collection or denominator is 0.',
          whyItWorks: 'The guard check intercepts empty inputs before the division statement can execute, avoiding the crash.',
          expectedOutput: 'Returns 0.0 cleanly for empty collections and correct quotient for non-empty ones.',
          preventionTip: 'Always write tests for boundary cases like empty lists [] or 0 total counts.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: fixedReplacement,
            startLine: errorLine,
            endLine: errorLine,
            explanation: 'Check if denominator or collection is empty before dividing.',
          },
        },
      },
      tryItYourself: {
        question: 'What is the best way to prevent ZeroDivisionError when calculating an average of list `nums`?',
        options: [
          'nums.clear()',
          'if not nums: return 0.0',
          'nums = nums + 1',
          'total = sum(nums) / 1',
        ],
        correctIndex: 1,
        explanation: 'Checking "if not nums: return 0.0" guards against calculating average on an empty list.',
      },
    })
  }

  // ==========================================================================
  // 7. IndexError (List Index Out of Range / Off-by-One Loop)
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'IndexError' ||
      errorMessage.includes('list index out of range') ||
      errorMessage.includes('string index out of range'))
  ) {
    let targetLine = errorLine
    for (let i = targetLine - 1; i >= Math.max(0, targetLine - 4); i--) {
      if (lines[i] && (lines[i].includes('range(len(') && (lines[i].includes('+ 1') || lines[i].includes('+1')))) {
        targetLine = i + 1
        break
      }
    }
    const targetContent = lines[targetLine - 1] || lineContent
    const fixedLine = targetContent.replace(/\s*\+\s*1\)/g, ')').replace(/<=\s*len\(/g, '< len(')

    issues.push({
      id: `issue_${Date.now()}_indexerror`,
      line: targetLine,
      title: 'Off-by-One Loop Boundary / IndexError',
      category: 'index-out-of-bounds',
      summary: `Line ${targetLine} accessed a sequence index outside the valid range 0 to len - 1.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `Python sequences use 0-based indexing. For a list with length N, what is the index of the very last element? Does your range go too far?`,
          concept: 'zero-based indexing and sequence bounds',
          line: targetLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Line ${targetLine}: '${targetContent.trim()}'. In Python, valid indices for a sequence of length N run from 0 to N - 1. Using range(len(items) + 1) or index <= len(items) attempts to access index N, which does not exist.`,
          problematicSnippet: targetContent.trim(),
          whyPythonErrors: 'Python strictly protects memory bounds. Attempting to index an element outside the container raises an IndexError.',
          conceptTeaching: 'To iterate over all indices of a list, use range(len(items)). Better yet, iterate directly over elements: for item in items.',
          correctExample: `fruits = ['apple', 'banana']\nfor i in range(len(fruits)):\n    print(fruits[i])`,
          evidence: {
            line: errorLine,
            observedValue: 'Index >= len(sequence)',
            expectedBehavior: 'Index <= len(sequence) - 1',
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: 'Change the loop range to range(len(sequence)) so indices stop at len - 1.',
          whyItWorks: 'range(len(items)) produces numbers 0, 1, ..., len - 1, which map exactly to valid list indices.',
          expectedOutput: 'Iterates through all items without exceeding sequence boundaries.',
          preventionTip: 'Prefer "for item in items" whenever you do not explicitly need the index variable.',
          suggestedFix: {
            originalText: targetContent,
            replacementText: fixedLine,
            startLine: targetLine,
            endLine: targetLine,
            explanation: 'Remove + 1 from range(len(...)) so indices stop at len - 1.',
          },
        },
      },
      tryItYourself: {
        question: 'If a list has 4 elements, what is the maximum valid positive index?',
        options: ['3', '4', '5', '0'],
        correctIndex: 0,
        explanation: 'Because Python uses zero-based indexing, a list of length 4 has valid indices 0, 1, 2, and 3.',
      },
    })
  }

  // ==========================================================================
  // 8. NameError (Misspelled Function/Variable / Undefined Variable)
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'NameError' || errorMessage.includes('is not defined'))
  ) {
    const match = errorMessage.match(/name ['"]([^'"]+)['"] is not defined/)
    const varName = match ? match[1] : 'variable'
    const similarMatch = findSimilarIdentifier(varName, code)
    const similar = similarMatch?.name || null
    const isBuiltin = similarMatch?.isBuiltin || false

    if (similar) {
      const fixedLine = lineContent.replace(new RegExp(`\\b${varName}\\b`, 'g'), similar)
      const isFunctionCall = isBuiltin || lineContent.includes(`${varName}(`)
      const title = isFunctionCall
        ? `Misspelled Function Name '${varName}'`
        : `Misspelled Variable '${varName}'`

      issues.push({
        id: `issue_${Date.now()}_nameerror_typo`,
        line: errorLine,
        title,
        category: 'name-error-typo',
        summary: isFunctionCall
          ? `Line ${errorLine}: You misspelled the function name. Write '${similar}' instead of '${varName}'.`
          : `Line ${errorLine}: '${varName}' is not defined. Did you mean '${similar}'?`,
        levels: {
          level1: {
            title: 'Hint',
            hint: isFunctionCall
              ? `You have a typo on line ${errorLine}. Python does not recognize '${varName}' — did you mean '${similar}'?`
              : `Check your spelling on line ${errorLine}. Did you mean to use '${similar}'?`,
            concept: isFunctionCall ? 'Python built-in functions' : 'variable names and spelling',
            line: errorLine,
          },
          level2: {
            title: 'Explanation',
            explanation: isFunctionCall
              ? `Python raised a NameError because '${varName}' does not exist. Python has a built-in function named '${similar}' to output text, but Python names are case-sensitive and must be spelled exactly.`
              : `Python raised a NameError because '${varName}' does not exist. You defined '${similar}' in your code. Python variable names are case-sensitive and must match character-for-character.`,
            problematicSnippet: varName,
            whyPythonErrors: `Python looked for '${varName}' in memory and built-in functions, but could not find anything matching that exact spelling.`,
            conceptTeaching: `Check function and variable spelling carefully. Python cannot guess what you meant if a letter is missing, mistyped, or capitalized differently.`,
            correctExample: `${similar}("hello")`,
            evidence: {
              line: errorLine,
              observedValue: `'${varName}' is not defined`,
              expectedBehavior: `'${similar}'`,
            },
          },
          level3: {
            title: 'Correct Answer',
            solution: isFunctionCall
              ? `You misspelled the function name. Write '${similar}' instead of '${varName}'.`
              : `Change '${varName}' to '${similar}'.`,
            whyItWorks: `Writing '${similar}' matches Python's ${isBuiltin ? 'built-in' : 'defined'} name.`,
            expectedOutput: `Executes '${similar}' without NameError.`,
            preventionTip: `Double-check your spelling and look for syntax highlighting in the editor.`,
            suggestedFix: {
              originalText: lineContent,
              replacementText: fixedLine,
              startLine: errorLine,
              endLine: errorLine,
              explanation: `Change '${varName}' to '${similar}'.`,
            },
          },
        },
        tryItYourself: {
          question: isFunctionCall
            ? `Which Python function outputs text to the screen?`
            : `Why did Python raise a NameError for '${varName}'?`,
          options: isFunctionCall
            ? ['display()', 'print()', 'output()', 'echo()']
            : [
                'The variable was misspelled or not defined before use.',
                'The variable name was written in numbers only.',
                'The line ended with a semicolon.',
                'The file was not saved.',
              ],
          correctIndex: isFunctionCall ? 1 : 0,
          explanation: isFunctionCall
            ? `In Python, print() is the built-in function used to display messages and data.`
            : `Python raises NameError whenever it encounters a word that hasn't been defined in the program.`,
        },
      })
    } else {
      // Undefined variable with no similar match
      issues.push({
        id: `issue_${Date.now()}_nameerror_undefined`,
        line: errorLine,
        title: `Undefined Variable '${varName}'`,
        category: 'name-error-typo',
        summary: `Line ${errorLine}: Variable '${varName}' was used before it was created.`,
        levels: {
          level1: {
            title: 'Hint',
            hint: `Variable '${varName}' is used on line ${errorLine}, but Python has not seen this variable before.`,
            concept: 'variable creation and assignment',
            line: errorLine,
          },
          level2: {
            title: 'Explanation',
            explanation: `Python raised NameError: name '${varName}' is not defined on line ${errorLine}. In Python, you must create a variable and give it a value (for example: ${varName} = 0) on a line above this one before you can use it.`,
            problematicSnippet: varName,
            whyPythonErrors: `Python tried to read the value of '${varName}', but no value has been stored in it yet.`,
            conceptTeaching: `To create a variable in Python, write its name followed by '=' and a value, for example: ${varName} = 10.`,
            correctExample: `${varName} = 10\nprint(${varName})`,
            evidence: {
              line: errorLine,
              observedValue: `'${varName}' is not defined`,
              expectedBehavior: `Create '${varName} = <value>' before line ${errorLine}`,
            },
          },
          level3: {
            title: 'Correct Answer',
            solution: `Create '${varName}' and give it a value on a line above line ${errorLine} (for example: ${varName} = 0), or check if you typed the wrong variable name.`,
            whyItWorks: `Giving '${varName}' a value before reading it allows Python to find it in memory.`,
            expectedOutput: `Resolves to the value stored in '${varName}'.`,
            preventionTip: `Make sure every variable is assigned a value before it appears in expressions or function calls.`,
            suggestedFix: undefined,
          },
        },
        tryItYourself: {
          question: `How do you create a variable named '${varName}' with value 5 in Python?`,
          options: [
            `var ${varName} = 5`,
            `${varName} = 5`,
            `int ${varName} = 5`,
            `set ${varName} to 5`,
          ],
          correctIndex: 1,
          explanation: `In Python, simply write the variable name, an '=' sign, and the value: ${varName} = 5.`,
        },
      })
    }
  }

  // ==========================================================================
  // 9. TypeError (Type Mismatch)
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'TypeError' ||
      errorMessage.includes('can only concatenate str') ||
      errorMessage.includes('unsupported operand type') ||
      errorMessage.includes('not callable'))
  ) {
    let fixedLine = lineContent
    if (errorMessage.includes('can only concatenate str') || errorMessage.includes('unsupported operand type')) {
      fixedLine = lineContent.replace(/([a-zA-Z_][a-zA-Z0-9_]*\[[^\]]+\]|\bitem\b|\bval\b|\bnum\b)/g, 'str($1)')
    }

    issues.push({
      id: `issue_${Date.now()}_typeerror`,
      line: errorLine,
      title: 'Incompatible Type Operation',
      category: 'type-mismatch',
      summary: `Line ${errorLine} attempted an operation between incompatible types.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `Python does not automatically convert numbers to strings when combining them. Check the data types of the values being combined on line ${errorLine}.`,
          concept: 'data types and type conversion',
          line: errorLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Line ${errorLine}: '${lineContent.trim()}'. Python raised TypeError because an operator (like +) cannot combine these types without explicit conversion (e.g., int() or str()).`,
          problematicSnippet: lineContent.trim(),
          whyPythonErrors: 'Python is strongly typed. It refuses to guess whether "10" + 5 should be "105" or 15.',
          conceptTeaching: 'Convert types explicitly before combining: str(number) for text concatenation, or int(string) for arithmetic.',
          correctExample: `age = 25\nprint("Age: " + str(age))\n# Or use an f-string: f"Age: {age}"`,
          evidence: {
            line: errorLine,
            observedValue: errorMessage,
            expectedBehavior: 'Explicit type conversion before operation',
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: 'Convert numbers to strings with str() or use an f-string for string formatting.',
          whyItWorks: 'Explicit type conversion aligns operands so the operation succeeds.',
          expectedOutput: 'Operands combined without TypeError.',
          preventionTip: 'Modern Python f-strings f"{var}" automatically handle string conversion for you.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: fixedLine,
            startLine: errorLine,
            endLine: errorLine,
            explanation: 'Convert string elements to integers with int() before numeric calculation.',
          },
        },
      },
      tryItYourself: {
        question: 'What is the result of "Score: " + 100 in Python?',
        options: [
          '"Score: 100"',
          'TypeError',
          '"Score: "',
          'None',
        ],
        correctIndex: 1,
        explanation: 'Python raises a TypeError because strings and integers cannot be directly concatenated with "+".',
      },
    })
  }

  // ==========================================================================
  // 10. ValueError
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'ValueError' || errorMessage.includes('ValueError'))
  ) {
    issues.push({
      id: `issue_${Date.now()}_valueerror`,
      line: errorLine,
      title: 'Invalid Value Format',
      category: 'value-error',
      summary: `Line ${errorLine} received an argument of the right type but inappropriate value.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `Check the value being passed into the function on line ${errorLine}. Does the data match the expected format?`,
          concept: 'data validation and value ranges',
          line: errorLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Python raised ValueError on line ${errorLine}: ${errorMessage}. The operation received a valid type but the actual value could not be converted or processed.`,
          problematicSnippet: lineContent.trim(),
          whyPythonErrors: 'For example, int("abc") receives a string (valid type) but "abc" cannot be parsed as a base-10 integer.',
          conceptTeaching: 'Validate or sanitize user input (e.g., using str.isdigit() or try/except) before converting.',
          correctExample: `val = "42"\nif val.isdigit():\n    num = int(val)`,
          evidence: {
            line: errorLine,
            observedValue: errorMessage,
            expectedBehavior: 'Valid formatted value',
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: 'Validate the input before conversion or wrap with a try/except ValueError block.',
          whyItWorks: 'Checking inputs prevents invalid literals from crashing the program.',
          expectedOutput: 'Safe parsing with fallback for malformed values.',
          preventionTip: 'Always sanitize external or user input before calling type conversion functions.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: `    # Verify input before conversion\n${lineContent}`,
            startLine: errorLine,
            endLine: errorLine,
            explanation: 'Add input validation before conversion.',
          },
        },
      },
      tryItYourself: {
        question: 'What happens when calling int("hello") in Python?',
        options: [
          'It returns 0.',
          'It raises a ValueError.',
          'It raises a TypeError.',
          'It returns None.',
        ],
        correctIndex: 1,
        explanation: 'int() raises ValueError when given a string that does not represent a valid number.',
      },
    })
  }

  // ==========================================================================
  // 11. KeyError
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'KeyError' || errorMessage.includes('KeyError'))
  ) {
    const match = errorMessage.match(/KeyError:\s*['"]?([^'"\n]+)['"]?/)
    const key = match ? match[1] : 'key'
    const fixedLine = lineContent.replace(/\[([^\]]+)\]/, '.get($1, 0)')

    issues.push({
      id: `issue_${Date.now()}_keyerror`,
      line: errorLine,
      title: `Missing Dictionary Key '${key}'`,
      category: 'key-error',
      summary: `Line ${errorLine} attempted to access dictionary key '${key}' which does not exist.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `What happens if key '${key}' is not in the dictionary? How can you look up a key safely with a fallback default?`,
          concept: 'dictionary lookup & default fallbacks',
          line: errorLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Direct dictionary indexing dict[key] raises KeyError if key is missing. Line ${errorLine} accessed '${key}' without confirming key existence.`,
          problematicSnippet: lineContent.trim(),
          whyPythonErrors: 'Dictionaries require keys to exist before direct indexing dict[key].',
          conceptTeaching: 'Use dict.get(key, default) or check "if key in dict:" before accessing.',
          correctExample: `counts = {'a': 1}\nval = counts.get('b', 0)  # Returns 0 without KeyError`,
          evidence: {
            line: errorLine,
            observedValue: `Key '${key}' missing`,
            expectedBehavior: `dict.get(key, default)`,
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: 'Use dict.get(key, default) instead of direct indexing.',
          whyItWorks: '.get() returns the default fallback when the key is absent instead of crashing.',
          expectedOutput: 'Retrieves value or default fallback without KeyError.',
          preventionTip: 'Use collections.defaultdict or dict.get() whenever keys may be missing.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: fixedLine,
            startLine: errorLine,
            endLine: errorLine,
            explanation: `Replace direct lookup with .get() to provide a safe default value.`,
          },
        },
      },
      tryItYourself: {
        question: 'Which method safely looks up a dictionary key with a default fallback?',
        options: ['dict[key]', 'dict.get(key, default)', 'dict.find(key)', 'dict.lookup(key)'],
        correctIndex: 1,
        explanation: 'dict.get(key, default) returns the default value if the key does not exist, preventing KeyError.',
      },
    })
  }

  // ==========================================================================
  // 12. AttributeError
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'AttributeError' || errorMessage.includes('AttributeError'))
  ) {
    const match = errorMessage.match(/object has no attribute ['"]([^'"]+)['"]/)
    const attr = match ? match[1] : 'method'
    let fixedLine = lineContent
    if (attr === 'add' && lineContent.includes('.add(')) {
      fixedLine = lineContent.replace('.add(', '.append(')
    }

    issues.push({
      id: `issue_${Date.now()}_attributeerror`,
      line: errorLine,
      title: `AttributeError: '${attr}' Not Found`,
      category: 'attribute-error',
      summary: `Line ${errorLine} attempted to access attribute or method '${attr}' which does not exist on this object.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `Check the method name on line ${errorLine}. Does this object type support '.${attr}()'? (For example, lists use .append(), while sets use .add()).`,
          concept: 'data structure methods',
          line: errorLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Python raised AttributeError: ${errorMessage} on line ${errorLine}. You called a method or attribute that is not part of this object's class.`,
          problematicSnippet: lineContent.trim(),
          whyPythonErrors: 'Different Python data structures have different methods. Calling a set method on a list, or calling string methods on an integer, raises an AttributeError.',
          conceptTeaching: 'Lists use .append(), .extend(), .pop(); dictionaries use .keys(), .values(), .items(); strings use .lower(), .strip().',
          correctExample: `items = []\nitems.append("val")  # Correct list method`,
          evidence: {
            line: errorLine,
            observedValue: `'${attr}' not on object`,
            expectedBehavior: 'Valid method name for data type',
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: `Use the correct method for this data type (e.g., .append() for lists).`,
          whyItWorks: 'Calling an existing method executes the desired data mutation.',
          expectedOutput: 'Method executes and mutates object correctly.',
          preventionTip: 'Check the data type using type(obj) or print(dir(obj)) if unsure of available methods.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: fixedLine,
            startLine: errorLine,
            endLine: errorLine,
            explanation: `Replace '.${attr}()' with the appropriate method for this object.`,
          },
        },
      },
      tryItYourself: {
        question: 'Which method is used to add an item to the end of a Python list?',
        options: ['list.add(item)', 'list.append(item)', 'list.push(item)', 'list.insert_end(item)'],
        correctIndex: 1,
        explanation: 'In Python, lists use the append() method to add an item to the end.',
      },
    })
  }

  // ==========================================================================
  // 13. Execution Timeout (Infinite Loop)
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorMessage.includes('Execution timed out') || errorMessage.includes('timed out'))
  ) {
    let loopLine = 1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('while ')) {
        loopLine = i + 1
        break
      }
    }
    const loopContent = lines[loopLine - 1] || ''

    issues.push({
      id: `issue_${Date.now()}_timeout`,
      line: loopLine,
      title: 'Execution Timeout (Infinite Loop Detected)',
      category: 'timeout-infinite-loop',
      summary: `The code exceeded the execution time limit, likely due to a loop that never terminates.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `A while loop in your program is running forever without reaching its exit condition. Check line ${loopLine}. Is the loop counter being updated inside the loop body?`,
          concept: 'loop termination conditions',
          line: loopLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Execution timed out because a loop ran continuously without stopping. In a while loop, the condition must eventually become False. If loop variables are never updated, the loop runs forever.`,
          problematicSnippet: loopContent.trim() || 'while condition:',
          whyPythonErrors: 'Pyodide execution safety terminated the process after 15 seconds to prevent freezing your browser tab.',
          conceptTeaching: 'Always ensure variables checked in a while loop condition are updated (e.g., i += 1) inside the loop body, or use a for loop.',
          correctExample: `count = 0\nwhile count < 5:\n    print(count)\n    count += 1  # Crucial: update loop variable`,
          evidence: {
            line: loopLine,
            observedValue: 'Loop ran indefinitely',
            expectedBehavior: 'Loop variable reaches exit condition',
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: 'Ensure the loop counter advances inside the loop, or convert the while loop to a for loop.',
          whyItWorks: 'Updating the counter guarantees the loop condition eventually evaluates to False.',
          expectedOutput: 'Loop terminates after the expected number of iterations.',
          preventionTip: 'Prefer "for i in range(N)" whenever the number of iterations is known.',
          suggestedFix: {
            originalText: loopContent,
            replacementText: loopContent.replace(/while\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*<\s*(\d+):/, 'for $1 in range($2):'),
            startLine: loopLine,
            endLine: loopLine,
            explanation: 'Convert while loop to a bounded for-range loop to guarantee termination.',
          },
        },
      },
      tryItYourself: {
        question: 'What is required for a while loop to terminate normally?',
        options: [
          'The condition must eventually evaluate to False.',
          'The loop must contain a print statement.',
          'The loop variable must be a string.',
          'The loop must be inside a function.',
        ],
        correctIndex: 0,
        explanation: 'A while loop continues as long as its condition is True. It terminates when the condition becomes False or a break statement executes.',
      },
    })
  }

  // ==========================================================================
  // 14. RecursionError
  // ==========================================================================
  if (
    issues.length === 0 &&
    (errorType === 'RecursionError' || errorMessage.includes('maximum recursion depth exceeded'))
  ) {
    issues.push({
      id: `issue_${Date.now()}_recursionerror`,
      line: errorLine,
      title: 'Maximum Recursion Depth Exceeded',
      category: 'recursion-error',
      summary: `A recursive function called itself continuously without hitting a base case.`,
      levels: {
        level1: {
          title: 'Helpful Hint',
          hint: `Recursive functions require a base case that stops recursion (e.g. if n <= 1: return 1). Check if your function has a base case.`,
          concept: 'recursion & base cases',
          line: errorLine,
        },
        level2: {
          title: 'Explain the Error',
          explanation: `Python has a maximum recursion limit (typically 1000 calls) to protect system call stacks. When a function recurses infinitely, Python raises RecursionError.`,
          problematicSnippet: lineContent.trim(),
          whyPythonErrors: 'Each function call adds a frame to the call stack. Without a terminating condition, the stack overflows.',
          conceptTeaching: 'Every recursive function must have two parts: 1) a base case that returns without recursing, and 2) a recursive step that moves closer to the base case.',
          correctExample: `def countdown(n):\n    if n <= 0:\n        return  # Base case\n    countdown(n - 1)  # Recursive step`,
          evidence: {
            line: errorLine,
            observedValue: 'Infinite recursive calls',
            expectedBehavior: 'Base case returns early',
          },
        },
        level3: {
          title: 'Complete Solution',
          solution: 'Add an early return base case at the top of the recursive function.',
          whyItWorks: 'The base case provides a stopping point where recursion halts.',
          expectedOutput: 'Function completes after finite recursive steps.',
          preventionTip: 'Always write and test the base case first before writing the recursive call.',
          suggestedFix: {
            originalText: lineContent,
            replacementText: `    if n <= 1:\n        return 1\n${lineContent}`,
            startLine: errorLine,
            endLine: errorLine,
            explanation: 'Add base case guard check at function start.',
          },
        },
      },
      tryItYourself: {
        question: 'What is the purpose of a base case in a recursive function?',
        options: [
          'To stop the recursion and prevent infinite calls.',
          'To define the function name.',
          'To print the output to the console.',
          'To import math libraries.',
        ],
        correctIndex: 0,
        explanation: 'A base case provides the condition under which the function returns without calling itself again, terminating the recursion.',
      },
    })
  }

  // ==========================================================================
  // 15. Logical Mistakes: Early Return Inside Loop
  // ==========================================================================
  if (issues.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.match(/^\s*(for|while)\s+/)) {
        const loopIndent = line.search(/\S/)
        for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
          const nextLine = lines[j]
          const nextIndent = nextLine.search(/\S/)
          if (nextIndent > loopIndent && nextLine.trim().startsWith('return ')) {
            const prevLine = lines[j - 1]?.trim() || ''
            if (!prevLine.startsWith('if ') && !prevLine.startsWith('elif ')) {
              issues.push({
                id: `issue_${Date.now()}_earlyreturn`,
                line: j + 1,
                title: 'Premature Return Inside Loop',
                category: 'early-return-loop',
                summary: `Line ${j + 1} returns inside the loop body, terminating the function on the first iteration.`,
                levels: {
                  level1: {
                    title: 'Helpful Hint',
                    hint: `Check the indentation of the return statement on line ${j + 1}. Should the function return on the first item, or after the loop finishes examining all items?`,
                    concept: 'loop accumulator and return timing',
                    line: j + 1,
                  },
                  level2: {
                    title: 'Explain the Error',
                    explanation: `Line ${j + 1}: '${nextLine.trim()}' is indented directly inside the loop. When Python executes a 'return' statement, the entire function immediately ends, abandoning the remaining iterations.`,
                    problematicSnippet: nextLine,
                    whyPythonErrors: 'A return statement inside a loop without an if-guard executes on iteration 1 and exits early.',
                    conceptTeaching: 'To accumulate results or inspect an entire collection, let the loop finish, then place the return statement at the same indentation level as the loop header.',
                    correctExample: `def sum_items(items):\n    total = 0\n    for item in items:\n        total += item\n    return total  # Outside the loop`,
                    evidence: {
                      line: j + 1,
                      observedValue: 'Returns on iteration 1',
                      expectedBehavior: 'Returns after loop completes',
                    },
                  },
                  level3: {
                    title: 'Complete Solution',
                    solution: `Dedent line ${j + 1} so it sits outside the loop body.`,
                    whyItWorks: 'Placing return after the loop allows the loop to iterate through every item before returning the final result.',
                    expectedOutput: 'Function processes all items and returns final calculated value.',
                    preventionTip: 'Trace loop execution with pencil and paper: if you see a return on the first step, check indentation.',
                    suggestedFix: {
                      originalText: nextLine,
                      replacementText: ' '.repeat(loopIndent) + nextLine.trim(),
                      startLine: j + 1,
                      endLine: j + 1,
                      explanation: 'Dedent return statement outside the loop body.',
                    },
                  },
                },
                tryItYourself: {
                  question: 'Where should a return statement be placed to return the sum of a list after summing all elements?',
                  options: [
                    'Inside the loop on the first line.',
                    'Directly indented under the for loop body.',
                    'Dedented outside the loop body.',
                    'Before the function definition.',
                  ],
                  correctIndex: 2,
                  explanation: 'Placing the return statement outside the loop ensures the loop completes all iterations before returning.',
                },
              })
              break
            }
          }
        }
      }
    }
  }

  // ==========================================================================
  // 16. Missing Return (Test Failures)
  // ==========================================================================
  if (issues.length === 0 && testFailures && testFailures.length > 0) {
    const noneFailure = testFailures.find((f) => f.actual === 'None' && f.expected !== 'None')
    if (noneFailure) {
      issues.push({
        id: `issue_${Date.now()}_missingreturn`,
        line: lines.length,
        title: 'Missing Return Statement in Function',
        category: 'missing-return',
        summary: `Function completed without a return statement, returning None instead of expected '${noneFailure.expected}'.`,
        levels: {
          level1: {
            title: 'Helpful Hint',
            hint: 'In Python, a function without an explicit return statement returns None by default. Did you return your calculated result?',
            concept: 'function return values',
            line: lines.length,
          },
          level2: {
            title: 'Explain the Error',
            explanation: `Test '${noneFailure.name}' expected '${noneFailure.expected}' but received 'None'. The function calculated a value but forgot to return it.`,
            problematicSnippet: '# Missing return at end of function',
            whyPythonErrors: 'Python functions that fall off the end of their body automatically return None.',
            conceptTeaching: 'Always include "return result" to send the calculated data back to the caller.',
            correctExample: `def add(a, b):\n    return a + b`,
            evidence: {
              line: lines.length,
              observedValue: 'Returned None',
              expectedBehavior: `Return ${noneFailure.expected}`,
            },
          },
          level3: {
            title: 'Complete Solution',
            solution: 'Add an explicit return statement returning the calculated variable.',
            whyItWorks: 'Returning the result passes the computed value back to test assertions.',
            expectedOutput: `Returns expected value ${noneFailure.expected}.`,
            preventionTip: 'Distinguish between print() (which outputs to screen) and return (which passes data to the caller).',
            suggestedFix: {
              originalText: lines[lines.length - 1],
              replacementText: `${lines[lines.length - 1]}\n    return result`,
              startLine: lines.length,
              endLine: lines.length,
              explanation: 'Add return statement at the end of function body.',
            },
          },
        },
        tryItYourself: {
          question: 'What does a Python function return by default if it contains no return statement?',
          options: ['0', 'None', 'False', 'An empty string'],
          correctIndex: 1,
          explanation: 'In Python, functions return None by default if no explicit return statement is encountered.',
        },
      })
    }
  }

  // ==========================================================================
  // 17. Multi-Line Static Scan for Additional Independent Issues (e.g. Lines 7, 11, 12)
  // ==========================================================================
  for (let idx = 0; idx < lines.length; idx++) {
    const lineNum = idx + 1
    // Don't re-diagnose lines already captured in issues
    if (issues.some((iss) => iss.line === lineNum)) continue

    const curLine = lines[idx]

    // Check for another f-string single brace on a different line
    if (
      (curLine.includes('f"') || curLine.includes("f'")) &&
      curLine.match(/\{[a-zA-Z0-9_.]+\}\}/)
    ) {
      const match = curLine.match(/\{([a-zA-Z0-9_.]+)\}\}/)!
      const varName = match[1]
      issues.push({
        id: `issue_${Date.now()}_line_${lineNum}_extra_brace`,
        line: lineNum,
        title: `Extra Closing Brace in f-string on Line ${lineNum}`,
        category: 'syntax-error',
        summary: `Line ${lineNum} has an extra '}' brace in an f-string expression.`,
        levels: {
          level1: {
            title: 'Hint',
            hint: `Count the braces around '{${varName}}}' on line ${lineNum}. There is a duplicate closing brace.`,
            concept: 'f-string formatting',
            line: lineNum,
          },
          level2: {
            title: 'Explanation',
            explanation: `Line ${lineNum} has '{${varName}}}'. In Python f-strings, braces must be in single matching pairs {var}.`,
            problematicSnippet: `{${varName}}}`,
            whyPythonErrors: "Single '}' characters are not allowed in f-strings.",
            conceptTeaching: "Use single matching braces: f'{${varName}}'.",
            correctExample: `print(f"{${varName}}")`,
          },
          level3: {
            title: 'Correct Answer',
            solution: `Remove the duplicate closing brace on line ${lineNum}.`,
            whyItWorks: 'Enclosing the variable in a single pair of braces satisfies f-string grammar.',
            preventionTip: 'Ensure balanced braces across all f-strings.',
            suggestedFix: {
              originalText: curLine,
              replacementText: curLine.replace(`{${varName}}}`, `{${varName}}`),
              startLine: lineNum,
              endLine: lineNum,
              explanation: `Remove extra '}' on line ${lineNum}.`,
            },
          },
        },
      })
      continue
    }

    // Check for misspelled built-in on a different line (e.g. prnt(...))
    const prntMatch = curLine.match(/\b(prnt|pritn|pint|prntf|rang|lengh|intger)\s*\(/)
    if (prntMatch) {
      const misspelled = prntMatch[1]
      const corrected = misspelled.startsWith('p')
        ? 'print'
        : misspelled === 'rang'
          ? 'range'
          : misspelled === 'lengh'
            ? 'len'
            : 'int'
      issues.push({
        id: `issue_${Date.now()}_line_${lineNum}_misspelled`,
        line: lineNum,
        title: `Misspelled Function '${misspelled}' on Line ${lineNum}`,
        category: 'name-error-typo',
        summary: `Line ${lineNum}: You misspelled the function name. Write '${corrected}' instead of '${misspelled}'.`,
        levels: {
          level1: {
            title: 'Hint',
            hint: `You have a spelling mistake on line ${lineNum}. Did you mean '${corrected}'?`,
            concept: 'Python built-in functions',
            line: lineNum,
          },
          level2: {
            title: 'Explanation',
            explanation: `Python does not recognize '${misspelled}'. In Python, the function is spelled '${corrected}'.`,
            problematicSnippet: misspelled,
            whyPythonErrors: `Python could not find a function named '${misspelled}'.`,
            conceptTeaching: `Python built-in function names must be spelled exactly.`,
            correctExample: `${corrected}("hello")`,
          },
          level3: {
            title: 'Correct Answer',
            solution: `You misspelled the function name. Write '${corrected}' instead of '${misspelled}'.`,
            whyItWorks: `Using '${corrected}' calls Python's built-in function.`,
            preventionTip: `Check the spelling of Python functions.`,
            suggestedFix: {
              originalText: curLine,
              replacementText: curLine.replace(new RegExp(`\\b${misspelled}\\b`), corrected),
              startLine: lineNum,
              endLine: lineNum,
              explanation: `Change '${misspelled}' to '${corrected}'.`,
            },
          },
        },
      })
      continue
    }

    // Check for missing colon on header on a different line
    if (
      curLine.match(/^\s*(if|elif|else|for|while|def|class)\b/) &&
      !curLine.trim().endsWith(':')
    ) {
      issues.push({
        id: `issue_${Date.now()}_line_${lineNum}_missing_colon`,
        line: lineNum,
        title: `Missing Colon ':' on Line ${lineNum}`,
        category: 'syntax-error',
        summary: `Line ${lineNum} ends without a required colon ':'.`,
        levels: {
          level1: {
            title: 'Hint',
            hint: `Look at the end of line ${lineNum}. Python requires a colon ':' at the end of this line.`,
            concept: 'compound statement syntax',
            line: lineNum,
          },
          level2: {
            title: 'Explanation',
            explanation: `Lines starting with if, for, while, or def must end with a colon (:).`,
            problematicSnippet: curLine.trim(),
            whyPythonErrors: `Python needs the colon to mark the start of the indented block.`,
            conceptTeaching: `Always add a colon at the end of header lines.`,
            correctExample: `${curLine.trim()}:`,
          },
          level3: {
            title: 'Correct Answer',
            solution: `Add a colon ':' at the end of line ${lineNum}.`,
            whyItWorks: `The colon satisfies Python syntax for statement headers.`,
            preventionTip: `Remember to type a colon at the end of if/for/def lines.`,
            suggestedFix: {
              originalText: curLine,
              replacementText: curLine.trimEnd() + ':',
              startLine: lineNum,
              endLine: lineNum,
              explanation: `Add colon at end of line ${lineNum}.`,
            },
          },
        },
      })
      continue
    }
  }

  // ==========================================================================
  // 18. Fallback if No Specific Issue Captured
  // ==========================================================================
  if (issues.length === 0) {
    if (errorType || errorMessage) {
      const cleanMsg = (errorMessage || '')
        .replace(/^(?:PythonError:\s*|Traceback\s*\([^)]*\):\s*|[\w]+Error:\s*)+/i, '')
        .trim()

      let mappedCategory: BugDiagnosis['category'] = 'syntax-error'
      if (errorType === 'NameError') mappedCategory = 'name-error-typo'
      else if (errorType === 'TypeError') mappedCategory = 'type-mismatch'
      else if (errorType === 'ZeroDivisionError') mappedCategory = 'zero-division'
      else if (errorType === 'IndentationError') mappedCategory = 'indentation-error'
      else if (errorType === 'IndexError') mappedCategory = 'index-out-of-bounds'
      else if (errorType === 'KeyError') mappedCategory = 'key-error'
      else if (errorType === 'ValueError') mappedCategory = 'value-error'
      else if (errorType === 'AttributeError') mappedCategory = 'attribute-error'
      else if (errorType === 'RecursionError') mappedCategory = 'recursion-error'
      else if (errorType === 'TimeoutError') mappedCategory = 'timeout-infinite-loop'

      const titleName = errorType ? errorType.replace(/([A-Z])/g, ' $1').trim() : 'Syntax Error'

      issues.push({
        id: `issue_${Date.now()}_fallback`,
        line: errorLine,
        title: `${titleName} on Line ${errorLine}`,
        category: mappedCategory,
        summary: cleanMsg ? `Line ${errorLine}: ${cleanMsg}` : `Python reported ${titleName} on line ${errorLine}.`,
        levels: {
          level1: {
            title: 'Hint',
            hint: cleanMsg
              ? `Python reported on line ${errorLine}: ${cleanMsg}. Inspect what is written on this line.`
              : `Inspect line ${errorLine} for syntax mistakes, unclosed symbols, or misspelled names.`,
            concept: titleName,
            line: errorLine,
          },
          level2: {
            title: 'Explanation',
            explanation: `On line ${errorLine}, Python encountered '${lineContent.trim()}'. Python reported: ${cleanMsg || errorType}. This means Python could not execute this statement as written.`,
            problematicSnippet: lineContent.trim(),
            whyPythonErrors: cleanMsg || `Python raised ${titleName} on line ${errorLine}.`,
            conceptTeaching: `Review line ${errorLine} to ensure statements adhere to Python rules for ${titleName}.`,
            correctExample: '',
            evidence: {
              line: errorLine,
              observedValue: cleanMsg || errorType,
              expectedBehavior: 'Valid Python statement',
            },
          },
          level3: {
            title: 'Correct Answer',
            solution: cleanMsg
              ? `Fix the issue reported on line ${errorLine} (${cleanMsg}). Manually update the statement in the code editor.`
              : `Correct the statement on line ${errorLine} to follow valid Python syntax.`,
            whyItWorks: 'Fixing the statement allows Python to compile and execute without raising an error.',
            preventionTip: 'Double-check delimiters, types, and function names before running your code.',
            suggestedFix: undefined,
          },
        },
      })
    } else {
      return null
    }
  }

  const primary = issues[0]
  return {
    id: `diag_${Date.now()}_${primary.category}`,
    category: primary.category,
    title: primary.title,
    line: primary.line,
    summary: primary.summary,
    hints: buildLegacyHints(primary),
    issues,
    isStale: false,
    codeHash,
  }
}
