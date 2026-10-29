// ============================================================================
// CodeCraft — Predict Before You Run Panel Component
// ============================================================================

import React from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { PredictionResult } from '../../../services/pyodide'
import styles from './PredictionPanel.module.css'

interface PredictionPanelProps {
  prediction: string
  setPrediction: (val: string) => void
  predictionResult: PredictionResult | null
  clearPrediction: () => void
  isStale: boolean
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  prediction,
  setPrediction,
  predictionResult,
  clearPrediction,
  isStale,
}) => {
  return (
    <div className={styles.predictionPanel}>
      {/* Stale Warning */}
      {isStale && predictionResult && (
        <div className={styles.staleBanner} role="alert">
          <AlertTriangle size={14} className={styles.staleIcon} />
          <span>Code modified since prediction evaluation. Run code again to re-check.</span>
        </div>
      )}

      <div className={styles.scrollArea}>
        {/* Intro Card */}
        <div className={styles.introCard}>
          <div className={styles.introTitle}>
            <Sparkles size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--color-bronze)' }} />
            Predict Before You Run
          </div>
          <div className={styles.introDesc}>
            Test your understanding before executing. Type what you expect the program to output, then click <strong>Run</strong>.
          </div>
        </div>

        {/* Prediction Input */}
        <div className={styles.inputSection}>
          <div className={styles.inputLabel}>
            <span>Your Expected Output</span>
            {prediction && (
              <button
                type="button"
                onClick={() => {
                  setPrediction('')
                  clearPrediction()
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-ivory-faint)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: '11px',
                }}
              >
                <RotateCcw size={11} /> Clear
              </button>
            )}
          </div>
          <textarea
            className={styles.predictionTextarea}
            placeholder="Type expected console output lines here..."
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
          />
        </div>

        {/* Prediction Evaluation Result */}
        {predictionResult && (
          <div className={styles.resultCard}>
            <div
              className={[
                styles.resultBanner,
                predictionResult.isMatch
                  ? styles['resultBanner--match']
                  : styles['resultBanner--mismatch'],
              ].join(' ')}
            >
              {predictionResult.isMatch ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Prediction Matched Actual Output Exactly!</span>
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  <span>Output Mismatch: Prediction Differed from Actual Output</span>
                </>
              )}
            </div>

            {/* Line by line diff comparison */}
            <table className={styles.diffTable}>
              <thead>
                <tr>
                  <th className={styles.diffLineNum}>Line</th>
                  <th>Expected</th>
                  <th>Actual</th>
                  <th className={styles.diffStatus}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {predictionResult.lineDiff.map((item) => (
                  <tr
                    key={item.lineNum}
                    className={!item.match ? styles['diffRow--mismatch'] : ''}
                  >
                    <td className={styles.diffLineNum}>{item.lineNum}</td>
                    <td className={styles.diffPredicted}>
                      {item.predicted || <span style={{ opacity: 0.4 }}>[empty]</span>}
                    </td>
                    <td className={styles.diffActual}>
                      {item.actual || <span style={{ opacity: 0.4 }}>[empty]</span>}
                    </td>
                    <td className={styles.diffStatus}>
                      {item.match ? (
                        <span className={styles.matchBadge}>✓ match</span>
                      ) : (
                        <span className={styles.mismatchBadge}>✕ diff</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
