// ============================================================================
// CodeCraft — CodeRefine Interactive Workspace Component (Redesigned)
// "Write better. Understand why."
// ============================================================================

import React, { useState, useMemo, useRef } from 'react'
import Editor from '@monaco-editor/react'
import {
  Sparkles,
  Zap,
  Minimize2,
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Check,
  GitCompare,
  ShieldCheck,
  Info,
  ChevronDown,
} from 'lucide-react'
import {
  CURATED_REFINE_EXAMPLES,
  refineService,
  executeRefineVerification,
  type RefineGoal,
  type RefineAnalysisResponse,
  type RefineVerificationResult,
  type RefineHintResponse,
} from '../../../services/refine'
import { PyodideService } from '../../../services/pyodide/pyodideService'
import styles from './CodeRefineWorkspace.module.css'

interface CodeRefineWorkspaceProps {
  currentStudioCode: string
  onAcceptChanges: (improvedCode: string) => void
  onUndoAccepted?: () => void
  canUndo?: boolean
  onClose: () => void
  pyodideService?: PyodideService
  fontSize?: number
}

type RefineMode = 'ai' | 'manual'
type ComparisonTab = 'changes' | 'explanation' | 'tests' | 'tradeoffs'

interface SimpleDiffLine {
  type: 'added' | 'removed' | 'unchanged'
  text: string
  lineNoOrig?: number
  lineNoImpr?: number
}

// Compute clean line-based diff between original and improved code
function computeLineDiff(original: string, improved: string): SimpleDiffLine[] {
  const origLines = original.split('\n')
  const imprLines = improved.split('\n')
  const diff: SimpleDiffLine[] = []

  let i = 0
  let j = 0

  while (i < origLines.length || j < imprLines.length) {
    if (i < origLines.length && j < imprLines.length && origLines[i] === imprLines[j]) {
      diff.push({
        type: 'unchanged',
        text: origLines[i],
        lineNoOrig: i + 1,
        lineNoImpr: j + 1,
      })
      i++
      j++
    } else if (j < imprLines.length && !origLines.slice(i, i + 5).includes(imprLines[j])) {
      diff.push({
        type: 'added',
        text: imprLines[j],
        lineNoImpr: j + 1,
      })
      j++
    } else if (i < origLines.length) {
      diff.push({
        type: 'removed',
        text: origLines[i],
        lineNoOrig: i + 1,
      })
      i++
    } else {
      diff.push({
        type: 'added',
        text: imprLines[j],
        lineNoImpr: j + 1,
      })
      j++
    }
  }

  return diff
}

