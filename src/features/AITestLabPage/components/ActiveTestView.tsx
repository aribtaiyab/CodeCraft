// ============================================================================
// CodeCraft — Active Assessment Test View
// Phase 6: Timed assessment interface with MCQ & Coding interaction
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Clock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Code,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react'
import { Button, Badge } from '../../../components'
import { QuestionPalette } from './QuestionPalette'
import { SubmitConfirmModal } from './SubmitConfirmModal'
import type {
  StudentAttempt,
  StudentAnswer,
  AssessmentMcqQuestion,
  AssessmentCodingQuestion,
} from '../../../services/assessment/types'
import { buildAssessmentTestScript } from '../../../services/assessment/isolatedRunner'
import type { PyodideService } from '../../../services/pyodide/pyodideService'
import styles from './ActiveTestView.module.css'

interface ActiveTestViewProps {
  attempt: StudentAttempt
  pyodideService?: PyodideService
  onUpdateAnswer: (questionId: string, answer: Partial<StudentAnswer>) => void
  onSubmitAttempt: (isTimeout?: boolean) => Promise<void>
}

export const ActiveTestView: React.FC<ActiveTestViewProps> = ({
  attempt,
  pyodideService,
  onUpdateAnswer,
  onSubmitAttempt,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return Math.max(0, Math.round((attempt.deadlineAt - Date.now()) / 1000))
  })
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sandboxOutput, setSandboxOutput] = useState<string | null>(null)
  const [isRunningSandbox, setIsRunningSandbox] = useState(false)

  const hasTriggeredTimeout = useRef(false)
  const questions = attempt.assessmentDefinition.questions
  const currentQuestion = questions[currentIdx]
  const currentAnswer = attempt.answers[currentQuestion?.id] || {
    questionId: currentQuestion?.id,
    questionType: currentQuestion?.type,
    lastUpdated: 0,
  }

  // Absolute Deadline Timer Loop
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const diff = Math.max(0, Math.round((attempt.deadlineAt - now) / 1000))
      setRemainingSeconds(diff)

      if (diff <= 0 && !hasTriggeredTimeout.current) {
        hasTriggeredTimeout.current = true
        setIsSubmitting(true)
        onSubmitAttempt(true)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [attempt.deadlineAt, onSubmitAttempt])

  // Format remaining seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Answer counts for confirmation modal and header
  const answeredCount = questions.filter((q) => {
    const ans = attempt.answers[q.id]
    if (q.type === 'mcq') {
      return Boolean(ans?.selectedOptionId && ans.selectedOptionId.trim() !== '')
    }
    return Boolean(
      ans?.codeAnswer &&
        ans.codeAnswer.trim() !== '' &&
        ans.codeAnswer.trim() !== q.starterCode.trim()
    )
  }).length

  const unansweredCount = questions.length - answeredCount

  const handleSelectOption = useCallback((optId: string) => {
    if (currentQuestion.type !== 'mcq') return
    onUpdateAnswer(currentQuestion.id, {
      selectedOptionId: optId,
      questionType: 'mcq',
      lastUpdated: Date.now(),
    })
  }, [currentQuestion, onUpdateAnswer])

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentQuestion.type !== 'coding') return
    onUpdateAnswer(currentQuestion.id, {
      codeAnswer: e.target.value,
      questionType: 'coding',
      lastUpdated: Date.now(),
    })
  }, [currentQuestion, onUpdateAnswer])

  const handleToggleFlag = useCallback(() => {
    onUpdateAnswer(currentQuestion.id, {
      isFlagged: !currentAnswer.isFlagged,
      lastUpdated: Date.now(),
    })
  }, [currentQuestion, currentAnswer.isFlagged, onUpdateAnswer])

  const handleResetCode = useCallback(() => {
    if (currentQuestion.type === 'coding') {
      const coding = currentQuestion as AssessmentCodingQuestion
      onUpdateAnswer(currentQuestion.id, {
        codeAnswer: coding.starterCode,
        lastUpdated: Date.now(),
      })
      setSandboxOutput(null)
    }
  }, [currentQuestion, onUpdateAnswer])

  // Quick sandbox test run for current coding question
  const handleRunSandbox = useCallback(() => {
    if (currentQuestion.type !== 'coding' || !pyodideService) return
    const coding = currentQuestion as AssessmentCodingQuestion
    const code = currentAnswer.codeAnswer || coding.starterCode

    setIsRunningSandbox(true)
    setSandboxOutput('Evaluating test cases in browser sandbox...')

    // Filter to ONLY visible test cases so hidden evaluation cases remain confidential
    const visibleCases = (coding.testCases || []).filter((tc) => !tc.isHidden)
    const testCasesToRun = visibleCases.length > 0 ? visibleCases : coding.testCases.slice(0, 1)

    const script = buildAssessmentTestScript(code, testCasesToRun)
    let buffer = ''
    let finished = false

    const finishRun = () => {
      if (finished) return
      finished = true
      clearTimeout(safetyTimer)
      setIsRunningSandbox(false)
      const lines = buffer
        .split('\n')
        .filter((l) => !l.includes('__CODECRAFT_ASSESSMENT_RESULTS__:') && !l.includes('[Process completed'))
        .filter(Boolean)
      setSandboxOutput(lines.join('\n') || 'Evaluation script finished.')
    }

    const safetyTimer = setTimeout(() => {
      finishRun()
    }, 5000)

    pyodideService.setListeners({
      onConsoleEntry: (entry) => {
        if (entry.type === 'stdout' || entry.type === 'error') {
          buffer += entry.text + '\n'
        }
      },
      onStateChange: (state) => {
        if (state === 'success' || state === 'error' || state === 'stopped') {
          finishRun()
        }
      },
    })

    try {
      pyodideService.runCode(script, { trace: false, timeoutMs: 4000 })
    } catch (err) {
      clearTimeout(safetyTimer)
      setIsRunningSandbox(false)
      setSandboxOutput(`Sandbox error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [currentQuestion, currentAnswer.codeAnswer, pyodideService])

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    setShowSubmitModal(false)
    await onSubmitAttempt(false)
  }

  const isTimeCritical = remainingSeconds <= 120

  return (
    <div className={styles.container}>
      {/* Top Test Header */}
      <header className={styles.testHeader}>
        <div className={styles.testHeader__left}>
          <h1 className={styles.testTitle}>{attempt.assessmentDefinition.title}</h1>
          <div className={styles.testMeta}>
            <Badge variant="default" size="sm">
              Question {currentIdx + 1} of {questions.length}
            </Badge>
            <Badge variant="bronze" size="sm">
              {answeredCount}/{questions.length} Answered
            </Badge>
          </div>
        </div>

        <div className={styles.testHeader__right}>
          <div
            className={`${styles.timerBadge} ${
              isTimeCritical ? styles['timerBadge--critical'] : ''
            }`}
            aria-live="polite"
            aria-label={`Time remaining: ${formatTime(remainingSeconds)}`}
          >
            <Clock size={15} />
            <span className={styles.timerDigits}>{formatTime(remainingSeconds)}</span>
          </div>

          <Button
            id="finish-assessment-btn"
            variant="primary"
            size="sm"
            iconRight={<Send size={14} />}
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
          >
            Submit Test
          </Button>
        </div>
      </header>

      {/* Main Workspace Split */}
      <div className={styles.workspace}>
        {/* Left: Active Question Area */}
        <main className={styles.questionArea} tabIndex={-1}>
          <div className={styles.questionCard}>
            {/* Question Toolbar */}
            <div className={styles.questionToolbar}>
              <div className={styles.questionToolbar__left}>
                {currentQuestion.type === 'mcq' ? (
                  <Badge variant="info" size="sm">
                    <HelpCircle size={11} style={{ marginRight: 3 }} /> Multiple Choice
                  </Badge>
                ) : (
                  <Badge variant="bronze" size="sm">
                    <Code size={11} style={{ marginRight: 3 }} /> Coding Challenge
                  </Badge>
                )}
                <span className={styles.questionPoints}>{currentQuestion.points} Points</span>
              </div>

              <div className={styles.questionToolbar__right}>
                <button
                  className={`${styles.flagBtn} ${
                    currentAnswer.isFlagged ? styles['flagBtn--active'] : ''
                  }`}
                  onClick={handleToggleFlag}
                  aria-pressed={Boolean(currentAnswer.isFlagged)}
                  title={currentAnswer.isFlagged ? 'Unflag question' : 'Flag for review'}
                >
                  <Bookmark
                    size={14}
                    fill={currentAnswer.isFlagged ? 'currentColor' : 'none'}
                  />
                  <span>{currentAnswer.isFlagged ? 'Flagged' : 'Flag'}</span>
                </button>
              </div>
            </div>

            {/* Question Prompt */}
            <div className={styles.promptWrap}>
              <h2 className={styles.promptText}>{currentQuestion.prompt}</h2>
            </div>

            {/* MCQ Options Rendering */}
            {currentQuestion.type === 'mcq' && (
              <div className={styles.mcqSection}>
                {(currentQuestion as AssessmentMcqQuestion).codeSnippet && (
                  <pre className={styles.codeSnippet}>
                    <code>{(currentQuestion as AssessmentMcqQuestion).codeSnippet}</code>
                  </pre>
                )}

                <div
                  className={styles.optionsList}
                  role="radiogroup"
                  aria-label="Answer options"
                >
                  {(currentQuestion as AssessmentMcqQuestion).options.map((opt, oIdx) => {
                    const isSelected = currentAnswer.selectedOptionId === opt.id
                    const letter = String.fromCharCode(65 + oIdx) // A, B, C, D

                    return (
                      <button
                        key={opt.id}
                        className={`${styles.optionCard} ${
                          isSelected ? styles['optionCard--selected'] : ''
                        }`}
                        onClick={() => handleSelectOption(opt.id)}
                        role="radio"
                        aria-checked={isSelected}
                      >
                        <span className={styles.optionLetter}>{letter}</span>
                        <span className={styles.optionText}>{opt.text}</span>
                        <div className={styles.optionIndicator}>
                          {isSelected && <div className={styles.optionIndicatorInner} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Coding Challenge Editor Rendering */}
            {currentQuestion.type === 'coding' && (
              <div className={styles.codingSection}>
                <div className={styles.codingHeader}>
                  <span className={styles.codingLabel}>Python 3.12 Solution</span>
                  <div className={styles.codingActions}>
                    <button
                      className={styles.sandboxBtn}
                      onClick={handleResetCode}
                      title="Reset starter code"
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                    {pyodideService && (
                      <button
                        className={styles.sandboxBtn}
                        onClick={handleRunSandbox}
                        disabled={isRunningSandbox}
                        title="Run starter test cases in sandbox"
                      >
                        <Play size={12} /> {isRunningSandbox ? 'Running...' : 'Run Tests'}
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  className={styles.codeTextarea}
                  value={
                    currentAnswer.codeAnswer !== undefined
                      ? currentAnswer.codeAnswer
                      : (currentQuestion as AssessmentCodingQuestion).starterCode
                  }
                  onChange={handleCodeChange}
                  placeholder="# Write your Python function implementation here..."
                  spellCheck={false}
                  rows={14}
                  aria-label="Python code submission"
                />

                {/* Example test cases info */}
                <div className={styles.testCasesList}>
                  <span className={styles.testCasesTitle}>Example Test Assertions:</span>
                  {(currentQuestion as AssessmentCodingQuestion).testCases
                    .filter((tc) => !tc.isHidden)
                    .map((tc) => (
                      <div key={tc.id} className={styles.testCaseItem}>
                        <span className={styles.tcName}>{tc.name}:</span>
                        <code>{tc.callExpr}</code> → Expected: <code>{tc.expected}</code>
                      </div>
                    ))}
                </div>

                {sandboxOutput && (
                  <div className={styles.sandboxConsole}>
                    <span className={styles.consoleTitle}>Sandbox Output:</span>
                    <pre className={styles.consoleText}>{sandboxOutput}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Question Navigation Controls */}
            <div className={styles.navControls}>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<ChevronLeft size={14} />}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
              >
                Previous
              </Button>

              <div className={styles.navStatus}>
                Question {currentIdx + 1} of {questions.length}
              </div>

              {currentIdx < questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  iconRight={<ChevronRight size={14} />}
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  iconRight={<Send size={14} />}
                  onClick={() => setShowSubmitModal(true)}
                  disabled={isSubmitting}
                >
                  Review & Submit
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Right: Question Palette Sidebar */}
        <aside className={styles.sidebar}>
          <QuestionPalette
            questions={questions}
            answers={attempt.answers}
            currentIndex={currentIdx}
            onSelectQuestion={(idx) => setCurrentIdx(idx)}
          />

          <div className={styles.quickSummaryCard}>
            <span className={styles.summaryTitle}>Assessment Status</span>
            <div className={styles.summaryRow}>
              <span>Answered:</span>
              <strong>{answeredCount}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Remaining:</span>
              <strong>{unansweredCount}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Total Points:</span>
              <strong>{attempt.assessmentDefinition.totalPoints}</strong>
            </div>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={showSubmitModal}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        remainingTimeFormatted={formatTime(remainingSeconds)}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowSubmitModal(false)}
      />
    </div>
  )
}
