// ============================================================================
// CodeCraft — React Hook for Pyodide Execution Engine & Visualization
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { PyodideService } from './pyodideService'
import { comparePrediction } from './predictionUtils'
import type {
  ExecutionState,
  ConsoleEntry,
  TraceResult,
  TraceStep,
  PredictionResult,
} from './types'

export interface UsePyodideOptions {
  defaultTimeoutMs?: number
}

export function usePyodide(options: UsePyodideOptions = {}) {
  const [state, setState] = useState<ExecutionState>('loading')
  const [output, setOutput] = useState<ConsoleEntry[]>([])
  const [pyodideInfo, setPyodideInfo] = useState<{
    version: string
    pythonVersion: string
  } | null>(null)
  const [timeoutMs, setTimeoutMs] = useState<number>(
    options.defaultTimeoutMs || 15000
  )

  // Phase 3: Trace and Stepper State
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1)
  const [isStale, setIsStale] = useState<boolean>(false)

  // Phase 3: Prediction State
  const [prediction, setPrediction] = useState<string>('')
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)

  const serviceRef = useRef<PyodideService | null>(null)
  const stdoutBufferRef = useRef<string[]>([])
  const predictionRef = useRef<string>('')

  useEffect(() => {
    predictionRef.current = prediction
  }, [prediction])

  useEffect(() => {
    const service = new PyodideService({
      onStateChange: (newState) => {
        setState(newState)
      },
      onConsoleEntry: (entry) => {
        if (entry.type === 'stdout') {
          stdoutBufferRef.current.push(entry.text)
        }
        setOutput((prev) => [...prev, entry])
      },
      onReady: (info) => {
        setPyodideInfo(info)
        setOutput((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: 'system',
            text: `Python ${info.pythonVersion} (Pyodide ${info.version}) ready.`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          },
        ])
      },
      onTrace: (trace) => {
        if (trace && trace.steps.length > 0) {
          setTraceResult(trace)
          // Default to the final step or first step
          setCurrentStepIndex(0)
        } else {
          setTraceResult(null)
          setCurrentStepIndex(-1)
        }

        // Evaluate prediction if provided
        const fullStdout = stdoutBufferRef.current.join('\n')
        if (predictionRef.current.trim().length > 0) {
          const comp = comparePrediction(predictionRef.current, fullStdout)
          setPredictionResult(comp)
        }
      },
    })

    serviceRef.current = service

    return () => {
      service.dispose()
      serviceRef.current = null
    }
  }, [])

  const runCode = useCallback(
    (code: string, runOptions: { trace?: boolean } = {}) => {
      if (!serviceRef.current) return
      stdoutBufferRef.current = []
      setIsStale(false)
      serviceRef.current.runCode(code, {
        timeoutMs,
        trace: runOptions.trace !== false,
      })
    },
    [timeoutMs]
  )

  const stopExecution = useCallback(() => {
    if (!serviceRef.current) return
    serviceRef.current.stopExecution('user')
  }, [])

  const submitInput = useCallback((value: string) => {
    if (!serviceRef.current) return
    serviceRef.current.submitInput(value)
  }, [])

  const clearOutput = useCallback(() => {
    setOutput([])
    stdoutBufferRef.current = []
    setPredictionResult(null)
  }, [])

  const resetEngine = useCallback(() => {
    if (!serviceRef.current) return
    setTraceResult(null)
    setCurrentStepIndex(-1)
    setPredictionResult(null)
    setIsStale(false)
    setOutput((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'system',
        text: '[Engine state reset. Reinitializing Pyodide worker...]',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      },
    ])
    serviceRef.current.resetEngine()
  }, [])

  // Stepper controls
  const stepForward = useCallback(() => {
    if (!traceResult || traceResult.steps.length === 0) return
    setCurrentStepIndex((prev) =>
      Math.min(prev + 1, traceResult.steps.length - 1)
    )
  }, [traceResult])

  const stepBackward = useCallback(() => {
    if (!traceResult || traceResult.steps.length === 0) return
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
  }, [traceResult])

  const goToStep = useCallback(
    (stepIdx: number) => {
      if (!traceResult || traceResult.steps.length === 0) return
      const clamped = Math.max(0, Math.min(stepIdx, traceResult.steps.length - 1))
      setCurrentStepIndex(clamped)
    },
    [traceResult]
  )

  const resetTrace = useCallback(() => {
    if (!traceResult || traceResult.steps.length === 0) return
    setCurrentStepIndex(0)
  }, [traceResult])

  const markCodeChanged = useCallback(() => {
    setIsStale(true)
  }, [])

  const currentStep: TraceStep | null =
    traceResult && currentStepIndex >= 0 && currentStepIndex < traceResult.steps.length
      ? traceResult.steps[currentStepIndex]
      : null

  return {
    state,
    output,
    pyodideInfo,
    timeoutMs,
    setTimeoutMs,
    // Run & controls
    runCode,
    stopExecution,
    submitInput,
    clearOutput,
    resetEngine,
    // Phase 3: Execution Tracing
    traceResult,
    currentStepIndex,
    currentStep,
    stepForward,
    stepBackward,
    goToStep,
    resetTrace,
    // Phase 3: Stale state
    isStale,
    markCodeChanged,
    // Phase 3: Prediction
    prediction,
    setPrediction,
    predictionResult,
    clearPrediction: () => setPredictionResult(null),
  }
}
