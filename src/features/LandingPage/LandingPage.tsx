import { Link } from 'react-router-dom'
import {
  Code2,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Terminal,
  CheckCircle2,
  Layers,
  Compass,
  Play,
  Sparkles,
  ShieldCheck,
  Cpu,
  RotateCcw,
  StepForward,
} from 'lucide-react'
import heroBg from '../../assets/hero-bg.jpg'
import styles from './LandingPage.module.css'

const CURRENT_YEAR = new Date().getFullYear()

export function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ================================================================== */}
      {/* 1. HERO SECTION (Editorial, Asymmetrical Composition)              */}
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
          <div className={styles.hero__bgGlow} />
        </div>

        <div className={styles.hero__inner}>
          {/* Left Column: Headline, Narrative & Primary Actions */}
          <div className={styles.hero__copy}>
            {/* Editorial Kicker */}
            <div className={styles.hero__kicker}>
              <span className={styles.hero__kickerDot} aria-hidden="true" />
              <span>Python 3.12 WebAssembly Environment</span>
            </div>

            {/* Headline with Editorial Typographic Contrast */}
            <h1 className={styles.hero__headline}>
              Don't just write code.
              <span className={styles.hero__headlineAccent}>
                Understand what happens.
              </span>
            </h1>

            {/* Supporting Narrative */}
            <p className={styles.hero__lead}>
              Write Python, explore execution step by step, understand errors
              and test your knowledge — all in one learning environment.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className={styles.hero__actions}>
              <Link to="/studio" className={styles.btnPrimary}>
                <span>Open Code Studio</span>
                <ArrowRight size={17} className={styles.btnIcon} />
              </Link>
              <Link to="/learn" className={styles.btnSecondary}>
                <Compass size={16} />
                <span>Explore Learn</span>
              </Link>
            </div>

            {/* Key Value Micro-Badges */}
            <div className={styles.hero__badges}>
              <div className={styles.hero__badgeItem}>
                <CheckCircle2 size={13} className={styles.badgeIcon} />
                <span>Zero-Install WebAssembly</span>
              </div>
              <div className={styles.hero__badgeItem}>
                <CheckCircle2 size={13} className={styles.badgeIcon} />
                <span>Deterministic Step Tracing</span>
              </div>
              <div className={styles.hero__badgeItem}>
                <CheckCircle2 size={13} className={styles.badgeIcon} />
                <span>Verified AI Guidance</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Artwork — Execution Engine Visual */}
          <div className={styles.hero__visual} aria-label="Execution engine preview">
            <div className={styles.visualCanvas}>
              {/* Main Floating Code & Tracer Card */}
              <div className={styles.visualCardPrimary}>
                <div className={styles.visualCardHeader}>
                  <div className={styles.visualDots}>
                    <span className={styles.dotRed} />
                    <span className={styles.dotYellow} />
                    <span className={styles.dotGreen} />
                  </div>
                  <span className={styles.visualFileName}>is_palindrome.py</span>
                  <span className={styles.visualBadgeWasm}>WASM Runtime</span>
                </div>

                <div className={styles.visualCodeBlock}>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNum}>1</span>
                    <span className={styles.codeTokenDef}>def</span>{' '}
                    <span className={styles.codeTokenFunc}>is_palindrome</span>(s:{' '}
                    <span className={styles.codeTokenType}>str</span>) -&gt;{' '}
                    <span className={styles.codeTokenType}>bool</span>:
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNum}>2</span>
                    {'    '}clean = s.<span className={styles.codeTokenFunc}>lower</span>()
                  </div>
                  <div className={`${styles.codeLine} ${styles.codeLineActive}`}>
                    <span className={styles.lineNum}>3</span>
                    {'    '}<span className={styles.codeTokenDef}>return</span>{' '}
                    clean == clean[::-<span className={styles.codeTokenNum}>1</span>]
                    <span className={styles.activePointer} aria-label="Current execution line">
                      ▶ Current Step
                    </span>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNum}>4</span>
                    word = <span className={styles.codeTokenStr}>"Racecar"</span>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNum}>5</span>
                    print(is_palindrome(word))
                  </div>
                </div>

                {/* Variable State Matrix */}
                <div className={styles.visualStateMatrix}>
                  <div className={styles.stateMatrixHeader}>
                    <Layers size={12} />
                    <span>Variable State Matrix (Step 3)</span>
                  </div>
                  <div className={styles.stateGrid}>
                    <div className={styles.statePill}>
                      <span className={styles.stateKey}>s</span>
                      <span className={styles.stateVal}>"Racecar"</span>
                    </div>
                    <div className={styles.statePill}>
                      <span className={styles.stateKey}>clean</span>
                      <span className={styles.stateVal}>"racecar"</span>
                    </div>
                    <div className={styles.statePill}>
                      <span className={styles.stateKey}>clean[::-1]</span>
                      <span className={styles.stateVal}>"racecar"</span>
                    </div>
                    <div className={`${styles.statePill} ${styles.statePillHighlight}`}>
                      <span className={styles.stateKey}>evaluates</span>
                      <span className={styles.stateVal}>True</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Diagnostics Card Overlapping */}
              <div className={styles.visualCardSecondary}>
                <div className={styles.visualSecondaryHeader}>
                  <Sparkles size={13} className={styles.sparkleIcon} />
                  <span>Smart Debugging Coach</span>
                </div>
                <div className={styles.visualSecondaryBody}>
                  <p className={styles.visualInsightText}>
                    <strong>Condition Verified:</strong> Both strings match character-for-character.
                    Slice <code>[::-1]</code> reverses in place.
                  </p>
                </div>
                <div className={styles.visualOutputPill}>
                  <span className={styles.outputDot} />
                  <span>Output: True · 0.8ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 2. PRODUCT PREVIEW (Integrated Code Studio Showcase)               */}
      {/* ================================================================== */}
      <section className={styles.previewSection} aria-label="Code Studio product preview">
        <div className={styles.previewContainer}>
          <div className={styles.previewLead}>
            <span className={styles.previewEyebrow}>Real Working Environment</span>
            <h2 className={styles.previewTitle}>The Code Studio Workspace</h2>
            <p className={styles.previewSubtitle}>
              Run code in your browser, step through variable memory, and receive
              evidence-based feedback when an error occurs.
            </p>
          </div>

          <div className={styles.studioWindow}>
            {/* Window Chrome Header */}
            <div className={styles.studioChrome}>
              <div className={styles.chromeLeft}>
                <div className={styles.chromeDots}>
                  <span className={styles.dotRed} />
                  <span className={styles.dotYellow} />
                  <span className={styles.dotGreen} />
                </div>
                <div className={styles.chromeTabs}>
                  <div className={styles.chromeTabActive}>
                    <Code2 size={13} className={styles.tabIcon} />
                    <span>fibonacci.py</span>
                  </div>
                </div>
              </div>

              <div className={styles.chromeActions}>
                <div className={styles.runButtonMock}>
                  <Play size={12} fill="currentColor" />
                  <span>Run</span>
                  <span className={styles.kbdShortcut}>Ctrl+Enter</span>
                </div>
                <div className={styles.enginePillMock}>
                  <span className={styles.engineDotMock} />
                  <span>Pyodide 0.26 / WASM</span>
                </div>
              </div>
            </div>

            {/* Studio Workspace Body: Monaco + Inspector */}
            <div className={styles.studioBody}>
              {/* Left Pane: Code Editor */}
              <div className={styles.studioEditorPane}>
                <div className={styles.editorGutter}>
                  {Array.from({ length: 11 }, (_, i) => (
                    <span
                      key={i + 1}
                      className={i + 1 === 7 ? styles.gutterActive : ''}
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
                <pre className={styles.editorContent}>
                  <code>
                    <span className={styles.codeTokenDef}>def</span> <span className={styles.codeTokenFunc}>fibonacci</span>(n: <span className={styles.codeTokenType}>int</span>) -&gt; <span className={styles.codeTokenType}>list[int]</span>:&#10;
                    {'    '}<span className={styles.codeTokenComment}>"""Generate the first n Fibonacci numbers."""</span>&#10;
                    {'    '}<span className={styles.codeTokenDef}>if</span> n &lt;= <span className={styles.codeTokenNum}>0</span>:&#10;
                    {'        '}<span className={styles.codeTokenDef}>return</span> []&#10;
                    {'    '}seq = [<span className={styles.codeTokenNum}>0</span>, <span className={styles.codeTokenNum}>1</span>]&#10;
                    {'    '}<span className={styles.codeTokenDef}>while</span> len(seq) &lt; n:&#10;
                    <span className={styles.codeLineHighlighted}>
                      {'        '}seq.<span className={styles.codeTokenFunc}>append</span>(seq[-<span className={styles.codeTokenNum}>1</span>] + seq[-<span className={styles.codeTokenNum}>2</span>])  <span className={styles.traceIndicator}>← Step 4</span>
                    </span>&#10;
                    {'    '}<span className={styles.codeTokenDef}>return</span> seq[:n]&#10;
                    &#10;
                    result = fibonacci(<span className={styles.codeTokenNum}>8</span>)&#10;
                    print(<span className={styles.codeTokenStr}>f"Fibonacci: &#123;result&#125;"</span>)
                  </code>
                </pre>
              </div>

              {/* Right Pane: Inspector (Visualizer & Console) */}
              <div className={styles.studioInspectorPane}>
                {/* Inspector Tab Bar */}
                <div className={styles.inspectorTabBar}>
                  <div className={`${styles.inspectorTab} ${styles.inspectorTabActive}`}>
                    <Layers size={13} />
                    <span>Visualizer</span>
                  </div>
                  <div className={styles.inspectorTab}>
                    <Terminal size={13} />
                    <span>Console</span>
                  </div>
                  <div className={styles.inspectorTab}>
                    <Sparkles size={13} />
                    <span>Coach</span>
                  </div>
                </div>

                {/* Visualizer Step Controls */}
                <div className={styles.tracerControls}>
                  <div className={styles.stepCounter}>
                    <span>Step <strong>4</strong> of 7</span>
                    <span className={styles.stepProgressPill}>Iteration 2</span>
                  </div>
                  <div className={styles.stepBtnGroup}>
                    <button className={styles.stepMiniBtn} aria-label="Step Backward" disabled>
                      <RotateCcw size={12} />
                    </button>
                    <button className={styles.stepMiniBtn} aria-label="Step Forward">
                      <StepForward size={12} />
                    </button>
                  </div>
                </div>

                {/* Live Variable Inspector Table */}
                <div className={styles.varInspector}>
                  <div className={styles.varHeader}>
                    <span>Variable</span>
                    <span>Value</span>
                    <span>Type</span>
                  </div>
                  <div className={styles.varRow}>
                    <span className={styles.varName}>n</span>
                    <span className={styles.varVal}>8</span>
                    <span className={styles.varType}>int</span>
                  </div>
                  <div className={`${styles.varRow} ${styles.varRowModified}`}>
                    <span className={styles.varName}>seq</span>
                    <span className={styles.varVal}>[0, 1, 1, 2]</span>
                    <span className={styles.varType}>list</span>
                  </div>
                  <div className={styles.varRow}>
                    <span className={styles.varName}>len(seq)</span>
                    <span className={styles.varVal}>4</span>
                    <span className={styles.varType}>int</span>
                  </div>
                </div>

                {/* Console Output Preview */}
                <div className={styles.terminalPreviewBox}>
                  <div className={styles.terminalHeader}>
                    <Terminal size={12} />
                    <span>Standard Output</span>
                    <span className={styles.processComplete}>24ms</span>
                  </div>
                  <div className={styles.terminalBody}>
                    <code>Fibonacci: [0, 1, 1, 2, 3, 5, 8, 13]</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Studio Bottom Bar */}
            <div className={styles.studioFooter}>
              <span className={styles.studioFooterStatus}>
                <span className={styles.footerGreenDot} />
                Ready for user input · Interactive session
              </span>
              <Link to="/studio" className={styles.studioLaunchLink}>
                <span>Launch Studio in Full Screen</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 3. BELOW THE HERO — THREE CORE WORKSPACES (Phase 4)                */}
      {/* ================================================================== */}
      <section className={styles.pillarsSection} aria-labelledby="pillars-heading">
        <div className={styles.pillarsContainer}>
          <div className={styles.pillarsHeader}>
            <span className={styles.pillarsKicker}>Integrated Learning Architecture</span>
            <h2 id="pillars-heading" className={styles.pillarsTitle}>
              Three Pillars of Python Mastery
            </h2>
            <p className={styles.pillarsSubtitle}>
              CodeCraft is built around three dedicated, integrated environments
              to turn passive syntax memorization into genuine programming intuition.
            </p>
          </div>

          <div className={styles.pillarsGrid}>
            {/* Pillar 1: Code Studio */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarTop}>
                <div className={styles.pillarIcon}>
                  <Code2 size={22} strokeWidth={1.75} />
                </div>
                <span className={styles.pillarTag}>Core Workspace</span>
              </div>
              <h3 className={styles.pillarTitle}>Code Studio</h3>
              <p className={styles.pillarLead}>
                Write and execute Python in an isolated WebAssembly sandbox. Step
                through line-by-line variable updates, and resolve mistakes with
                the Smart Debugging Coach.
              </p>
              <ul className={styles.pillarList}>
                <li>Monaco editor with full Python syntax intelligence</li>
                <li>Visual execution tracer with state snapshots</li>
                <li>Evidence-based Smart Debugging Coach</li>
              </ul>
              <Link to="/studio" className={styles.pillarActionBtn}>
                <span>Open Code Studio</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Pillar 2: AI Test Lab */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarTop}>
                <div className={styles.pillarIcon}>
                  <FlaskConical size={22} strokeWidth={1.75} />
                </div>
                <span className={styles.pillarTag}>Assessment Lab</span>
              </div>
              <h3 className={styles.pillarTitle}>AI Test Lab</h3>
              <p className={styles.pillarLead}>
                Practice with generated assessments, evaluate your understanding,
                and review results. Every multiple-choice question is verified by
                the Python engine.
              </p>
              <ul className={styles.pillarList}>
                <li>Output questions verified by genuine Pyodide runtime</li>
                <li>Adaptive difficulty tailored to your progress</li>
                <li>Targeted retesting directly from debugging diagnoses</li>
              </ul>
              <Link to="/testlab" className={styles.pillarActionBtn}>
                <span>Enter Test Lab</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Pillar 3: Learn */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarTop}>
                <div className={styles.pillarIcon}>
                  <BookOpen size={22} strokeWidth={1.75} />
                </div>
                <span className={styles.pillarTag}>Curriculum</span>
              </div>
              <h3 className={styles.pillarTitle}>Learn</h3>
              <p className={styles.pillarLead}>
                Build programming foundations and strengthen your understanding
                with a structured modular curriculum, mastery indicators, and
                targeted exercises.
              </p>
              <ul className={styles.pillarList}>
                <li>Curated topics from fundamentals to data structures</li>
                <li>Real-time mastery tracking with learning event history</li>
                <li>Dedicated debugging practice exercises with pre-set bugs</li>
              </ul>
              <Link to="/learn" className={styles.pillarActionBtn}>
                <span>Explore Curriculum</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 4. HONEST ENGINEERING PRINCIPLES                                   */}
      {/* ================================================================== */}
      <section className={styles.principlesSection} aria-label="Engineering principles">
        <div className={styles.principlesContainer}>
          <div className={styles.principlesHeader}>
            <span className={styles.principlesKicker}>Guiding Philosophy</span>
            <h2 className={styles.principlesTitle}>Designed for Genuine Learning</h2>
            <p className={styles.principlesSubtitle}>
              No fabricated streaks, no invented metrics, and no simulated outputs.
            </p>
          </div>

          <div className={styles.principlesGrid}>
            <div className={styles.principleCard}>
              <div className={styles.principleIconWrap}>
                <Cpu size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className={styles.principleCardTitle}>Real Runtime Execution</h3>
                <p className={styles.principleCardText}>
                  Your code executes in a genuine WebAssembly Pyodide runtime in
                  a dedicated browser worker with authentic stdout, stderr, and tracebacks.
                </p>
              </div>
            </div>

            <div className={styles.principleCard}>
              <div className={styles.principleIconWrap}>
                <CheckCircle2 size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className={styles.principleCardTitle}>Deterministic Diagnostics</h3>
                <p className={styles.principleCardText}>
                  The Smart Debugging Coach analyzes concrete trace state and test
                  assertions, guiding students with three progressive levels rather
                  than generic guesses.
                </p>
              </div>
            </div>

            <div className={styles.principleCard}>
              <div className={styles.principleIconWrap}>
                <ShieldCheck size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className={styles.principleCardTitle}>Hardened Security</h3>
                <p className={styles.principleCardText}>
                  AI features communicate exclusively with a secured server backend.
                  API keys and credentials are never exposed to browser clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 5. EDITORIAL BOTTOM CTA                                            */}
      {/* ================================================================== */}
      <section className={styles.ctaSection} aria-labelledby="cta-heading">
        <div className={styles.ctaContainer}>
          <div className={styles.ctaCard}>
            <span className={styles.ctaKicker}>Start Coding Now</span>
            <h2 id="cta-heading" className={styles.ctaTitle}>
              Ready to understand your code?
            </h2>
            <p className={styles.ctaLead}>
              Open Code Studio to write, trace, and diagnose Python code in WebAssembly,
              or test your skills in the AI Test Lab.
            </p>
            <div className={styles.ctaButtons}>
              <Link to="/studio" className={styles.btnPrimary}>
                <span>Launch Code Studio</span>
                <ArrowRight size={17} className={styles.btnIcon} />
              </Link>
              <Link to="/learn" className={styles.btnSecondary}>
                <BookOpen size={16} />
                <span>Browse Lessons</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 6. REFINED FOOTER                                                  */}
      {/* ================================================================== */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrandCol}>
            <div className={styles.footerLogo}>
              <div className={styles.footerLogoMark}>
                <Cpu size={16} strokeWidth={1.75} />
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
