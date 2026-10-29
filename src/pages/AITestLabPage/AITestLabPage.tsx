import { useState } from 'react'
import {
  FlaskConical,
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
  Info,
} from 'lucide-react'
import { Button, Badge, Tabs, EmptyState } from '../../components'
import type { TestCase, TestCaseStatus, Language } from '../../types'
import styles from './AITestLabPage.module.css'

// ---- Seed data (static, no execution) ----
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

const STATUS_META: Record<TestCaseStatus, { label: string; icon: typeof Circle; badge: 'default' | 'success' | 'error' | 'warning' | 'info' }> = {
  idle:    { label: 'Idle',    icon: Circle,       badge: 'default' },
  running: { label: 'Running', icon: Clock,        badge: 'info' },
  passed:  { label: 'Passed',  icon: CheckCircle2, badge: 'success' },
  failed:  { label: 'Failed',  icon: XCircle,      badge: 'error' },
  error:   { label: 'Error',   icon: AlertCircle,  badge: 'warning' },
}

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'python',     label: 'Python 3.12' },
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
  const [tests, setTests] = useState<TestCase[]>(SEED_TESTS)
  const [language, setLanguage] = useState<Language>('python')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<NewTestForm>(DEFAULT_FORM)
  const [formErrors, setFormErrors] = useState<Partial<NewTestForm>>({})

  const configTabs = [
    { id: 'config', label: 'Configuration' },
    { id: 'results', label: 'Results' },
  ]

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleRunAll = () => {
    // Honest: show "not wired" state, don't fake execution
    setTests((prev) =>
      prev.map((t) => ({
        ...t,
        status: 'idle' as TestCaseStatus,
        actualOutput: undefined,
      }))
    )
  }

  const handleDelete = (id: string) => {
    setTests((prev) => prev.filter((t) => t.id !== id))
  }

  const validateForm = (): boolean => {
    const errors: Partial<NewTestForm> = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.input.trim()) errors.input = 'Input is required'
    if (!form.expectedOutput.trim()) errors.expectedOutput = 'Expected output is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddTest = () => {
    if (!validateForm()) return
    const newTest: TestCase = {
      id: `tc-${Date.now()}`,
      name: form.name.trim(),
      input: form.input.trim(),
      expectedOutput: form.expectedOutput.trim(),
      status: 'idle',
    }
    setTests((prev) => [...prev, newTest])
    setForm(DEFAULT_FORM)
    setFormErrors({})
    setShowAddForm(false)
  }

  const idleCt  = tests.filter((t) => t.status === 'idle').length
  const passCt  = tests.filter((t) => t.status === 'passed').length
  const failCt  = tests.filter((t) => t.status === 'failed').length

  return (
    <div className={styles.page}>
      {/* ---- Page header ---- */}
      <div className={styles.header}>
        <div className={styles.header__inner}>
          <div className={styles.header__titleRow}>
            <div className={styles.header__icon}>
              <FlaskConical size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className={styles.header__title}>AI Test Lab</h1>
              <p className={styles.header__subtitle}>
                Define test cases, configure the runner, and review results.
                AI execution connects in Phase 2.
              </p>
            </div>
          </div>

          <div className={styles.header__actions}>
            <div className={styles.header__langSelect}>
              <label htmlFor="lab-language" className={styles.header__langLabel}>Language</label>
              <select
                id="lab-language"
                className={styles.header__langControl}
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <Button
              id="run-all-tests-btn"
              variant="primary"
              size="sm"
              iconLeft={<Play size={14} />}
              onClick={handleRunAll}
              disabled={tests.length === 0}
            >
              Run All
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.stat__val}>{tests.length}</span>
            <span className={styles.stat__label}>Total</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.stat}>
            <span className={`${styles.stat__val} ${styles['stat__val--success']}`}>{passCt}</span>
            <span className={styles.stat__label}>Passed</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.stat}>
            <span className={`${styles.stat__val} ${styles['stat__val--error']}`}>{failCt}</span>
            <span className={styles.stat__label}>Failed</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.stat}>
            <span className={styles.stat__val}>{idleCt}</span>
            <span className={styles.stat__label}>Pending</span>
          </div>
        </div>
      </div>

      {/* ---- Main tabs ---- */}
      <div className={styles.body}>
        <Tabs tabs={configTabs} defaultTab="config">
          {(activeTab) => (
            <>
              {/* ======== Configuration tab ======== */}
              {activeTab === 'config' && (
                <div className={styles.configTab}>
                  {/* Phase 2 notice */}
                  <div className={styles.notice} role="note">
                    <Info size={14} />
                    <span>
                      <strong>Phase 1:</strong> Test cases can be defined and managed. Execution engine (AI grading) arrives in Phase 2.
                    </span>
                  </div>

                  {/* Test list */}
                  <div className={styles.testList} aria-label="Test cases">
                    {tests.length === 0 ? (
                      <EmptyState
                        icon={<FlaskConical size={28} strokeWidth={1.5} />}
                        title="No test cases yet"
                        description="Add your first test case to define expected inputs and outputs. Results will appear once the execution engine is ready."
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
                      <>
                        {tests.map((test) => {
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
                                onClick={() => handleToggle(test.id)}
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
                                  <Badge variant={meta.badge} size="sm">{meta.label}</Badge>
                                  {isExpanded
                                    ? <ChevronDown size={15} className={styles.testCard__chevron} />
                                    : <ChevronRight size={15} className={styles.testCard__chevron} />
                                  }
                                </div>
                              </button>

                              {isExpanded && (
                                <div
                                  id={`test-body-${test.id}`}
                                  className={styles.testCard__body}
                                >
                                  <div className={styles.testField}>
                                    <span className={styles.testField__label}>Input</span>
                                    <pre className={styles.testField__code}>{test.input}</pre>
                                  </div>
                                  <div className={styles.testField}>
                                    <span className={styles.testField__label}>Expected Output</span>
                                    <pre className={styles.testField__code}>{test.expectedOutput}</pre>
                                  </div>
                                  {test.actualOutput && (
                                    <div className={styles.testField}>
                                      <span className={styles.testField__label}>Actual Output</span>
                                      <pre className={`${styles.testField__code} ${styles['testField__code--actual']}`}>
                                        {test.actualOutput}
                                      </pre>
                                    </div>
                                  )}
                                  <div className={styles.testCard__bodyActions}>
                                    <Button
                                      variant="danger"
                                      size="xs"
                                      iconLeft={<Trash2 size={12} />}
                                      onClick={() => handleDelete(test.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>

                  {/* Add test case form */}
                  {showAddForm ? (
                    <div className={styles.addForm} role="form" aria-label="Add test case">
                      <h3 className={styles.addForm__title}>New Test Case</h3>

                      <div className={styles.formField}>
                        <label htmlFor="tc-name" className={styles.formField__label}>Test name *</label>
                        <input
                          id="tc-name"
                          type="text"
                          className={`${styles.formField__input} ${formErrors.name ? styles['formField__input--error'] : ''}`}
                          placeholder="e.g. Empty string input"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                        {formErrors.name && <span className={styles.formField__error}>{formErrors.name}</span>}
                      </div>

                      <div className={styles.formField}>
                        <label htmlFor="tc-input" className={styles.formField__label}>Input expression *</label>
                        <textarea
                          id="tc-input"
                          rows={3}
                          className={`${styles.formField__textarea} ${formErrors.input ? styles['formField__input--error'] : ''}`}
                          placeholder={`e.g. greet("world")`}
                          value={form.input}
                          onChange={(e) => setForm((f) => ({ ...f, input: e.target.value }))}
                        />
                        {formErrors.input && <span className={styles.formField__error}>{formErrors.input}</span>}
                      </div>

                      <div className={styles.formField}>
                        <label htmlFor="tc-expected" className={styles.formField__label}>Expected output *</label>
                        <textarea
                          id="tc-expected"
                          rows={3}
                          className={`${styles.formField__textarea} ${formErrors.expectedOutput ? styles['formField__input--error'] : ''}`}
                          placeholder="Hello, world! Welcome to CodeCraft."
                          value={form.expectedOutput}
                          onChange={(e) => setForm((f) => ({ ...f, expectedOutput: e.target.value }))}
                        />
                        {formErrors.expectedOutput && <span className={styles.formField__error}>{formErrors.expectedOutput}</span>}
                      </div>

                      <div className={styles.addForm__actions}>
                        <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setForm(DEFAULT_FORM); setFormErrors({}) }}>
                          Cancel
                        </Button>
                        <Button
                          id="add-test-case-btn"
                          variant="primary"
                          size="sm"
                          iconLeft={<Plus size={14} />}
                          onClick={handleAddTest}
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
              )}

              {/* ======== Results tab ======== */}
              {activeTab === 'results' && (
                <div className={styles.resultsTab}>
                  <EmptyState
                    icon={<FlaskConical size={32} strokeWidth={1.25} />}
                    title="No results yet"
                    description="Results appear here after running the test suite. The execution engine connects in Phase 2 — this layout is ready and waiting."
                    size="lg"
                  />
                </div>
              )}
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}
