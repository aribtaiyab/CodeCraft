// ============================================================================
// CodeCraft — Prediction Comparison Utility
// ============================================================================

import type { PredictionResult, LineDiffItem } from './types'

export function comparePrediction(
  predictedRaw: string,
  actualRaw: string
): PredictionResult {
  const normalize = (text: string) =>
    text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trimEnd())

  const predictedLines = normalize(predictedRaw)
  const actualLines = normalize(actualRaw)

  // Filter out trailing empty lines from comparison if both end in newline
  while (predictedLines.length > 0 && predictedLines[predictedLines.length - 1] === '') {
    predictedLines.pop()
  }
  while (actualLines.length > 0 && actualLines[actualLines.length - 1] === '') {
    actualLines.pop()
  }

  const maxLen = Math.max(predictedLines.length, actualLines.length)
  const lineDiff: LineDiffItem[] = []
  let allMatched = true

  for (let i = 0; i < maxLen; i++) {
    const p = predictedLines[i] ?? ''
    const a = actualLines[i] ?? ''
    const match = p === a

    if (!match) {
      allMatched = false
    }

    lineDiff.push({
      lineNum: i + 1,
      predicted: p,
      actual: a,
      match,
    })
  }

  // Exact string match comparison across normalized lines
  const isMatch = allMatched && predictedLines.length === actualLines.length

  return {
    predicted: predictedRaw,
    actual: actualRaw,
    isMatch,
    lineDiff,
  }
}
