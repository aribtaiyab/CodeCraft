import { Link } from 'react-router-dom'
import {
  Code2,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Terminal,
  Layers,
  Compass,
  ShieldCheck,
  Cpu,
  Workflow,
} from 'lucide-react'
import heroBg from '../../assets/hero-bg.jpg'
import styles from './LandingPage.module.css'

const CURRENT_YEAR = new Date().getFullYear()

export function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ================================================================== */}
      {/* 1. HERO SECTION (Cinematic Editorial Asymmetrical Layout)          */}
      {/* ================================================================== */}
      <section className={styles.hero} aria-label="Hero">
        {/* Atmospheric Background Layer */}
        <div className={styles.hero__backdrop} aria-hidden="true">
          <img
            src={heroBg}
            alt=""
            className={styles.hero__bgImage}
            loading="eager"
          />
          <div className={styles.hero__bgOverlay} />
          <div className={styles.hero__bgWarmth} />
        </div>

        <div className={styles.hero__inner}>
          {/* Left Column: Editorial Headline & Actions */}
          <div className={styles.hero__copy}>
            {/* Architectural Kicker */}
            <div className={styles.hero__kicker}>
              <span className={styles.hero__kickerDot} aria-hidden="true" />
              <span>Python 3.12 WebAssembly Environment</span>
            </div>

            {/* Controlled, High-Contrast Typography */}
            <h1 className={styles.hero__headline}>
              Write code.
              <span className={styles.hero__headlineAccent}>
                See how it works.
              </span>
            </h1>

            {/* Concise Supporting Copy */}
            <p className={styles.hero__lead}>
              Run Python. Follow every step. Understand errors.
              Build confidence through practice.
            </p>

            {/* Primary & Secondary Actions */}
            <div className={styles.hero__actions}>
              <Link to="/studio" className={styles.btnPrimary}>
                <span>Enter Code Studio</span>
                <ArrowRight size={15} className={styles.btnIcon} />
              </Link>
              <Link to="/learn" className={styles.btnSecondary}>
                <Compass size={15} />
                <span>Explore Learn</span>
              </Link>
            </div>

            {/* Technical Micro-Coordinates */}
            <div className={styles.hero__specs}>
              <div className={styles.specItem}>
                <span className={styles.specKey}>RUNTIME</span>
                <span className={styles.specVal}>Pyodide WASM</span>
              </div>
              <span className={styles.specDivider} aria-hidden="true">/</span>
              <div className={styles.specItem}>
                <span className={styles.specKey}>EXECUTION</span>
                <span className={styles.specVal}>Client-Side Worker</span>
              </div>
              <span className={styles.specDivider} aria-hidden="true">/</span>
              <div className={styles.specItem}>
                <span className={styles.specKey}>STATE</span>
                <span className={styles.specVal}>Step Traceable</span>
              </div>
            </div>
          </div>

          {/* Right Column: Authentic Unified CodeCraft Studio Console */}
          <div className={styles.hero__visual} aria-label="Interactive Python Studio preview">
            <div className={styles.consoleWindow}>
              {/* Console Window Header */}
              <div className={styles.consoleHeader}>
                <div className={styles.consoleDots} aria-hidden="true">
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
                <div className={styles.consoleTab}>
                  <Code2 size={12} className={styles.consoleTabIcon} />
                  <span>palindrome.py</span>
                </div>
                <div className={styles.consoleStatus}>
                  <span className={styles.statusLiveDot} />
                  <span>Step 3 of 4</span>
                </div>
              </div>

              {/* Editor Workspace with Syntax Highlighting */}
              <div className={styles.consoleEditor}>
                <div className={styles.editorGutter} aria-hidden="true">
                  <span>1</span>
                  <span>2</span>
                  <span className={styles.gutterActive}>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                </div>
                <div className={styles.codeLines}>
                  <div className={styles.codeRow}>
                    <span className={styles.tokKeyword}>def</span>{' '}
                    <span className={styles.tokFunc}>is_palindrome</span>(
                    <span className={styles.tokParam}>word</span>:{' '}
                    <span className={styles.tokType}>str</span>) -&gt;{' '}
                    <span className={styles.tokType}>bool</span>:
                  </div>
                  <div className={styles.codeRow}>
                    {'    '}<span className={styles.tokVar}>clean</span> ={' '}
                    <span className={styles.tokParam}>word</span>.<span className={styles.tokFunc}>lower</span>()
                  </div>
                  <div className={`${styles.codeRow} ${styles.codeRowActive}`}>
                    {'    '}<span className={styles.tokKeyword}>return</span>{' '}
                    <span className={styles.tokVar}>clean</span> =={' '}
                    <span className={styles.tokVar}>clean</span>[::<span className={styles.tokNum}>-1</span>]
                    <span className={styles.stepPointerBadge}>
                      ▶ Step 3: Compare slice
                    </span>
                  </div>
                  <div className={styles.codeRow}>
                    <span className={styles.tokVar}>sample</span> ={' '}
                    <span className={styles.tokStr}>"Racecar"</span>
                  </div>
                  <div className={styles.codeRow}>
                    <span className={styles.tokVar}>result</span> ={' '}
                    <span className={styles.tokFunc}>is_palindrome</span>(
                    <span className={styles.tokVar}>sample</span>)
                  </div>
                  <div className={styles.codeRow}>
                    <span className={styles.tokFunc}>print</span>(
                    <span className={styles.tokStr}>f"Result: &#123;result&#125;"</span>)
                  </div>
                </div>
              </div>

              {/* Integrated Variable State Matrix */}
              <div className={styles.consoleMatrix}>
                <div className={styles.matrixHeader}>
                  <div className={styles.matrixTitle}>
                    <Layers size={11} />
                    <span>Variable Memory at Step 3</span>
                  </div>
                  <span className={styles.matrixTag}>Active Scope: is_palindrome</span>
                </div>
                <div className={styles.matrixGrid}>
                  <div className={styles.matrixCell}>
                    <span className={styles.matrixKey}>word</span>
                    <span className={styles.matrixVal}>"Racecar"</span>
                    <span className={styles.matrixType}>str</span>
                  </div>
                  <div className={styles.matrixCell}>
                    <span className={styles.matrixKey}>clean</span>
                    <span className={styles.matrixVal}>"racecar"</span>
                    <span className={styles.matrixType}>str</span>
                  </div>
                  <div className={styles.matrixCell}>
                    <span className={styles.matrixKey}>clean[::-1]</span>
                    <span className={styles.matrixVal}>"racecar"</span>
                    <span className={styles.matrixType}>str</span>
                  </div>
                  <div className={`${styles.matrixCell} ${styles.matrixCellActive}`}>
                    <span className={styles.matrixKey}>evaluation</span>
                    <span className={styles.matrixValHighlight}>True</span>
                    <span className={styles.matrixType}>bool</span>
                  </div>
                </div>
              </div>

              {/* Integrated Output Drawer */}
              <div className={styles.consoleOutput}>
                <div className={styles.outputLeft}>
                  <Terminal size={11} className={styles.terminalIcon} />
                  <span className={styles.outputCommand}>python palindrome.py</span>
                  <span className={styles.outputArrow}>&rarr;</span>
                  <span className={styles.outputResult}>Result: True</span>
                </div>
                <span className={styles.outputTiming}>0.8ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 2. THREE CORE PRODUCT AREAS (Phase 9)                              */}
      {/* ================================================================== */}
      <section className={styles.pillarsSection} aria-labelledby="pillars-heading">
        <div className={styles.pillarsContainer}>
          <div className={styles.pillarsHeader}>
            <span className={styles.sectionKicker}>Learning System</span>
            <h2 id="pillars-heading" className={styles.sectionTitle}>
              Three Environments. One Cohesive Workflow.
            </h2>
            <p className={styles.sectionSubtitle}>
              CodeCraft unifies editor execution, verified assessments, and progressive
              curriculum into a single focused learning studio.
            </p>
          </div>

          <div className={styles.pillarsGrid}>
            {/* Pillar 1: Code Studio */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarCardTop}>
                <div className={styles.pillarIcon}>
                  <Code2 size={20} strokeWidth={1.75} />
                </div>
                <span className={styles.pillarTag}>Core Workspace</span>
              </div>
              <h3 className={styles.pillarTitle}>Code Studio</h3>
              <p className={styles.pillarLead}>
                Write and execute Python in an isolated WebAssembly sandbox. Step
                through line-by-line variable updates, and resolve mistakes with
                the Smart Debugging Coach.
              </p>
              <ul className={styles.pillarFeatures}>
                <li>Monaco editor with full Python syntax intelligence</li>
                <li>Visual execution tracer with state snapshots</li>
                <li>Evidence-based Smart Debugging Coach</li>
              </ul>
              <Link to="/studio" className={styles.pillarAction}>
                <span>Enter Code Studio</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Pillar 2: AI Test Lab */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarCardTop}>
                <div className={styles.pillarIcon}>
                  <FlaskConical size={20} strokeWidth={1.75} />
                </div>
                <span className={styles.pillarTag}>Assessment Lab</span>
              </div>
              <h3 className={styles.pillarTitle}>AI Test Lab</h3>
              <p className={styles.pillarLead}>
                Practice with generated assessments, evaluate your understanding,
                and review results. Every multiple-choice question is verified by
                the genuine Python engine.
              </p>
              <ul className={styles.pillarFeatures}>
                <li>Output questions verified by Pyodide runtime</li>
                <li>Adaptive difficulty tailored to your progress</li>
                <li>Targeted retesting directly from debugging diagnoses</li>
              </ul>
              <Link to="/testlab" className={styles.pillarAction}>
                <span>Enter Test Lab</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Pillar 3: Learn */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarCardTop}>
                <div className={styles.pillarIcon}>
                  <BookOpen size={20} strokeWidth={1.75} />
                </div>
                <span className={styles.pillarTag}>Curriculum</span>
              </div>
              <h3 className={styles.pillarTitle}>Learn</h3>
              <p className={styles.pillarLead}>
                Build programming foundations and strengthen your understanding
                with a structured modular curriculum, mastery indicators, and
                targeted exercises.
              </p>
              <ul className={styles.pillarFeatures}>
                <li>Curated topics from fundamentals to data structures</li>
                <li>Real-time mastery tracking with learning event history</li>
                <li>Dedicated debugging practice exercises with pre-set bugs</li>
              </ul>
              <Link to="/learn" className={styles.pillarAction}>
                <span>Explore Curriculum</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 3. ARCHITECTURE & ENGINEERING TRANSPARENCY                         */}
      {/* ================================================================== */}
      <section className={styles.principlesSection} aria-label="Engineering principles">
        <div className={styles.principlesContainer}>
          <div className={styles.principlesGrid}>
            <div className={styles.principleCard}>
              <div className={styles.principleIcon}>
                <Cpu size={18} strokeWidth={1.75} />
              </div>
              <div className={styles.principleBody}>
                <h3 className={styles.principleTitle}>Real Runtime Execution</h3>
                <p className={styles.principleText}>
                  Your Python code executes in a genuine WebAssembly Pyodide runtime inside
                  a dedicated browser Web Worker with authentic stdout, stderr, and tracebacks.
                </p>
              </div>
            </div>

            <div className={styles.principleCard}>
              <div className={styles.principleIcon}>
                <Workflow size={18} strokeWidth={1.75} />
              </div>
              <div className={styles.principleBody}>
                <h3 className={styles.principleTitle}>Deterministic Diagnostics</h3>
                <p className={styles.principleText}>
                  The Smart Debugging Coach analyzes concrete trace state and test assertions,
                  guiding students with three progressive levels rather than generic guesses.
                </p>
              </div>
            </div>

            <div className={styles.principleCard}>
              <div className={styles.principleIcon}>
                <ShieldCheck size={18} strokeWidth={1.75} />
              </div>
              <div className={styles.principleBody}>
                <h3 className={styles.principleTitle}>Hardened Security</h3>
                <p className={styles.principleText}>
                  AI features communicate exclusively with a secured server backend. API
                  keys and credentials are never exposed to browser clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 4. EDITORIAL BOTTOM CTA                                            */}
      {/* ================================================================== */}
      <section className={styles.ctaSection} aria-labelledby="cta-heading">
        <div className={styles.ctaContainer}>
          <div className={styles.ctaCard}>
            <span className={styles.ctaKicker}>Ready to Begin</span>
            <h2 id="cta-heading" className={styles.ctaTitle}>
              Start coding with clear understanding.
            </h2>
            <p className={styles.ctaLead}>
              Open Code Studio to write, trace, and diagnose Python code in WebAssembly,
              or test your skills in the AI Test Lab.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/studio" className={styles.btnPrimary}>
                <span>Enter Code Studio</span>
                <ArrowRight size={15} className={styles.btnIcon} />
              </Link>
              <Link to="/learn" className={styles.btnSecondary}>
                <BookOpen size={15} />
                <span>Browse Lessons</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 5. REFINED FOOTER                                                  */}
      {/* ================================================================== */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrandCol}>
            <div className={styles.footerLogo}>
              <div className={styles.footerLogoMark}>
                <Cpu size={15} strokeWidth={1.75} />
              </div>
              <span className={styles.footerLogoText}>
                Code<span className={styles.footerLogoAccent}>Craft</span>
              </span>
            </div>
            <p className={styles.footerTagline}>
              An interactive Python learning platform engineered for clarity,
              deep understanding, and verified knowledge.
            </p>
          </div>

          <div className={styles.footerNavCol}>
            <span className={styles.footerNavHeader}>Navigation</span>
            <Link to="/studio" className={styles.footerLink}>Code Studio</Link>
            <Link to="/testlab" className={styles.footerLink}>AI Test Lab</Link>
            <Link to="/learn" className={styles.footerLink}>Curriculum</Link>
          </div>

          <div className={styles.footerTechCol}>
            <span className={styles.footerNavHeader}>Architecture</span>
            <span className={styles.footerTechItem}>Python 3.12 (Pyodide WASM)</span>
            <span className={styles.footerTechItem}>Monaco Code Editor</span>
            <span className={styles.footerTechItem}>Groq AI Infrastructure</span>
            <span className={styles.footerTechItem}>Client-Side State Tracking</span>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.footerBottomInner}>
            <span>&copy; {CURRENT_YEAR} CodeCraft. Built for serious Python learners.</span>
            <span className={styles.footerBuildPill}>Production Ready</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
