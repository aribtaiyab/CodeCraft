// ============================================================================
// Automated Tests: Prediction Comparison Utility
// ============================================================================

import { describe, it, expect } from 'vitest'
import { comparePrediction } from '../predictionUtils'

describe('comparePrediction Utility', () => {
  it('returns isMatch: true when predicted output matches actual stdout exactly', () => {
    const predicted = 'Hello World\nLine 2\nDone'
    const actual = 'Hello World\nLine 2\nDone'

    const res = comparePrediction(predicted, actual)
    expect(res.isMatch).toBe(true)
    expect(res.lineDiff.every((l) => l.match)).toBe(true)
  })

  it('normalizes CRLF line endings and trailing empty lines', () => {
    const predicted = 'Hello World\r\n42\r\n'
    const actual = 'Hello World\n42\n'

    const res = comparePrediction(predicted, actual)
    expect(res.isMatch).toBe(true)
    expect(res.lineDiff.length).toBe(2)
  })

  it('detects line mismatches and provides lineDiff details', () => {
    const predicted = 'Total: 100\nStatus: Error'
    const actual = 'Total: 100\nStatus: OK'

    const res = comparePrediction(predicted, actual)
    expect(res.isMatch).toBe(false)
    expect(res.lineDiff[0].match).toBe(true)
    expect(res.lineDiff[1].match).toBe(false)
    expect(res.lineDiff[1].predicted).toBe('Status: Error')
    expect(res.lineDiff[1].actual).toBe('Status: OK')
  })

  it('handles length differences between predicted and actual output', () => {
    const predicted = 'Line 1'
    const actual = 'Line 1\nLine 2\nLine 3'

    const res = comparePrediction(predicted, actual)
    expect(res.isMatch).toBe(false)
    expect(res.lineDiff.length).toBe(3)
    expect(res.lineDiff[0].match).toBe(true)
    expect(res.lineDiff[1].match).toBe(false)
    expect(res.lineDiff[1].predicted).toBe('')
    expect(res.lineDiff[1].actual).toBe('Line 2')
  })
})
