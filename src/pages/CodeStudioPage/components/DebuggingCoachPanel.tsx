// ============================================================================
// CodeCraft — Smart Debugging Coach Panel Component
// ============================================================================

import React, { useState } from 'react'
import {
  LifeBuoy,
  AlertTriangle,
  Lightbulb,
  FileSearch,
  Wrench,
  Check,
  Undo2,
} from 'lucide-react'
import type { BugDiagnosis } from '../../../services/coach'
import styles from './DebuggingCoachPanel.module.css'

interface DebuggingCoachPanelProps {
  diagnosis: BugDiagnosis | null
  isStale: boolean
  onApplyFix: (originalText: string, replacementText: string) => void
  onUndoFix: () => void
  canUndo: boolean
}

export const DebuggingCoachPanel: React.FC<DebuggingCoachPanelProps> = ({
  diagnosis,
  isStale,
  onApplyFix,
  onUndoFix,
  canUndo,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1)
  const [fixApplied, setFixApplied] = useState(false)

  if (!diagnosis) {
    return (
      <div className={styles.coachPanel}>
        <div className={styles.emptyState}>
          <LifeBuoy size={32} strokeWidth={1.5} />
          <div className={styles.emptyStateTitle}>Debugging Coach Ready</div>
          <div className={styles.emptyStateSubtitle}>
            When a runtime exception, test failure, or logic error occurs, the coach analyzes source code and execution traces to provide progressive hints and verified diagnoses.
          </div>
        </div>
      </div>
    )
  }

  const currentHint = diagnosis.hints[selectedLevel - 1]

  const handleApply = () => {
    if (currentHint?.suggestedFix) {
      onApplyFix(
        currentHint.suggestedFix.originalText,
        currentHint.suggestedFix.replacementText
      )
      setFixApplied(true)
    }
  }

  const handleUndo = () => {
    onUndoFix()
    setFixApplied(false)
  }

  return (
    <div className={styles.coachPanel}>
      {/* Stale Warning */}
      {isStale && (
        <div className={styles.staleBanner} role="alert">
          <AlertTriangle size={14} className={styles.staleIcon} />
          <span>Code modified since diagnosis. Run code to re-analyze.</span>
        </div>
      )}

      <div className={styles.scrollArea}>
        {/* Summary Card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div className={styles.summaryTitle}>
              <LifeBuoy size={15} style={{ color: 'var(--color-bronze)' }} />
              <span>{diagnosis.title}</span>
            </div>
            {diagnosis.line > 0 && (
              <span className={styles.summaryLineBadge}>Line {diagnosis.line}</span>
            )}
          </div>
          <div className={styles.summaryText}>{diagnosis.summary}</div>
        </div>

        {/* Level Selector Tabs */}
        <div className={styles.levelTabs} role="tablist" aria-label="Progressive Hint Levels">
          <button
            role="tab"
            aria-selected={selectedLevel === 1}
            className={[
              styles.levelTabBtn,
              selectedLevel === 1 ? styles['levelTabBtn--active'] : '',
            ].join(' ')}
            onClick={() => setSelectedLevel(1)}
          >
            Level 1: Hint
          </button>
          <button
            role="tab"
            aria-selected={selectedLevel === 2}
            className={[
              styles.levelTabBtn,
              selectedLevel === 2 ? styles['levelTabBtn--active'] : '',
            ].join(' ')}
            onClick={() => setSelectedLevel(2)}
          >
            Level 2: Diagnosis
          </button>
          <button
            role="tab"
            aria-selected={selectedLevel === 3}
            className={[
              styles.levelTabBtn,
              selectedLevel === 3 ? styles['levelTabBtn--active'] : '',
            ].join(' ')}
            onClick={() => setSelectedLevel(3)}
          >
            Level 3: Suggested Fix
          </button>
        </div>

        {/* Hint Content Card */}
        <div className={styles.hintCard}>
          <div className={styles.hintLevelHeader}>
            <span className={styles.hintLevelTag}>
              {selectedLevel === 1 && <Lightbulb size={12} style={{ display: 'inline', marginRight: 4 }} />}
              {selectedLevel === 2 && <FileSearch size={12} style={{ display: 'inline', marginRight: 4 }} />}
              {selectedLevel === 3 && <Wrench size={12} style={{ display: 'inline', marginRight: 4 }} />}
              Progressive Hint · Level {selectedLevel}
            </span>
          </div>

          <div className={styles.hintCardTitle}>{currentHint.title}</div>
          <div className={styles.hintCardBody}>{currentHint.content}</div>

          {/* Evidence Box for Level 2 */}
          {selectedLevel >= 2 && currentHint.evidence && (
            <div className={styles.evidenceBox}>
              {currentHint.evidence.line && (
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Location:</span>
                  <span>Line {currentHint.evidence.line}</span>
                </div>
              )}
              {currentHint.evidence.observedValue && (
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Observed:</span>
                  <span className={styles.evidenceVal}>{currentHint.evidence.observedValue}</span>
                </div>
              )}
              {currentHint.evidence.expectedBehavior && (
                <div className={styles.evidenceRow}>
                  <span className={styles.evidenceLabel}>Expected:</span>
                  <span className={styles.evidenceExpected}>{currentHint.evidence.expectedBehavior}</span>
                </div>
              )}
            </div>
          )}

          {/* Code Diff & Actions for Level 3 */}
          {selectedLevel === 3 && currentHint.suggestedFix && (
            <div>
              <div className={styles.diffContainer}>
                <div className={`${styles.diffBlock} ${styles['diffBlock--original']}`}>
                  - {currentHint.suggestedFix.originalText}
                </div>
                <div className={`${styles.diffBlock} ${styles['diffBlock--replacement']}`}>
                  + {currentHint.suggestedFix.replacementText}
                </div>
              </div>

              <div className={styles.actionRow}>
                <button
                  className={styles.applyBtn}
                  onClick={handleApply}
                  title="Apply suggested fix to code editor"
                >
                  <Check size={14} />
                  {fixApplied ? 'Fix Applied' : 'Apply Suggested Fix'}
                </button>

                {canUndo && (
                  <button
                    className={styles.undoBtn}
                    onClick={handleUndo}
                    title="Undo fix and restore previous code"
                  >
                    <Undo2 size={13} />
                    Undo Fix
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
