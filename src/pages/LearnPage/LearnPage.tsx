import { useState } from 'react'
import {
  BookOpen,
  Lock,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  Flame,
  Star,
  Info,
} from 'lucide-react'
import { Badge, EmptyState, Button } from '../../components'
import type { LearningPath, DifficultyLevel } from '../../types'
import styles from './LearnPage.module.css'

// ---- Static data — no fake progress, no fake XP ----
const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'python-fundamentals',
    title: 'Python Fundamentals',
    description: 'Learn the core building blocks of Python: variables, control flow, functions, and data structures. Suitable for absolute beginners.',
    difficulty: 'beginner',
    totalHours: 12,
    enrolled: false,
    modules: [
      {
        id: 'py-intro',
        title: 'Introduction & Setup',
        description: 'Get your environment ready and write your first Python script.',
        difficulty: 'beginner',
        status: 'available',
        totalXp: 100,
        completedXp: 0,
        estimatedHours: 1,
        lessons: [
          { id: 'l1', title: 'What is Python?', type: 'concept', estimatedMinutes: 8, status: 'available', xp: 20 },
          { id: 'l2', title: 'Setting up your environment', type: 'concept', estimatedMinutes: 12, status: 'available', xp: 20 },
          { id: 'l3', title: 'Your first script', type: 'practice', estimatedMinutes: 15, status: 'available', xp: 30 },
          { id: 'l4', title: 'Variables and types', type: 'practice', estimatedMinutes: 10, status: 'available', xp: 30 },
        ],
      },
      {
        id: 'py-control-flow',
        title: 'Control Flow',
        description: 'Master if/else, loops, and conditional logic.',
        difficulty: 'beginner',
        status: 'locked',
        totalXp: 150,
        completedXp: 0,
        estimatedHours: 2,
        lessons: [
          { id: 'l5', title: 'Boolean expressions', type: 'concept', estimatedMinutes: 10, status: 'locked', xp: 25 },
          { id: 'l6', title: 'if / elif / else', type: 'practice', estimatedMinutes: 15, status: 'locked', xp: 35 },
          { id: 'l7', title: 'for loops', type: 'practice', estimatedMinutes: 15, status: 'locked', xp: 35 },
          { id: 'l8', title: 'while loops', type: 'practice', estimatedMinutes: 12, status: 'locked', xp: 30 },
          { id: 'l9', title: 'Control flow challenge', type: 'challenge', estimatedMinutes: 20, status: 'locked', xp: 25 },
        ],
      },
      {
        id: 'py-functions',
        title: 'Functions & Scope',
        description: 'Write reusable, clean functions with proper scope management.',
        difficulty: 'beginner',
        status: 'locked',
        totalXp: 200,
        completedXp: 0,
        estimatedHours: 3,
        lessons: [
          { id: 'l10', title: 'Defining functions', type: 'concept', estimatedMinutes: 12, status: 'locked', xp: 30 },
          { id: 'l11', title: 'Arguments & return values', type: 'practice', estimatedMinutes: 15, status: 'locked', xp: 40 },
          { id: 'l12', title: 'Default parameters', type: 'practice', estimatedMinutes: 10, status: 'locked', xp: 30 },
          { id: 'l13', title: 'Lambda functions', type: 'concept', estimatedMinutes: 12, status: 'locked', xp: 35 },
          { id: 'l14', title: 'Functions challenge', type: 'challenge', estimatedMinutes: 25, status: 'locked', xp: 65 },
        ],
      },
    ],
  },
  {
    id: 'data-structures',
    title: 'Data Structures in Python',
    description: 'Deep dive into lists, tuples, dictionaries, sets, and custom data structures. Build the foundations for algorithmic thinking.',
    difficulty: 'intermediate',
    totalHours: 16,
    enrolled: false,
    modules: [
      {
        id: 'ds-lists',
        title: 'Lists & Tuples',
        description: 'Sequence types and their operations.',
        difficulty: 'intermediate',
        status: 'locked',
        totalXp: 180,
        completedXp: 0,
        estimatedHours: 3,
        lessons: [
          { id: 'l20', title: 'List operations', type: 'concept', estimatedMinutes: 15, status: 'locked', xp: 30 },
          { id: 'l21', title: 'List comprehensions', type: 'practice', estimatedMinutes: 20, status: 'locked', xp: 50 },
          { id: 'l22', title: 'Tuples and immutability', type: 'concept', estimatedMinutes: 10, status: 'locked', xp: 30 },
          { id: 'l23', title: 'Sequences challenge', type: 'challenge', estimatedMinutes: 25, status: 'locked', xp: 70 },
        ],
      },
    ],
  },
]

