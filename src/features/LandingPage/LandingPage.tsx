import { Link } from 'react-router-dom'
import {
  Code2,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Terminal,
  Zap,
  CheckCircle2,
  Bug,
  Sparkles,
  Layers,
  Compass,
} from 'lucide-react'
import { Badge } from '../../components'
import styles from './LandingPage.module.css'

const coreFeatures = [
  {
    icon: Code2,
    title: 'Code Studio',
    description:
      'Monaco-powered Python editor with syntax highlighting, stdin prompt handling, and instant in-browser WebAssembly execution.',
    path: '/studio',
    badge: 'Core Studio',
  },
  {
    icon: Layers,
    title: 'Execution Trace & Predict',
    description:
      'Predict output before execution. Step forward and backward through line-by-line variable updates and state snapshots.',
    path: '/studio',
    badge: 'Visual Trace',
  },
  {
    icon: Bug,
    title: 'Smart Debugging Coach',
    description:
      'Deterministic evidence-based diagnosis for runtime errors and test failures. Progressive Hint → Diagnosis → Suggested Fix.',
    path: '/studio',
    badge: 'Diagnostics',
  },
  {
    icon: Sparkles,
    title: 'AI Mentor & Code Quizzes',
    description:
      'Groq-powered line breakdowns, contextual follow-up Q&A, and code-specific MCQs verified against actual Python output.',
    path: '/studio',
    badge: 'AI Assistant',
  },
  {
    icon: BookOpen,
    title: 'Structured Curriculum',
    description:
      'Modular learning tracks from Python fundamentals to data structures with honest difficulty ratings and exercise roadmaps.',
    path: '/learn',
    badge: 'Curriculum',
  },
  {
    icon: FlaskConical,
    title: 'AI Test Lab',
    description:
      'Timed assessments, MCQs, and real coding challenges with isolated Pyodide execution grading, question diversity, and detailed analytics.',
    path: '/testlab',
    badge: 'Test Lab',
  },
]

const learningLoopSteps = [
  {
    step: '01',
    title: 'Write & Predict',
    desc: 'Write code in Monaco and predict the exact console output before running to test your mental execution model.',
  },
  {
    step: '02',
    title: 'Run & Inspect',
    desc: 'Execute code instantly in an isolated WebAssembly Worker. Step line by line through variable changes.',
  },
  {
    step: '03',
    title: 'Diagnose & Fix',
    desc: 'When an error occurs, the Debugging Coach provides evidence-based hints, pinpointed lines, and diff fixes.',
  },
  {
    step: '04',
    title: 'Understand & Quiz',
    desc: 'Deepen understanding with contextual follow-up Q&A and interactive MCQs verified by real program output.',
  },
]

