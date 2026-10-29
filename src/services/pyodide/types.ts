// ============================================================================
// CodeCraft — Pyodide Execution Engine & Visualization Types
// ============================================================================

export type ExecutionState =
  | 'uninitialized'
  | 'loading'
  | 'ready'
  | 'running'
  | 'waiting_input'
  | 'success'
  | 'error'
  | 'stopped'

export type ConsoleEntryType =
  | 'stdout'
  | 'stderr'
  | 'system'
  | 'info'
  | 'prompt'
  | 'input'
  | 'error'

export interface ConsoleEntry {
  id: string
  type: ConsoleEntryType
  text: string
  timestamp: string
  runId?: string
}

export interface PyodideInitOptions {
  timeoutMs?: number
  maxOutputLines?: number
}

// ----------------------------------------------------------------------------
// Phase 3: Real Execution Tracing & Visualization Types
// ----------------------------------------------------------------------------

export interface TraceStep {
  step: number
  line: number
  event: 'line' | 'call' | 'return' | 'exception'
  func: string
  locals: Record<string, unknown>
  changedVars: string[]
  outputSoFar: string
  exception?: string
}

export interface TraceResult {
  steps: TraceStep[]
  isTruncated: boolean
  maxSteps: number
  supported: boolean
  unsupportedReason?: string
}

// ----------------------------------------------------------------------------
// Phase 3: Predict Before You Run Types
// ----------------------------------------------------------------------------

export interface LineDiffItem {
  lineNum: number
  predicted: string
  actual: string
  match: boolean
}

export interface PredictionResult {
  predicted: string
  actual: string
  isMatch: boolean
  lineDiff: LineDiffItem[]
}

// ----------------------------------------------------------------------------
// Worker Protocol: Main -> Worker
// ----------------------------------------------------------------------------

export interface WorkerInitMessage {
  type: 'INIT'
  indexURL?: string
  sharedBuffer?: SharedArrayBuffer
  interruptBuffer?: SharedArrayBuffer
}

export interface WorkerRunMessage {
  type: 'RUN'
  code: string
  runId: string
  trace?: boolean
}

export interface WorkerStdinMessage {
  type: 'STDIN_INPUT'
  value: string
  runId: string
}

export interface WorkerInterruptMessage {
  type: 'INTERRUPT'
  runId: string
}

export type MainToWorkerMessage =
  | WorkerInitMessage
  | WorkerRunMessage
  | WorkerStdinMessage
  | WorkerInterruptMessage

// ----------------------------------------------------------------------------
// Worker Protocol: Worker -> Main
// ----------------------------------------------------------------------------

export interface WorkerReadyMessage {
  type: 'READY'
  version: string
  pythonVersion: string
}

export interface WorkerLoadingMessage {
  type: 'LOADING_PROGRESS'
  message: string
}

export interface WorkerStdoutMessage {
  type: 'STDOUT'
  text: string
  runId: string
}

export interface WorkerStderrMessage {
  type: 'STDERR'
  text: string
  runId: string
}

export interface WorkerStdinPromptMessage {
  type: 'STDIN_PROMPT'
  prompt: string
  runId: string
}

export interface WorkerSuccessMessage {
  type: 'EXECUTION_SUCCESS'
  runId: string
  durationMs: number
  trace?: TraceResult
}

export interface WorkerErrorMessage {
  type: 'EXECUTION_ERROR'
  runId: string
  errorType: string
  message: string
  traceback?: string
  durationMs: number
  trace?: TraceResult
}

export interface WorkerInterruptedMessage {
  type: 'INTERRUPTED'
  runId: string
  durationMs: number
  trace?: TraceResult
}

export type WorkerToMainMessage =
  | WorkerReadyMessage
  | WorkerLoadingMessage
  | WorkerStdoutMessage
  | WorkerStderrMessage
  | WorkerStdinPromptMessage
  | WorkerSuccessMessage
  | WorkerErrorMessage
  | WorkerInterruptedMessage
