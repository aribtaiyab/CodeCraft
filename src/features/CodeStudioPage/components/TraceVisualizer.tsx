// ============================================================================
// CodeCraft — Execution Trace Visualizer Component
// ============================================================================

import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  AlertCircle,
  Clock,
  Terminal,
  AlertTriangle,
} from 'lucide-react'
import type { TraceResult, TraceStep } from '../../../services/pyodide'
import styles from './TraceVisualizer.module.css'

interface TraceVisualizerProps {
  traceResult: TraceResult | null
  currentStepIndex: number
  currentStep: TraceStep | null
  isStale: boolean
  stepForward: () => void
  stepBackward: () => void
  goToStep: (index: number) => void
  resetTrace: () => void
}

function getValType(val: unknown): string {
  if (Array.isArray(val)) return `list (${val.length})`
  if (val === null) return 'None'
  if (typeof val === 'object') return 'dict'
  return typeof val
}

function formatVal(val: unknown): string {
  if (typeof val === 'string') return `"${val}"`
  if (typeof val === 'boolean') return val ? 'True' : 'False'
  if (val === null) return 'None'
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch {
      return String(val)
    }
  }
  return String(val)
}

export const TraceVisualizer: React.FC<TraceVisualizerProps> = ({
  traceResult,
  currentStepIndex,
  currentStep,
  isStale,
  stepForward,
  stepBackward,
  goToStep,
  resetTrace,
}) => {
  if (!traceResult || traceResult.steps.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Layers size={32} strokeWidth={1.5} />
        <div className={styles.emptyStateTitle}>No Execution Trace Recorded</div>
        <div className={styles.emptyStateSubtitle}>
          Run your Python code to step through each line, inspect variable mutations, and examine execution flow.
        </div>
      </div>
    )
  }

  const totalSteps = traceResult.steps.length
  const isFirst = currentStepIndex <= 0
  const isLast = currentStepIndex >= totalSteps - 1

  const localsEntries = currentStep ? Object.entries(currentStep.locals) : []

  return (
    <div className={styles.visualizer}>
      {/* Stale Code Warning */}
      {isStale && (
        <div className={styles.staleBanner} role="alert">
          <AlertTriangle size={14} className={styles.staleIcon} />
          <span>Code modified since this trace was recorded. Run code again to update.</span>
        </div>
      )}

      {/* Truncation Notice */}
      {traceResult.isTruncated && (
        <div className={styles.staleBanner}>
          <Clock size={14} className={styles.staleIcon} />
          <span>Execution reached the 500 step visualizer limit. Trace was capped.</span>
        </div>
      )}

      {/* Stepper Navigation Bar */}
      <div className={styles.stepperBar}>
        <div className={styles.stepperControls}>
          <button
            className={styles.stepBtn}
            onClick={resetTrace}
            disabled={isFirst}
            title="Jump to Start (Step 1)"
            aria-label="First step"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            className={styles.stepBtn}
            onClick={stepBackward}
            disabled={isFirst}
            title="Step Backward"
            aria-label="Previous step"
          >
            <ChevronLeft size={14} />
          </button>
          <span className={styles.stepCounter}>
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          <button
            className={styles.stepBtn}
            onClick={stepForward}
            disabled={isLast}
            title="Step Forward"
            aria-label="Next step"
          >
            <ChevronRight size={14} />
          </button>
          <button
            className={styles.stepBtn}
            onClick={() => goToStep(totalSteps - 1)}
            disabled={isLast}
            title="Jump to End"
            aria-label="Last step"
          >
            <ChevronsRight size={14} />
          </button>
        </div>

        {/* Current Event Badge */}
        {currentStep && (
          <div className={styles.eventBadge}>
            <span>{currentStep.func === '<module>' ? 'global' : currentStep.func}()</span>
            <span>:</span>
            <span>L{currentStep.line}</span>
            <span>({currentStep.event})</span>
          </div>
        )}
      </div>

      {/* Timeline Slider */}
      <div className={styles.timelineScrubber}>
        <input
          type="range"
          className={styles.timelineSlider}
          min={0}
          max={totalSteps - 1}
          value={currentStepIndex}
          onChange={(e) => goToStep(Number(e.target.value))}
          aria-label="Execution timeline scrubber"
        />
      </div>

      {/* Panels: Variables and Output */}
      <div className={styles.panelsContainer}>
        {/* Variable Inspector Card */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelHeaderTitle}>
              <Layers size={13} />
              <span>Variable Scope ({currentStep?.func || 'global'})</span>
            </div>
            <span>{localsEntries.length} {localsEntries.length === 1 ? 'variable' : 'variables'}</span>
          </div>

          {localsEntries.length === 0 ? (
            <div className={styles.emptyVars}>No local variables defined at this step.</div>
          ) : (
            <table className={styles.varsTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {localsEntries.map(([name, val]) => {
                  const isChanged = currentStep?.changedVars.includes(name)
                  return (
                    <tr key={name}>
                      <td>
                        <span className={isChanged ? styles['varName--changed'] : styles.varName}>
                          {name}
                        </span>
                        {isChanged && <span className={styles.changeTag}>updated</span>}
                      </td>
                      <td className={styles.varType}>{getValType(val)}</td>
                      <td className={styles.varValue}>{formatVal(val)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Output at this step Card */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.panelHeaderTitle}>
              <Terminal size={13} />
              <span>Stdout at Step {currentStepIndex + 1}</span>
            </div>
          </div>
          <div className={styles.stepOutputBox}>
            {currentStep && currentStep.outputSoFar.length > 0 ? (
              currentStep.outputSoFar
            ) : (
              <span className={styles.stepOutputEmpty}>No output emitted yet.</span>
            )}
          </div>
        </div>

        {/* Exception Box if this step raised an exception */}
        {currentStep?.exception && (
          <div className={styles.exceptionBox}>
            <AlertCircle size={15} />
            <span>Exception raised: {currentStep.exception}</span>
          </div>
        )}
      </div>
    </div>
  )
}
