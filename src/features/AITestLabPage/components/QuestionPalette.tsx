// ============================================================================
// CodeCraft — Assessment Question Palette Component
// Phase 6: Accessible question navigation with status indicators
// ============================================================================

import React from 'react'
import { Bookmark, Check, Code, HelpCircle } from 'lucide-react'
import type { AssessmentQuestion, StudentAnswer } from '../../../services/assessment/types'
import styles from './QuestionPalette.module.css'

interface QuestionPaletteProps {
  questions: AssessmentQuestion[]
  answers: Record<string, StudentAnswer>
  currentIndex: number
  onSelectQuestion: (index: number) => void
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  answers,
  currentIndex,
  onSelectQuestion,
}) => {
  return (
    <div className={styles.palette} role="navigation" aria-label="Question palette">
      <div className={styles.header}>
        <span className={styles.title}>Questions ({questions.length})</span>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles['legendDot--answered']}`} />
            Answered
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles['legendDot--flagged']}`} />
            Flagged
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles['legendDot--unanswered']}`} />
            Pending
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {questions.map((q, idx) => {
          const ans = answers[q.id]
          const isCurrent = idx === currentIndex
          const isFlagged = Boolean(ans?.isFlagged)
          const isAnswered =
            q.type === 'mcq'
              ? Boolean(ans?.selectedOptionId && ans.selectedOptionId.trim() !== '')
              : Boolean(
                  ans?.codeAnswer &&
                    ans.codeAnswer.trim() !== '' &&
                    ans.codeAnswer.trim() !== q.starterCode.trim()
                )

          const itemClasses = [
            styles.item,
            isCurrent ? styles['item--current'] : '',
            isAnswered ? styles['item--answered'] : styles['item--unanswered'],
            isFlagged ? styles['item--flagged'] : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={q.id}
              className={itemClasses}
              onClick={() => onSelectQuestion(idx)}
              aria-label={`Go to question ${idx + 1} (${q.type.toUpperCase()}), ${
                isAnswered ? 'Answered' : 'Unanswered'
              }${isFlagged ? ', Flagged' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <span className={styles.itemNumber}>{idx + 1}</span>
              <div className={styles.itemIcons}>
                {q.type === 'coding' ? (
                  <Code size={10} className={styles.typeIcon} />
                ) : (
                  <HelpCircle size={10} className={styles.typeIcon} />
                )}
                {isFlagged && <Bookmark size={10} className={styles.flagIcon} fill="currentColor" />}
                {isAnswered && !isFlagged && <Check size={10} className={styles.checkIcon} />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
