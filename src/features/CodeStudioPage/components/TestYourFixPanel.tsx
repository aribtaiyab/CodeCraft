// ============================================================================
// CodeCraft — Test Your Fix Panel Component
// ============================================================================

import React, { useState } from 'react'
import {
  CheckCircle2,
  Play,
  ArrowRight,
  AlertTriangle,
  Code2,
} from 'lucide-react'
import {
  DEBUGGING_EXERCISES,
  buildTestRunnerScript,
  type DebuggingExercise,
  type TestAssertionResult,
} from '../../../services/coach'
import styles from './TestYourFixPanel.module.css'

interface TestYourFixPanelProps {
  currentCode: string
  testResults: TestAssertionResult[] | null
  isRunningTests: boolean
  isStale: boolean
  onRunTests: (testScript: string) => void
  onLoadExerciseCode: (code: string) => void
}

export const TestYourFixPanel: React.FC<TestYourFixPanelProps> = ({
  currentCode: _currentCode,
  testResults,
  isRunningTests,
  isStale,
  onRunTests,
  onLoadExerciseCode,
}) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    DEBUGGING_EXERCISES[0].id
  )

  const selectedExercise =
    DEBUGGING_EXERCISES.find((e) => e.id === selectedExerciseId) ||
    DEBUGGING_EXERCISES[0]

  const relatedExercise = selectedExercise.relatedExerciseId
    ? DEBUGGING_EXERCISES.find((e) => e.id === selectedExercise.relatedExerciseId)
    : null

  const handleSelectExercise = (id: string) => {
    setSelectedExerciseId(id)
  }

  const handleLoadExercise = (ex: DebuggingExercise) => {
    onLoadExerciseCode(ex.buggyCode)
  }

  const handleRun = () => {
    const script = buildTestRunnerScript(
      _currentCode,
      selectedExercise.testCases
    )
    onRunTests(script)
  }

  const totalTests = selectedExercise.testCases.length
  const passedTests =
    testResults?.filter((r) => r.status === 'passed').length ?? 0
  const allPassed =
    testResults !== null &&
    testResults.length === totalTests &&
    passedTests === totalTests

  return (
    <div className={styles.testPanel}>
      {/* Stale Warning */}
      {isStale && testResults && (
        <div className={styles.staleBanner} role="alert">
          <AlertTriangle size={14} className={styles.staleIcon} />
          <span>Code modified since tests ran. Click Run Tests to re-verify.</span>
        </div>
      )}

      <div className={styles.scrollArea}>
        {/* Exercise Header Card */}
        <div className={styles.exerciseCard}>
          <div className={styles.selectorRow}>
            <select
              className={styles.exerciseSelect}
              value={selectedExercise.id}
              onChange={(e) => handleSelectExercise(e.target.value)}
              aria-label="Select debugging exercise"
            >
              {DEBUGGING_EXERCISES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.conceptLabel})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.conceptBadge}>{selectedExercise.conceptLabel}</span>
            <span style={{ fontSize: '11px', color: 'var(--color-ivory-faint)' }}>
              Difficulty: {selectedExercise.difficulty}
            </span>
          </div>

          <div className={styles.exerciseDesc}>{selectedExercise.description}</div>

          <button
            className={styles.loadCodeBtn}
            onClick={() => handleLoadExercise(selectedExercise)}
            title="Load initial buggy code into the editor"
          >
            <Code2 size={13} />
            Load Buggy Starter Code
          </button>
        </div>

        {/* Test Run Controls Bar */}
        <div className={styles.testActionBar}>
          <div className={styles.testCountLabel}>
            {testResults ? (
              <span>
                {passedTests} / {totalTests} Tests Passing
              </span>
            ) : (
              <span>{totalTests} Trusted Test Cases</span>
            )}
          </div>

          <button
            className={styles.runTestsBtn}
            onClick={handleRun}
            disabled={isRunningTests}
            title="Run tests in real Python runtime"
          >
            <Play size={13} />
            {isRunningTests ? 'Running Tests...' : 'Test Your Fix'}
          </button>
        </div>

        {/* Celebration & Related Exercise Offer */}
        {allPassed && (
          <div className={styles.celebrationCard}>
            <div className={styles.celebrationTitle}>
              <CheckCircle2 size={16} />
              <span>All Test Cases Passed! Bug Resolved.</span>
            </div>
            <div className={styles.celebrationText}>
              Every assertion verified successfully in the Pyodide runtime.
            </div>

            {relatedExercise && (
              <div className={styles.relatedBox}>
                <div className={styles.relatedInfo}>
                  <div className={styles.relatedTitle}>
                    Related Challenge: {relatedExercise.title}
                  </div>
                  <div className={styles.relatedTag}>
                    Shared concept: {relatedExercise.conceptLabel}
                  </div>
                </div>
                <button
                  className={styles.loadRelatedBtn}
                  onClick={() => {
                    setSelectedExerciseId(relatedExercise.id)
                    handleLoadExercise(relatedExercise)
                  }}
                  title="Try related debugging challenge"
                >
                  Load Challenge <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Test Cases List */}
        <div className={styles.testCasesList}>
          {selectedExercise.testCases.map((tc, idx) => {
            const result = testResults?.find((r) => r.id === tc.id)
            const status = result?.status ?? 'idle'

            return (
              <div key={tc.id} className={styles.testCaseCard}>
                <div className={styles.testCaseHeader}>
                  <span className={styles.testCaseName}>
                    Test {idx + 1}: {tc.name}
                  </span>
                  <span
                    className={[
                      styles.testBadge,
                      styles[`testBadge--${status}`],
                    ].join(' ')}
                  >
                    {status}
                  </span>
                </div>

                <div className={styles.testDetails}>
                  <div className={styles.testDetailRow}>
                    <span className={styles.testDetailLabel}>Call:</span>
                    <span className={styles.testDetailCode}>{tc.callExpr}</span>
                  </div>
                  <div className={styles.testDetailRow}>
                    <span className={styles.testDetailLabel}>Expected:</span>
                    <span className={styles.testDetailVal}>{tc.expected}</span>
                  </div>
                  {result && result.actual !== undefined && (
                    <div className={styles.testDetailRow}>
                      <span className={styles.testDetailLabel}>Actual:</span>
                      <span className={styles.testDetailVal}>{result.actual}</span>
                    </div>
                  )}
                  {result && result.error && (
                    <div className={styles.testDetailRow}>
                      <span className={styles.testDetailLabel}>Error:</span>
                      <span className={styles.testDetailError}>{result.error}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
