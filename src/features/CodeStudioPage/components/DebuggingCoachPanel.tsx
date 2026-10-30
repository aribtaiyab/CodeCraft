// ============================================================================
// CodeCraft — Smart Debugging Coach Panel Component
// Line-Level Issue Cards, 3 Progressive Levels, Targeted Monaco Edits
// ============================================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LifeBuoy,
  AlertTriangle,
  Lightbulb,
  FileSearch,
  Wrench,
  Check,
  Undo2,
  Copy,
  Play,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import type { BugDiagnosis, DiagnosedIssue } from '../../../services/coach'
import { classifyBugCategory, CONCEPT_REGISTRY } from '../../../services/learning'
import styles from './DebuggingCoachPanel.module.css'

export interface LineFixTarget {
  originalText: string
  replacementText: string
  startLine: number
  endLine?: number
  startColumn?: number
  endColumn?: number
  issueId?: string
}

interface DebuggingCoachPanelProps {
  diagnosis: BugDiagnosis | null
  isStale: boolean
  onApplyLineFix: (fix: LineFixTarget) => void
  onUndoFix: () => void
  onRunAgain: () => void
  canUndo: boolean
}

export const DebuggingCoachPanel: React.FC<DebuggingCoachPanelProps> = ({
  diagnosis,
  isStale,
  onApplyLineFix,
  onUndoFix,
  onRunAgain,
  canUndo,
}) => {
  const navigate = useNavigate()

  // Track active level tab per issue: Record<issueId, 1 | 2 | 3>
  const [activeLevels, setActiveLevels] = useState<Record<string, 1 | 2 | 3>>({})
  // Track applied status per issue: Record<issueId, boolean>
  const [appliedIssues, setAppliedIssues] = useState<Record<string, boolean>>({})
  // Track copied state for replacement snippet: Record<issueId, boolean>
  const [copiedIssues, setCopiedIssues] = useState<Record<string, boolean>>({})
  // Track quiz selection per issue: Record<issueId, number>
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})

  if (!diagnosis) {
    return (
      <div className={styles.coachPanel}>
        <div className={styles.emptyState}>
          <LifeBuoy size={36} strokeWidth={1.5} className={styles.emptyStateIcon} />
          <div className={styles.emptyStateTitle}>Smart Debugging Coach Ready</div>
          <div className={styles.emptyStateSubtitle}>
            Run your Python program in Code Studio. When a syntax error, exception, or logic mismatch occurs, the Coach provides line-targeted explanations and progressive hints to guide your solution.
          </div>
        </div>
      </div>
    )
  }

  const issues: DiagnosedIssue[] =
    diagnosis.issues && diagnosis.issues.length > 0
      ? diagnosis.issues
      : [
          {
            id: diagnosis.id,
            line: diagnosis.line,
            title: diagnosis.title,
            category: diagnosis.category,
            summary: diagnosis.summary,
            levels: {
              level1: {
                title: diagnosis.hints[0]?.title || 'Helpful Hint',
                hint: diagnosis.hints[0]?.content || '',
                concept: 'Python Logic',
                line: diagnosis.line,
              },
              level2: {
                title: diagnosis.hints[1]?.title || 'Explain the Error',
                explanation: diagnosis.hints[1]?.content || '',
                problematicSnippet: diagnosis.hints[1]?.evidence?.observedValue || '',
                whyPythonErrors: 'An unexpected exception or invalid syntax was encountered during execution.',
                conceptTeaching: 'Review syntax and type compatibility for this statement.',
                correctExample: '',
                evidence: diagnosis.hints[1]?.evidence,
              },
              level3: {
                title: diagnosis.hints[2]?.title || 'Complete Solution',
                solution: diagnosis.hints[2]?.content || '',
                whyItWorks: 'Fixing the statement resolves the runtime error.',
                preventionTip: 'Double check variable values and boundary conditions.',
                suggestedFix: diagnosis.hints[2]?.suggestedFix
                  ? {
                      originalText: diagnosis.hints[2].suggestedFix.originalText,
                      replacementText: diagnosis.hints[2].suggestedFix.replacementText,
                      startLine: diagnosis.line,
                      endLine: diagnosis.line,
                      explanation: diagnosis.hints[2].suggestedFix.explanation,
                    }
                  : undefined,
              },
            },
          },
        ]

  const primaryClassification = classifyBugCategory(diagnosis.category)
  const primaryConceptDef = CONCEPT_REGISTRY[primaryClassification.conceptId]

  const getActiveLevel = (issueId: string): 1 | 2 | 3 => {
    return activeLevels[issueId] ?? 1
  }

  const handleSetLevel = (issueId: string, level: 1 | 2 | 3) => {
    setActiveLevels((prev) => ({ ...prev, [issueId]: level }))
  }

  const handleApply = (issue: DiagnosedIssue) => {
    const fix = issue.levels.level3.suggestedFix
    if (fix) {
      onApplyLineFix({
        originalText: fix.originalText,
        replacementText: fix.replacementText,
        startLine: fix.startLine,
        endLine: fix.endLine,
        startColumn: fix.startColumn,
        endColumn: fix.endColumn,
        issueId: issue.id,
      })
      setAppliedIssues((prev) => ({ ...prev, [issue.id]: true }))
    }
  }

  const handleUndo = (issueId: string) => {
    onUndoFix()
    setAppliedIssues((prev) => ({ ...prev, [issueId]: false }))
  }

  const handleCopy = async (issueId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIssues((prev) => ({ ...prev, [issueId]: true }))
      setTimeout(() => {
        setCopiedIssues((prev) => ({ ...prev, [issueId]: false }))
      }, 2000)
    } catch {
      // Ignore clipboard write failures
    }
  }

  const handleQuizSelect = (issueId: string, optionIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [issueId]: optionIndex }))
  }

  return (
    <div className={styles.coachPanel}>
      {/* Stale Warning Banner */}
      {isStale && (
        <div className={styles.staleBanner} role="alert">
          <AlertTriangle size={14} className={styles.staleIcon} />
          <span>Code modified since diagnosis. Press <strong>Ctrl+Enter</strong> or click <strong>Run</strong> to re-analyze.</span>
        </div>
      )}

      <div className={styles.scrollArea}>
        {/* Header Overview Card */}
        <div className={styles.overviewCard}>
          <div className={styles.overviewHeader}>
            <div className={styles.overviewTitle}>
              <LifeBuoy size={16} className={styles.coachIcon} />
              <span>Smart Debugging Coach</span>
            </div>
            <span className={styles.issueCountBadge}>
              {issues.length} {issues.length === 1 ? 'Issue Detected' : 'Issues Detected'}
            </span>
          </div>

          <div className={styles.overviewConceptRow}>
            <div className={styles.conceptTag}>
              Concept: {primaryConceptDef?.name || primaryClassification.conceptId}
            </div>
            <button
              className={styles.targetedRetestBtn}
              onClick={() =>
                navigate(
                  `/testlab?topic=${primaryClassification.topicId}&concept=${primaryClassification.conceptId}`
                )
              }
              title="Practice related questions in AI Test Lab"
            >
              <span>Retest in Test Lab</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Individual Line-Level Issue Cards */}
        {issues.map((issue, idx) => {
          const currentLevel = getActiveLevel(issue.id)
          const isApplied = appliedIssues[issue.id]
          const isCopied = copiedIssues[issue.id]
          const fix = issue.levels.level3.suggestedFix
          const quizAnswer = quizAnswers[issue.id]

          return (
            <div key={issue.id} className={styles.issueCard}>
              {/* Issue Top Header */}
              <div className={styles.issueCardHeader}>
                <div className={styles.issueCardHeaderLeft}>
                  {issues.length > 1 && (
                    <span className={styles.issueBadge}>Issue {idx + 1}</span>
                  )}
                  {issue.line > 0 && (
                    <span className={styles.lineBadge}>Line {issue.line}</span>
                  )}
                  <span className={styles.categoryBadge}>{issue.category}</span>
                </div>
                {isApplied && (
                  <span className={styles.appliedBadge}>
                    <Check size={11} /> Fix Applied
                  </span>
                )}
              </div>

              <div className={styles.issueTitle}>{issue.title}</div>
              <div className={styles.issueSummary}>{issue.summary}</div>

              {/* 3 Progressive Levels Selector */}
              <div className={styles.levelTabs} role="tablist" aria-label="Progressive Hint Levels">
                <button
                  role="tab"
                  aria-selected={currentLevel === 1}
                  className={[
                    styles.levelTabBtn,
                    currentLevel === 1 ? styles['levelTabBtn--active'] : '',
                  ].join(' ')}
                  onClick={() => handleSetLevel(issue.id, 1)}
                >
                  <Lightbulb size={12} />
                  <span>Level 1: Hint</span>
                </button>
                <button
                  role="tab"
                  aria-selected={currentLevel === 2}
                  className={[
                    styles.levelTabBtn,
                    currentLevel === 2 ? styles['levelTabBtn--active'] : '',
                  ].join(' ')}
                  onClick={() => handleSetLevel(issue.id, 2)}
                >
                  <FileSearch size={12} />
                  <span>Level 2: Explain</span>
                </button>
                <button
                  role="tab"
                  aria-selected={currentLevel === 3}
                  className={[
                    styles.levelTabBtn,
                    currentLevel === 3 ? styles['levelTabBtn--active'] : '',
                  ].join(' ')}
                  onClick={() => handleSetLevel(issue.id, 3)}
                >
                  <Wrench size={12} />
                  <span>Level 3: Solution</span>
                </button>
              </div>

              {/* Level 1: Helpful Hint */}
              {currentLevel === 1 && (
                <div className={styles.levelContent}>
                  <div className={styles.levelHeading}>
                    <Lightbulb size={14} className={styles.levelIcon} />
                    <span>Beginner Clue</span>
                  </div>
                  <div className={styles.hintBody}>{issue.levels.level1.hint}</div>
                  <div className={styles.hintMeta}>
                    <span>Relevant Concept: <strong>{issue.levels.level1.concept}</strong></span>
                    <span>Target: <strong>Line {issue.levels.level1.line}</strong></span>
                  </div>
                </div>
              )}

              {/* Level 2: Explain the Error */}
              {currentLevel === 2 && (
                <div className={styles.levelContent}>
                  <div className={styles.levelHeading}>
                    <FileSearch size={14} className={styles.levelIcon} />
                    <span>Why Python Produced this Error</span>
                  </div>
                  <div className={styles.explanationText}>
                    {issue.levels.level2.explanation}
                  </div>

                  {issue.levels.level2.problematicSnippet && (
                    <div className={styles.codeSnippetBlock}>
                      <span className={styles.codeSnippetLabel}>Problematic Code on Line {issue.line}:</span>
                      <code>{issue.levels.level2.problematicSnippet}</code>
                    </div>
                  )}

                  <div className={styles.conceptTeachingBox}>
                    <div className={styles.conceptTeachingTitle}>How this Concept Works:</div>
                    <div>{issue.levels.level2.conceptTeaching}</div>
                  </div>

                  {issue.levels.level2.correctExample && (
                    <div className={styles.correctExampleBox}>
                      <span className={styles.codeSnippetLabel}>Correct Pattern Example:</span>
                      <pre><code>{issue.levels.level2.correctExample}</code></pre>
                    </div>
                  )}
                </div>
              )}

              {/* Level 3: Complete Solution & Targeted Fix */}
              {currentLevel === 3 && (
                <div className={styles.levelContent}>
                  <div className={styles.levelHeading}>
                    <Wrench size={14} className={styles.levelIcon} />
                    <span>Exact Targeted Correction</span>
                  </div>

                  <div className={styles.solutionText}>
                    {issue.levels.level3.solution}
                  </div>

                  {/* Compact Line-Level Diff */}
                  {fix && (
                    <div className={styles.diffContainer}>
                      <div className={styles.diffHeader}>
                        <span>Target Line {fix.startLine}</span>
                        <span className={styles.diffScopeLabel}>Only this line will be modified</span>
                      </div>
                      <div className={`${styles.diffLine} ${styles['diffLine--original']}`}>
                        <span className={styles.diffPrefix}>-</span>
                        <code>{fix.originalText}</code>
                      </div>
                      <div className={`${styles.diffLine} ${styles['diffLine--replacement']}`}>
                        <span className={styles.diffPrefix}>+</span>
                        <code>{fix.replacementText}</code>
                      </div>
                    </div>
                  )}

                  {issue.levels.level3.whyItWorks && (
                    <div className={styles.whyItWorksBox}>
                      <strong>Why this fix works:</strong> {issue.levels.level3.whyItWorks}
                    </div>
                  )}

                  {issue.levels.level3.preventionTip && (
                    <div className={styles.preventionBox}>
                      <strong>How to avoid this next time:</strong> {issue.levels.level3.preventionTip}
                    </div>
                  )}

                  {/* Action Toolbar */}
                  <div className={styles.actionRow}>
                    {fix && (
                      <button
                        className={[
                          styles.applyBtn,
                          isApplied ? styles['applyBtn--applied'] : '',
                        ].join(' ')}
                        onClick={() => handleApply(issue)}
                        title="Apply targeted fix to Monaco editor"
                      >
                        <Check size={14} />
                        <span>{isApplied ? 'Fix Applied' : 'Apply Fix to Editor'}</span>
                      </button>
                    )}

                    {(isApplied || canUndo) && (
                      <button
                        className={styles.undoBtn}
                        onClick={() => handleUndo(issue.id)}
                        title="Undo fix and restore previous code"
                      >
                        <Undo2 size={13} />
                        <span>Undo Fix</span>
                      </button>
                    )}

                    {fix && (
                      <button
                        className={styles.copyBtn}
                        onClick={() => handleCopy(issue.id, fix.replacementText)}
                        title="Copy corrected code to clipboard"
                      >
                        {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        <span>{isCopied ? 'Copied!' : 'Copy Fix'}</span>
                      </button>
                    )}

                    <button
                      className={styles.runAgainBtn}
                      onClick={onRunAgain}
                      title="Run code with this fix applied"
                    >
                      <Play size={13} />
                      <span>Run Again</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Optional: Try It Yourself Mini-Quiz */}
              {issue.tryItYourself && (
                <div className={styles.quizBox}>
                  <div className={styles.quizHeader}>
                    <HelpCircle size={14} className={styles.quizIcon} />
                    <span>Try It Yourself (Optional)</span>
                  </div>
                  <div className={styles.quizQuestion}>
                    {issue.tryItYourself.question}
                  </div>
                  <div className={styles.quizOptions}>
                    {issue.tryItYourself.options.map((opt, optIdx) => {
                      const isSelected = quizAnswer === optIdx
                      const isCorrect = optIdx === issue.tryItYourself!.correctIndex
                      const showResult = quizAnswer !== undefined

                      let btnStyle = styles.quizOptionBtn
                      if (showResult && isSelected) {
                        btnStyle = isCorrect
                          ? `${styles.quizOptionBtn} ${styles['quizOptionBtn--correct']}`
                          : `${styles.quizOptionBtn} ${styles['quizOptionBtn--wrong']}`
                      }

                      return (
                        <button
                          key={optIdx}
                          className={btnStyle}
                          onClick={() => handleQuizSelect(issue.id, optIdx)}
                        >
                          <span className={styles.quizOptionLetter}>
                            {String.fromCharCode(65 + optIdx)})
                          </span>
                          <span className={styles.quizOptionText}>{opt}</span>
                          {showResult && isSelected && (
                            <span className={styles.quizFeedbackIcon}>
                              {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {quizAnswer !== undefined && (
                    <div className={styles.quizExplanation}>
                      <strong>
                        {quizAnswer === issue.tryItYourself.correctIndex
                          ? 'Correct! '
                          : 'Not quite. '}
                      </strong>
                      {issue.tryItYourself.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
