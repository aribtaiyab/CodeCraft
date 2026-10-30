// ============================================================================
// CodeCraft — Upgraded Test Fix Component
// Real-world code validation assistant for beginner and intermediate Python developers
// ============================================================================

import React, { useState, useMemo } from 'react'
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowLeft,
  Info,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react'
import {
  buildTestRunnerScript,
  generateSuggestedTestCases,
  explainFailure,
  type TestCaseAssertion,
  type TestAssertionResult,
} from '../../../services/coach'
import styles from './TestYourFixPanel.module.css'

interface TestYourFixPanelProps {
  currentCode: string
  testResults: TestAssertionResult[] | null
  isRunningTests: boolean
  isStale: boolean
  onRunTests: (testScript: string) => void
  onReturnToEditor?: () => void
}

export const TestYourFixPanel: React.FC<TestYourFixPanelProps> = ({
  currentCode,
  testResults,
  isRunningTests,
  isStale,
  onRunTests,
  onReturnToEditor,
}) => {
  // Suggest test cases based on user's current Python code
  const suggestedTestCases = useMemo(() => {
    return generateSuggestedTestCases(currentCode)
  }, [currentCode])

  // Custom test cases added by the student
  const [customTests, setCustomTests] = useState<TestCaseAssertion[]>([])
  // Form modal/inline toggle
  const [isAddingCustom, setIsAddingCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customInput, setCustomInput] = useState('')
  const [customExpected, setCustomExpected] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Track results mapped by test ID so single runs merge with existing batch runs
  const [resultsMap, setResultsMap] = useState<Record<string, TestAssertionResult>>({})

  // Currently running individual test ID (if single run)
  const [runningTestId, setRunningTestId] = useState<string | null>(null)

  // Combine suggested + custom tests
  const allTestCases = useMemo(() => {
    return [...suggestedTestCases, ...customTests]
  }, [suggestedTestCases, customTests])

  // Track previous testResults prop to merge during render
  const [prevTestResults, setPrevTestResults] = useState<TestAssertionResult[] | null>(null)

  if (testResults !== prevTestResults) {
    setPrevTestResults(testResults)
    if (testResults) {
      const next = { ...resultsMap }
      for (const res of testResults) {
        next[res.id] = res
      }
      setResultsMap(next)
      setRunningTestId(null)
    }
  }

  // Run all tests
  const handleRunAll = () => {
    if (allTestCases.length === 0 || isRunningTests) return
    setRunningTestId(null)
    const script = buildTestRunnerScript(currentCode, allTestCases)
    onRunTests(script)
  }

  // Run a single test individually
  const handleRunSingle = (tc: TestCaseAssertion) => {
    if (isRunningTests) return
    setRunningTestId(tc.id)
    const script = buildTestRunnerScript(currentCode, [tc])
    onRunTests(script)
  }

  // Add custom test
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const name = customName.trim()
    const inputVal = customInput.trim()
    const expectedVal = customExpected.trim()

    if (!name) {
      setFormError('Please enter a test name (e.g., "Negative Decimals").')
      return
    }
    if (!inputVal) {
      setFormError('Please enter the input or function call (e.g., "[ -5, -10 ]").')
      return
    }
    if (!expectedVal) {
      setFormError('Please provide the expected output (e.g., "-7.5").')
      return
    }

    // Determine call expression:
    // If input already has parentheses e.g. "func(1, 2)", use it directly.
    // Otherwise, check if user code defines a function to wrap it.
    let callExpr = inputVal
    if (!inputVal.includes('(')) {
      const match = currentCode.match(/def\s+([a-zA-Z_]\w*)\s*\(/)
      if (match && match[1] !== 'main') {
        callExpr = `${match[1]}(${inputVal})`
      }
    }

    const newTest: TestCaseAssertion = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      callExpr,
      expected: expectedVal,
      inputDescription: inputVal,
      category: 'custom',
      isCustom: true,
    }

    setCustomTests((prev) => [...prev, newTest])
    setCustomName('')
    setCustomInput('')
    setCustomExpected('')
    setIsAddingCustom(false)
  }

  // Remove custom test
  const handleRemoveCustom = (id: string) => {
    setCustomTests((prev) => prev.filter((t) => t.id !== id))
    setResultsMap((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  // Calculate metrics
  const totalCount = allTestCases.length
  const executedList = allTestCases
    .map((tc) => resultsMap[tc.id])
    .filter((r): r is TestAssertionResult => Boolean(r && r.status !== 'idle'))

  const passedCount = executedList.filter((r) => r.status === 'passed').length
  const failedCount = executedList.filter(
    (r) => r.status === 'failed' || r.status === 'error'
  ).length

  const hasExecuted = executedList.length > 0
  const allExecutedAndPassed =
    totalCount > 0 &&
    executedList.length === totalCount &&
    passedCount === totalCount
  const hasFailures = executedList.length > 0 && failedCount > 0
  const successRate =
    executedList.length > 0 ? Math.round((passedCount / executedList.length) * 100) : 0

  return (
    <div className={styles.testPanel}>
      {/* 1. Header & Educational Guidance */}
      <div className={styles.panelHeader}>
        <div className={styles.headerTitleRow}>
          <div className={styles.titleWithBadge}>
            <span className={styles.panelTitle}>Test Fix</span>
            <span className={styles.codeCraftPill}>Python 3.12 Validator</span>
          </div>
          {onReturnToEditor && (
            <button
              className={styles.backToEditorBtn}
              onClick={onReturnToEditor}
              title="Return to Code Editor"
            >
              <ArrowLeft size={13} />
              <span>Back to Editor</span>
            </button>
          )}
        </div>

        <p className={styles.purposeText}>
          Test your corrected code against different inputs to verify that your fix
          works. See which cases pass, which fail, and why.
        </p>

        <div className={styles.instructionBanner}>
          <Info size={14} className={styles.bannerIcon} />
          <span>Run your code first, then select Test Fix to check it.</span>
        </div>
      </div>

      {/* 2. Stale Banner (Code modified since tests ran) */}
      {isStale && hasExecuted && (
        <div className={styles.staleBanner} role="alert">
          <div className={styles.staleLeft}>
            <AlertTriangle size={14} className={styles.staleIcon} />
            <span>Code modified in editor. Rerun tests to verify your latest changes.</span>
          </div>
          <button
            className={styles.rerunBtn}
            onClick={handleRunAll}
            disabled={isRunningTests}
          >
            <RotateCcw size={12} />
            <span>Rerun Tests</span>
          </button>
        </div>
      )}

      {/* Scrollable Container */}
      <div className={styles.scrollArea}>
        {/* 3. Metrics Summary Bar */}
        <div className={styles.metricsCard}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Total Tests</span>
              <span className={styles.metricValue}>{totalCount}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Passed</span>
              <span className={`${styles.metricValue} ${styles.metricValuePassed}`}>
                {passedCount}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Failed</span>
              <span className={`${styles.metricValue} ${styles.metricValueFailed}`}>
                {failedCount}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Success Rate</span>
              <span className={styles.metricValue}>
                {hasExecuted ? `${successRate}%` : '—'}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFillPassed}
              style={{
                width: hasExecuted ? `${(passedCount / totalCount) * 100}%` : '0%',
              }}
            />
            <div
              className={styles.progressBarFillFailed}
              style={{
                width: hasExecuted ? `${(failedCount / totalCount) * 100}%` : '0%',
              }}
            />
          </div>
        </div>

        {/* 4. Action Controls Bar */}
        <div className={styles.actionBar}>
          <button
            className={styles.runAllBtn}
            onClick={handleRunAll}
            disabled={isRunningTests || totalCount === 0}
            title="Execute all test cases in isolated Python environment"
          >
            <Play size={13} />
            <span>
              {isRunningTests && runningTestId === null
                ? 'Running All Tests...'
                : 'Run All Tests'}
            </span>
          </button>

          <button
            className={styles.addCustomBtn}
            onClick={() => setIsAddingCustom((prev) => !prev)}
            title="Add your own custom test case"
          >
            <Plus size={13} />
            <span>Add Custom Test</span>
          </button>
        </div>

        {/* 5. Custom Test Creation Form */}
        {isAddingCustom && (
          <form className={styles.customForm} onSubmit={handleAddCustom}>
            <div className={styles.customFormTitle}>
              <Sparkles size={14} className={styles.formIcon} />
              <span>Create Custom Test Case</span>
            </div>

            {formError && <div className={styles.formErrorAlert}>{formError}</div>}

            <div className={styles.formField}>
              <label htmlFor="test-name">Test Name</label>
              <input
                id="test-name"
                type="text"
                className={styles.formInput}
                placeholder='e.g., "Extremely large numbers"'
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>

            <div className={styles.formFieldRow}>
              <div className={styles.formField}>
                <label htmlFor="test-input">Input / Arguments</label>
                <input
                  id="test-input"
                  type="text"
                  className={styles.formInput}
                  placeholder='e.g., "[1000000, 2000000]" or "x, y"'
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="test-expected">Expected Output</label>
                <input
                  id="test-expected"
                  type="text"
                  className={styles.formInput}
                  placeholder='e.g., "1500000.0"'
                  value={customExpected}
                  onChange={(e) => setCustomExpected(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formButtonRow}>
              <button type="submit" className={styles.formSubmitBtn}>
                Save &amp; Add Test
              </button>
              <button
                type="button"
                className={styles.formCancelBtn}
                onClick={() => {
                  setIsAddingCustom(false)
                  setFormError(null)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* 6. Outcome Banners */}
        {allExecutedAndPassed && (
          <div className={styles.successBanner} role="status">
            <div className={styles.bannerHeaderRow}>
              <CheckCircle2 size={18} className={styles.successIcon} />
              <div className={styles.bannerTextCol}>
                <strong>All tests passed! Your corrected code works for the tested cases.</strong>
                <span>
                  Every tested edge case, negative value, and input executed and verified
                  accurately.
                </span>
              </div>
            </div>
            {onReturnToEditor && (
              <button className={styles.returnEditorActionBtn} onClick={onReturnToEditor}>
                <span>Return to Editor</span>
              </button>
            )}
          </div>
        )}

        {hasFailures && (
          <div className={styles.failureBanner} role="status">
            <div className={styles.bannerHeaderRow}>
              <XCircle size={18} className={styles.failureIcon} />
              <div className={styles.bannerTextCol}>
                <strong>
                  Some tests failed. Review the failed cases to understand what still needs
                  fixing.
                </strong>
                <span>
                  Inspect the expected vs actual output and simple explanation below.
                </span>
              </div>
            </div>
            {onReturnToEditor && (
              <button className={styles.returnEditorActionBtn} onClick={onReturnToEditor}>
                <span>Return to Editor</span>
              </button>
            )}
          </div>
        )}

        {/* 7. Empty State if no tests generated */}
        {allTestCases.length === 0 && (
          <div className={styles.emptyState}>
            <HelpCircle size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No Test Cases Yet</p>
            <p className={styles.emptySubtitle}>
              Write or run your Python code in Code Studio first. Test Fix will automatically
              suggest test cases based on your functions.
            </p>
          </div>
        )}

        {/* 8. Test Cases List */}
        <div className={styles.testList}>
          {allTestCases.map((tc, idx) => {
            const result = resultsMap[tc.id]
            const isSingleRunning = isRunningTests && runningTestId === tc.id
            const status = isSingleRunning
              ? 'running'
              : result?.status ?? 'idle'

            const explanation = explainFailure(tc, result)

            return (
              <div
                key={tc.id}
                className={`${styles.testCard} ${
                  status === 'passed'
                    ? styles.testCardPassed
                    : status === 'failed' || status === 'error'
                    ? styles.testCardFailed
                    : ''
                }`}
              >
                {/* Test Card Header */}
                <div className={styles.testCardHeader}>
                  <div className={styles.testHeaderLeft}>
                    <span className={styles.testIndex}>Test {idx + 1}</span>
                    <span className={styles.testName}>{tc.name}</span>
                    {tc.isCustom && (
                      <span className={styles.customBadge}>Custom</span>
                    )}
                  </div>

                  <div className={styles.testHeaderRight}>
                    {/* Status Badge */}
                    <span
                      className={`${styles.statusBadge} ${
                        styles[`statusBadge_${status}`]
                      }`}
                    >
                      {status === 'running' && 'Running...'}
                      {status === 'passed' && 'Passed ✓'}
                      {status === 'failed' && 'Failed ✕'}
                      {status === 'error' && 'Runtime Error ⚠'}
                      {status === 'idle' && 'Not Run'}
                    </span>

                    {/* Single Run Action */}
                    <button
                      className={styles.singleRunBtn}
                      onClick={() => handleRunSingle(tc)}
                      disabled={isRunningTests}
                      title="Run only this test case"
                    >
                      <Play size={11} />
                      <span>Run</span>
                    </button>

                    {/* Remove Custom Test */}
                    {tc.isCustom && (
                      <button
                        className={styles.removeCustomBtn}
                        onClick={() => handleRemoveCustom(tc.id)}
                        title="Remove custom test"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Test Details Matrix */}
                <div className={styles.testDetailsGrid}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Input:</span>
                    <code className={styles.detailInput}>
                      {tc.inputDescription || tc.callExpr}
                    </code>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Expected:</span>
                    <code className={styles.detailExpected}>{tc.expected}</code>
                  </div>

                  {result && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailKey}>Actual:</span>
                      <code
                        className={
                          result.status === 'passed'
                            ? styles.detailActualPassed
                            : styles.detailActualFailed
                        }
                      >
                        {result.actual !== null && result.actual !== undefined
                          ? result.actual
                          : 'None (Error occurred)'}
                      </code>
                    </div>
                  )}

                  {result?.durationMs !== undefined && (
                    <div className={styles.durationTag}>
                      <Clock size={10} />
                      <span>{result.durationMs}ms</span>
                    </div>
                  )}
                </div>

                {/* Explanation Callout (Plain-English failure analysis) */}
                {(status === 'failed' || status === 'error') && explanation && (
                  <div className={styles.explanationBox}>
                    <div className={styles.explanationLabel}>Why It Failed:</div>
                    <div className={styles.explanationText}>{explanation}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
