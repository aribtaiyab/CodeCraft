// ============================================================================
// CodeCraft — Client-Side MCQ Verification via Browser Pyodide Sandbox
// Verifies generated code-output questions against real Pyodide runtime stdout
// while ensuring conceptual questions and stale states are never verified.
// ============================================================================

import type { McqQuestion } from './types.ts'

export interface ClientVerificationOptions {
  lastStdout?: string
  lastError?: string
  isStale?: boolean
  sourceHash?: string
  currentSourceHash?: string
}

export function verifyMcqsWithBrowserRuntime(
  questions: McqQuestion[],
  _sourceCode: string,
  contextOrStdout?: string | ClientVerificationOptions
): McqQuestion[] {
  const options: ClientVerificationOptions =
    typeof contextOrStdout === 'string'
      ? { lastStdout: contextOrStdout }
      : contextOrStdout || {}

  const cleanStdout = (options.lastStdout || '').trim()
  const hasError = Boolean(options.lastError && options.lastError.trim().length > 0)
  const isStale = Boolean(
    options.isStale ||
      (options.sourceHash &&
        options.currentSourceHash &&
        options.sourceHash !== options.currentSourceHash)
  )

  return questions.map((q) => {
    // 1. Conceptual questions are strictly preserved as unverified by execution
    const questionLower = q.question.toLowerCase()
    const isConceptual =
      questionLower.includes('what type') ||
      questionLower.includes('data type') ||
      questionLower.includes('which type') ||
      questionLower.includes('keyword') ||
      questionLower.includes('concept') ||
      questionLower.includes('why ') ||
      questionLower.includes('purpose of') ||
      questionLower.includes('how does') ||
      questionLower.includes('which statement') ||
      questionLower.includes('which of the following')

    if (isConceptual || (!q.verifiedByExecution && !q.verificationNote?.includes('Output question'))) {
      return {
        ...q,
        verifiedByExecution: false,
        verificationNote: 'Conceptual reasoning question — not evaluated by execution.',
      }
    }

    // 2. If code is stale, execution failed, or output is cleared:
    // Old verification results CANNOT be shown as currently verified!
    if (isStale) {
      return {
        ...q,
        verifiedByExecution: false,
        verificationNote: 'Verification stale: code modified since execution. Re-run to verify output.',
      }
    }

    if (hasError) {
      return {
        ...q,
        verifiedByExecution: false,
        verificationNote: 'Verification unavailable: last execution ended with an error. Fix errors and re-run to verify.',
      }
    }

    // 3. If verified by safe static literal analysis on the server, preserve it
    if (q.verifiedByExecution && q.verificationNote?.includes('Verified against literal')) {
      return q
    }

    // 4. For dynamic output questions, verify against browser Pyodide runtime output
    if (cleanStdout.length > 0) {
      const matchedIndex = q.options.findIndex((opt) => {
        const cleanOpt = opt.trim().replace(/^['"]|['"]$/g, '')
        const cleanOut = cleanStdout.replace(/^['"]|['"]$/g, '')
        if (cleanOpt === cleanOut || opt.trim() === cleanStdout) return true
        const numOpt = parseFloat(cleanOpt)
        const numOut = parseFloat(cleanOut)
        if (!isNaN(numOpt) && !isNaN(numOut) && numOpt === numOut) return true
        return false
      })

      if (matchedIndex !== -1) {
        return {
          ...q,
          correctIndex: matchedIndex,
          verifiedByExecution: true,
          verificationNote: `Verified through browser Pyodide execution (Output: '${cleanStdout}').`,
        }
      } else {
        return {
          ...q,
          verifiedByExecution: false,
          verificationNote: `Pyodide output was '${cleanStdout}', but options did not directly match; marked as conceptual.`,
        }
      }
    }

    // 5. Output question but no Pyodide execution output yet (or output was cleared)
    return {
      ...q,
      verifiedByExecution: false,
      verificationNote: 'Output question — run code in Code Studio to verify against Pyodide output.',
    }
  })
}
