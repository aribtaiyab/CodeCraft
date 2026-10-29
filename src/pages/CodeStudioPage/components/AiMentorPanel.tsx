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
  Key,
  Copy,
  Check,
  RefreshCw,
  Layers,
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

  // Quiz State
  const [mcqData, setMcqData] = useState<GenerateMcqsResponse | null>(null)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})

  // Copied state
  const [copiedKeySnippet, setCopiedKeySnippet] = useState(false)

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

  const handleCopyConfig = () => {
    navigator.clipboard.writeText('GROQ_API_KEY=your_fresh_groq_api_key_here')
    setCopiedKeySnippet(true)
    setTimeout(() => setCopiedKeySnippet(false), 2000)
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

        {/* Missing API Key or Backend Offline Notice */}
        {(!hasKey || isServerOffline) && (
          <div className={styles.configCard}>
            <div className={styles.configCard__header}>
              <Key size={16} />
              <span>
                {isServerOffline
                  ? 'CodeCraft Backend Server Not Running'
                  : 'Groq API Key Required for Phase 5'}
              </span>
            </div>
            <div className={styles.configCard__body}>
              {isServerOffline ? (
                <p>
                  Start the local CodeCraft backend by running{' '}
                  <code>npm run server</code>. Ordinary Python execution,
                  predict, trace, and tests continue to work independently.
                </p>
              ) : (
                <p>
                  To enable Groq-powered code explanations, contextual follow-up
                  Q&A, and code-specific MCQs, create a fresh Groq API key and
                  place it in your local <code>.env</code> file:
                </p>
              )}
            </div>
            {!isServerOffline && (
              <>
                <div className={styles.configSnippet}>
                  GROQ_API_KEY=your_fresh_groq_api_key_here
                </div>
                <div className={styles.actionBar}>
                  <button
                    className={styles.actionBtn}
                    onClick={handleCopyConfig}
                  >
                    {copiedKeySnippet ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKeySnippet ? 'Copied' : 'Copy Template'}
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles['actionBtn--outline']}`}
                    onClick={() => {
                      setIsLoadingHealth(true)
                      aiService.checkHealth().then((s) => {
                        setHealthStatus(s)
                        setIsLoadingHealth(false)
                      })
                    }}
                  >
                    <RefreshCw size={13} />
                    Check Connection
                  </button>
                </div>
              </>
            )}
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
              <div className={styles.staleBanner} style={{ color: '#E06C75' }}>
                <AlertTriangle size={14} />
                <span>{explainError}</span>
              </div>
            )}

            {/* Explanation Results */}
            {explanation && (
              <div className={styles.explainCard}>
                <div className={styles.explainCard__summary}>
                  {explanation.summary}
                </div>

                {explanation.keyConcepts &&
                  explanation.keyConcepts.length > 0 && (
                    <div className={styles.conceptTags}>
                      {explanation.keyConcepts.map((concept, idx) => (
                        <span key={idx} className={styles.conceptTag}>
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}

                <div className={styles.detailedText}>
                  {explanation.detailedExplanation}
                </div>

                {/* Line by Line Breakdown */}
                {explanation.lineExplanations &&
                  explanation.lineExplanations.length > 0 && (
                    <div className={styles.lineBreakdown}>
                      <div className={styles.lineBreakdown__title}>
                        Line-by-Line Breakdown
                      </div>
                      {explanation.lineExplanations.map((le, idx) => (
                        <div key={idx} className={styles.lineRow}>
                          <span className={styles.lineNo}>L{le.line}</span>
                          <span className={styles.lineCode}>{le.code}</span>
                          <span className={styles.lineExp}>
                            {le.explanation}
                          </span>
                        </div>
                      ))}
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
                <div className={styles.staleBanner} style={{ color: '#E06C75' }}>
                  <AlertTriangle size={14} />
                  <span>{askError}</span>
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