const SAMPLE_CODE = `def fibonacci(n: int) -> list[int]:
    """Generate the first n Fibonacci numbers."""
    if n <= 0:
        return []
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[:n]

result = fibonacci(8)
print(f"Fibonacci: {result}")`

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
            <Badge variant="bronze">Python 3.12 Engine</Badge>
            <span className={styles.hero__eyebrowText}>WebAssembly · Monaco · AI Mentor</span>
          </div>

          <h1 className={styles.hero__title}>
            Write code.&nbsp;
            <span className={styles.hero__titleAccent}>Understand it.</span>
            <br />Get better.
          </h1>

          <p className={styles.hero__subtitle}>
            CodeCraft is an interactive Python developer environment designed for serious learners.
            Run real Python in WebAssembly, step through execution traces, diagnose errors with
            evidence-based guidance, and test your understanding with verified quizzes.
          </p>

          <div className={styles.hero__actions}>
            <Link to="/studio" className={styles.linkBtn}>
              Open Code Studio <ArrowRight size={18} />
            </Link>
            <Link to="/learn" className={styles.linkBtnSecondary}>
              <Compass size={16} /> Explore Curriculum
            </Link>
          </div>

          {/* Code preview card — real craftsman UI styling */}
          <div className={styles.hero__preview} aria-label="Code Studio preview">
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
            <div className={styles.hero__previewOutput}>
              <div className={styles.hero__previewOutputHeader}>
                <span className={styles.hero__previewOutputDot} />
                <span>Standard Output</span>
              </div>
              <div className={styles.hero__previewOutputBody}>
                Fibonacci: [0, 1, 1, 2, 3, 5, 8, 13]
                <span className={styles.hero__previewOutputMeta}>
                  [Process completed in 24ms]
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== LEARNING LOOP ========== */}
      <section className={styles.section} aria-labelledby="loop-heading">
        <div className={styles.section__inner}>
          <div className={styles.section__header}>
            <h2 id="loop-heading" className={styles.section__title}>
              The CodeCraft Learning Loop
            </h2>
            <p className={styles.section__subtitle}>
              Active learning that builds genuine intuition instead of passive video watching.
            </p>
          </div>

          <div className={styles.loopGrid}>
            {learningLoopSteps.map(({ step, title, desc }) => (
              <div key={step} className={styles.loopCard}>
                <div className={styles.loopCard__step}>{step}</div>
                <h3 className={styles.loopCard__title}>{title}</h3>
                <p className={styles.loopCard__desc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CORE WORKSPACES ========== */}
      <section className={styles.section} aria-labelledby="features-heading">
        <div className={styles.section__inner}>
          <div className={styles.section__header}>
            <h2 id="features-heading" className={styles.section__title}>
              Integrated Developer Workspaces
            </h2>
            <p className={styles.section__subtitle}>
              Every capability is purpose-built to accelerate your mastery of Python.
            </p>
          </div>

          <div className={styles.features}>
            {coreFeatures.map(({ icon: Icon, title, description, path, badge }) => (
              <Link key={title} to={path} className={styles.featureCard} aria-label={`Go to ${title}`}>
                <div className={styles.featureCard__top}>
                  <div className={styles.featureCard__icon}>
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <Badge variant="bronze" size="sm">{badge}</Badge>
                </div>
                <div className={styles.featureCard__meta}>
                  <span className={styles.featureCard__title}>{title}</span>
                </div>
                <p className={styles.featureCard__desc}>{description}</p>
                <div className={styles.featureCard__arrow}>
                  <span>Launch</span>
                  <ArrowRight size={14} />
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
              Honest Engineering Principles
            </h2>
            <p className={styles.section__subtitle}>
              A learning product designed with integrity. No fabricated metrics, no fake streaks.
            </p>
          </div>

          <div className={styles.principles}>
            {[
              {
                icon: CheckCircle2,
                title: 'Real Runtime Execution',
                desc: 'Your code runs in a genuine Pyodide WebAssembly worker with real stdout, stderr, and tracebacks.',
              },
              {
                icon: Zap,
                title: 'Deterministic Diagnostics First',
                desc: 'The Smart Debugging Coach uses verified trace state and explicit test failures, never guessing intent.',
              },
              {
                icon: Code2,
                title: 'Server-Isolated Credentials',
                desc: 'AI capabilities use a hardened backend with server-only keys and verified multiple-choice answer validation.',
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

      {/* ========== BOTTOM CTA ========== */}
      <section className={styles.cta} aria-labelledby="cta-heading">
        <div className={styles.cta__inner}>
          <h2 id="cta-heading" className={styles.cta__title}>
            Ready to build your craft?
          </h2>
          <p className={styles.cta__subtitle}>
            Open the Code Studio to write Python, inspect execution step-by-step, and test your knowledge.
          </p>
          <Link to="/studio" className={styles.linkBtn}>
            Launch Code Studio <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className={styles.footer}>
        <div className={styles.footer__inner}>
          <div className={styles.footer__brandGroup}>
            <span className={styles.footer__brand}>
              Code<span className={styles.hero__titleAccent}>Craft</span>
            </span>
            <span className={styles.footer__tagline}>Learn Python Smarter</span>
          </div>

          <div className={styles.footer__links}>
            <Link to="/studio" className={styles.footer__link}>Code Studio</Link>
            <Link to="/testlab" className={styles.footer__link}>AI Test Lab</Link>
            <Link to="/learn" className={styles.footer__link}>Curriculum</Link>
          </div>

          <span className={styles.footer__meta}>
            React + TypeScript + Monaco + Pyodide
          </span>
        </div>
      </footer>
    </div>
  )
}