const DIFFICULTY_META: Record<DifficultyLevel, { label: string; badge: 'success' | 'warning' | 'error' }> = {
  beginner:     { label: 'Beginner',     badge: 'success' },
  intermediate: { label: 'Intermediate', badge: 'warning' },
  advanced:     { label: 'Advanced',     badge: 'error' },
}

const LESSON_TYPE_LABELS = {
  concept:   '📖 Concept',
  practice:  '💻 Practice',
  challenge: '🏆 Challenge',
  quiz:      '🧪 Quiz',
}

type FilterLevel = 'all' | DifficultyLevel

export function LearnPage() {
  const [filter, setFilter] = useState<FilterLevel>('all')
  const [expandedPath, setExpandedPath] = useState<string | null>('python-fundamentals')
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  const filtered = LEARNING_PATHS.filter(
    (p) => filter === 'all' || p.difficulty === filter
  )

  const filters: { value: FilterLevel; label: string }[] = [
    { value: 'all', label: 'All paths' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ]

  return (
    <div className={styles.page}>
      {/* ---- Page header ---- */}
      <div className={styles.header}>
        <div className={styles.header__inner}>
          <div className={styles.header__titleRow}>
            <div className={styles.header__icon}>
              <BookOpen size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className={styles.header__title}>Learning Paths</h1>
              <p className={styles.header__subtitle}>
                Structured curricula built for real skill development.
                Progress tracking and interactive exercises arrive in Phase 2.
              </p>
            </div>
          </div>
        </div>

        {/* Phase 2 notice */}
        <div className={styles.notice}>
          <div className={styles.notice__inner}>
            <Info size={14} />
            <span>
              <strong>Phase 1:</strong> Browse available learning paths and their full module/lesson structure.
              Enrollment, XP tracking, and interactive lessons connect in Phase 2.
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className={styles.filterBar}>
          <div className={styles.filterBar__inner}>
            <div className={styles.filterBar__left}>
              <span className={styles.filterBar__label}>Filter by:</span>
              <div className={styles.filterBar__pills} role="group" aria-label="Filter by difficulty">
                {filters.map(({ value, label }) => (
                  <button
                    key={value}
                    className={[
                      styles.filterPill,
                      filter === value ? styles['filterPill--active'] : '',
                    ].join(' ')}
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <span className={styles.filterBar__count}>
              {filtered.length} path{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon={<BookOpen size={32} strokeWidth={1.25} />}
              title="No paths at this level"
              description="Try a different difficulty filter. More paths are being added progressively."
              size="lg"
              action={
                <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
                  Show all paths
                </Button>
              }
            />
          </div>
        ) : (
          <div className={styles.pathList}>
            {filtered.map((path) => {
              const diff = DIFFICULTY_META[path.difficulty]
              const isExpanded = expandedPath === path.id
              const totalLessons = path.modules.reduce((acc, m) => acc + m.lessons.length, 0)

              return (
                <div key={path.id} className={styles.pathCard}>
                  {/* Path header */}
                  <button
                    className={styles.pathCard__header}
                    onClick={() => setExpandedPath(isExpanded ? null : path.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`path-content-${path.id}`}
                  >
                    <div className={styles.pathCard__headerLeft}>
                      <div className={styles.pathCard__meta}>
                        <h2 className={styles.pathCard__title}>{path.title}</h2>
                        <div className={styles.pathCard__badges}>
                          <Badge variant={diff.badge} size="sm">{diff.label}</Badge>
                          <Badge variant="default" size="sm">
                            <Clock size={10} style={{ marginRight: 3 }} />
                            {path.totalHours}h
                          </Badge>
                          <Badge variant="default" size="sm">
                            {path.modules.length} modules · {totalLessons} lessons
                          </Badge>
                        </div>
                      </div>
                      <p className={styles.pathCard__desc}>{path.description}</p>
                    </div>
                    <ChevronRight
                      size={18}
                      className={`${styles.pathCard__chevron} ${isExpanded ? styles['pathCard__chevron--open'] : ''}`}
                    />
                  </button>

                  {/* Path enrollment bar (honest empty state) */}
                  {isExpanded && (
                    <div className={styles.pathCard__enrollBanner}>
                      <div className={styles.pathCard__enrollInfo}>
                        <Flame size={14} />
                        <span>Not enrolled — enrollment and XP tracking available in Phase 2</span>
                      </div>
                      <Badge variant="default" size="sm">Coming Phase 2</Badge>
                    </div>
                  )}

                  {/* Module list */}
                  {isExpanded && (
                    <div
                      id={`path-content-${path.id}`}
                      className={styles.pathCard__modules}
                    >
                      {path.modules.map((module, idx) => {
                        const isModuleExpanded = expandedModule === module.id
                        const isLocked = module.status === 'locked'

                        return (
                          <div
                            key={module.id}
                            className={`${styles.moduleCard} ${isLocked ? styles['moduleCard--locked'] : ''}`}
                          >
                            <button
                              className={styles.moduleCard__header}
                              onClick={() => !isLocked && setExpandedModule(isModuleExpanded ? null : module.id)}
                              aria-expanded={isModuleExpanded}
                              aria-controls={`module-content-${module.id}`}
                              disabled={isLocked}
                            >
                              <div className={styles.moduleCard__index}>
                                {isLocked
                                  ? <Lock size={13} />
                                  : <span>{idx + 1}</span>
                                }
                              </div>
                              <div className={styles.moduleCard__info}>
                                <span className={styles.moduleCard__title}>{module.title}</span>
                                <span className={styles.moduleCard__meta}>
                                  <Clock size={11} /> {module.estimatedHours}h
                                  <span className={styles.moduleCard__sep}>·</span>
                                  {module.lessons.length} lessons
                                  <span className={styles.moduleCard__sep}>·</span>
                                  {module.totalXp} XP
                                </span>
                              </div>
                              <div className={styles.moduleCard__right}>
                                {isLocked
                                  ? <Badge variant="default" size="sm">Locked</Badge>
                                  : <Badge variant="bronze" size="sm">Available</Badge>
                                }
                                {!isLocked && (
                                  <ChevronRight
                                    size={14}
                                    className={`${styles.moduleCard__chevron} ${isModuleExpanded ? styles['moduleCard__chevron--open'] : ''}`}
                                  />
                                )}
                              </div>
                            </button>

                            {/* Lesson list */}
                            {isModuleExpanded && !isLocked && (
                              <div
                                id={`module-content-${module.id}`}
                                className={styles.lessonList}
                              >
                                {module.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className={`${styles.lessonItem} ${lesson.status === 'locked' ? styles['lessonItem--locked'] : ''}`}
                                  >
                                    <div className={styles.lessonItem__icon}>
                                      {lesson.status === 'completed'
                                        ? <CheckCircle2 size={14} className={styles['lessonItem__icon--done']} />
                                        : lesson.status === 'locked'
                                          ? <Lock size={12} />
                                          : <Circle size={14} />
                                      }
                                    </div>
                                    <span className={styles.lessonItem__title}>{lesson.title}</span>
                                    <div className={styles.lessonItem__right}>
                                      <span className={styles.lessonItem__type}>
                                        {LESSON_TYPE_LABELS[lesson.type]}
                                      </span>
                                      <span className={styles.lessonItem__duration}>
                                        <Clock size={10} /> {lesson.estimatedMinutes}m
                                      </span>
                                      <div className={styles.lessonItem__xp}>
                                        <Star size={10} /> {lesson.xp}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