const defineCodecraftMonacoTheme = (monaco: Parameters<NonNullable<React.ComponentProps<typeof Editor>['beforeMount']>>[0]) => {
  monaco.editor.defineTheme('codecraft', {
    base: 'vs-dark',
    inherit: true,
    rules: [
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
    ],
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
}

export const CodeRefineWorkspace: React.FC<CodeRefineWorkspaceProps> = ({
  currentStudioCode,
  onAcceptChanges,
  onUndoAccepted,
  canUndo = false,
  onClose,
  pyodideService,
  fontSize = 14,
}) => {
  // 1. Source Tracking (Never automatically overwrite Studio code)
  const [sourceType, setSourceType] = useState<'studio' | 'example'>('studio')
  const [sourceName, setSourceName] = useState<string>('Studio Code')

  // 2. Mode: AI Assistance (Default) vs. Manual Practice
  const [mode, setMode] = useState<RefineMode>('ai')

  // 3. Code state (Dual Editors)
  const [originalCode, setOriginalCode] = useState<string>(currentStudioCode || '')
  const [improvedCode, setImprovedCode] = useState<string>(currentStudioCode || '')
  const improvedEditorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null)

  // 4. Selected Improvement Goal (Performance Optimization vs Easy to Understand)
  const [selectedGoal, setSelectedGoal] = useState<RefineGoal>('performance')

  // 5. Active results tab
  const [activeTab, setActiveTab] = useState<ComparisonTab>('explanation')

  // 6. AI Analysis state
  const [isRefining, setIsRefining] = useState<boolean>(false)
  const [analysis, setAnalysis] = useState<RefineAnalysisResponse | null>(null)
  const [refineError, setRefineError] = useState<string | null>(null)

  // 7. Manual Hints state
  const [hintLevel, setHintLevel] = useState<number>(0)
  const [currentHint, setCurrentHint] = useState<RefineHintResponse | null>(null)
  const [isLoadingHint, setIsLoadingHint] = useState<boolean>(false)

  // 8. Verification state
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [verification, setVerification] = useState<RefineVerificationResult | null>(null)

  // 9. Confirmation Modal for Accept
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false)

  // 10. Copy feedback state
  const [copiedImproved, setCopiedImproved] = useState<boolean>(false)

  const handleCopyImprovedCode = async () => {
    if (!improvedCode) return
    try {
      await navigator.clipboard.writeText(improvedCode)
      setCopiedImproved(true)
      setTimeout(() => setCopiedImproved(false), 2000)
    } catch {
      // Fallback if clipboard API is restricted
      setCopiedImproved(false)
    }
  }

  // Use current studio code as source
  const handleUseStudioCode = () => {
    setSourceType('studio')
    setSourceName('Studio Code')
    setOriginalCode(currentStudioCode)
    setImprovedCode(currentStudioCode)
    setAnalysis(null)
    setVerification(null)
    setHintLevel(0)
    setCurrentHint(null)
    setRefineError(null)
  }

  // Load curated Python example as source
  const handleLoadExample = (exampleId: string) => {
    const ex = CURATED_REFINE_EXAMPLES.find((e) => e.id === exampleId)
    if (!ex) return
    setSourceType('example')
    setSourceName(ex.title)
    setOriginalCode(ex.originalCode)
    setImprovedCode(ex.originalCode)
    setSelectedGoal(ex.suggestedGoal)
    setAnalysis(null)
    setVerification(null)
    setHintLevel(0)
    setCurrentHint(null)
    setRefineError(null)
  }

  // Trigger AI Refinement
  const handleRefineCode = async () => {
    if (!originalCode.trim()) return

    setIsRefining(true)
    setRefineError(null)

    try {
      const res = await refineService.refineCode({
        code: originalCode,
        goal: selectedGoal,
      })

      setAnalysis(res)
      setImprovedCode(res.improvedCode)
      setActiveTab('explanation')
    } catch (err: unknown) {
      setRefineError((err as Error).message || 'Failed to refine code.')
    } finally {
      setIsRefining(false)
    }
  }

  // Request progressive hint in Manual Mode
  const handleRequestNextHint = async () => {
    const nextLevel = Math.min(hintLevel + 1, 3)
    setIsLoadingHint(true)
    try {
      if (analysis && analysis.progressiveHints && analysis.progressiveHints[nextLevel - 1]) {
        setCurrentHint({
          hintLevel: nextLevel,
          hint: analysis.progressiveHints[nextLevel - 1],
          nextAvailable: nextLevel < 3,
        })
        setHintLevel(nextLevel)
      } else {
        const hintRes = await refineService.getHint({
          code: originalCode,
          goal: selectedGoal,
          hintLevel: nextLevel,
        })
        setCurrentHint(hintRes)
        setHintLevel(nextLevel)
      }
    } catch (err) {
      console.warn('Hint request error:', err)
    } finally {
      setIsLoadingHint(false)
    }
  }

  // Run Behaviour Verification Tests using Pyodide
  const handleRunVerification = async () => {
    setIsVerifying(true)
    setActiveTab('tests')
    try {
      const res = await executeRefineVerification(
        originalCode,
        improvedCode,
        pyodideService,
        12000
      )
      setVerification(res)
    } catch (err) {
      console.warn('Verification failed:', err)
    } finally {
      setIsVerifying(false)
    }
  }

  // Accept improved code into main Studio
  const handleConfirmAccept = () => {
    const finalCode = improvedEditorRef.current?.getValue() ?? improvedCode
    onAcceptChanges(finalCode)
    setShowAcceptModal(false)
  }

  // Reset improved editor back to original code
  const handleRejectSuggestion = () => {
    setImprovedCode(originalCode)
    setAnalysis(null)
    setVerification(null)
  }

  // Reset both editors to current selected source
  const handleResetSource = () => {
    setImprovedCode(originalCode)
    setAnalysis(null)
    setVerification(null)
    setHintLevel(0)
    setCurrentHint(null)
    setRefineError(null)
  }

  // Compute live line-based diff
  const diffLines = useMemo(() => {
    return computeLineDiff(originalCode, improvedCode)
  }, [originalCode, improvedCode])

  const diffCounts = useMemo(() => {
    const added = diffLines.filter((l) => l.type === 'added').length
    const removed = diffLines.filter((l) => l.type === 'removed').length
    return { added, removed }
  }, [diffLines])

  const origLineCount = originalCode.split('\n').length
  const imprLineCount = improvedCode.split('\n').length
  const hasChanges = improvedCode !== originalCode

  return (
    <div className={styles.refineWorkspace} aria-label="CodeRefine Workspace">
      {/* --------------------------------------------------------------------
         1. Compact Header with Discoverable Identity & Quick Exit
         -------------------------------------------------------------------- */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.brandEmblem} aria-hidden="true">
            <Sparkles size={16} strokeWidth={2} />
          </div>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <span className={styles.title}>CodeRefine</span>
              <span className={styles.tagline}>Write better. Understand why.</span>
            </div>
            <span className={styles.subtitle}>
              Interactive AI refinement workspace to polish your Python code, understand trade-offs, and verify behavior.
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.returnBtn}
            onClick={onClose}
            title="Return to standard Code Studio editor"
          >
            <ArrowLeft size={13} />
            Back to Studio
          </button>
        </div>
      </header>

      {/* --------------------------------------------------------------------
         2. Three-Step Workflow Card (Clean, Compact, Beginner-Friendly)
         -------------------------------------------------------------------- */}
      <section className={styles.workflowCard} aria-label="Refine Setup">
        {/* Source Selector Toolbar */}
        <div className={styles.sourceBar}>
          <div className={styles.sourceControlsRow}>
            <span className={styles.sourceLabel}>Working on:</span>
            <button
              type="button"
              className={`${styles.sourceBtn} ${sourceType === 'studio' ? styles.sourceBtnActive : ''}`}
              onClick={handleUseStudioCode}
              title="Load code currently in the Code Studio main editor"
            >
              <Copy size={12} />
              Current Studio Code
            </button>

            <select
              className={styles.exampleSelect}
              value={sourceType === 'example' ? '' : ''}
              onChange={(e) => {
                if (e.target.value) {
                  handleLoadExample(e.target.value)
                }
              }}
              aria-label="Load Curated Python Example"
            >
              <option value="" disabled>
                Load Curated Example...
              </option>
              {CURATED_REFINE_EXAMPLES.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <span className={styles.sourceBadge} title="Active source being refined">
            Source: {sourceType === 'studio' ? 'Current Studio Code' : sourceName}
          </span>
        </div>

        {/* STEP 1: CHOOSE IMPROVEMENT GOAL (3 Equal Compact Cards) */}
        <div className={styles.goalSection}>
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge}>1</span>
            <span className={styles.stepTitle}>Choose Improvement Goal</span>
          </div>

          <div className={styles.threeGoalsGrid} role="radiogroup" aria-label="Improvement Goal">
            {/* Option 1: Performance Optimization */}
            <button
              type="button"
              role="radio"
              aria-checked={selectedGoal === 'performance'}
              className={`${styles.goalCard} ${selectedGoal === 'performance' ? styles.goalCardActive : ''}`}
              onClick={() => setSelectedGoal('performance')}
              title="Performance Optimization: Focus on execution efficiency, identify inefficient operations, and avoid unnecessary computations."
            >
              <div className={styles.goalCardTop}>
                <div className={styles.goalCardIconBox}>
                  <Zap size={14} className={styles.goalCardIcon} />
                </div>
                <span className={styles.goalCardTitle}>Performance Optimization</span>
                {selectedGoal === 'performance' && (
                  <span className={styles.activeCheck} aria-hidden="true">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                )}
              </div>
              <p className={styles.goalCardDesc}>
                Make code more efficient by identifying unnecessary computations and improving algorithmic efficiency where meaningful.
              </p>
            </button>

            {/* Option 2: Easy to Understand */}
            <button
              type="button"
              role="radio"
              aria-checked={selectedGoal === 'easy_to_understand'}
              className={`${styles.goalCard} ${selectedGoal === 'easy_to_understand' ? styles.goalCardActive : ''}`}
              onClick={() => setSelectedGoal('easy_to_understand')}
              title="Easy to Understand: Make code cleaner, simpler, and easier for beginners to understand."
            >
              <div className={styles.goalCardTop}>
                <div className={styles.goalCardIconBox}>
                  <Sparkles size={14} className={styles.goalCardIcon} />
                </div>
                <span className={styles.goalCardTitle}>Easy to Understand</span>
                {selectedGoal === 'easy_to_understand' && (
                  <span className={styles.activeCheck} aria-hidden="true">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                )}
              </div>
              <p className={styles.goalCardDesc}>
                Make code cleaner, simpler and easier for beginners to understand with descriptive names and clean logic.
              </p>
            </button>

            {/* Option 3: Shortest Code */}
            <button
              type="button"
              role="radio"
              aria-checked={selectedGoal === 'shortest_code'}
              className={`${styles.goalCard} ${selectedGoal === 'shortest_code' ? styles.goalCardActive : ''}`}
              onClick={() => setSelectedGoal('shortest_code')}
              title="Shortest Code: Simplify your code and find a shorter way to achieve the same result without unnecessary lines or repetition."
            >
              <div className={styles.goalCardTop}>
                <div className={styles.goalCardIconBox}>
                  <Minimize2 size={14} className={styles.goalCardIcon} />
                </div>
                <span className={styles.goalCardTitle}>Shortest Code</span>
                {selectedGoal === 'shortest_code' && (
                  <span className={styles.activeCheck} aria-hidden="true">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                )}
              </div>
              <p className={styles.goalCardDesc}>
                Simplify your code and find a shorter way to achieve the same result. Remove unnecessary lines and intermediate steps safely.
              </p>
            </button>
          </div>
        </div>

        {/* STEP 2 & 3: Mode Selection and Primary Action in Balanced Horizontal Flow */}
        <div className={styles.controlRow}>
          <div className={styles.modeControlArea}>
            <div className={styles.stepHeader}>
              <span className={styles.stepBadge}>2</span>
              <span className={styles.stepTitle}>Choose Mode</span>
            </div>
            <div className={styles.modeSegmented} role="radiogroup" aria-label="Improvement mode">
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'ai'}
                className={`${styles.modeSegment} ${mode === 'ai' ? styles.modeSegmentActive : ''}`}
                onClick={() => setMode('ai')}
                title="AI Assistance: AI generates an improved version based on the selected goal and explains meaningful changes."
              >
                <Sparkles size={13} />
                <span>AI Assistance</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'manual'}
                className={`${styles.modeSegment} ${mode === 'manual' ? styles.modeSegmentActive : ''}`}
                onClick={() => setMode('manual')}
                title="Manual Practice: User improves their own code with progressive hints without immediately receiving the complete solution."
              >
                <Lightbulb size={13} />
                <span>Manual Practice</span>
              </button>
            </div>
            <span className={styles.modeExplainer}>
              {mode === 'ai'
                ? 'AI generates an improved version and explains changes.'
                : 'Improve code yourself with progressive hints.'}
            </span>
          </div>

          <div className={styles.actionControlArea}>
            <div className={styles.stepHeader}>
              <span className={styles.stepBadge}>3</span>
              <span className={styles.stepTitle}>Improve Code</span>
            </div>
            {mode === 'ai' ? (
              <button
                type="button"
                className={styles.improveBtnPrimary}
                onClick={handleRefineCode}
                disabled={isRefining || !originalCode.trim()}
              >
                {isRefining ? (
                  <>
                    <span className={styles.spinnerIcon} aria-hidden="true" />
                    <span>Refining Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>{analysis ? 'Re-analyze & Improve' : 'Improve Code with AI'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className={styles.hintBtnPrimary}
                onClick={handleRequestNextHint}
                disabled={isLoadingHint || hintLevel >= 3}
              >
                {isLoadingHint ? (
                  <>
                    <span className={styles.spinnerIcon} aria-hidden="true" />
                    <span>Generating Hint...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb size={14} />
                    <span>{hintLevel === 0 ? 'Practice Improving' : `Next Hint (${hintLevel}/3)`}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Manual Mode Hint Notification */}
      {mode === 'manual' && currentHint && (
        <aside className={styles.hintBanner} aria-label="Progressive Hint">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className={styles.hintBadge}>
              Progressive Hint · Level {currentHint.hintLevel}/3
              {currentHint.focusArea ? ` · Focus: ${currentHint.focusArea}` : ''}
            </span>
            <div className={styles.hintText}>{currentHint.hint}</div>
          </div>
          {currentHint.nextAvailable && (
            <button
              type="button"
              className={styles.sourceBtn}
              onClick={handleRequestNextHint}
              disabled={isLoadingHint}
            >
              <Lightbulb size={12} />
              Next Hint
            </button>
          )}
        </aside>
      )}

      {/* Error Notification */}
      {refineError && (
        <aside className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} />
            <span>{refineError}</span>
          </div>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={handleRefineCode}
            disabled={isRefining}
          >
            <RotateCcw size={12} />
            Retry
          </button>
        </aside>
      )}

      {/* --------------------------------------------------------------------
         3. Dual Monaco Editors Area (Desktop 50/50, Height 400px, Stacks on Mobile)
         -------------------------------------------------------------------- */}
      <section className={styles.editorsContainer} aria-label="Side-by-side Editors">
        {/* Left Editor: Original Code (Read-Only) */}
        <div className={styles.editorColumn}>
          <div className={styles.editorHeader}>
            <div className={styles.editorTitleGroup}>
              <span className={styles.editorTitle}>Original Code</span>
              <span className={styles.badgeReadOnly}>Read-Only</span>
            </div>
            <span className={styles.lineCount}>{origLineCount} lines</span>
          </div>
          <div className={styles.editorBody}>
            <Editor
              height="100%"
              language="python"
              theme="codecraft"
              beforeMount={defineCodecraftMonacoTheme}
              value={originalCode}
              options={{
                readOnly: true,
                fontSize,
                lineHeight: Math.round(fontSize * 1.6),
                fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                automaticLayout: true,
                renderWhitespace: 'selection',
                folding: true,
                padding: { top: 10, bottom: 10 },
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  alwaysConsumeMouseWheel: false,
                },
              }}
            />
          </div>
        </div>

        {/* Right Editor: Improved Code (Editable) */}
        <div className={styles.editorColumn}>
          <div className={styles.editorHeader}>
            <div className={styles.editorTitleGroup}>
              <span className={styles.editorTitle}>Improved Code</span>
              <span className={styles.badgeEditable}>Editable</span>
              {diffCounts.added > 0 && (
                <span className={styles.diffStatAdded}>+{diffCounts.added}</span>
              )}
              {diffCounts.removed > 0 && (
                <span className={styles.diffStatRemoved}>-{diffCounts.removed}</span>
              )}
            </div>
            <span className={styles.lineCount}>{imprLineCount} lines</span>
          </div>
          <div className={styles.editorBody}>
            <Editor
              height="100%"
              language="python"
              theme="codecraft"
              beforeMount={defineCodecraftMonacoTheme}
              value={improvedCode}
              onChange={(newVal) => setImprovedCode(newVal || '')}
              onMount={(ed) => {
                improvedEditorRef.current = ed as import('monaco-editor').editor.IStandaloneCodeEditor
              }}
              options={{
                readOnly: false,
                fontSize,
                lineHeight: Math.round(fontSize * 1.6),
                fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                automaticLayout: true,
                renderWhitespace: 'selection',
                folding: true,
                padding: { top: 10, bottom: 10 },
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  alwaysConsumeMouseWheel: false,
                },
              }}
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
         4. Action Bar (Grouped Primary & Secondary Actions)
         -------------------------------------------------------------------- */}
      <section className={styles.actionBar} aria-label="Action Controls">
        <div className={styles.actionGroupPrimary}>
          <button
            type="button"
            className={styles.actionBtnAccept}
            onClick={() => setShowAcceptModal(true)}
            disabled={!hasChanges && !analysis}
            title="Accept improved code into main Code Studio editor"
          >
            <Check size={14} />
            <span>Accept Changes</span>
          </button>

          <button
            type="button"
            className={styles.actionBtnPrimary}
            onClick={handleRefineCode}
            disabled={isRefining || !originalCode.trim()}
          >
            {isRefining ? (
              <>
                <span className={styles.spinnerIcon} aria-hidden="true" />
                <span>Refining...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>{analysis ? 'Re-analyze' : 'Improve Code'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={styles.actionBtnTests}
            onClick={handleRunVerification}
            disabled={isVerifying}
            title="Execute test cases on both versions inside Pyodide WebAssembly"
          >
            <ShieldCheck size={13} />
            <span>{isVerifying ? 'Running Tests...' : 'Run Behaviour Tests'}</span>
          </button>
        </div>

        <div className={styles.actionGroupSecondary}>
          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={handleCopyImprovedCode}
            disabled={!improvedCode}
            title="Copy improved code to clipboard"
          >
            {copiedImproved ? <Check size={13} color="#7EC786" /> : <Copy size={13} />}
            <span>{copiedImproved ? 'Copied' : 'Copy Improved Code'}</span>
          </button>

          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={() => setActiveTab('changes')}
            title="Inspect line differences"
          >
            <GitCompare size={13} />
            <span>Compare Diff</span>
          </button>

          {hasChanges && (
            <button
              type="button"
              className={styles.actionBtnSecondary}
              onClick={handleRejectSuggestion}
              title="Reset improved editor back to original code"
            >
              <XCircle size={13} />
              <span>Reject Suggestion</span>
            </button>
          )}

          {canUndo && onUndoAccepted && (
            <button
              type="button"
              className={styles.actionBtnSecondary}
              onClick={onUndoAccepted}
              title="Undo previously accepted changes and restore Studio code"
            >
              <RotateCcw size={12} />
              <span>Undo Accepted</span>
            </button>
          )}

          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={handleResetSource}
            title="Reset editors to loaded source"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </section>

      {/* --------------------------------------------------------------------
         5. Results Section (Full Natural Height, NO Nested Scroll Trap)
         -------------------------------------------------------------------- */}
      <section className={styles.resultsSection} aria-label="Refine Analysis and Results">
        <div className={styles.resultsTabBar} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'explanation'}
            className={`${styles.resultsTab} ${activeTab === 'explanation' ? styles.resultsTabActive : ''}`}
            onClick={() => setActiveTab('explanation')}
          >
            <BookOpen size={13} />
            <span>Explanation</span>
            {analysis?.changes && analysis.changes.length > 0 && (
              <span className={styles.tabCountBadge}>{analysis.changes.length}</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'changes'}
            className={`${styles.resultsTab} ${activeTab === 'changes' ? styles.resultsTabActive : ''}`}
            onClick={() => setActiveTab('changes')}
          >
            <GitCompare size={13} />
            <span>Changes</span>
            {(diffCounts.added > 0 || diffCounts.removed > 0) && (
              <span className={styles.tabCountBadge}>
                +{diffCounts.added} -{diffCounts.removed}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tests'}
            className={`${styles.resultsTab} ${activeTab === 'tests' ? styles.resultsTabActive : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            <ShieldCheck size={13} />
            <span>Verification Tests</span>
            {verification && (
              <span
                className={styles.tabCountBadge}
                style={{
                  background: verification.areOutputsIdentical
                    ? 'rgba(72, 160, 96, 0.2)'
                    : 'rgba(224, 108, 117, 0.2)',
                  color: verification.areOutputsIdentical ? '#7EC786' : '#E06C75',
                }}
              >
                {verification.passedCount}/{verification.totalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tradeoffs'}
            className={`${styles.resultsTab} ${activeTab === 'tradeoffs' ? styles.resultsTabActive : ''}`}
            onClick={() => setActiveTab('tradeoffs')}
          >
            <Info size={13} />
            <span>Trade-Offs & Insights</span>
          </button>
        </div>

        <div className={styles.resultsBody}>
          {/* TAB 1: EXPLANATION (Collapsible details cards answering What, Why, How, Benefits, Trade-offs) */}
          {activeTab === 'explanation' && (
            <div className={styles.explanationContainer}>
              {analysis ? (
                <>
                  <div className={styles.summaryCallout}>
                    <strong>Refinement Summary:</strong> {analysis.summary}
                    {analysis.isAlreadyClean && (
                      <div style={{ marginTop: 6, color: '#D8B58B' }}>
                        ✓ This code is already clean and idiomatic for the selected goal. Only minor polish adjustments were suggested.
                      </div>
                    )}
                  </div>

                  {analysis.changes && analysis.changes.length > 0 ? (
                    analysis.changes.map((change, idx) => (
                      <details key={change.id || idx} open className={styles.changeCard}>
                        <summary className={styles.changeCardSummary}>
                          <div className={styles.changeCardHeaderLeft}>
                            <span className={styles.changeIndexBadge}>Change #{idx + 1}</span>
                            <span className={styles.changeCardTitle}>{change.whatChanged}</span>
                          </div>
                          <ChevronDown size={14} color="#8C8477" />
                        </summary>

                        <div className={styles.changeCardBody}>
                          {/* Side-by-side snippet preview */}
                          {(change.originalSnippet || change.improvedSnippet) && (
                            <div className={styles.snippetComparisonGrid}>
                              {change.originalSnippet && (
                                <div className={styles.snippetBox}>
                                  <div className={styles.snippetBoxHeader}>Original</div>
                                  <pre className={styles.snippetBoxCode}>
                                    {change.originalSnippet.trim()}
                                  </pre>
                                </div>
                              )}
                              {change.improvedSnippet && (
                                <div className={styles.snippetBox}>
                                  <div className={styles.snippetBoxHeader} style={{ color: '#D8B58B' }}>
                                    Improved
                                  </div>
                                  <pre className={styles.snippetBoxCode} style={{ color: '#F4F0E8' }}>
                                    {change.improvedSnippet.trim()}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 1. Why was it changed? */}
                          <div className={styles.qaItem}>
                            <span className={styles.qaQuestion}>Why was it changed?</span>
                            <span className={styles.qaAnswer}>{change.whyChanged}</span>
                          </div>

                          {/* 2. How does it work under the hood? */}
                          <div className={styles.qaItem}>
                            <span className={styles.qaQuestion}>How does it work under the hood?</span>
                            <span className={styles.qaAnswer}>{change.howItWorks}</span>
                          </div>

                          {/* 3. Concrete benefit */}
                          <div className={styles.qaItem}>
                            <span className={styles.qaQuestion}>Why is this useful?</span>
                            <span className={styles.qaAnswer}>{change.benefit}</span>
                          </div>

                          {/* 4. Limitation or Trade-off */}
                          {change.tradeOff && (
                            <div className={styles.qaItem}>
                              <span className={styles.qaQuestion} style={{ color: '#C8996C' }}>
                                Trade-off or Limitation
                              </span>
                              <span className={styles.qaAnswer}>{change.tradeOff}</span>
                            </div>
                          )}
                        </div>
                      </details>
                    ))
                  ) : (
                    <div style={{ color: '#8C8477', fontStyle: 'italic', padding: '12px 0' }}>
                      No individual change breakdown reported. The code structure remains clean.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#8C8477' }}>
                  <Sparkles size={28} style={{ marginBottom: 10, opacity: 0.5, color: '#D8B58B' }} />
                  <p style={{ margin: '0 0 12px 0', fontSize: '13.5px' }}>
                    Click <strong>"Improve Code"</strong> above to generate a beginner-friendly breakdown of what changed, why, and how.
                  </p>
                  <button
                    type="button"
                    className={styles.actionBtnPrimary}
                    onClick={handleRefineCode}
                    disabled={isRefining || !originalCode.trim()}
                  >
                    <Sparkles size={13} />
                    <span>Improve Code Now</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHANGES (Line Diff View) */}
          {activeTab === 'changes' && (
            <div className={styles.diffContainer}>
              <div className={styles.diffSummaryBanner}>
                <span>Line Diff Summary:</span>
                <span className={styles.diffStatAdded}>+{diffCounts.added} added</span>
                <span className={styles.diffStatRemoved}>-{diffCounts.removed} removed</span>
                {diffCounts.added === 0 && diffCounts.removed === 0 && (
                  <span style={{ color: '#8C8477' }}>(Original and improved code are identical)</span>
                )}
              </div>

              <div className={styles.diffCodeBox}>
                {diffLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`${styles.diffLine} ${
                      line.type === 'added'
                        ? styles.diffLineAdded
                        : line.type === 'removed'
                        ? styles.diffLineRemoved
                        : styles.diffLineUnchanged
                    }`}
                  >
                    <span className={styles.diffLineSign}>
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    <span>{line.text || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VERIFICATION TESTS (Pyodide Test Execution) */}
          {activeTab === 'tests' && (
            <div className={styles.testsContainer}>
              {verification ? (
                <>
                  <div
                    className={`${styles.testResultBanner} ${
                      verification.areOutputsIdentical
                        ? styles.testResultPass
                        : styles.testResultFail
                    }`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {verification.areOutputsIdentical ? (
                        <CheckCircle2 size={18} color="#7EC786" />
                      ) : (
                        <AlertTriangle size={18} color="#E06C75" />
                      )}
                      <div>
                        <strong>{verification.summary}</strong>
                        <div style={{ fontSize: '11.5px', color: '#B9B2A7', marginTop: 2 }}>
                          {verification.limitationsNote}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.sourceBtn}
                      onClick={handleRunVerification}
                      disabled={isVerifying}
                    >
                      <RotateCcw size={12} />
                      Re-run Tests
                    </button>
                  </div>

                  {verification.testCases.map((tc) => (
                    <div key={tc.id} className={styles.testCaseCard}>
                      <div className={styles.testCaseHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {tc.passed ? (
                            <CheckCircle2 size={15} color="#7EC786" />
                          ) : (
                            <XCircle size={15} color="#E06C75" />
                          )}
                          <span style={{ fontWeight: 600, fontSize: '12.5px' }}>
                            {tc.description}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#8C8477' }}>
                          Orig: {tc.executionTimeMs.original}ms · Impr: {tc.executionTimeMs.improved}ms
                        </span>
                      </div>

                      <div className={styles.testOutputsRow}>
                        <div className={styles.testOutputCol}>
                          <span className={styles.testOutputLabel}>Original Output</span>
                          <div className={styles.testOutputVal}>
                            {tc.originalOutput || '(No stdout produced)'}
                          </div>
                        </div>

                        <div className={styles.testOutputCol}>
                          <span className={styles.testOutputLabel}>Improved Output</span>
                          <div
                            className={styles.testOutputVal}
                            style={{
                              borderColor: tc.passed
                                ? 'rgba(72, 160, 96, 0.3)'
                                : 'rgba(224, 108, 117, 0.3)',
                            }}
                          >
                            {tc.improvedOutput || '(No stdout produced)'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#8C8477' }}>
                  <ShieldCheck size={28} style={{ marginBottom: 10, opacity: 0.5, color: '#D8B58B' }} />
                  <p style={{ margin: '0 0 12px 0', fontSize: '13.5px' }}>
                    Run behaviour verification to execute both versions with identical test inputs in Pyodide WebAssembly.
                  </p>
                  <button
                    type="button"
                    className={styles.actionBtnTests}
                    onClick={handleRunVerification}
                    disabled={isVerifying}
                  >
                    <Play size={13} />
                    <span>{isVerifying ? 'Verifying in Pyodide...' : 'Run Behaviour Tests'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRADE-OFFS & INSIGHTS */}
          {activeTab === 'tradeoffs' && (
            <div className={styles.tradeOffsContainer}>
              {analysis ? (
                <>
                  <div className={styles.tradeOffCard}>
                    <span className={styles.tradeOffTitle}>Benefits of this Refinement</span>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                      {analysis.benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.tradeOffCard}>
                    <span className={styles.tradeOffTitle}>Limitations & Considerations</span>
                    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                      {analysis.tradeOffs.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {analysis.behaviourNotes && (
                    <div className={styles.tradeOffCard} style={{ gridColumn: '1 / -1' }}>
                      <span className={styles.tradeOffTitle}>Behaviour Preservation Notes</span>
                      <p style={{ margin: 0, color: '#D5CFC5' }}>{analysis.behaviourNotes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#8C8477', gridColumn: '1 / -1' }}>
                  <Info size={28} style={{ marginBottom: 10, opacity: 0.5, color: '#D8B58B' }} />
                  <p>Trade-offs and architectural considerations will appear here once code is refined.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------------------
         6. Confirmation Modal for "Accept Changes"
         -------------------------------------------------------------------- */}
      {showAcceptModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard} role="dialog" aria-modal="true">
            <span className={styles.modalTitle}>Accept CodeRefine Changes?</span>
            <p className={styles.modalText}>
              This will update your main Code Studio editor with the improved code.
              A checkpoint of your previous code will be saved so you can click <strong>Undo Refine</strong> at any time.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.sourceBtn}
                onClick={() => setShowAcceptModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.actionBtnAccept}
                onClick={handleConfirmAccept}
              >
                <Check size={14} />
                Confirm & Replace Studio Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
