// ============================================================================
// CodeCraft — Assessment Test Configuration View
// Phase 6: Intuitive topic selection, question filters & test creation
// ============================================================================

import React, { useState } from 'react'
import {
  FlaskConical,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Code,
  Layers,
  Terminal,
  GitFork,
  Braces,
  Cpu,
  Info,
} from 'lucide-react'
import { Button, Badge } from '../../../components'
import type {
  AssessmentConfig,
  AssessmentTopic,
  AssessmentDifficulty,
  QuestionTypeSelection,
  StudentAttempt,
  AssessmentResult,
} from '../../../services/assessment/types'
import { TOPIC_METADATA } from '../../../services/assessment/types'
import styles from './TestConfigView.module.css'

interface TestConfigViewProps {
  onStartTest: (config: AssessmentConfig) => Promise<void>
  activeSavedAttempt: StudentAttempt | null
  lastSavedResult: AssessmentResult | null
  onResumeAttempt: () => void
  onDiscardAttempt: () => void
  onViewLastResult: () => void
  isGenerating: boolean
  generationError?: string | null
  initialTopic?: AssessmentTopic
}

const TOPIC_ICONS: Record<AssessmentTopic, React.FC<{ size: number }>> = {
  python_fundamentals: Terminal,
  control_flow: GitFork,
  functions_scope: Braces,
  data_structures: Layers,
  algorithms_logic: Cpu,
}

