// ============================================================================
// CodeCraft — Assessment Test Results View
// Phase 6: Score presentation, invariant-validated summaries & explanations
// ============================================================================

import React, { useState } from 'react'
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Code2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { Button, Badge } from '../../../components'
import type {
  AssessmentResult,
  AssessmentDefinition,
  AssessmentMcqQuestion,
} from '../../../services/assessment/types'
import { useNavigate } from 'react-router-dom'
import styles from './TestResultsView.module.css'

interface TestResultsViewProps {
  result: AssessmentResult
  assessmentDefinition: AssessmentDefinition
  onRetest: () => void
}

export const TestResultsView: React.FC<TestResultsViewProps> = ({
  result,
  assessmentDefinition,
  onRetest,
}) => {
  const navigate = useNavigate()
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>(() => {
    // Expand incorrect/unanswered questions by default for quick review
    const initial: Record<string, boolean> = {}
    assessmentDefinition.questions.forEach((q) => {
      const evalItem = result.questionEvaluations[q.id]
      if (evalItem && !evalItem.isCorrect) {
        initial[q.id] = true
      }
    })
    return initial
  })

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }))
  }

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s}s`
  }

  const isPassing = result.scorePercentage >= 70

  return (
    <div className={styles.container}>
      {/* Score Banner */}
      <section className={styles.scoreBanner}>
        <div className={styles.scoreBanner__inner}>
          <div className={styles.scoreCard}>
            <div className={styles.scoreDial}>
              <span className={styles.scorePct}>{result.scorePercentage}%</span>
              <span className={styles.scoreVerdict}>
                {isPassing ? 'Proficient' : 'Needs Review'}
              </span>
            </div>

            <div className={styles.scoreDetails}>
              <div className={styles.scoreHeadingRow}>
                <Trophy size={20} className={styles.trophyIcon} />
                <h1 className={styles.title}>{result.assessmentTitle}</h1>
              </div>

              <div className={styles.badgesRow}>
                <Badge variant={isPassing ? 'success' : 'warning'} size="sm">
                  {result.totalPointsEarned} / {result.totalPointsMax} Points Earned
                </Badge>
                <Badge variant="default" size="sm">
                  <Clock size={11} style={{ marginRight: 3 }} />
                  {formatDuration(result.durationSeconds)}
                </Badge>
                {result.isExpiredTimeout && (
                  <Badge variant="error" size="sm">
                    Submitted on Timeout
                  </Badge>
                )}
              </div>

              <p className={styles.subtitle}>
                Completed on {new Date(result.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                Detailed performance breakdown by question and topic is shown below.
              </p>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<RotateCcw size={14} />}
              onClick={onRetest}
            >
              Take Another Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Code2 size={14} />}
              onClick={() => navigate('/studio')}
            >
              Practice in Code Studio
            </Button>
          </div>
        </div>
      </section>

      <div className={styles.body}>
        {/* Breakdown Summaries Grid */}
        <section className={styles.summaryGrid}>
          {/* MCQ Summary */}
          {result.mcqSummary.total > 0 && (
            <div className={styles.summaryCard}>
              <h2 className={styles.cardTitle}>Multiple Choice Performance</h2>
              <div className={styles.metricRow}>
                <div className={styles.metric}>
                  <span className={`${styles.metricVal} ${styles['metricVal--success']}`}>
                    {result.mcqSummary.correct}
                  </span>
                  <span className={styles.metricLabel}>Correct</span>
                </div>
                <div className={styles.metric}>
                  <span className={`${styles.metricVal} ${styles['metricVal--error']}`}>
                    {result.mcqSummary.incorrect}
                  </span>
                  <span className={styles.metricLabel}>Incorrect</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricVal}>{result.mcqSummary.unanswered}</span>
                  <span className={styles.metricLabel}>Unanswered</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricVal}>{result.mcqSummary.total}</span>
                  <span className={styles.metricLabel}>Total MCQs</span>
                </div>
              </div>
            </div>
          )}

          {/* Coding Summary */}
          {result.codingSummary.total > 0 && (
            <div className={styles.summaryCard}>
              <h2 className={styles.cardTitle}>Coding Challenge Performance</h2>
              <div className={styles.metricRow}>
                <div className={styles.metric}>
                  <span className={`${styles.metricVal} ${styles['metricVal--success']}`}>
                    {result.codingSummary.passed}
                  </span>
                  <span className={styles.metricLabel}>Passed</span>
                </div>
                <div className={styles.metric}>
                  <span className={`${styles.metricVal} ${styles['metricVal--warn']}`}>
                    {result.codingSummary.partial}
                  </span>
                  <span className={styles.metricLabel}>Partial</span>
                </div>
                <div className={styles.metric}>
                  <span className={`${styles.metricVal} ${styles['metricVal--error']}`}>
                    {result.codingSummary.failed}
                  </span>
                  <span className={styles.metricLabel}>Failed</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricVal}>{result.codingSummary.total}</span>
                  <span className={styles.metricLabel}>Total Challenges</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Topic Breakdown & Learning Recommendations */}
        <section className={styles.topicSection}>
          <div className={styles.topicCard}>
            <h2 className={styles.cardTitle}>Topic Mastery Breakdown</h2>
            <div className={styles.topicList}>
              {Object.values(result.topicBreakdown).map((t) => (
                <div key={t.topic} className={styles.topicItem}>
                  <div className={styles.topicHeader}>
                    <span className={styles.topicName}>{t.topicLabel}</span>
                    <Badge
                      variant={
                        t.status === 'strength'
                          ? 'success'
                          : t.status === 'satisfactory'
                          ? 'warning'
                          : 'error'
                      }
                      size="sm"
                    >
                      {t.earnedPoints}/{t.totalPoints} pts ({t.percentage}%)
                    </Badge>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={`${styles.progressBarFill} ${
                        styles[`progressBarFill--${t.status}`]
                      }`}
                      style={{ width: `${t.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.recsCard}>
            <div className={styles.recsHeader}>
              <BookOpen size={16} className={styles.recsIcon} />
              <h2 className={styles.cardTitle}>Learning Recommendations</h2>
            </div>
            <ul className={styles.recsList}>
              {result.recommendations.map((rec, rIdx) => (
                <li key={rIdx} className={styles.recItem}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Detailed Question Review */}
        <section className={styles.reviewSection}>
          <h2 className={styles.reviewTitle}>Question Review & Explanations</h2>

          <div className={styles.questionsList}>
            {assessmentDefinition.questions.map((q, idx) => {
              const evalItem = result.questionEvaluations[q.id]
              const isExpanded = Boolean(expandedQuestions[q.id])

              const isPassed = evalItem?.isCorrect
              const isUnanswered = evalItem?.isUnanswered
              const earnedPts = evalItem?.earnedPoints ?? 0

              return (
                <div
                  key={q.id}
                  className={`${styles.reviewCard} ${
                    isPassed
                      ? styles['reviewCard--correct']
                      : isUnanswered
                      ? styles['reviewCard--unanswered']
                      : styles['reviewCard--incorrect']
                  }`}
                >
                  <button
                    className={styles.reviewHeader}
                    onClick={() => toggleQuestion(q.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className={styles.reviewHeader__left}>
                      {isPassed ? (
                        <CheckCircle2 size={18} className={styles.iconCorrect} />
                      ) : isUnanswered ? (
                        <AlertTriangle size={18} className={styles.iconUnanswered} />
                      ) : (
                        <XCircle size={18} className={styles.iconIncorrect} />
                      )}
                      <div>
                        <span className={styles.qNum}>Question {idx + 1}:</span>
                        <span className={styles.qPromptShort}>{q.prompt}</span>
                      </div>
                    </div>

                    <div className={styles.reviewHeader__right}>
                      <Badge
                        variant={isPassed ? 'success' : isUnanswered ? 'default' : 'error'}
                        size="sm"
                      >
                        {earnedPts} / {q.points} pts
                      </Badge>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className={styles.reviewBody}>
                      {/* MCQ Detailed Review */}
                      {q.type === 'mcq' && (
                        <div className={styles.mcqReview}>
                          {(q as AssessmentMcqQuestion).codeSnippet && (
                            <pre className={styles.codeSnippet}>
                              <code>{(q as AssessmentMcqQuestion).codeSnippet}</code>
                            </pre>
                          )}

                          <div className={styles.optionsReviewList}>
                            {(q as AssessmentMcqQuestion).options.map((opt) => {
                              const isCorrectOpt =
                                opt.id === (q as AssessmentMcqQuestion).correctOptionId
                              const isSelectedOpt =
                                opt.id === evalItem?.selectedOptionId

                              let optClass = styles.reviewOption
                              if (isCorrectOpt) {
                                optClass += ` ${styles['reviewOption--correct']}`
                              } else if (isSelectedOpt && !isCorrectOpt) {
                                optClass += ` ${styles['reviewOption--wrong']}`
                              }

                              return (
                                <div key={opt.id} className={optClass}>
                                  <span className={styles.optReviewText}>{opt.text}</span>
                                  {isCorrectOpt && (
                                    <Badge variant="success" size="sm">
                                      Correct Answer
                                    </Badge>
                                  )}
                                  {isSelectedOpt && !isCorrectOpt && (
                                    <Badge variant="error" size="sm">
                                      Your Answer
                                    </Badge>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Coding Detailed Review */}
                      {q.type === 'coding' && (
                        <div className={styles.codingReview}>
                          <div className={styles.codeBox}>
                            <span className={styles.codeBoxTitle}>Your Code Submission:</span>
                            <pre className={styles.codeBoxContent}>
                              <code>{evalItem?.submittedCode || '# No code submitted'}</code>
                            </pre>
                          </div>

                          {evalItem?.testOutcomes && evalItem.testOutcomes.length > 0 && (
                            <div className={styles.testOutcomesBox}>
                              <span className={styles.codeBoxTitle}>Test Case Assertions:</span>
                              <div className={styles.testOutcomesList}>
                                {evalItem.testOutcomes.map((tc, tcIdx) => (
                                  <div
                                    key={tc.testCaseId || tcIdx}
                                    className={`${styles.outcomeItem} ${
                                      tc.passed
                                        ? styles['outcomeItem--pass']
                                        : styles['outcomeItem--fail']
                                    }`}
                                  >
                                    <div className={styles.outcomeHeader}>
                                      {tc.passed ? (
                                        <CheckCircle2 size={13} className={styles.iconCorrect} />
                                      ) : (
                                        <XCircle size={13} className={styles.iconIncorrect} />
                                      )}
                                      <span className={styles.tcName}>
                                        {tc.name} {tc.isHidden && '(Hidden Graded Case)'}
                                      </span>
                                    </div>
                                    <div className={styles.outcomeDetails}>
                                      {tc.isHidden ? (
                                        <span>Result: <code>{tc.passed ? 'Passed (Confidential evaluation)' : 'Failed (Confidential evaluation)'}</code></span>
                                      ) : (
                                        <>
                                          <span>Expected: <code>{tc.expected}</code></span>
                                          {tc.actual !== undefined && (
                                            <span>Got: <code>{tc.actual}</code></span>
                                          )}
                                        </>
                                      )}
                                      {tc.error && !tc.isHidden && (
                                        <span className={styles.tcError}>{tc.error}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Learning Explanation */}
                      <div className={styles.explanationBox}>
                        <span className={styles.explanationTitle}>Explanation & Reasoning:</span>
                        <p className={styles.explanationText}>{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
