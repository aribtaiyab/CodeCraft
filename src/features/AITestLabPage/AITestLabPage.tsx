import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FlaskConical,
  Award,
  Layers,
  Plus,
  Play,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  AlertCircle,
} from 'lucide-react'
import { Button, Badge, EmptyState } from '../../components'
import { TestConfigView } from './components/TestConfigView'
import { ActiveTestView } from './components/ActiveTestView'
import { TestResultsView } from './components/TestResultsView'
import {
  createAssessment,
  evaluateAttempt,
  saveAttempt,
  loadAttempt,
  clearAttempt,
  loadLastResult,
  type AssessmentConfig,
  type AssessmentDefinition,
  type StudentAttempt,
  type AssessmentResult,
  type StudentAnswer,
  type AssessmentTopic,
} from '../../services/assessment'
import {
  recordLearningEvent,
  recordAssessmentResult,
  getHistoricalResultById,
  classifyAssessmentQuestion,
} from '../../services/learning'
import { PyodideService } from '../../services/pyodide/pyodideService'
import type { TestCase, TestCaseStatus, Language } from '../../types'
import styles from './AITestLabPage.module.css'

// ---- Seed test cases for preserved custom assertion manager ----
const SEED_TESTS: TestCase[] = [
  {
    id: 'tc-1',
    name: 'Basic greeting',
    input: 'greet("world")',
    expectedOutput: 'Hello, world! Welcome to CodeCraft.',
    status: 'idle',
  },
  {
    id: 'tc-2',
    name: 'Empty string input',
    input: 'greet("")',
    expectedOutput: 'Hello, ! Welcome to CodeCraft.',
    status: 'idle',
  },
  {
    id: 'tc-3',
    name: 'Numeric name',
    input: 'greet("42")',
    expectedOutput: 'Hello, 42! Welcome to CodeCraft.',
    status: 'idle',
  },
]

const STATUS_META: Record<
  TestCaseStatus,
  {
    label: string
    icon: typeof Circle
    badge: 'default' | 'success' | 'error' | 'warning' | 'info'
  }
> = {
  idle: { label: 'Idle', icon: Circle, badge: 'default' },
  running: { label: 'Running', icon: Clock, badge: 'info' },
  passed: { label: 'Passed', icon: CheckCircle2, badge: 'success' },
  failed: { label: 'Failed', icon: XCircle, badge: 'error' },
  error: { label: 'Error', icon: AlertCircle, badge: 'warning' },
}

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python 3.12' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
]

type NewTestForm = {
  name: string
  input: string
  expectedOutput: string
}

const DEFAULT_FORM: NewTestForm = { name: '', input: '', expectedOutput: '' }