export const TestConfigView: React.FC<TestConfigViewProps> = ({
  onStartTest,
  activeSavedAttempt,
  lastSavedResult,
  onResumeAttempt,
  onDiscardAttempt,
  onViewLastResult,
  isGenerating,
  generationError,
  initialTopic,
}) => {
  const [topic, setTopic] = useState<AssessmentTopic>(initialTopic || 'python_fundamentals')
  const [difficulty, setDifficulty] = useState<AssessmentDifficulty>('beginner')
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeSelection>('mixed')
  const [questionCount, setQuestionCount] = useState<number>(5)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15)
  const [mode, setMode] = useState<'curated' | 'ai_generated'>('curated')

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    await onStartTest({
      topic,
      difficulty,
      questionTypes,
      questionCount,
      timeLimitMinutes,
      mode,
    })
  }

  const selectedMeta = TOPIC_METADATA[topic]

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.header__inner}>
          <div className={styles.header__titleRow}>
            <div className={styles.header__icon}>
              <FlaskConical size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className={styles.header__title}>AI Test Lab & Assessment</h1>
              <p className={styles.header__subtitle}>
                Test your Python knowledge with timed multiple-choice questions and real coding challenges.
                All tests feature deterministic execution grading and detailed learning breakdowns.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Saved Attempt Notification */}
        {activeSavedAttempt && (
          <div className={styles.resumeBanner} role="region" aria-label="Resume test">
            <div className={styles.resumeBanner__left}>
              <div className={styles.resumeIcon}>
                <RotateCcw size={18} />
              </div>
              <div>
                <span className={styles.resumeTitle}>Active Test in Progress</span>
                <p className={styles.resumeDesc}>
                  You have an in-progress assessment for{' '}
                  <strong>{activeSavedAttempt.assessmentDefinition.title}</strong> with saved answers.
                </p>
              </div>
            </div>
            <div className={styles.resumeBanner__actions}>
              <Button variant="ghost" size="sm" onClick={onDiscardAttempt}>
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                iconRight={<Play size={13} />}
                onClick={onResumeAttempt}
              >
                Resume Assessment
              </Button>
            </div>
          </div>
        )}

        {/* Previous Result Notification */}
        {lastSavedResult && !activeSavedAttempt && (
          <div className={styles.lastResultBanner}>
            <div className={styles.lastResultText}>
              <span>Previous Assessment Score:</span>
              <Badge
                variant={lastSavedResult.scorePercentage >= 70 ? 'success' : 'warning'}
                size="sm"
              >
                {lastSavedResult.scorePercentage}% ({lastSavedResult.totalPointsEarned}/
                {lastSavedResult.totalPointsMax} pts)
              </Badge>
              <span className={styles.lastResultTitle}>
                {lastSavedResult.assessmentTitle}
              </span>
            </div>
            <Button variant="outline" size="xs" onClick={onViewLastResult}>
              View Report
            </Button>
          </div>
        )}

        {/* Error notification */}
        {generationError && (
          <div className={styles.errorAlert} role="alert">
            <Info size={16} />
            <span>{generationError}</span>
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleStart} className={styles.configGrid}>
          {/* Left Column: Selections */}
          <div className={styles.selectionsCol}>
            {/* Step 1: Topic Selection */}
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeading}>1. Select Python Topic</h2>
              <div className={styles.topicGrid}>
                {(Object.keys(TOPIC_METADATA) as AssessmentTopic[]).map((tKey) => {
                  const meta = TOPIC_METADATA[tKey]
                  const Icon = TOPIC_ICONS[tKey]
                  const isSelected = topic === tKey

                  return (
                    <button
                      key={tKey}
                      type="button"
                      className={`${styles.topicCard} ${
                        isSelected ? styles['topicCard--selected'] : ''
                      }`}
                      onClick={() => setTopic(tKey)}
                      aria-pressed={isSelected}
                    >
                      <div className={styles.topicIcon}>
                        <Icon size={18} />
                      </div>
                      <div className={styles.topicText}>
                        <span className={styles.topicLabel}>{meta.label}</span>
                        <span className={styles.topicDesc}>{meta.description}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Difficulty & Format */}
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeading}>2. Difficulty & Question Format</h2>
              <div className={styles.subGrid}>
                {/* Difficulty */}
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Difficulty Level</label>
                  <div className={styles.pillGroup} role="group" aria-label="Difficulty level">
                    {(['beginner', 'intermediate', 'advanced'] as AssessmentDifficulty[]).map(
                      (diff) => (
                        <button
                          key={diff}
                          type="button"
                          className={`${styles.pillBtn} ${
                            difficulty === diff ? styles['pillBtn--active'] : ''
                          }`}
                          onClick={() => setDifficulty(diff)}
                        >
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Question Types */}
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Question Types</label>
                  <div className={styles.pillGroup} role="group" aria-label="Question types">
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${
                        questionTypes === 'mixed' ? styles['pillBtn--active'] : ''
                      }`}
                      onClick={() => setQuestionTypes('mixed')}
                    >
                      MCQ & Coding
                    </button>
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${
                        questionTypes === 'mcq_only' ? styles['pillBtn--active'] : ''
                      }`}
                      onClick={() => setQuestionTypes('mcq_only')}
                    >
                      <HelpCircle size={12} style={{ marginRight: 3 }} /> MCQs Only
                    </button>
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${
                        questionTypes === 'coding_only' ? styles['pillBtn--active'] : ''
                      }`}
                      onClick={() => setQuestionTypes('coding_only')}
                    >
                      <Code size={12} style={{ marginRight: 3 }} /> Coding Only
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Limits & Generator Mode */}
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionHeading}>3. Question Count & Duration</h2>
              <div className={styles.subGrid}>
                {/* Question Count */}
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Number of Questions</label>
                  <div className={styles.pillGroup}>
                    {[3, 5, 10].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        className={`${styles.pillBtn} ${
                          questionCount === cnt ? styles['pillBtn--active'] : ''
                        }`}
                        onClick={() => setQuestionCount(cnt)}
                      >
                        {cnt} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Limit */}
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Time Limit</label>
                  <div className={styles.pillGroup}>
                    {[5, 10, 15, 20, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        className={`${styles.pillBtn} ${
                          timeLimitMinutes === mins ? styles['pillBtn--active'] : ''
                        }`}
                        onClick={() => setTimeLimitMinutes(mins)}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className={styles.modeGroup}>
                <label className={styles.controlLabel}>Question Suite Source</label>
                <div className={styles.modeCards}>
                  <button
                    type="button"
                    className={`${styles.modeCard} ${
                      mode === 'curated' ? styles['modeCard--active'] : ''
                    }`}
                    onClick={() => setMode('curated')}
                  >
                    <div className={styles.modeCardHeader}>
                      <span className={styles.modeCardTitle}>Curated Verified Bank</span>
                      <Badge variant="bronze" size="sm">Recommended</Badge>
                    </div>
                    <p className={styles.modeCardDesc}>
                      Hand-crafted, reviewed Python questions with deterministic execution test cases. Guaranteed valid.
                    </p>
                  </button>

                  <button
                    type="button"
                    className={`${styles.modeCard} ${
                      mode === 'ai_generated' ? styles['modeCard--active'] : ''
                    }`}
                    onClick={() => setMode('ai_generated')}
                  >
                    <div className={styles.modeCardHeader}>
                      <span className={styles.modeCardTitle}>AI-Augmented Generator</span>
                      <Badge variant="default" size="sm">
                        <Sparkles size={10} style={{ marginRight: 2 }} /> Groq
                      </Badge>
                    </div>
                    <p className={styles.modeCardDesc}>
                      Dynamic question generation via server Groq model, validated and guarded by automatic curated fallback.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Test Summary & Launch */}
          <div className={styles.summaryCol}>
            <div className={styles.specCard}>
              <h3 className={styles.specTitle}>Assessment Overview</h3>

              <div className={styles.specList}>
                <div className={styles.specItem}>
                  <span className={styles.specKey}>Topic:</span>
                  <span className={styles.specVal}>{selectedMeta.label}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specKey}>Difficulty:</span>
                  <span className={styles.specVal}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specKey}>Format:</span>
                  <span className={styles.specVal}>
                    {questionTypes === 'mixed'
                      ? 'MCQ & Coding'
                      : questionTypes === 'mcq_only'
                      ? 'Multiple Choice Only'
                      : 'Coding Challenges Only'}
                  </span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specKey}>Questions:</span>
                  <span className={styles.specVal}>{questionCount} Questions</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specKey}>Duration:</span>
                  <span className={styles.specVal}>{timeLimitMinutes} Minutes</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specKey}>Grading:</span>
                  <span className={styles.specVal}>In-browser Pyodide Sandbox</span>
                </div>
              </div>

              <div className={styles.specNotice}>
                <Info size={14} className={styles.noticeIcon} />
                <span>
                  Once started, the timer begins immediately. Your answers auto-save locally and you can review all questions before submitting.
                </span>
              </div>

              <Button
                id="start-assessment-btn"
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                iconRight={<Play size={15} />}
                loading={isGenerating}
              >
                {isGenerating ? 'Preparing Test...' : 'Start Timed Assessment'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
