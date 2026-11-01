// ============================================================================
// CodeCraft — AI Mentor Panel Component (Phase 5)
// Groq-Powered Explanations, Selected-Line Context, Q&A, and MCQs
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import {
  Sparkles,
  HelpCircle,
  BookOpen,
  Send,
  AlertTriangle,
  CheckCircle2,
  Layers,
  RotateCcw,
} from 'lucide-react'
import {
  aiService,
  computeCodeHash,
  verifyMcqsWithBrowserRuntime,
  type ExplainResponse,
  type AskResponse,
  type GenerateMcqsResponse,
  type LineRange,
  type ChatMessage,
  type AiHealthStatus,
} from '../../../services/ai/index.ts'
import styles from './AiMentorPanel.module.css'

interface AiMentorPanelProps {
  currentCode: string
  selectionRange?: LineRange | null
  lastStdout?: string
  lastError?: string
  isStale: boolean
}

let messageCounter = 0
function createTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}
function nextMessageId(prefix: 'user' | 'assistant'): string {
  return `msg_${prefix}_${++messageCounter}_${Date.now()}`
}

export const AiMentorPanel: React.FC<AiMentorPanelProps> = ({
  currentCode,
  selectionRange,
  lastStdout,
  lastError,
  isStale,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'explain' | 'quiz'>('explain')
  const [healthStatus, setHealthStatus] = useState<AiHealthStatus | null>(null)
  const [isLoadingHealth, setIsLoadingHealth] = useState(true)

  // Explain State
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null)
  const [isExplaining, setIsExplaining] = useState(false)
  const [explainError, setExplainError] = useState<string | null>(null)

  // Q&A State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [questionInput, setQuestionInput] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([])
  const [lastAskedQuestion, setLastAskedQuestion] = useState<string | null>(null)

  // Quiz State
  const [mcqData, setMcqData] = useState<GenerateMcqsResponse | null>(null)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})

  // Check health on mount
  useEffect(() => {
    let isMounted = true
    aiService.checkHealth().then((status) => {
      if (isMounted) {
        setHealthStatus(status)
        setIsLoadingHealth(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // --------------------------------------------------------------------------
  // Explain Handlers
  // --------------------------------------------------------------------------
  const handleExplain = async (targetSelection?: LineRange | null) => {
    setIsExplaining(true)
    setExplainError(null)
    try {
      const res = await aiService.explainCode(
        currentCode,
        targetSelection || undefined
      )
      setExplanation(res)
    } catch (err: unknown) {
      setExplainError((err as Error).message || 'Failed to explain code.')
    } finally {
      setIsExplaining(false)
    }
  }

  // --------------------------------------------------------------------------
  // Ask / Follow-up Q&A Handlers
  // --------------------------------------------------------------------------
  const handleAsk = async (textToAsk?: string) => {
    const q = (textToAsk || questionInput).trim()
    if (!q) return

    const userMsg: ChatMessage = {
      id: nextMessageId('user'),
      role: 'user',
      content: q,
      timestamp: createTimestamp(),
    }

    setLastAskedQuestion(q)
    setChatMessages((prev) => [...prev, userMsg])
    setQuestionInput('')
    setIsAsking(true)
    setAskError(null)

    try {
      const res: AskResponse = await aiService.askQuestion({
        code: currentCode,
        question: q,
        selection: selectionRange || undefined,
        runtimeContext: {
          lastStdout: lastStdout || undefined,
          lastError: lastError || undefined,
        },
        conversationHistory: chatMessages,
      })

      const botMsg: ChatMessage = {
        id: nextMessageId('assistant'),
        role: 'assistant',
        content: res.answer,
        timestamp: createTimestamp(),
        relevantLines: res.relevantLines,
      }

      setChatMessages((prev) => [...prev, botMsg])
      setFollowUpSuggestions(res.followUpSuggestions || [])
    } catch (err: unknown) {
      setAskError((err as Error).message || 'Failed to answer question.')
    } finally {
      setIsAsking(false)
    }
  }

  // --------------------------------------------------------------------------
  // MCQ Quiz Handlers
  // --------------------------------------------------------------------------
  const currentHash = computeCodeHash(currentCode)
  const isSourceStale = isStale || (mcqData ? mcqData.sourceHash !== currentHash : false)
  const isExplainStale = isStale || (explanation ? explanation.sourceHash !== currentHash : false)

  const activeQuestions = useMemo(() => {
    if (!mcqData) return []
    return verifyMcqsWithBrowserRuntime(
      mcqData.questions,
      currentCode,
      {
        lastStdout,
        lastError,
        isStale: isSourceStale,
        sourceHash: mcqData.sourceHash,
        currentSourceHash: currentHash,
      }
    )
  }, [mcqData, currentCode, lastStdout, lastError, isSourceStale, currentHash])

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true)
    setQuizError(null)
    setSelectedAnswers({})
    try {
      const res = await aiService.generateMcqs(currentCode, 3)
      setMcqData(res)
    } catch (err: unknown) {
      setQuizError((err as Error).message || 'Failed to generate quiz.')
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (selectedAnswers[questionId] !== undefined) return // already answered
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }))
  }

  const hasKey = healthStatus?.hasGroqKey ?? false
  const isServerOffline = healthStatus?.status === 'unreachable'

  return (
    <div className={styles.mentorPanel}>
      {/* Sub-nav header */}
      <div className={styles.subNavBar}>
        <div className={styles.subNavTabs}>
          <button
            className={`${styles.subNavBtn} ${
              activeSubTab === 'explain' ? styles['subNavBtn--active'] : ''
            }`}
            onClick={() => setActiveSubTab('explain')}
          >
            <Sparkles size={13} />
            Explain & Ask
          </button>
          <button
            className={`${styles.subNavBtn} ${
              activeSubTab === 'quiz' ? styles['subNavBtn--active'] : ''
            }`}
            onClick={() => setActiveSubTab('quiz')}
          >
            <BookOpen size={13} />
            Code Quiz (MCQs)
          </button>
        </div>

        <div className={styles.statusIndicator}>
          <span
            className={`${styles.statusDot} ${
              isServerOffline || !hasKey ? styles['statusDot--offline'] : ''
            }`}
          />
          <span>
            {isLoadingHealth
              ? 'Checking API...'
              : isServerOffline
              ? 'Backend Offline'
              : hasKey
              ? healthStatus?.model || 'Groq Active'
              : 'Key Not Set'}
          </span>
        </div>
      </div>

      <div className={styles.panelScrollContent}>
        {/* Stale Code Warning */}
        {isSourceStale && (explanation || mcqData) && (
          <div className={styles.staleBanner} role="alert">
            <AlertTriangle size={14} />
            <span>Code modified since last AI analysis. Re-run in Code Studio to update.</span>
          </div>
        )}

        {/* TAB 1: EXPLAIN & ASK */}
        {activeSubTab === 'explain' && (
          <>
            {/* Action Bar */}
            <div className={styles.actionBar}>
              <button
                className={styles.actionBtn}
                onClick={() => handleExplain(null)}
                disabled={isExplaining || !currentCode.trim()}
              >
                <Sparkles size={13} />
                {isExplaining ? 'Analyzing...' : 'Explain Code'}
              </button>

              {selectionRange &&
                selectionRange.startLine <= selectionRange.endLine && (
                  <button
                    className={`${styles.actionBtn} ${styles['actionBtn--outline']}`}
                    onClick={() => handleExplain(selectionRange)}
                    disabled={isExplaining}
                  >
                    <Layers size={13} />
                    Explain Lines {selectionRange.startLine}–
                    {selectionRange.endLine}
                  </button>
                )}
            </div>

            {explainError && (
              <div className={styles.staleBanner} style={{ color: '#E06C75', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={14} />
                  <span>{explainError}</span>
                </div>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => handleExplain(selectionRange)}
                  disabled={isExplaining}
                  style={{ marginLeft: '12px', padding: '4px 10px', fontSize: '11px', flexShrink: 0 }}
                >
                  <RotateCcw size={12} />
                  Retry
                </button>
              </div>
            )}

            {isExplainStale && explanation && (
              <div className={styles.staleBanner} role="alert">
                <AlertTriangle size={14} />
                <span>Code modified since explanation was generated. Request a new explanation to analyze current code.</span>
              </div>
            )}

            {/* Explanation Results */}
            {explanation && (
              <div className={styles.explainContainer}>
                {/* Header Badge */}
                <div className={styles.explainHeader}>
                  <div className={styles.explainHeaderLeft}>
                    <Sparkles size={14} className={styles.explainHeaderIcon} />
                    <span className={styles.explainHeaderTitle}>
                      {explanation.isSelectionOnly
                        ? `Selected Lines ${explanation.selectedRange?.startLine}–${explanation.selectedRange?.endLine}`
                        : 'Computer Science Teacher Explanation'}
                    </span>
                  </div>
                  <span className={styles.modelPill}>
                    {explanation.model ? explanation.model.split('/').pop() : 'AI Mentor'}
                  </span>
                </div>

                {/* Section A: What does this code do? */}
                <div className={styles.explainSection}>
                  <div className={styles.sectionHeading}>
                    <span className={styles.sectionIndexBadge}>A</span>
                    <span className={styles.sectionTitle}>What Does This Code Do?</span>
                  </div>
                  <div className={styles.summaryBox}>
                    {explanation.summary}
                  </div>
                </div>

                {/* Section B: Understand the Main Idea */}
                {explanation.mainIdeaSteps && explanation.mainIdeaSteps.length > 0 ? (
                  <div className={styles.explainSection}>
                    <div className={styles.sectionHeading}>
                      <span className={styles.sectionIndexBadge}>B</span>
                      <span className={styles.sectionTitle}>Understand the Main Idea</span>
                    </div>
                    <div className={styles.stepsList}>
                      {explanation.mainIdeaSteps.map((step, idx) => {
                        const stepMatch = step.match(/^\s*(\d+)[.)]\s*(.*)$/)
                        const stepNum = stepMatch ? stepMatch[1] : String(idx + 1)
                        const stepText = stepMatch ? stepMatch[2] : step

                        return (
                          <div key={idx} className={styles.stepItem}>
                            <span className={styles.stepNumberBadge}>{stepNum}</span>
                            <div className={styles.stepContent}>{stepText}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : explanation.detailedExplanation && !explanation.isSelectionOnly ? (
                  <div className={styles.explainSection}>
                    <div className={styles.sectionHeading}>
                      <span className={styles.sectionIndexBadge}>B</span>
                      <span className={styles.sectionTitle}>Understand the Main Idea</span>
                    </div>
                    <div className={styles.detailedText}>
                      {explanation.detailedExplanation}
                    </div>
                  </div>
                ) : null}

                {/* Section C: Important Concepts */}
                {explanation.conceptDetails && explanation.conceptDetails.length > 0 ? (
                  <div className={styles.explainSection}>
                    <div className={styles.sectionHeading}>
                      <span className={styles.sectionIndexBadge}>C</span>
                      <span className={styles.sectionTitle}>Important Concepts</span>
                    </div>
                    <div className={styles.conceptCardsGrid}>
                      {explanation.conceptDetails.map((concept, idx) => (
                        <div key={idx} className={styles.conceptCard}>
                          <div className={styles.conceptCardHeader}>
                            <span className={styles.conceptCardName}>{concept.name}</span>
                            {concept.example && (
                              <code className={styles.conceptExamplePill}>{concept.example}</code>
                            )}
                          </div>
                          <div className={styles.conceptMeaning}>
                            <strong>Meaning:</strong> {concept.meaning}
                          </div>
                          <div className={styles.conceptUsage}>
                            <strong>In this code:</strong> {concept.codeUsage}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : explanation.keyConcepts && explanation.keyConcepts.length > 0 ? (
                  <div className={styles.explainSection}>
                    <div className={styles.sectionHeading}>
                      <span className={styles.sectionIndexBadge}>C</span>
                      <span className={styles.sectionTitle}>Key Concepts</span>
                    </div>
                    <div className={styles.conceptTags}>
                      {explanation.keyConcepts.map((concept, idx) => (
                        <span key={idx} className={styles.conceptTag}>
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* If selection-only and detailedExplanation exists */}
                {explanation.isSelectionOnly && explanation.detailedExplanation && (
                  <div className={styles.explainSection}>
                    <div className={styles.sectionHeading}>
                      <span className={styles.sectionTitle}>Contextual Analysis</span>
                    </div>
                    <div className={styles.detailedText}>
                      {explanation.detailedExplanation}
                    </div>
                  </div>
                )}

                {/* Section D: Line-by-Line Breakdown */}
                {explanation.lineExplanations && explanation.lineExplanations.length > 0 && (
                  <div className={styles.explainSection}>
                    <div className={styles.sectionHeading}>
                      <span className={styles.sectionIndexBadge}>D</span>
                      <span className={styles.sectionTitle}>Line-by-Line Breakdown</span>
                    </div>
                    <div className={styles.lineBreakdownList}>
                      {explanation.lineExplanations
                        .filter((le) => le.code.trim().length > 0)
                        .map((le, idx) => (
                          <div key={idx} className={styles.lineBreakdownCard}>
                            <div className={styles.lineBreakdownHeader}>
                              <span className={styles.lineNoBadge}>Line {le.line}</span>
                              <code className={styles.lineCodeSnippet}>{le.code.trim()}</code>
                            </div>
                            <div className={styles.lineExplanationText}>
                              {le.explanation}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Section E: Final Output */}
                {explanation.expectedOutput && (
                  <div className={styles.explainSection}>
                    <div className={styles.sectionHeading}>
                      <span className={styles.sectionIndexBadge}>E</span>
                      <span className={styles.sectionTitle}>Final Output</span>
                    </div>
                    <div className={styles.outputBox}>
                      <div className={styles.outputConsole}>
                        <div className={styles.outputConsoleHeader}>
                          <span className={styles.consoleDot} />
                          <span className={styles.consoleDot} />
                          <span className={styles.consoleDot} />
                          <span className={styles.consoleTitle}>Program Output</span>
                        </div>
                        <pre className={styles.outputContent}>
                          <code>{explanation.expectedOutput.output || '(No output produced)'}</code>
                        </pre>
                      </div>
                      {explanation.expectedOutput.explanation && (
                        <div className={styles.outputWhyText}>
                          <strong>Why:</strong> {explanation.expectedOutput.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Q&A Conversation Thread */}
            <div className={styles.qaSection}>
              <div className={styles.lineBreakdown__title}>
                Contextual Follow-up Q&A
              </div>

              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.qaMessage} ${
                    msg.role === 'user'
                      ? styles['qaMessage--user']
                      : styles['qaMessage--assistant']
                  }`}
                >
                  <div>{msg.content}</div>
                  {msg.relevantLines && msg.relevantLines.length > 0 && (
                    <div className={styles.conceptTags} style={{ marginTop: 4 }}>
                      {msg.relevantLines.map((ln) => (
                        <span key={ln} className={styles.conceptTag}>
                          Line {ln}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {askError && (
                <div className={styles.staleBanner} style={{ color: '#E06C75', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={14} />
                    <span>{askError}</span>
                  </div>
                  {lastAskedQuestion && (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleAsk(lastAskedQuestion)}
                      disabled={isAsking}
                      style={{ marginLeft: '12px', padding: '4px 10px', fontSize: '11px', flexShrink: 0 }}
                    >
                      <RotateCcw size={12} />
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Follow-up Prompt Suggestions */}
              {followUpSuggestions.length > 0 && (
                <div className={styles.followUps}>
                  {followUpSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className={styles.followUpChip}
                      onClick={() => handleAsk(suggestion)}
                      disabled={isAsking}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form
                className={styles.qaInputForm}
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAsk()
                }}
              >
                <input
                  type="text"
                  className={styles.qaInput}
                  placeholder="Ask a question about this code or runtime output..."
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  disabled={isAsking}
                />
                <button
                  type="submit"
                  className={styles.actionBtn}
                  disabled={isAsking || !questionInput.trim()}
                >
                  <Send size={13} />
                  {isAsking ? 'Thinking...' : 'Ask'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* TAB 2: CODE QUIZ (MCQS) */}
        {activeSubTab === 'quiz' && (
          <>
            <div className={styles.actionBar}>
              <button
                className={styles.actionBtn}
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz || !currentCode.trim()}
              >
                <BookOpen size={13} />
                {isGeneratingQuiz
                  ? 'Generating Code Quiz...'
                  : 'Generate Code Quiz'}
              </button>
            </div>

            {quizError && (
              <div className={styles.staleBanner} style={{ color: '#E06C75' }}>
                <AlertTriangle size={14} />
                <span>{quizError}</span>
              </div>
            )}

            {isSourceStale && mcqData && (
              <div className={styles.staleBanner} role="alert">
                <AlertTriangle size={14} />
                <span>Code modified since quiz was generated. Re-generate quiz to evaluate current code.</span>
              </div>
            )}

            {!mcqData && !isGeneratingQuiz && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 10px',
                  color: 'var(--text-muted, #857E71)',
                  fontSize: 13,
                }}
              >
                <HelpCircle size={32} strokeWidth={1} style={{ marginBottom: 8 }} />
                <p>Generate code-specific multiple-choice questions to test your understanding.</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>
                  Questions are generated directly from your code and verified for correctness.
                </p>
              </div>
            )}

            {/* Questions List */}
            {mcqData &&
              activeQuestions.map((q, qIdx) => {
                const answeredIndex = selectedAnswers[q.id]
                const hasAnswered = answeredIndex !== undefined
                const isCorrect = hasAnswered && answeredIndex === q.correctIndex

                return (
                  <div key={q.id || qIdx} className={styles.mcqCard}>
                    <div className={styles.mcqHeader}>
                      <span className={styles.conceptTag}>{q.conceptTag}</span>
                      {isSourceStale ? (
                        <span className={styles.mcqBadgeStale}>
                          <AlertTriangle size={11} />
                          Stale Output
                        </span>
                      ) : q.verifiedByExecution ? (
                        <span className={styles.mcqBadgeVerified}>
                          <CheckCircle2 size={11} />
                          Verified by Output
                        </span>
                      ) : (
                        <span className={styles.mcqBadgeConceptual}>
                          Conceptual Reasoning
                        </span>
                      )}
                    </div>

                    <div className={styles.mcqQuestionText}>
                      {qIdx + 1}. {q.question}
                    </div>

                    <div className={styles.mcqOptionsList}>
                      {q.options.map((opt, optIdx) => {
                        let btnModifier = ''
                        if (hasAnswered) {
                          if (optIdx === q.correctIndex) {
                            btnModifier = styles['mcqOptionBtn--correct']
                          } else if (optIdx === answeredIndex) {
                            btnModifier = styles['mcqOptionBtn--incorrect']
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            className={`${styles.mcqOptionBtn} ${btnModifier}`}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            disabled={hasAnswered}
                          >
                            <span className={styles.mcqOptionIndex}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        )
                      })}
                    </div>

                    {hasAnswered && (
                      <div className={styles.mcqExplanationBox}>
                        <strong style={{ color: isCorrect ? '#79C587' : '#E06C75' }}>
                          {isCorrect ? 'Correct! ' : 'Incorrect. '}
                        </strong>
                        {q.explanation}
                        {q.verificationNote && (
                          <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>
                            Note: {q.verificationNote}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
          </>
        )}
      </div>
    </div>
  )
}
