// ============================================================================
// CodeCraft — Assessment Submit Confirmation Modal
// Phase 6: Prevents accidental submissions and warns of unanswered questions
// ============================================================================

import React, { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react'
import { Button } from '../../../components'
import styles from './SubmitConfirmModal.module.css'

interface SubmitConfirmModalProps {
  isOpen: boolean
  totalQuestions: number
  answeredCount: number
  unansweredCount: number
  remainingTimeFormatted: string
  isSubmitting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  totalQuestions,
  answeredCount,
  unansweredCount,
  remainingTimeFormatted,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onCancel])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.backdrop} onClick={() => !isSubmitting && onCancel()} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <div className={styles.iconWrap}>
              {unansweredCount > 0 ? (
                <AlertTriangle size={20} className={styles.warnIcon} />
              ) : (
                <CheckCircle2 size={20} className={styles.checkIcon} />
              )}
            </div>
            <h2 id="modal-title" className={styles.title}>
              Submit Assessment?
            </h2>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Questions</span>
              <span className={styles.statValue}>{totalQuestions}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Answered</span>
              <span className={`${styles.statValue} ${styles['statValue--success']}`}>
                {answeredCount}
              </span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Unanswered</span>
              <span
                className={`${styles.statValue} ${
                  unansweredCount > 0 ? styles['statValue--warn'] : ''
                }`}
              >
                {unansweredCount}
              </span>
            </div>
          </div>

          {unansweredCount > 0 ? (
            <div className={styles.warningAlert} role="alert">
              <AlertTriangle size={15} />
              <span>
                You have <strong>{unansweredCount}</strong> unanswered question
                {unansweredCount === 1 ? '' : 's'}. Unanswered questions will receive 0 points upon submission.
              </span>
            </div>
          ) : (
            <div className={styles.readyAlert}>
              <CheckCircle2 size={15} />
              <span>All questions answered! Ready for scoring and automated evaluation.</span>
            </div>
          )}

          <div className={styles.timeInfo}>
            <Clock size={14} />
            <span>Time remaining: <strong>{remainingTimeFormatted}</strong></span>
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Keep Reviewing
          </Button>
          <Button
            id="confirm-submit-btn"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Evaluating Submission...' : 'Submit Assessment'}
          </Button>
        </div>
      </div>
    </div>
  )
}
