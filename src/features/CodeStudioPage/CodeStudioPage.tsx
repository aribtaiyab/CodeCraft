import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Copy,
  Check,
  Terminal,
  Settings2,
  ChevronDown,
  FileCode,
  Trash2,
  CornerDownLeft,
  HelpCircle,
  Layers,
  Sparkles,
  LifeBuoy,
  FlaskConical,
  Eye,
} from 'lucide-react'
import { Button, Badge, Tabs } from '../../components'
import { usePyodide } from '../../services/pyodide'
import {
  TraceVisualizer,
  PredictionPanel,
  DebuggingCoachPanel,
  TestYourFixPanel,
  AiMentorPanel,
} from './components'
import {
  diagnoseBug,
  parseTestResultsFromOutput,
  DEBUGGING_EXERCISES,
  type BugDiagnosis,
  type TestAssertionResult,
} from '../../services/coach'
import { recordLearningEvent, classifyBugCategory } from '../../services/learning'
import type { Language } from '../../types'
import styles from './CodeStudioPage.module.css'

const LANGUAGE_OPTIONS: { value: Language; label: string; monacoLang: string }[] = [
  { value: 'python',     label: 'Python 3.12 (Pyodide)', monacoLang: 'python' },
  { value: 'javascript', label: 'JavaScript',            monacoLang: 'javascript' },
  { value: 'typescript', label: 'TypeScript',            monacoLang: 'typescript' },
]

const STARTER_CODE: Record<Language, string> = {
  python: `# CodeCraft — Python Execution & Tracing Studio
# Phase 4: Smart Debugging Coach + Test Your Fix

def process_inventory(items: list[str]) -> dict:
    """Count item occurrences and categorize."""
    counts = {}
    for item in items:
        if item in counts:
            counts[item] += 1
        else:
            counts[item] = 1
    return counts

def main() -> None:
    print("Initializing inventory scan...")
    batch = ["bronze", "charcoal", "ivory", "bronze", "graphite", "bronze"]
    result = process_inventory(batch)
    
    total_unique = len(result)
    print(f"Discovered {total_unique} unique items:")
    for material, count in result.items():
        print(f"  {material}: {count}")
    print("Scan complete.")

if __name__ == "__main__":
    main()
`,
  javascript: `// CodeCraft — JavaScript Studio
// Note: Python is active with real execution, tracing, and debugging coach.
// JavaScript & TypeScript runtime execution is planned for a future phase.

function greet(name) {
  return \`Hello, \${name}! Welcome to CodeCraft.\`;
}

function main() {
  const message = greet("world");
  console.log(message);
}

main();
`,
  typescript: `// CodeCraft — TypeScript Studio
// Note: Python is active with real execution, tracing, and debugging coach.
// JavaScript & TypeScript runtime execution is planned for a future phase.

function greet(name: string): string {
  return \`Hello, \${name}! Welcome to CodeCraft.\`;
}

function main(): void {
  const message: string = greet("world");
  console.log(message);
}

main();
`,
  json: '{}',
  markdown: '',
}

const EDITOR_THEME_RULES = [
  { token: 'comment', foreground: '857E71', fontStyle: 'italic' },
  { token: 'keyword', foreground: 'B8895B', fontStyle: 'bold' },
  { token: 'string', foreground: '5E9E6E' },
  { token: 'number', foreground: '7A9EBA' },
  { token: 'type', foreground: 'D4A876' },
  { token: 'function', foreground: 'C8C2B4' },
]

