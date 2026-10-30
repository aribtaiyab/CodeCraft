// ============================================================================
// CodeCraft — Smart Debugging Coach Panel Component
// Beginner-Friendly Line-Level Error Diagnosis & 3 Simple Progressive Levels
// ============================================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LifeBuoy,
  AlertTriangle,
  Lightbulb,
  FileSearch,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import type { BugDiagnosis, DiagnosedIssue } from '../../../services/coach'
import { classifyBugCategory } from '../../../services/learning'
import styles from './DebuggingCoachPanel.module.css'

function getDisplayCategoryName(category: string): string {
  switch (category) {
    case 'name-error-typo':
      return 'Name Error'
    case 'syntax-error':
    case 'comparison-assignment':
      return 'Syntax Error'
    case 'indentation-error':
      return 'Indentation Error'
    case 'zero-division':
      return 'Zero Division Error'
    case 'type-mismatch':
      return 'Type Error'
    case 'value-error':
      return 'Value Error'
    case 'index-out-of-bounds':
      return 'Index Error'
    case 'key-error':
      return 'Key Error'
    case 'attribute-error':
      return 'Attribute Error'
    case 'import-error':
      return 'Import Error'
    case 'recursion-error':
      return 'Recursion Error'
    case 'timeout-infinite-loop':
      return 'Timeout Error'
    case 'early-return-loop':
      return 'Logic Error'
    case 'missing-return':
      return 'Missing Return'
    default:
      return 'Syntax Error'
  }
}

function getDisplayConceptName(category: string): string {
  switch (category) {
    case 'name-error-typo':
      return 'Variables & Functions'
    case 'syntax-error':
    case 'comparison-assignment':
      return 'Parentheses, Brackets & Colons'
    case 'indentation-error':
      return 'Indentation & Code Blocks'
    case 'zero-division':
      return 'Division Safety'
    case 'type-mismatch':
      return 'Data Types & Operations'
    case 'value-error':
      return 'Values & Type Conversion'
    case 'index-out-of-bounds':
      return 'List Indexing'
    case 'key-error':
      return 'Dictionary Keys'
    case 'attribute-error':
      return 'Object Attributes'
    case 'recursion-error':
      return 'Recursion Depth'
    case 'timeout-infinite-loop':
      return 'Loop Termination'
    case 'early-return-loop':
      return 'Loop Logic'
    case 'missing-return':
      return 'Return Values'
    default:
      return 'Syntax Rules'
  }
}

interface DebuggingCoachPanelProps {
  diagnosis: BugDiagnosis | null
  isStale: boolean
}