export function AITestLabPage() {
  // Navigation mode: 'assessment' (Phase 6 primary) vs 'custom_cases' (preserved legacy)
  const [labMode, setLabMode] = useState<'assessment' | 'custom_cases'>('assessment')

  // Phase 6 Assessment State
  // Phase 7: URL query parameter integration
  const [searchParams] = useSearchParams()
  const revisitId = searchParams.get('revisit')
  const revisitResult = revisitId ? getHistoricalResultById(revisitId) : null
  const initialTopicParam = searchParams.get('topic') as AssessmentTopic | undefined

  // Phase 6 Assessment State
  const [assessmentView, setAssessmentView] = useState<'config' | 'active' | 'results'>(() => {
    if (revisitResult) return 'results'
    return 'config'
  })
  const [activeAttempt, setActiveAttempt] = useState<StudentAttempt | null>(() => {
    const saved = loadAttempt()
    return saved && saved.status === 'in_progress' ? saved : null
  })
  const [lastResult, setLastResult] = useState<AssessmentResult | null>(() => {
    if (revisitResult) return revisitResult
    return loadLastResult()
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Isolated Pyodide service for assessment testing
  const [pyodideService] = useState<PyodideService>(() => new PyodideService())

  // Clean up Pyodide worker on page unmount
  useEffect(() => {
    return () => {
      try {
        pyodideService.dispose()
      } catch {
        // Ignore disposal error
      }
    }
  }, [pyodideService])

  // Preserved Custom Test Cases State
  const [customTests, setCustomTests] = useState<TestCase[]>(SEED_TESTS)
  const [customLanguage, setCustomLanguage] = useState<Language>('python')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<NewTestForm>(DEFAULT_FORM)
  const [formErrors, setFormErrors] = useState<Partial<NewTestForm>>({})

  // Start a new assessment
  const handleStartAssessment = async (config: AssessmentConfig) => {
    setIsGenerating(true)
    setGenerationError(null)

    try {
      const { assessment, usedFallback, fallbackReason } = await createAssessment(config)
      if (usedFallback && fallbackReason) {
        setGenerationError(fallbackReason)
      }

      const startedAt = Date.now()
      const deadlineAt = startedAt + config.timeLimitMinutes * 60 * 1000

      const newAttempt: StudentAttempt = {
        id: `att_${Date.now()}`,
        assessmentId: assessment.id,
        assessmentDefinition: assessment,
        startedAt,
        deadlineAt,
        timeLimitMinutes: config.timeLimitMinutes,
        status: 'in_progress',
        answers: {},
      }

      saveAttempt(newAttempt)
      setActiveAttempt(newAttempt)
      setAssessmentView('active')
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Failed to create assessment.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Answer update handler
  const handleUpdateAnswer = (questionId: string, answerPatch: Partial<StudentAnswer>) => {
    setActiveAttempt((prev) => {
      if (!prev) return null
      const existing = prev.answers[questionId] || {
        questionId,
        questionType: answerPatch.questionType || 'mcq',
        lastUpdated: Date.now(),
      }
      const updatedAnswers = {
        ...prev.answers,
        [questionId]: {
          ...existing,
          ...answerPatch,
          lastUpdated: Date.now(),
        },
      }
      const updatedAttempt: StudentAttempt = {
        ...prev,
        answers: updatedAnswers,
      }
      saveAttempt(updatedAttempt)
      return updatedAttempt
    })
  }

  // Submit assessment handler
  const handleSubmitAttempt = async (isTimeout = false) => {
    if (!activeAttempt) return

    const frozenAttempt: StudentAttempt = {
      ...activeAttempt,
      status: isTimeout ? 'expired' : 'submitted',
      completedAt: Date.now(),
    }

    try {
      const evaluatedResult = await evaluateAttempt(frozenAttempt, {
        pyodideService: pyodideService,
        isExpiredTimeout: isTimeout,
      })

      // Phase 7: Save to historical attempts and update last result
      recordAssessmentResult(evaluatedResult)
      clearAttempt()

      // Phase 7: Record verified learning events for each question
      for (const [qId, qEval] of Object.entries(evaluatedResult.questionEvaluations)) {
        const question = frozenAttempt.assessmentDefinition.questions.find((q) => q.id === qId)
        if (!question) continue
        const classification = classifyAssessmentQuestion(question)

        recordLearningEvent({
          id: `ev_testlab_${evaluatedResult.attemptId}_${qId}`,
          timestamp: Date.now(),
          source: 'ai_test_lab',
          activityType: 'assessment_question_evaluated',
          conceptId: classification.conceptId,
          topicId: classification.topicId,
          outcome: qEval.isCorrect ? 'passed' : qEval.isSystemError ? 'system_error' : 'failed',
          evidenceQuality: 'high',
          title: `Question: ${question.prompt.slice(0, 36)}...`,
          summary: qEval.isCorrect
            ? 'Answered question correctly.'
            : qEval.isUnanswered
            ? 'Question left unanswered.'
            : 'Question answered incorrectly.',
          metadata: {
            questionId: qId,
            attemptId: evaluatedResult.attemptId,
            earnedPoints: qEval.earnedPoints,
            maxPoints: qEval.maxPoints,
            isSystemError: qEval.isSystemError,
          },
          dedupKey: `testlab_q:${evaluatedResult.attemptId}:${qId}`,
          schemaVersion: 1,
        })
      }

      // Record overall assessment completion
      const firstQ = frozenAttempt.assessmentDefinition.questions[0]
      const primaryConcept = firstQ
        ? classifyAssessmentQuestion(firstQ).conceptId
        : 'var_assignment_types'

      recordLearningEvent({
        id: `ev_testlab_complete_${evaluatedResult.attemptId}`,
        timestamp: Date.now(),
        source: 'ai_test_lab',
        activityType: 'assessment_completed',
        conceptId: primaryConcept,
        topicId: evaluatedResult.topic,
        outcome: evaluatedResult.scorePercentage >= 70 ? 'passed' : 'failed',
        evidenceQuality: 'high',
        title: `${evaluatedResult.assessmentTitle} (${evaluatedResult.scorePercentage}%)`,
        summary: `Scored ${evaluatedResult.totalPointsEarned}/${evaluatedResult.totalPointsMax} points (${evaluatedResult.scorePercentage}%).`,
        metadata: {
          attemptId: evaluatedResult.attemptId,
          scorePercentage: evaluatedResult.scorePercentage,
        },
        dedupKey: `testlab_complete:${evaluatedResult.attemptId}`,
        schemaVersion: 1,
      })

      setActiveAttempt(null)
      setLastResult(evaluatedResult)
      setAssessmentView('results')
    } catch (err) {
      console.error('Error during assessment evaluation:', err)
      setGenerationError(`Evaluation failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Resume active saved attempt
  const handleResumeAttempt = () => {
    if (activeAttempt) {
      setAssessmentView('active')
    }
  }

  // Discard saved attempt
  const handleDiscardAttempt = () => {
    clearAttempt()
    setActiveAttempt(null)
  }

  // Retest or take new test
  const handleRetest = () => {
    setAssessmentView('config')
    setGenerationError(null)
  }

  // View previous result report
  const handleViewLastResult = () => {
    if (lastResult) {
      setAssessmentView('results')
    }
  }

  // Preserved custom tests handlers
  const handleToggleCustom = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleRunAllCustom = () => {
    setCustomTests((prev) =>
      prev.map((t) => ({
        ...t,
        status: 'idle' as TestCaseStatus,
        actualOutput: undefined,
      }))
    )
  }

  const handleDeleteCustom = (id: string) => {
    setCustomTests((prev) => prev.filter((t) => t.id !== id))
  }

  const validateCustomForm = (): boolean => {
    const errors: Partial<NewTestForm> = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.input.trim()) errors.input = 'Input is required'
    if (!form.expectedOutput.trim()) errors.expectedOutput = 'Expected output is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddCustomTest = () => {
    if (!validateCustomForm()) return
    const newTest: TestCase = {
      id: `tc-${Date.now()}`,
      name: form.name.trim(),
      input: form.input.trim(),
      expectedOutput: form.expectedOutput.trim(),
      status: 'idle',
    }
    setCustomTests((prev) => [...prev, newTest])
    setForm(DEFAULT_FORM)
    setFormErrors({})
    setShowAddForm(false)
  }

  // If in active test view, present dedicated distraction-free timed test interface
  if (labMode === 'assessment' && assessmentView === 'active' && activeAttempt) {
    return (
      <ActiveTestView
        attempt={activeAttempt}
        pyodideService={pyodideService}
        onUpdateAnswer={handleUpdateAnswer}
        onSubmitAttempt={handleSubmitAttempt}
      />
    )
  }

  // If in results view, present comprehensive results report
  if (
    labMode === 'assessment' &&
    assessmentView === 'results' &&
    lastResult &&
    (activeAttempt?.assessmentDefinition || lastResult)
  ) {
    // Reconstruct definition from attempt or synthesize from result
    const def: AssessmentDefinition =
      activeAttempt?.assessmentDefinition || {
        id: lastResult.assessmentId,
        version: '1.0.0',
        title: lastResult.assessmentTitle,
        description: '',
        topic: lastResult.topic,
        difficulty: lastResult.difficulty,
        timeLimitMinutes: 15,
        totalPoints: lastResult.totalPointsMax,
        questions: Object.values(lastResult.questionEvaluations).map((evalItem, qIdx) => ({
          id: evalItem.questionId,
          type: evalItem.questionType,
          topic: lastResult.topic,
          difficulty: lastResult.difficulty,
          points: evalItem.maxPoints,
          prompt: `Question ${qIdx + 1} (${evalItem.questionType.toUpperCase()})`,
          options: [],
          correctOptionId: evalItem.correctOptionId || '',
          starterCode: evalItem.submittedCode || '',
          testCases: [],
          explanation: evalItem.explanation,
        })),
        createdAt: lastResult.completedAt,
      }

    return (
      <TestResultsView
        result={lastResult}
        assessmentDefinition={def}
        onRetest={handleRetest}
      />
    )
  }

  return (
    <div className={styles.page}>
      {/* Top Mode Bar */}
      <div className={styles.modeBar}>
        <div className={styles.modeBar__inner}>
          <div className={styles.modeTabs} role="tablist" aria-label="AI Test Lab sections">
            <button
              role="tab"
              aria-selected={labMode === 'assessment'}
              className={`${styles.modeTab} ${
                labMode === 'assessment' ? styles['modeTab--active'] : ''
              }`}
              onClick={() => {
                setLabMode('assessment')
                setAssessmentView('config')
              }}
            >
              <Award size={15} />
              <span>Python Assessments</span>
              <Badge variant="bronze" size="sm">Phase 6 Active</Badge>
            </button>

            <button
              role="tab"
              aria-selected={labMode === 'custom_cases'}
              className={`${styles.modeTab} ${
                labMode === 'custom_cases' ? styles['modeTab--active'] : ''
              }`}
              onClick={() => setLabMode('custom_cases')}
            >
              <Layers size={15} />
              <span>Custom Test Assertions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Mode View */}
      {labMode === 'assessment' ? (
        <TestConfigView
          onStartTest={handleStartAssessment}
          activeSavedAttempt={activeAttempt}
          lastSavedResult={lastResult}
          onResumeAttempt={handleResumeAttempt}
          onDiscardAttempt={handleDiscardAttempt}
          onViewLastResult={handleViewLastResult}
          isGenerating={isGenerating}
          generationError={generationError}
          initialTopic={initialTopicParam}
        />
      ) : (
        /* Preserved Legacy Custom Test Cases Suite */
        <div className={styles.legacyContainer}>
          <div className={styles.header}>
            <div className={styles.header__inner}>
              <div className={styles.header__titleRow}>
                <div className={styles.header__icon}>
                  <FlaskConical size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <h1 className={styles.header__title}>Custom Test Cases Manager</h1>
                  <p className={styles.header__subtitle}>
                    Define custom test cases, configure input expressions, and inspect assertion criteria.
                  </p>
                </div>
              </div>

              <div className={styles.header__actions}>
                <div className={styles.header__langSelect}>
                  <label htmlFor="lab-language" className={styles.header__langLabel}>
                    Language
                  </label>
                  <select
                    id="lab-language"
                    className={styles.header__langControl}
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value as Language)}
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  id="run-all-tests-btn"
                  variant="primary"
                  size="sm"
                  iconLeft={<Play size={14} />}
                  onClick={handleRunAllCustom}
                  disabled={customTests.length === 0}
                >
                  Run All
                </Button>
              </div>
            </div>

            {/* Stats row */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.stat__val}>{customTests.length}</span>
                <span className={styles.stat__label}>Total</span>
              </div>
              <div className={styles.statDivider} aria-hidden="true" />
              <div className={styles.stat}>
                <span className={`${styles.stat__val} ${styles['stat__val--success']}`}>
                  {customTests.filter((t) => t.status === 'passed').length}
                </span>
                <span className={styles.stat__label}>Passed</span>
              </div>
              <div className={styles.statDivider} aria-hidden="true" />
              <div className={styles.stat}>
                <span className={`${styles.stat__val} ${styles['stat__val--error']}`}>
                  {customTests.filter((t) => t.status === 'failed').length}
                </span>
                <span className={styles.stat__label}>Failed</span>
              </div>
              <div className={styles.statDivider} aria-hidden="true" />
              <div className={styles.stat}>
                <span className={styles.stat__val}>
                  {customTests.filter((t) => t.status === 'idle').length}
                </span>
                <span className={styles.stat__label}>Pending</span>
              </div>
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.configTab}>
              <div className={styles.testList} aria-label="Test cases">
                {customTests.length === 0 ? (
                  <EmptyState
                    icon={<FlaskConical size={28} strokeWidth={1.5} />}
                    title="No test cases yet"
                    description="Add your first test case to define expected inputs and outputs."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        iconLeft={<Plus size={14} />}
                        onClick={() => setShowAddForm(true)}
                      >
                        Add Test Case
                      </Button>
                    }
                  />
                ) : (
                  customTests.map((test) => {
                    const meta = STATUS_META[test.status]
                    const Icon = meta.icon
                    const isExpanded = expandedId === test.id

                    return (
                      <div
                        key={test.id}
                        className={`${styles.testCard} ${styles[`testCard--${test.status}`]}`}
                      >
                        <button
                          className={styles.testCard__header}
                          onClick={() => handleToggleCustom(test.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`test-body-${test.id}`}
                        >
                          <div className={styles.testCard__left}>
                            <Icon
                              size={15}
                              strokeWidth={1.75}
                              className={styles[`testCard__statusIcon--${test.status}`]}
                            />
                            <span className={styles.testCard__name}>{test.name}</span>
                          </div>
                          <div className={styles.testCard__right}>
                            <Badge variant={meta.badge} size="sm">
                              {meta.label}
                            </Badge>
                            {isExpanded ? (
                              <ChevronDown size={15} className={styles.testCard__chevron} />
                            ) : (
                              <ChevronRight size={15} className={styles.testCard__chevron} />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div id={`test-body-${test.id}`} className={styles.testCard__body}>
                            <div className={styles.testField}>
                              <span className={styles.testField__label}>Input</span>
                              <pre className={styles.testField__code}>{test.input}</pre>
                            </div>
                            <div className={styles.testField}>
                              <span className={styles.testField__label}>Expected Output</span>
                              <pre className={styles.testField__code}>{test.expectedOutput}</pre>
                            </div>
                            <div className={styles.testCard__bodyActions}>
                              <Button
                                variant="danger"
                                size="xs"
                                iconLeft={<Trash2 size={12} />}
                                onClick={() => handleDeleteCustom(test.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {showAddForm ? (
                <div className={styles.addForm} role="form" aria-label="Add test case">
                  <h3 className={styles.addForm__title}>New Test Case</h3>

                  <div className={styles.formField}>
                    <label htmlFor="tc-name" className={styles.formField__label}>
                      Test name *
                    </label>
                    <input
                      id="tc-name"
                      type="text"
                      className={`${styles.formField__input} ${
                        formErrors.name ? styles['formField__input--error'] : ''
                      }`}
                      placeholder="e.g. Empty string input"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    {formErrors.name && (
                      <span className={styles.formField__error}>{formErrors.name}</span>
                    )}
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="tc-input" className={styles.formField__label}>
                      Input expression *
                    </label>
                    <textarea
                      id="tc-input"
                      rows={3}
                      className={`${styles.formField__textarea} ${
                        formErrors.input ? styles['formField__input--error'] : ''
                      }`}
                      placeholder={`e.g. greet("world")`}
                      value={form.input}
                      onChange={(e) => setForm((f) => ({ ...f, input: e.target.value }))}
                    />
                    {formErrors.input && (
                      <span className={styles.formField__error}>{formErrors.input}</span>
                    )}
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="tc-expected" className={styles.formField__label}>
                      Expected output *
                    </label>
                    <textarea
                      id="tc-expected"
                      rows={3}
                      className={`${styles.formField__textarea} ${
                        formErrors.expectedOutput ? styles['formField__input--error'] : ''
                      }`}
                      placeholder="Hello, world! Welcome to CodeCraft."
                      value={form.expectedOutput}
                      onChange={(e) => setForm((f) => ({ ...f, expectedOutput: e.target.value }))}
                    />
                    {formErrors.expectedOutput && (
                      <span className={styles.formField__error}>{formErrors.expectedOutput}</span>
                    )}
                  </div>

                  <div className={styles.addForm__actions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false)
                        setForm(DEFAULT_FORM)
                        setFormErrors({})
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      id="add-test-case-btn"
                      variant="primary"
                      size="sm"
                      iconLeft={<Plus size={14} />}
                      onClick={handleAddCustomTest}
                    >
                      Add Test Case
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.addBtnRow}>
                  <Button
                    id="show-add-test-form-btn"
                    variant="outline"
                    size="sm"
                    iconLeft={<Plus size={14} />}
                    onClick={() => setShowAddForm(true)}
                  >
                    Add Test Case
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