export function CodeStudioPage() {
  // Phase 7: URL exercise parameter loading
  const [searchParams] = useSearchParams()
  const exerciseParam = searchParams.get('exerciseId')
  const initialCode = exerciseParam
    ? DEBUGGING_EXERCISES.find((e) => e.id === exerciseParam)?.buggyCode || STARTER_CODE.python
    : STARTER_CODE.python

  const [language, setLanguage] = useState<Language>('python')
  const [code, setCode] = useState<string>(initialCode)
  const [copied, setCopied] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [wordWrap, setWordWrap] = useState<'off' | 'on'>('off')
  const [inputVal, setInputVal] = useState('')

  // Phase 4: Debugging Coach & Test Results State
  const [diagnosis, setDiagnosis] = useState<BugDiagnosis | null>(null)
  const [testResults, setTestResults] = useState<TestAssertionResult[] | null>(null)
  const [isRunningTests, setIsRunningTests] = useState(false)

  // Phase 5: Selection range for line explanation
  const [selectionRange, setSelectionRange] = useState<{ startLine: number; endLine: number } | null>(null)

  const consoleEndRef = useRef<HTMLDivElement | null>(null)
  const stdinInputRef = useRef<HTMLInputElement | null>(null)

  // Monaco Editor Reference for line decoration
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)
  const decorationsCollectionRef = useRef<import('monaco-editor').editor.IEditorDecorationsCollection | null>(null)

  // Layout resize trigger for Monaco Editor
  useEffect(() => {
    const handleResize = () => {
      editorRef.current?.layout()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Pyodide Execution & Tracing Hook
  const {
    state,
    output,
    pyodideInfo,
    timeoutMs,
    setTimeoutMs,
    runCode,
    stopExecution,
    submitInput,
    clearOutput,
    resetEngine,
    // Phase 3: Trace Visualizer
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
    clearPrediction,
  } = usePyodide({ defaultTimeoutMs: 15000 })

  const currentLang = LANGUAGE_OPTIONS.find((l) => l.value === language)!

  // Synchronize Monaco line highlighting with current trace step
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    if (currentStep && currentStep.line > 0) {
      const m = monacoRef.current
      const lineNum = currentStep.line

      if (decorationsCollectionRef.current) {
        decorationsCollectionRef.current.set([
          {
            range: new m.Range(lineNum, 1, lineNum, 1),
            options: {
              isWholeLine: true,
              className: 'monaco-active-trace-line',
              glyphMarginClassName: 'monaco-active-trace-glyph',
            },
          },
        ])
      } else {
        decorationsCollectionRef.current = editorRef.current.createDecorationsCollection([
          {
            range: new m.Range(lineNum, 1, lineNum, 1),
            options: {
              isWholeLine: true,
              className: 'monaco-active-trace-line',
              glyphMarginClassName: 'monaco-active-trace-glyph',
            },
          },
        ])
      }

      editorRef.current.revealLineInCenterIfOutsideViewport(lineNum)
    } else {
      decorationsCollectionRef.current?.clear()
    }
  }, [currentStep])

  // Auto-scroll console log on new output
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  // Focus stdin input when waiting for user input
  useEffect(() => {
    if (state === 'waiting_input') {
      setTimeout(() => {
        stdinInputRef.current?.focus()
      }, 50)
    }
  }, [state])

  const analyzedErrorKeyRef = useRef<string | null>(null)
  const analyzedTestsKeyRef = useRef<string | null>(null)
  const cursorSelectionSubRef = useRef<import('monaco-editor').IDisposable | null>(null)
  const diagnosisRef = useRef<BugDiagnosis | null>(diagnosis)

  useEffect(() => {
    diagnosisRef.current = diagnosis
  }, [diagnosis])

  // Cleanup Monaco listeners and decorations on unmount
  useEffect(() => {
    return () => {
      cursorSelectionSubRef.current?.dispose()
      decorationsCollectionRef.current?.clear()
    }
  }, [])

  // Analyze output for errors or test assertion markers
  useEffect(() => {
    if (output.length === 0) return

    // 1. Check for test runner results if marker is present
    const hasTestMarkers = output.some(
      (e) => e.text.includes('__CODECRAFT_TEST_RESULTS__') || e.text.includes('TEST_')
    )

    if (hasTestMarkers) {
      const fullText = output.map((e) => e.text).join('\n')
      const parsed = parseTestResultsFromOutput(fullText)
      if (parsed) {
        const testsKey = `${parsed.length}:${parsed.map((p) => `${p.name}:${p.status}`).join(',')}`
        if (analyzedTestsKeyRef.current !== testsKey) {
          analyzedTestsKeyRef.current = testsKey
          queueMicrotask(() => {
            setTestResults(parsed)
            setIsRunningTests(false)

            const failures = parsed.filter((t) => t.status !== 'passed')
            if (failures.length > 0) {
              const diag = diagnoseBug({
                code,
                testFailures: failures,
                trace: traceResult,
              })
              if (diag) {
                setDiagnosis(diag)
                const classification = classifyBugCategory(diag.category)
                recordLearningEvent({
                  id: `ev_studio_${Date.now()}`,
                  timestamp: Date.now(),
                  source: 'code_studio',
                  activityType: 'test_your_fix',
                  conceptId: classification.conceptId,
                  topicId: classification.topicId,
                  outcome: 'failed',
                  evidenceQuality: 'high',
                  errorCategory: diag.category,
                  title: diag.title,
                  summary: diag.summary,
                  metadata: {
                    line: diag.line,
                    isSystemError: false,
                  },
                  dedupKey: `studio_test_fail:${diag.codeHash}:${diag.category}`,
                  schemaVersion: 1,
                })
              }
            } else if (parsed.length > 0 && diagnosisRef.current) {
              const currentDiag = diagnosisRef.current
              const classification = classifyBugCategory(currentDiag.category)
              recordLearningEvent({
                id: `ev_studio_pass_${Date.now()}`,
                timestamp: Date.now(),
                source: 'code_studio',
                activityType: 'test_your_fix',
                conceptId: classification.conceptId,
                topicId: classification.topicId,
                outcome: 'passed',
                evidenceQuality: 'high',
                errorCategory: currentDiag.category,
                title: `${currentDiag.title} — Fix Verified`,
                summary: 'All test assertions passed successfully in Test Your Fix.',
                dedupKey: `studio_fix_verified:${currentDiag.codeHash}:${currentDiag.category}`,
                schemaVersion: 1,
              })
            }
          })
        }
        return
      }
    }

    // 2. Check for execution error to provide diagnosis
    if (state === 'error') {
      const errEntry = output.slice().reverse().find((e) => e.type === 'error')
      if (errEntry) {
        const errKey = `${errEntry.text}:${code.length}`
        if (analyzedErrorKeyRef.current !== errKey) {
          analyzedErrorKeyRef.current = errKey
          // Extract exact Python error type (e.g. SyntaxError, NameError)
          const typeMatch = errEntry.text.match(
            /\b(SyntaxError|IndentationError|NameError|TypeError|ValueError|IndexError|KeyError|ZeroDivisionError|AttributeError|ImportError|ModuleNotFoundError|RecursionError|TimeoutError)\b/
          )
          const errorType = typeMatch ? typeMatch[1] : 'SyntaxError'
          const diag = diagnoseBug({
            code,
            lastError: {
              errorType,
              message: errEntry.text,
              traceback: errEntry.text,
            },
            trace: traceResult,
          })
          if (diag) {
            queueMicrotask(() => {
              setDiagnosis(diag)
              const classification = classifyBugCategory(diag.category)
              recordLearningEvent({
                id: `ev_studio_err_${Date.now()}`,
                timestamp: Date.now(),
                source: 'code_studio',
                activityType: 'coach_diagnosis',
                conceptId: classification.conceptId,
                topicId: classification.topicId,
                outcome: 'failed',
                evidenceQuality: classification.confidence,
                errorCategory: diag.category,
                title: diag.title,
                summary: diag.summary,
                metadata: {
                  line: diag.line,
                  isSystemError: false,
                },
                dedupKey: `studio_err:${diag.codeHash}:${diag.category}`,
                schemaVersion: 1,
              })
            })
          }
        }
      }
    }
  }, [output, state, code, traceResult])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCode(STARTER_CODE[lang])
    setLangMenuOpen(false)
    markCodeChanged()
  }

  const handleCodeChange = (newCode: string | undefined) => {
    setCode(newCode ?? '')
    markCodeChanged()
  }

  const handleRun = useCallback(() => {
    analyzedErrorKeyRef.current = null
    analyzedTestsKeyRef.current = null
    if (language !== 'python') {
      runCode(
        `print("[Notice] Real in-browser execution is enabled for Python (Pyodide).")\nprint("Language '${language}' runtime execution will be added in a future phase.")`
      )
      return
    }
    setDiagnosis(null)
    setTestResults(null)
    runCode(code, { trace: true })
  }, [language, code, runCode])

  const handleStop = useCallback(() => {
    stopExecution()
    setIsRunningTests(false)
  }, [stopExecution])

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    analyzedErrorKeyRef.current = null
    analyzedTestsKeyRef.current = null
    setCode(STARTER_CODE[language])
    decorationsCollectionRef.current?.clear()
    setDiagnosis(null)
    setTestResults(null)
    if (language === 'python') {
      resetEngine()
    }
  }

  const handleStdinSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (state !== 'waiting_input') return
    submitInput(inputVal)
    setInputVal('')
  }

  // Phase 4: Test Fix Runner
  const handleRunTestScript = (script: string) => {
    analyzedErrorKeyRef.current = null
    analyzedTestsKeyRef.current = null
    setIsRunningTests(true)
    clearOutput()
    runCode(script, { trace: false })
  }

  const handleEditorMount = (
    editor: unknown,
    monaco: unknown
  ) => {
    const m = monaco as typeof import('monaco-editor')
    const ed = editor as import('monaco-editor').editor.IStandaloneCodeEditor

    editorRef.current = ed
    monacoRef.current = m

    m.editor.defineTheme('codecraft', {
      base: 'vs-dark',
      inherit: true,
      rules: EDITOR_THEME_RULES,
      colors: {
        'editor.background':              '#1E1C18',
        'editor.foreground':              '#F4F0E8',
        'editor.lineHighlightBackground': '#24221E',
        'editor.selectionBackground':     '#B8895B33',
        'editorLineNumber.foreground':    '#857E71',
        'editorLineNumber.activeForeground': '#B8895B',
        'editorCursor.foreground':        '#B8895B',
        'editor.findMatchBackground':     '#B8895B44',
        'editorIndentGuide.background1':  '#2C2A25',
        'editorIndentGuide.activeBackground1': '#3A3730',
        'scrollbarSlider.background':     '#3A373066',
        'scrollbarSlider.hoverBackground':'#B8895B44',
        'editorWidget.background':        '#24221E',
        'editorWidget.border':            '#3A3730',
        'input.background':               '#191815',
        'input.foreground':               '#F4F0E8',
        'input.border':                   '#3A3730',
        'focusBorder':                    '#B8895B',
        'list.activeSelectionBackground': '#B8895B22',
        'list.hoverBackground':           '#2C2A25',
      },
    })
    m.editor.setTheme('codecraft')

    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to Run Code
    ed.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Enter, () => {
      handleRun()
    })

    // Phase 5: Track cursor selection for selected lines explanation
    cursorSelectionSubRef.current?.dispose()
    cursorSelectionSubRef.current = ed.onDidChangeCursorSelection((e) => {
      const sel = e.selection
      if (
        sel &&
        (sel.startLineNumber !== sel.endLineNumber ||
          sel.startColumn !== sel.endColumn)
      ) {
        setSelectionRange({
          startLine: sel.startLineNumber,
          endLine: sel.endLineNumber,
        })
      } else {
        setSelectionRange(null)
      }
    })
  }

  const outputTabs = [
    {
      id: 'output',
      label: 'Console',
      icon: <Terminal size={12} />,
    },
    {
      id: 'coach',
      label: diagnosis ? 'Debug Coach (!)' : 'Debug Coach',
      icon: <LifeBuoy size={12} />,
    },
    {
      id: 'aimentor',
      label: 'AI Mentor',
      icon: <Sparkles size={12} />,
    },
    {
      id: 'prediction',
      label: predictionResult ? (predictionResult.isMatch ? 'Predict ✓' : 'Predict ✕') : 'Predict',
      icon: <Eye size={12} />,
    },
    {
      id: 'visualizer',
      label: traceResult ? `Visualizer (${traceResult.steps.length})` : 'Visualizer',
      icon: <Layers size={12} />,
    },
    {
      id: 'testfix',
      label: testResults
        ? `Test Fix (${testResults.filter((t) => t.status === 'passed').length}/${testResults.length})`
        : 'Test Fix',
      icon: <FlaskConical size={12} />,
    },
  ]

  const isRunning = state === 'running' || state === 'waiting_input' || isRunningTests
  const isEngineLoading = state === 'loading' || state === 'uninitialized'

  return (
    <div className={styles.page}>
      {/* ---- Top bar ---- */}
      <div className={styles.topBar}>
        <div className={styles.topBar__left}>
          <div className={styles.topBar__fileInfo}>
            <FileCode size={15} strokeWidth={1.75} className={styles.topBar__fileIcon} />
            <span className={styles.topBar__fileName}>
              main.{language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : 'py'}
            </span>
            {isStale && (
              <span title="Code modified since last run">
                <Badge variant="warning" size="sm">
                  Modified
                </Badge>
              </span>
            )}
          </div>

          {/* Language selector */}
          <div className={styles.langSelector}>
            <button
              id="language-selector"
              className={styles.langSelector__btn}
              onClick={() => setLangMenuOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={langMenuOpen}
              aria-label="Select programming language"
            >
              <span>{currentLang.label}</span>
              <ChevronDown
                size={13}
                className={
                  langMenuOpen
                    ? styles['langSelector__chevron--open']
                    : styles.langSelector__chevron
                }
              />
            </button>
            {langMenuOpen && (
              <div className={styles.langSelector__menu} role="listbox" aria-label="Languages">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    role="option"
                    aria-selected={language === opt.value}
                    className={[
                      styles.langSelector__option,
                      language === opt.value ? styles['langSelector__option--active'] : '',
                    ].join(' ')}
                    onClick={() => handleLanguageChange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.topBar__right}>
          <div className={styles.topBar__utilityGroup}>
            <Button
              variant="ghost"
              size="sm"
              iconLeft={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopyCode}
              title="Copy code to clipboard"
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              iconLeft={<RotateCcw size={14} />}
              onClick={handleReset}
              title="Reset code and engine state"
            >
              Reset
            </Button>

            <button
              className={styles.topBar__settingsBtn}
              onClick={() => setSettingsOpen((v) => !v)}
              title="Editor settings"
              aria-label="Toggle editor settings"
            >
              <Settings2 size={15} />
            </button>
          </div>

          <div className={styles.topBar__actionGroup}>
            {/* Stop Button */}
            <button
              id="stop-code-btn"
              className={styles.btnStop}
              onClick={handleStop}
              disabled={!isRunning}
              title={isRunning ? 'Stop Python execution (interrupts infinite loops)' : 'No code currently running'}
            >
              <Square size={13} />
              Stop
            </button>

            {/* Run Button */}
            <Button
              id="run-code-btn"
              variant="primary"
              size="sm"
              iconLeft={<Play size={14} />}
              onClick={handleRun}
              disabled={isRunning || isEngineLoading}
              title="Run Code and Trace (Ctrl+Enter)"
            >
              {isEngineLoading ? 'Loading Pyodide...' : isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>
      </div>

      {/* ---- Settings panel ---- */}
      {settingsOpen && (
        <div className={styles.settingsPanel} role="region" aria-label="Editor settings">
          <div className={styles.settingRow}>
            <label htmlFor="font-size-select" className={styles.settingLabel}>Font size</label>
            <select
              id="font-size-select"
              className={styles.settingControl}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            >
              {[12, 13, 14, 15, 16, 18, 20].map((s) => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </div>

          <div className={styles.settingRow}>
            <label htmlFor="word-wrap-select" className={styles.settingLabel}>Word wrap</label>
            <select
              id="word-wrap-select"
              className={styles.settingControl}
              value={wordWrap}
              onChange={(e) => setWordWrap(e.target.value as 'off' | 'on')}
            >
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </div>

          <div className={styles.settingRow}>
            <label htmlFor="timeout-select" className={styles.settingLabel}>Execution timeout</label>
            <select
              id="timeout-select"
              className={styles.settingControl}
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(Number(e.target.value))}
            >
              <option value={5000}>5 seconds</option>
              <option value={15000}>15 seconds (Default)</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>60 seconds</option>
            </select>
          </div>
        </div>
      )}

      {/* ---- Split layout ---- */}
      <div className={styles.split}>
        {/* Editor pane */}
        <div className={styles.editorPane} aria-label="Code editor">
          <Editor
            height="100%"
            language={currentLang.monacoLang}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            options={{
              fontSize,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              glyphMargin: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap,
              automaticLayout: true,
              tabSize: 4,
              renderWhitespace: 'selection',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              bracketPairColorization: { enabled: true },
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>

        {/* Output pane */}
        <div className={styles.outputPane}>
          <Tabs tabs={outputTabs} defaultTab="output">
            {(activeTab) => (
              <>
                {/* 1. Console Tab */}
                {activeTab === 'output' && (
                  <div className={styles.outputContent}>
                    <div className={styles.outputToolbar}>
                      <div className={styles.outputToolbar__left}>
                        <Terminal size={13} />
                        <span>Console Output</span>
                        {output.length > 0 && (
                          <Badge variant="default" size="sm">{output.length}</Badge>
                        )}
                      </div>
                      <button
                        className={styles.outputClearBtn}
                        onClick={clearOutput}
                        disabled={output.length === 0}
                        title="Clear output"
                        aria-label="Clear console output"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className={styles.outputLog} aria-live="polite" aria-label="Console output">
                      {output.length === 0 ? (
                        <div className={styles.outputEmpty}>
                          <Terminal size={32} strokeWidth={1} />
                          <p>Run your code to see output here.</p>
                          <p className={styles.outputEmpty__note}>
                            Pyodide WebAssembly runtime active · Press Ctrl+Enter to run
                          </p>
                        </div>
                      ) : (
                        output.map((entry) => (
                          <div
                            key={entry.id}
                            className={`${styles.outputLine} ${styles[`outputLine--${entry.type}`]}`}
                          >
                            <span className={styles.outputLine__ts}>{entry.timestamp}</span>
                            <span className={styles.outputLine__text}>{entry.text}</span>
                          </div>
                        ))
                      )}
                      <div ref={consoleEndRef} />
                    </div>

                    {/* Interactive stdin input bar when waiting for input */}
                    {state === 'waiting_input' && (
                      <form className={styles.stdinBar} onSubmit={handleStdinSubmit}>
                        <HelpCircle size={15} className={styles.stdinIcon} />
                        <span className={styles.stdinPromptLabel}>input():</span>
                        <input
                          ref={stdinInputRef}
                          type="text"
                          className={styles.stdinInput}
                          placeholder="Type input and press Enter..."
                          value={inputVal}
                          onChange={(e) => setInputVal(e.target.value)}
                        />
                        <button type="submit" className={styles.stdinSubmitBtn}>
                          <CornerDownLeft size={13} />
                          Submit
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* 2. Debug Coach Tab */}
                {activeTab === 'coach' && (
                  <DebuggingCoachPanel
                    diagnosis={diagnosis}
                    isStale={isStale}
                  />
                )}

                {/* 3. AI Mentor Tab */}
                {activeTab === 'aimentor' && (
                  <AiMentorPanel
                    currentCode={code}
                    selectionRange={selectionRange}
                    lastStdout={output
                      .filter((e) => e.type === 'stdout')
                      .map((e) => e.text)
                      .join('\n')}
                    lastError={
                      output
                        .slice()
                        .reverse()
                        .find((e) => e.type === 'error')?.text
                    }
                    isStale={isStale}
                  />
                )}

                {/* 4. Predict Tab */}
                {activeTab === 'prediction' && (
                  <PredictionPanel
                    prediction={prediction}
                    setPrediction={setPrediction}
                    predictionResult={predictionResult}
                    clearPrediction={clearPrediction}
                    isStale={isStale}
                  />
                )}

                {/* 5. Visualizer Tab */}
                {activeTab === 'visualizer' && (
                  <TraceVisualizer
                    traceResult={traceResult}
                    currentStepIndex={currentStepIndex}
                    currentStep={currentStep}
                    isStale={isStale}
                    stepForward={stepForward}
                    stepBackward={stepBackward}
                    goToStep={goToStep}
                    resetTrace={resetTrace}
                  />
                )}

                {/* 6. Test Fix Tab */}
                {activeTab === 'testfix' && (
                  <TestYourFixPanel
                    currentCode={code}
                    testResults={testResults}
                    isRunningTests={isRunningTests}
                    isStale={isStale}
                    onRunTests={handleRunTestScript}
                    onReturnToEditor={() => editorRef.current?.focus()}
                  />
                )}
              </>
            )}
          </Tabs>
        </div>
      </div>

      {/* ---- Status bar ---- */}
      <div className={styles.statusBar} aria-label="Editor status">
        <div className={styles.statusBar__left}>
          <span className={styles.statusBar__item}>
            <span
              className={[
                styles.statusBar__dot,
                state === 'loading' ? styles['statusBar__dot--loading'] : '',
                state === 'running' ? styles['statusBar__dot--running'] : '',
                state === 'waiting_input' ? styles['statusBar__dot--waiting'] : '',
                state === 'stopped' ? styles['statusBar__dot--stopped'] : '',
                state === 'error' ? styles['statusBar__dot--error'] : '',
              ].join(' ')}
            />
            {state === 'loading'
              ? 'Loading Pyodide runtime...'
              : state === 'running'
              ? 'Running...'
              : state === 'waiting_input'
              ? 'Waiting for user input...'
              : state === 'stopped'
              ? 'Execution stopped'
              : state === 'error'
              ? 'Execution error'
              : pyodideInfo
              ? `Python ${pyodideInfo.pythonVersion} ready`
              : 'Python ready'}
          </span>
          <span className={styles.statusBar__sep} aria-hidden="true">·</span>
          <span className={styles.statusBar__item}>{currentLang.label}</span>
          <span className={styles.statusBar__sep} aria-hidden="true">·</span>
          {traceResult && (
            <>
              <span className={styles.statusBar__item}>
                Trace: Step {currentStepIndex + 1}/{traceResult.steps.length}
              </span>
              <span className={styles.statusBar__sep} aria-hidden="true">·</span>
            </>
          )}
          <span className={styles.statusBar__item}>Timeout: {timeoutMs / 1000}s</span>
        </div>

        <div className={styles.statusBar__right}>
          <Badge variant="bronze" size="sm">Python 3.12 · Live Inspector Active</Badge>
          <button
            className={styles.statusBar__item}
            title="Export code"
            aria-label="Download code file"
            onClick={() => {
              const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `main.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'ts'}`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            <Download size={12} /> Export
          </button>
        </div>
      </div>
    </div>
  )
}
