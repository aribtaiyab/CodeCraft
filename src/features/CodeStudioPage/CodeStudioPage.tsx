import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
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
  Maximize2,
  Columns,
  Search,
  Type,
  WrapText,
  Save,
} from 'lucide-react'
import { Badge, Tabs } from '../../components'
import { useTheme } from '../../context/ThemeContext'
import { usePyodide } from '../../services/pyodide'
import {
  TraceVisualizer,
  PredictionPanel,
  DebuggingCoachPanel,
  TestYourFixPanel,
  AiMentorPanel,
  CommandPaletteModal,
  type CommandItem,
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
  python: `# Print a message
print("Hello, World!")

# Simple calculation
a = 5
b = 10
print(a + b)
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

// Warm, restrained syntax token rules tailored for CodeCraft charcoal/bronze palette
const EDITOR_THEME_RULES = [
  { token: 'comment', foreground: '857E71', fontStyle: 'italic' },
  { token: 'keyword', foreground: 'B8895B', fontStyle: 'bold' },
  { token: 'keyword.control', foreground: 'B8895B', fontStyle: 'bold' },
  { token: 'keyword.operator', foreground: 'D8B58B' },
  { token: 'string', foreground: '8FA678' },
  { token: 'string.escape', foreground: 'D8B58B' },
  { token: 'number', foreground: 'D4A876' },
  { token: 'type', foreground: 'E0C09E', fontStyle: 'bold' },
  { token: 'function', foreground: 'F4F0E8' },
  { token: 'variable', foreground: 'D5CFC5' },
  { token: 'variable.parameter', foreground: 'C5BDB1' },
  { token: 'delimiter', foreground: 'B9B2A7' },
  { token: 'operator', foreground: 'B8895B' },
  { token: 'identifier', foreground: 'F4F0E8' },
]

// Warm syntax token rules tailored for CodeCraft Daylight editorial light palette
const LIGHT_EDITOR_THEME_RULES = [
  { token: 'comment', foreground: '91897D', fontStyle: 'italic' },
  { token: 'keyword', foreground: 'C87532', fontStyle: 'bold' },
  { token: 'keyword.control', foreground: 'C87532', fontStyle: 'bold' },
  { token: 'keyword.operator', foreground: 'A95D27' },
  { token: 'string', foreground: '397653' },
  { token: 'string.escape', foreground: 'A76A24' },
  { token: 'number', foreground: 'A76A24' },
  { token: 'type', foreground: 'B64B40', fontStyle: 'bold' },
  { token: 'function', foreground: '292720' },
  { token: 'variable', foreground: '3A362D' },
  { token: 'variable.parameter', foreground: '575043' },
  { token: 'delimiter', foreground: '716B61' },
  { token: 'operator', foreground: 'C87532' },
  { token: 'identifier', foreground: '292720' },
]

export function CodeStudioPage() {
  const { isLight } = useTheme()
  // URL exercise parameter loading or workspace auto-restore
  const [searchParams] = useSearchParams()
  const exerciseParam = searchParams.get('exerciseId')
  const savedCode = localStorage.getItem('codecraft_studio_saved_code')
  const initialCode = exerciseParam
    ? DEBUGGING_EXERCISES.find((e) => e.id === exerciseParam)?.buggyCode || STARTER_CODE.python
    : savedCode && !savedCode.includes('process_inventory')
      ? savedCode
      : STARTER_CODE.python

  const [language, setLanguage] = useState<Language>('python')
  const [code, setCode] = useState<string>(initialCode)
  const [copied, setCopied] = useState(false)
  const [saveToast, setSaveToast] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('codecraft_studio_font_size')
    return saved ? Number(saved) : 15
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [wordWrap, setWordWrap] = useState<'off' | 'on'>('off')
  const [inputVal, setInputVal] = useState('')

  // Active tools tab state
  const [activeTab, setActiveTab] = useState<string>('output')

  // Draggable Split Pane & Maximized state
  const [toolsWidth, setToolsWidth] = useState<number>(() => {
    const saved = localStorage.getItem('codecraft_studio_tools_width')
    return saved ? Math.min(Math.max(Number(saved), 320), 800) : 480
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isEditorMaximized, setIsEditorMaximized] = useState(false)

  // Cursor & selection tracking
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [selectionCount, setSelectionCount] = useState(0)
  const [selectionRange, setSelectionRange] = useState<{ startLine: number; endLine: number } | null>(null)

  // Command palette modal state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Debugging Coach & Test Results State
  const [diagnosis, setDiagnosis] = useState<BugDiagnosis | null>(null)
  const [testResults, setTestResults] = useState<TestAssertionResult[] | null>(null)
  const [isRunningTests, setIsRunningTests] = useState(false)

  const consoleEndRef = useRef<HTMLDivElement | null>(null)
  const stdinInputRef = useRef<HTMLInputElement | null>(null)

  // Monaco Editor References
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)
  const decorationsCollectionRef = useRef<import('monaco-editor').editor.IEditorDecorationsCollection | null>(null)

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
    traceResult,
    currentStepIndex,
    currentStep,
    stepForward,
    stepBackward,
    goToStep,
    resetTrace,
    isStale,
    markCodeChanged,
    prediction,
    setPrediction,
    predictionResult,
    clearPrediction,
  } = usePyodide({ defaultTimeoutMs: 15000 })

  const currentLang = LANGUAGE_OPTIONS.find((l) => l.value === language)!

  // Save font size preference
  useEffect(() => {
    localStorage.setItem('codecraft_studio_font_size', String(fontSize))
  }, [fontSize])

  // Resize listener for Monaco
  useEffect(() => {
    const handleResize = () => {
      editorRef.current?.layout()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Sync Monaco editor theme with Daylight / Night mode
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(isLight ? 'codecraft-light' : 'codecraft')
    }
  }, [isLight])

  // Draggable divider mouse listener
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const minWidth = 320
      const maxWidth = Math.max(minWidth, window.innerWidth - 380)
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, minWidth), maxWidth)
      setToolsWidth(newWidth)
      editorRef.current?.layout()
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      localStorage.setItem('codecraft_studio_tools_width', String(toolsWidth))
      editorRef.current?.layout()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, toolsWidth])

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
  const cursorPosSubRef = useRef<import('monaco-editor').IDisposable | null>(null)
  const diagnosisRef = useRef<BugDiagnosis | null>(diagnosis)

  useEffect(() => {
    diagnosisRef.current = diagnosis
  }, [diagnosis])

  // Cleanup Monaco listeners and decorations on unmount
  useEffect(() => {
    return () => {
      cursorSelectionSubRef.current?.dispose()
      cursorPosSubRef.current?.dispose()
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

  const handleCopyCode = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem('codecraft_studio_saved_code', code)
      setSaveToast(true)
      setTimeout(() => setSaveToast(false), 2200)
    } catch {
      // LocalStorage quota or privacy mode fallback
    }
  }, [code])

  const handleReset = useCallback(() => {
    analyzedErrorKeyRef.current = null
    analyzedTestsKeyRef.current = null
    setCode(STARTER_CODE[language])
    decorationsCollectionRef.current?.clear()
    setDiagnosis(null)
    setTestResults(null)
    if (language === 'python') {
      resetEngine()
    }
  }, [language, resetEngine])

  const toggleEditorMaximize = useCallback(() => {
    setIsEditorMaximized((prev) => !prev)
    setTimeout(() => editorRef.current?.layout(), 50)
  }, [])

  const handleExportFile = useCallback(() => {
    const ext = language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'ts'
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `main.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [code, language])

  const handleStdinSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (state !== 'waiting_input') return
    submitInput(inputVal)
    setInputVal('')
  }

  // Test Fix runner
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
        'editor.background':                  '#191815',
        'editor.foreground':                  '#F4F0E8',
        'editor.lineHighlightBackground':     '#24221E99',
        'editor.lineHighlightBorder':         '#302C26',
        'editor.selectionBackground':         '#B8895B38',
        'editor.selectionHighlightBackground':'#B8895B20',
        'editor.inactiveSelectionBackground': '#2D2924',
        'editorLineNumber.foreground':        '#6B6357',
        'editorLineNumber.activeForeground':  '#D8B58B',
        'editorCursor.foreground':            '#D8B58B',
        'editor.findMatchBackground':         '#B8895B55',
        'editor.findMatchHighlightBackground':'#B8895B28',
        'editorIndentGuide.background1':      '#26231E',
        'editorIndentGuide.activeBackground1':'#454037',
        'editorBracketMatch.background':      '#B8895B25',
        'editorBracketMatch.border':          '#B8895B88',
        'scrollbarSlider.background':         '#302C2688',
        'scrollbarSlider.hoverBackground':    '#454037CC',
        'scrollbarSlider.activeBackground':   '#B8895B66',
        'editorWidget.background':            '#24221E',
        'editorWidget.border':                '#454037',
        'editorSuggestWidget.background':     '#24221E',
        'editorSuggestWidget.border':         '#454037',
        'editorSuggestWidget.foreground':     '#F4F0E8',
        'editorSuggestWidget.selectedBackground': '#302C26',
        'editorSuggestWidget.highlightForeground': '#D8B58B',
        'editorHoverWidget.background':       '#24221E',
        'editorHoverWidget.border':           '#454037',
        'input.background':                   '#191815',
        'input.foreground':                   '#F4F0E8',
        'input.border':                       '#454037',
        'focusBorder':                        '#B8895B',
        'list.activeSelectionBackground':     '#302C26',
        'list.activeSelectionForeground':     '#F4F0E8',
        'list.hoverBackground':               '#2A2722',
      },
    })

    m.editor.defineTheme('codecraft-light', {
      base: 'vs',
      inherit: true,
      rules: LIGHT_EDITOR_THEME_RULES,
      colors: {
        'editor.background':                  '#FFFFFF',
        'editor.foreground':                  '#292720',
        'editor.lineHighlightBackground':     '#FAF8F3',
        'editor.lineHighlightBorder':         '#ECE6DC',
        'editor.selectionBackground':         '#F5E7D8',
        'editor.selectionHighlightBackground':'#F5E7D888',
        'editor.inactiveSelectionBackground': '#F0EBE1',
        'editorLineNumber.foreground':        '#B3AAA0',
        'editorLineNumber.activeForeground':  '#C87532',
        'editorCursor.foreground':            '#C87532',
        'editor.findMatchBackground':         '#F5E7D8',
        'editor.findMatchHighlightBackground':'#F5E7D888',
        'editorIndentGuide.background1':      '#ECE6DC',
        'editorIndentGuide.activeBackground1':'#D5CCC0',
        'editorBracketMatch.background':      '#F5E7D888',
        'editorBracketMatch.border':          '#C87532',
        'scrollbarSlider.background':         '#E2DBD088',
        'scrollbarSlider.hoverBackground':    '#D5CCC0CC',
        'scrollbarSlider.activeBackground':   '#C8753266',
        'editorWidget.background':            '#FFFFFF',
        'editorWidget.border':                '#E2DBD0',
        'editorSuggestWidget.background':     '#FFFFFF',
        'editorSuggestWidget.border':         '#E2DBD0',
        'editorSuggestWidget.foreground':     '#292720',
        'editorSuggestWidget.selectedBackground': '#FAF8F3',
        'editorSuggestWidget.highlightForeground': '#C87532',
        'editorHoverWidget.background':       '#FFFFFF',
        'editorHoverWidget.border':           '#E2DBD0',
        'input.background':                   '#FAF8F3',
        'input.foreground':                   '#292720',
        'input.border':                       '#E2DBD0',
        'focusBorder':                        '#C87532',
        'list.activeSelectionBackground':     '#FAF8F3',
        'list.activeSelectionForeground':     '#292720',
        'list.hoverBackground':               '#F6F2EA',
      },
    })

    m.editor.setTheme(isLight ? 'codecraft-light' : 'codecraft')

    // Track live cursor position
    cursorPosSubRef.current?.dispose()
    cursorPosSubRef.current = ed.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column })
    })

    // Track cursor selection
    cursorSelectionSubRef.current?.dispose()
    cursorSelectionSubRef.current = ed.onDidChangeCursorSelection((e) => {
      const sel = e.selection
      if (
        sel &&
        (sel.startLineNumber !== sel.endLineNumber ||
          sel.startColumn !== sel.endColumn)
      ) {
        const selText = ed.getModel()?.getValueInRange(sel) || ''
        setSelectionCount(selText.length)
        setSelectionRange({
          startLine: sel.startLineNumber,
          endLine: sel.endLineNumber,
        })
      } else {
        setSelectionCount(0)
        setSelectionRange(null)
      }
    })

    // Keyboard Shortcuts inside Monaco
    ed.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Enter, () => {
      handleRun()
    })
    ed.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyS, () => {
      handleSave()
    })
    ed.addCommand(m.KeyMod.CtrlCmd | m.KeyMod.Shift | m.KeyCode.KeyP, () => {
      setIsCommandPaletteOpen(true)
    })
    ed.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.KeyK, () => {
      setIsCommandPaletteOpen(true)
    })
  }

  // Global window keyboard shortcuts when editor isn't focused
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        handleSave()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRun()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleSave, handleRun])

  // Command Palette Items
  const paletteCommands: CommandItem[] = useMemo(() => [
    {
      id: 'run-code',
      title: 'Run Code and Trace',
      subtitle: 'Execute Python in Pyodide WebAssembly with runtime tracing',
      shortcut: 'Ctrl+Enter',
      category: 'execution',
      icon: <Play size={16} />,
      action: handleRun,
    },
    {
      id: 'stop-code',
      title: 'Stop Execution',
      subtitle: 'Halt active execution or interrupt loops',
      category: 'execution',
      icon: <Square size={16} />,
      action: handleStop,
    },
    {
      id: 'save-code',
      title: 'Save Code to Workspace',
      subtitle: 'Persist current Python code in local storage',
      shortcut: 'Ctrl+S',
      category: 'editor',
      icon: <Save size={16} />,
      action: handleSave,
    },
    {
      id: 'clear-console',
      title: 'Clear Console Output',
      subtitle: 'Remove all standard output, warnings and error traces',
      category: 'execution',
      icon: <Trash2 size={16} />,
      action: clearOutput,
    },
    {
      id: 'copy-code',
      title: 'Copy All Code',
      subtitle: 'Copy editor content to system clipboard',
      category: 'editor',
      icon: <Copy size={16} />,
      action: handleCopyCode,
    },
    {
      id: 'reset-code',
      title: 'Reset to Starter Code',
      subtitle: 'Restore clean template and reset execution engine',
      category: 'editor',
      icon: <RotateCcw size={16} />,
      action: handleReset,
    },
    {
      id: 'font-increase',
      title: 'Increase Editor Font Size',
      subtitle: `Current: ${fontSize}px`,
      category: 'editor',
      icon: <Type size={16} />,
      action: () => setFontSize((s) => Math.min(22, s + 1)),
    },
    {
      id: 'font-decrease',
      title: 'Decrease Editor Font Size',
      subtitle: `Current: ${fontSize}px`,
      category: 'editor',
      icon: <Type size={16} />,
      action: () => setFontSize((s) => Math.max(12, s - 1)),
    },
    {
      id: 'toggle-wordwrap',
      title: `Toggle Word Wrap (Currently ${wordWrap})`,
      subtitle: 'Enable or disable soft wrapping of long lines',
      category: 'editor',
      icon: <WrapText size={16} />,
      action: () => setWordWrap((w) => (w === 'off' ? 'on' : 'off')),
    },
    {
      id: 'toggle-maximize',
      title: isEditorMaximized ? 'Restore Tools Panel' : 'Maximize Editor (Full Width)',
      subtitle: isEditorMaximized ? 'Show Console & Learning Tools side-by-side' : 'Expand editor to 100% width',
      category: 'navigation',
      icon: isEditorMaximized ? <Columns size={16} /> : <Maximize2 size={16} />,
      action: toggleEditorMaximize,
    },
    {
      id: 'tab-console',
      title: 'Switch to Console',
      subtitle: 'View standard output, execution logs, and interactive input',
      category: 'navigation',
      icon: <Terminal size={16} />,
      action: () => {
        setIsEditorMaximized(false)
        setActiveTab('output')
      },
    },
    {
      id: 'tab-coach',
      title: 'Switch to Debug Coach',
      subtitle: 'Inspect error diagnosis, line highlights, and fix guidance',
      category: 'navigation',
      icon: <LifeBuoy size={16} />,
      action: () => {
        setIsEditorMaximized(false)
        setActiveTab('coach')
      },
    },
    {
      id: 'tab-aimentor',
      title: 'Switch to AI Mentor',
      subtitle: 'Ask questions, explain code, and understand concepts',
      category: 'navigation',
      icon: <Sparkles size={16} />,
      action: () => {
        setIsEditorMaximized(false)
        setActiveTab('aimentor')
      },
    },
    {
      id: 'tab-predict',
      title: 'Switch to Predict',
      subtitle: 'Mental model training: guess output before running',
      category: 'navigation',
      icon: <Eye size={16} />,
      action: () => {
        setIsEditorMaximized(false)
        setActiveTab('prediction')
      },
    },
    {
      id: 'tab-visualizer',
      title: 'Switch to Visualizer',
      subtitle: 'Step through Python execution and variable state live',
      category: 'navigation',
      icon: <Layers size={16} />,
      action: () => {
        setIsEditorMaximized(false)
        setActiveTab('visualizer')
      },
    },
    {
      id: 'tab-testfix',
      title: 'Switch to Test Fix',
      subtitle: 'Run automated assertions against code to verify fixes',
      category: 'navigation',
      icon: <FlaskConical size={16} />,
      action: () => {
        setIsEditorMaximized(false)
        setActiveTab('testfix')
      },
    },
    {
      id: 'export-file',
      title: 'Export Python File',
      subtitle: 'Download main.py to disk',
      category: 'editor',
      icon: <Download size={16} />,
      action: handleExportFile,
    },
  ], [
    fontSize,
    wordWrap,
    isEditorMaximized,
    handleRun,
    handleStop,
    handleSave,
    clearOutput,
    handleCopyCode,
    handleReset,
    toggleEditorMaximize,
    handleExportFile,
  ])

  // Exact 6 Learning Tools Tabs in required order
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
      {/* ---- Toolbar with Organized File/Environment, Editing, and Execution Sections ---- */}
      <div className={styles.topBar}>
        {/* 1. File / Environment Controls */}
        <div className={styles.topBar__group}>
          <div className={styles.topBar__fileInfo}>
            <FileCode size={15} strokeWidth={1.75} className={styles.topBar__fileIcon} />
            <span className={styles.topBar__fileName}>
              main.{language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : 'py'}
            </span>
            {saveToast ? (
              <span className={styles.savedToastBadge}>Saved</span>
            ) : isStale ? (
              <span title="Code modified since last run">
                <Badge variant="warning" size="sm">
                  Modified
                </Badge>
              </span>
            ) : null}
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
              <span className={styles.langDot} />
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

        {/* 2. Editing & Studio Controls */}
        <div className={styles.topBar__group}>
          {/* Quick font size controls */}
          <div className={styles.fontStepper} title="Editor font size">
            <button
              className={styles.fontStepper__btn}
              onClick={() => setFontSize((s) => Math.max(12, s - 1))}
              disabled={fontSize <= 12}
              title="Decrease font size"
              aria-label="Decrease font size"
            >
              A-
            </button>
            <span className={styles.fontStepper__val}>{fontSize}px</span>
            <button
              className={styles.fontStepper__btn}
              onClick={() => setFontSize((s) => Math.min(22, s + 1))}
              disabled={fontSize >= 22}
              title="Increase font size"
              aria-label="Increase font size"
            >
              A+
            </button>
          </div>

          <button
            className={styles.toolBtn}
            onClick={handleCopyCode}
            title="Copy code to clipboard"
            aria-label="Copy code"
          >
            {copied ? <Check size={14} className={styles.checkIcon} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            className={styles.toolBtn}
            onClick={handleReset}
            title="Reset to starter code"
            aria-label="Reset code"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          {/* Command Palette Trigger */}
          <button
            className={styles.commandPaletteTrigger}
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Command Palette (Ctrl+Shift+P / ⌘K)"
            aria-label="Open Command Palette"
          >
            <Search size={13} />
            <span className={styles.commandPaletteText}>Commands</span>
            <kbd className={styles.commandPaletteKbd}>⌘K</kbd>
          </button>

          <button
            className={`${styles.iconBtn} ${settingsOpen ? styles.iconBtnActive : ''}`}
            onClick={() => setSettingsOpen((v) => !v)}
            title="Editor settings"
            aria-label="Toggle editor settings"
          >
            <Settings2 size={15} />
          </button>
        </div>

        {/* 3. Execution Controls */}
        <div className={styles.topBar__group}>
          {/* Stop Button */}
          <button
            id="stop-code-btn"
            className={styles.btnStop}
            onClick={handleStop}
            disabled={!isRunning}
            title={isRunning ? 'Stop Python execution (interrupts infinite loops)' : 'No code currently running'}
          >
            <Square size={13} />
            <span>Stop</span>
          </button>

          {/* Primary Bronze Run Button */}
          <button
            id="run-code-btn"
            className={styles.btnRun}
            onClick={handleRun}
            disabled={isRunning || isEngineLoading}
            title="Run Code & Trace (Ctrl+Enter)"
          >
            <Play size={14} className={styles.runIcon} />
            <span>{isEngineLoading ? 'Loading Pyodide...' : isRunning ? 'Running...' : 'Run'}</span>
            <kbd className={styles.runKbdHint}>Ctrl+↵</kbd>
          </button>
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

      {/* ---- Split Workspace Layout with Draggable Divider ---- */}
      <div className={`${styles.split} ${isDragging ? styles.splitDragging : ''}`}>
        {/* 1. Code Editor Pane */}
        <div className={styles.editorPane} aria-label="Code editor">
          <Editor
            height="100%"
            language={currentLang.monacoLang}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            options={{
              fontSize,
              lineHeight: Math.round(fontSize * 1.6),
              fontFamily: "'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
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
              cursorWidth: 2,
              bracketPairColorization: { enabled: true },
              guides: {
                indentation: true,
                bracketPairs: true,
              },
              folding: true,
              foldingHighlight: true,
              padding: { top: 16, bottom: 20 },
              suggestOnTriggerCharacters: true,
              quickSuggestions: { other: true, comments: false, strings: false },
              parameterHints: { enabled: true },
            }}
          />
        </div>

        {/* 2. Draggable Resizable Divider (hidden when editor maximized) */}
        {!isEditorMaximized && (
          <div
            className={styles.dividerHandle}
            onMouseDown={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDoubleClick={() => setToolsWidth(480)}
            title="Drag to resize · Double-click to reset"
            role="separator"
            aria-orientation="vertical"
            tabIndex={0}
          >
            <div className={styles.dividerGrip} />
          </div>
        )}

        {/* 3. Output & Learning Tools Pane (hidden when editor maximized) */}
        {!isEditorMaximized && (
          <div
            className={styles.outputPane}
            style={{ width: `${toolsWidth}px` }}
          >
            <Tabs
              tabs={outputTabs}
              activeTab={activeTab}
              onChange={(tabId) => setActiveTab(tabId)}
              size="sm"
            >
              {(tab) => (
                <>
                  {/* Tab 1: Console */}
                  {tab === 'output' && (
                    <div className={styles.outputContent}>
                      <div className={styles.outputToolbar}>
                        <div className={styles.outputToolbar__left}>
                          <Terminal size={13} className={styles.outputToolbar__icon} />
                          <span className={styles.outputToolbar__title}>Console Output</span>
                          {output.length > 0 && (
                            <span className={styles.outputCountBadge}>
                              {output.length} {output.length === 1 ? 'line' : 'lines'}
                            </span>
                          )}
                        </div>
                        <div className={styles.outputToolbar__right}>
                          {state === 'running' ? (
                            <span className={styles.executionBadgeRunning}>Running...</span>
                          ) : state === 'error' ? (
                            <span className={styles.executionBadgeError}>Error</span>
                          ) : output.length > 0 ? (
                            <span className={styles.executionBadgeSuccess}>Completed</span>
                          ) : null}
                          <button
                            className={styles.outputClearBtn}
                            onClick={clearOutput}
                            disabled={output.length === 0}
                            title="Clear console output"
                            aria-label="Clear console output"
                          >
                            <Trash2 size={13} />
                            <span>Clear</span>
                          </button>
                        </div>
                      </div>

                      <div className={styles.outputLog} aria-live="polite" aria-label="Console output">
                        {output.length === 0 ? (
                          <div className={styles.outputEmpty}>
                            <div className={styles.outputEmpty__iconBox}>
                              <Terminal size={24} strokeWidth={1.5} />
                            </div>
                            <p className={styles.outputEmpty__message}>
                              Your output will appear here. Write some Python code and press Run to see what happens.
                            </p>
                            <div className={styles.outputEmpty__shortcut}>
                              <span className={styles.outputEmpty__shortcutLabel}>Shortcut:</span>
                              <kbd className={styles.kbdBadge}>Ctrl</kbd>
                              <span className={styles.kbdPlus}>+</span>
                              <kbd className={styles.kbdBadge}>Enter</kbd>
                            </div>
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

                  {/* Tab 2: Debug Coach */}
                  {tab === 'coach' && (
                    <DebuggingCoachPanel
                      diagnosis={diagnosis}
                      isStale={isStale}
                    />
                  )}

                  {/* Tab 3: AI Mentor */}
                  {tab === 'aimentor' && (
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

                  {/* Tab 4: Predict */}
                  {tab === 'prediction' && (
                    <PredictionPanel
                      prediction={prediction}
                      setPrediction={setPrediction}
                      predictionResult={predictionResult}
                      clearPrediction={clearPrediction}
                      isStale={isStale}
                    />
                  )}

                  {/* Tab 5: Visualizer */}
                  {tab === 'visualizer' && (
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

                  {/* Tab 6: Test Fix */}
                  {tab === 'testfix' && (
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
        )}
      </div>

      {/* ---- Status Bar ---- */}
      <div className={styles.statusBar} aria-label="Editor status">
        <div className={styles.statusBar__left}>
          {/* Runtime Indicator */}
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
              ? `Python ${pyodideInfo.pythonVersion} · Ready`
              : 'Python 3.12 · Ready'}
          </span>

          <span className={styles.statusBar__sep} aria-hidden="true">·</span>

          {/* Cursor Position & Selection */}
          <span className={styles.statusBar__item}>
            Ln {cursorPos.line}, Col {cursorPos.col}
            {selectionCount > 0 && (
              <span className={styles.statusBar__selection}> ({selectionCount} sel)</span>
            )}
          </span>

          <span className={styles.statusBar__sep} aria-hidden="true">·</span>

          {/* Indentation */}
          <span className={styles.statusBar__item}>Spaces: 4</span>

          <span className={styles.statusBar__sep} aria-hidden="true">·</span>

          {/* Encoding & Language */}
          <span className={styles.statusBar__item}>UTF-8</span>

          <span className={styles.statusBar__sep} aria-hidden="true">·</span>

          <span className={styles.statusBar__item}>{currentLang.label}</span>

          {traceResult && (
            <>
              <span className={styles.statusBar__sep} aria-hidden="true">·</span>
              <span className={styles.statusBar__item}>
                Trace: Step {currentStepIndex + 1}/{traceResult.steps.length}
              </span>
            </>
          )}
        </div>

        <div className={styles.statusBar__right}>
          <span className={styles.statusBar__item}>Timeout: {timeoutMs / 1000}s</span>

          <span className={styles.statusBar__sep} aria-hidden="true">·</span>

          {/* Maximize / Restore Editor Button */}
          <button
            className={styles.statusBar__btn}
            onClick={toggleEditorMaximize}
            title={isEditorMaximized ? 'Restore side-by-side tools panel' : 'Maximize editor (hide panel)'}
            aria-label={isEditorMaximized ? 'Restore side-by-side tools panel' : 'Maximize editor (hide panel)'}
          >
            {isEditorMaximized ? <Columns size={12} /> : <Maximize2 size={12} />}
            <span>{isEditorMaximized ? 'Restore Panel' : 'Full Editor'}</span>
          </button>

          <span className={styles.statusBar__sep} aria-hidden="true">·</span>

          {/* Export File Button */}
          <button
            className={styles.statusBar__btn}
            title="Export code file"
            aria-label="Download code file"
            onClick={handleExportFile}
          >
            <Download size={12} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ---- Command Palette Modal (Ctrl+Shift+P / ⌘K) ---- */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={paletteCommands}
      />
    </div>
  )
}