export const DebuggingCoachPanel: React.FC<DebuggingCoachPanelProps> = ({
  diagnosis,
  isStale,
}) => {
  const navigate = useNavigate()

  // Track active level tab per issue: Record<issueId, 1 | 2 | 3>
  const [activeLevels, setActiveLevels] = useState<Record<string, 1 | 2 | 3>>({})
  // Track quiz selection per issue: Record<issueId, number>
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})

  if (!diagnosis) {
    return (
      <div className={styles.coachPanel}>
        <div className={styles.emptyState}>
          <LifeBuoy size={36} strokeWidth={1.5} className={styles.emptyStateIcon} />
          <div className={styles.emptyStateTitle}>Smart Debugging Coach Ready</div>
          <div className={styles.emptyStateSubtitle}>
            Run your Python program in Code Studio. When a mistake occurs, the Coach shows the exact incorrect line, explains why it happened in simple English, and helps you fix it.
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
                title: 'Hint',
                hint: diagnosis.hints[0]?.content || '',
                concept: 'Python Logic',
                line: diagnosis.line,
              },
              level2: {
                title: 'Explanation',
                explanation: diagnosis.hints[1]?.content || '',
                problematicSnippet: diagnosis.hints[1]?.evidence?.observedValue || '',
                whyPythonErrors: 'An unexpected exception or invalid syntax was encountered during execution.',
                conceptTeaching: 'Review syntax and type compatibility for this statement.',
                correctExample: '',
                evidence: diagnosis.hints[1]?.evidence,
              },
              level3: {
                title: 'Correct Answer',
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
  const displayCategory = getDisplayCategoryName(diagnosis.category)
  const displayConcept = getDisplayConceptName(diagnosis.category)

  const getActiveLevel = (issueId: string): 1 | 2 | 3 => {
    return activeLevels[issueId] ?? 1
  }

  const handleSetLevel = (issueId: string, level: 1 | 2 | 3) => {
    setActiveLevels((prev) => ({ ...prev, [issueId]: level }))
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
          <span>Code modified. Click <strong>Run</strong> (or press <strong>Ctrl+Enter</strong>) to test your changes.</span>
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
              {issues.length} {issues.length === 1 ? 'Issue Found' : 'Issues Found'}
            </span>
          </div>

          <div className={styles.overviewConceptRow}>
            <div className={styles.conceptTag}>
              {displayCategory}: {displayConcept}
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
          const fix = issue.levels.level3.suggestedFix
          const quizAnswer = quizAnswers[issue.id]
          const issueCategoryName = getDisplayCategoryName(issue.category)

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
                  <span className={styles.categoryBadge}>{issueCategoryName}</span>
                </div>
              </div>

              <div className={styles.issueTitle}>{issue.title}</div>
              <div className={styles.issueSummary}>{issue.summary}</div>

              {/* 3 Simple Progressive Levels Selector */}
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
                  <span>Level 2: Explanation</span>
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
                  <CheckCircle size={12} />
                  <span>Level 3: Correct Answer</span>
                </button>
              </div>

              {/* Level 1: Hint */}
              {currentLevel === 1 && (
                <div className={styles.levelContent}>
                  <div className={styles.levelHeading}>
                    <Lightbulb size={14} className={styles.levelIcon} />
                    <span>Beginner Clue</span>
                  </div>
                  <div className={styles.hintBody}>{issue.levels.level1.hint}</div>
                  <div className={styles.hintMeta}>
                    <span>Target: <strong>Line {issue.levels.level1.line}</strong></span>
                    <span>Concept: <strong>{issue.levels.level1.concept}</strong></span>
                  </div>
                </div>
              )}

              {/* Level 2: Explanation */}
              {currentLevel === 2 && (
                <div className={styles.levelContent}>
                  <div className={styles.levelHeading}>
                    <FileSearch size={14} className={styles.levelIcon} />
                    <span>What Happened and Why</span>
                  </div>
                  <div className={styles.explanationText}>
                    {issue.levels.level2.explanation}
                  </div>

                  {issue.levels.level2.problematicSnippet && (
                    <div className={styles.codeSnippetBlock}>
                      <span className={styles.codeSnippetLabel}>Mistake on Line {issue.line}:</span>
                      <code>{issue.levels.level2.problematicSnippet}</code>
                    </div>
                  )}

                  {issue.levels.level2.correctExample && (
                    <div className={styles.correctExampleBox}>
                      <span className={styles.codeSnippetLabel}>Correct Python Example:</span>
                      <pre><code>{issue.levels.level2.correctExample}</code></pre>
                    </div>
                  )}
                </div>
              )}

              {/* Level 3: Correct Answer (Line-level only, no entire program) */}
              {currentLevel === 3 && (
                <div className={styles.levelContent}>
                  <div className={styles.levelHeading}>
                    <CheckCircle size={14} className={styles.levelIcon} />
                    <span>Correct Answer</span>
                  </div>

                  {/* Compact Line-Level Comparison */}
                  {fix && fix.originalText.trim() !== fix.replacementText.trim() ? (
                    <div className={styles.lineComparisonBox}>
                      <div className={styles.lineBoxIncorrect}>
                        <div className={styles.lineBoxLabel}>
                          <span className={styles.lineTagError}>Incorrect Line {issue.line}</span>
                        </div>
                        <pre className={styles.codeSnippet}><code>{fix.originalText.trim()}</code></pre>
                      </div>

                      <div className={styles.lineBoxCorrect}>
                        <div className={styles.lineBoxLabel}>
                          <span className={styles.lineTagCorrect}>Correct Line</span>
                        </div>
                        <pre className={styles.codeSnippet}><code>{fix.replacementText.trim()}</code></pre>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.lineBoxIncorrect}>
                      <div className={styles.lineBoxLabel}>
                        <span className={styles.lineTagError}>Problematic Line {issue.line}</span>
                      </div>
                      <pre className={styles.codeSnippet}><code>{issue.levels.level2.problematicSnippet || fix?.originalText.trim() || `Line ${issue.line}`}</code></pre>
                    </div>
                  )}

                  {/* Short Explanation */}
                  <div className={styles.solutionText}>
                    {issue.levels.level3.solution}
                  </div>

                  {/* Clear Student Action Prompt: Manually edit in Monaco and press Run */}
                  <div className={styles.studentActionPrompt}>
                    💡 <span>Update <strong>Line {issue.line}</strong> in the code editor on the left, then click <strong>Run</strong> (or press <strong>Ctrl+Enter</strong>).</span>
                  </div>
                </div>
              )}

              {/* Optional: Try It Yourself Quick Check */}
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
