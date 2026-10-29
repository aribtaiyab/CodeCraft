import { Link } from 'react-router-dom'
import {
  Code2,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Terminal,
  Zap,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { Badge } from '../../components'
import styles from './LandingPage.module.css'

const features = [
  {
    icon: Code2,
    title: 'Code Studio',
    description:
      'A Monaco-powered editor with syntax highlighting and a structured output panel. Write Python, see results, iterate quickly.',
    path: '/studio',
    status: 'ready' as const,
    tag: 'Available',
  },
  {
    icon: FlaskConical,
    title: 'AI Test Lab',
    description:
      'Define test cases with expected inputs and outputs. Review results in a structured layout. AI execution integrates in Phase 2.',
    path: '/testlab',
    status: 'ready' as const,
    tag: 'Available',
  },
  {
    icon: BookOpen,
    title: 'Learning Paths',
    description:
      'Structured curriculum with modules, lessons, and exercises. Content and progress tracking come in Phase 2.',
    path: '/learn',
    status: 'ready' as const,
    tag: 'Available',
  },
]

const roadmapItems = [
  { phase: 'Phase 1', title: 'Foundation', done: true, items: ['UI shell & routing', 'Design system', 'Editor layout', 'Test lab layout', 'Learning overview'] },
  { phase: 'Phase 2', title: 'Execution', done: false, items: ['Python runtime', 'AI feedback engine', 'Test grading', 'Progress persistence'] },
  { phase: 'Phase 3', title: 'Intelligence', done: false, items: ['Adaptive curriculum', 'Code analysis', 'Hint system', 'Multi-language support'] },
]

const SAMPLE_CODE = `def fibonacci(n: int) -> list[int]:
    """Return the first n Fibonacci numbers."""
    if n <= 0:
        return []
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[:n]

print(fibonacci(8))
# → [0, 1, 1, 2, 3, 5, 8, 13]`

export function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ========== HERO ========== */}
      <section className={styles.hero} aria-label="Hero">
        <div className={styles.hero__bg} aria-hidden="true">
          <div className={styles.hero__bgGradient} />
          <div className={styles.hero__bgGrid} />
        </div>

        <div className={styles.hero__content}>
          <div className={styles.hero__eyebrow}>
            <Badge variant="bronze">Phase 1 · Foundation</Badge>
            <span className={styles.hero__eyebrowText}>React + TypeScript + Vite</span>
          </div>

          <h1 className={styles.hero__title}>
            A craftsman's&nbsp;
            <span className={styles.hero__titleAccent}>coding studio</span>
            <br />for serious learners
          </h1>

          <p className={styles.hero__subtitle}>
            CodeCraft is a focused coding education platform — not a playground.
            Write real code, see real output, follow a real curriculum.
            No fake analytics. No invented progress. Just the craft.
          </p>

          <div className={styles.hero__actions}>
            <Link to="/studio" className={styles.linkBtn}>
              Open Code Studio <ArrowRight size={18} />
            </Link>
            <Link to="/learn" className={styles.linkBtnSecondary}>
              Browse Learning Paths
            </Link>
          </div>

          {/* Code preview card */}
          <div className={styles.hero__preview} aria-label="Code sample preview">
            <div className={styles.hero__previewBar}>
              <div className={styles.hero__previewDots} aria-hidden="true">
                <span /><span /><span />
              </div>
              <span className={styles.hero__previewLabel}>fibonacci.py</span>
              <Terminal size={13} className={styles.hero__previewIcon} />
            </div>
            <pre className={styles.hero__code}>
              <code>{SAMPLE_CODE}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className={styles.section} aria-labelledby="features-heading">
        <div className={styles.section__inner}>
          <div className={styles.section__header}>
            <h2 id="features-heading" className={styles.section__title}>
              Three integrated workspaces
            </h2>
            <p className={styles.section__subtitle}>
              Each workspace has a specific, focused purpose. No feature creep. No unnecessary complexity.
            </p>
          </div>

          <div className={styles.features}>
            {features.map(({ icon: Icon, title, description, path, tag }) => (
              <Link key={path} to={path} className={styles.featureCard} aria-label={`Go to ${title}`}>
                <div className={styles.featureCard__icon}>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <div className={styles.featureCard__meta}>
                  <span className={styles.featureCard__title}>{title}</span>
                  <Badge variant="success" size="sm">{tag}</Badge>
                </div>
                <p className={styles.featureCard__desc}>{description}</p>
                <div className={styles.featureCard__arrow}>
                  <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRINCIPLES ========== */}
      <section className={styles.section} aria-labelledby="principles-heading">
        <div className={styles.section__inner}>
          <div className={styles.section__header}>
            <h2 id="principles-heading" className={styles.section__title}>
              Built on honest engineering principles
            </h2>
            <p className={styles.section__subtitle}>
              This app shows only what works. Unfinished features show empty states, not fake data.
            </p>
          </div>

          <div className={styles.principles}>
            {[
              {
                icon: CheckCircle2,
                title: 'No fabricated functionality',
                desc: 'Every interactive element either works or shows a clear "coming soon" state. No loading spinners that go nowhere.',
              },
              {
                icon: Zap,
                title: 'Incremental delivery',
                desc: 'Phase 1 is pure foundation. Phase 2 adds execution. Phase 3 adds intelligence. No phase ships what it doesn\'t contain.',
              },
              {
                icon: Code2,
                title: 'Design system first',
                desc: 'Every pixel uses design tokens. Color, spacing, typography, shadows — all consistent across every surface.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.principle}>
                <div className={styles.principle__icon}>
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className={styles.principle__title}>{title}</h3>
                  <p className={styles.principle__desc}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ROADMAP ========== */}
      <section className={styles.section} aria-labelledby="roadmap-heading">
        <div className={styles.section__inner}>
          <div className={styles.section__header}>
            <h2 id="roadmap-heading" className={styles.section__title}>
              Development roadmap
            </h2>
            <p className={styles.section__subtitle}>
              Honest phased delivery — know exactly what's available now and what's coming.
            </p>
          </div>

          <div className={styles.roadmap}>
            {roadmapItems.map(({ phase, title, done, items }) => (
              <div key={phase} className={`${styles.roadmapItem} ${done ? styles['roadmapItem--done'] : ''}`}>
                <div className={styles.roadmapItem__header}>
                  <div className={styles.roadmapItem__phase}>
                    <div className={styles.roadmapItem__dot}>
                      {done
                        ? <CheckCircle2 size={16} strokeWidth={2} />
                        : <Circle size={16} strokeWidth={1.5} />
                      }
                    </div>
                    <span className={styles.roadmapItem__phaseLabel}>{phase}</span>
                  </div>
                  <div className={styles.roadmapItem__title}>{title}</div>
                  <Badge variant={done ? 'success' : 'default'} size="sm">
                    {done ? 'Complete' : 'Upcoming'}
                  </Badge>
                </div>
                <ul className={styles.roadmapItem__items}>
                  {items.map((item) => (
                    <li key={item} className={styles.roadmapItem__item}>
                      <span className={styles.roadmapItem__bullet} aria-hidden="true">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className={styles.cta} aria-labelledby="cta-heading">
        <div className={styles.cta__inner}>
          <h2 id="cta-heading" className={styles.cta__title}>
            Ready to start writing code?
          </h2>
          <p className={styles.cta__subtitle}>
            The Code Studio is open. A Monaco editor, output panel, and language selector — all wired up and ready.
          </p>
          <Link to="/studio" className={styles.linkBtn}>
            Open Code Studio <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className={styles.footer}>
        <div className={styles.footer__inner}>
          <span className={styles.footer__brand}>
            Code<span className={styles.hero__titleAccent}>Craft</span>
          </span>
          <span className={styles.footer__meta}>
            Phase 1 · Foundation · Built with React + TypeScript + Vite
          </span>
        </div>
      </footer>
    </div>
  )
}
