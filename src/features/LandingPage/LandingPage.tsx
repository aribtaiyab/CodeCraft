import { Link } from 'react-router-dom'
import {
  Code2,
  BookOpen,
  ArrowRight,
  Terminal,
  Layers,
  Compass,
  ShieldCheck,
  Cpu,
  Workflow,
  CheckCircle2,
} from 'lucide-react'
import heroBg from '../../assets/hero-bg.jpg'
import { BrandSymbol } from '../../components/Brand/BrandSymbol'
import styles from './LandingPage.module.css'

const CURRENT_YEAR = new Date().getFullYear()

export function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ================================================================== */}
      {/* 1. ASYMMETRICAL EDITORIAL HERO                                     */}
      {/* ================================================================== */}
      <section className={styles.hero} aria-label="Hero">
        {/* Integrated Mountain Sunset Canvas */}
        <div className={styles.hero__backdrop} aria-hidden="true">
          <img
            src={heroBg}
            alt=""
            className={styles.hero__bgImage}
            loading="eager"
          />
          <div className={styles.hero__bgOverlay} />
          <div className={styles.hero__ambientGlow} />
        </div>

        <div className={styles.hero__container}>
          {/* Architectural Masthead Line */}
          <div className={styles.hero__masthead}>
            <div className={styles.mastheadTag}>
              <span className={styles.mastheadCross}>+</span>
              <span>VOL. 01 — RUNTIME INTUITION</span>
            </div>
            <div className={styles.mastheadMeta}>
              <span>CLIENT-SIDE WEBASSEMBLY</span>
              <span className={styles.mastheadSep}>/</span>
              <span>DETERMINISTIC TRACE</span>
              <span className={styles.mastheadSep}>/</span>
              <span>EVIDENCE MENTORSHIP</span>
            </div>
          </div>

          {/* Layered Expressive Headline */}
          <div className={styles.hero__headlineSpread}>
            <div className={styles.headlineKicker}>
              <span className={styles.kickerDot} />
              <span>Python 3.12 Developer Studio</span>
            </div>

            <h1 className={styles.hero__title}>
              <span className={styles.titleLineUpper}>Don't just write code.</span>
              <span className={styles.titleLineAccent}>
                <em>Understand</em> every step.
              </span>
            </h1>
          </div>

          {/* Asymmetrical Content & Cognitive Runtime Atlas Grid */}
          <div className={styles.hero__mainGrid}>
            {/* Storytelling Narrative & Action Column */}
            <div className={styles.hero__storyCol}>
              <p className={styles.hero__manifesto}>
                Syntax teaches you what to type. CodeCraft shows you how Python
                actually thinks. Run code in WebAssembly, step through program memory
                line by line, and turn runtime mistakes into permanent intuition.
              </p>

              <div className={styles.hero__actions}>
                <Link to="/studio" className={styles.btnPrimary}>
                  <span>Enter Code Studio</span>
                  <ArrowRight size={15} className={styles.btnIcon} />
                </Link>
                <Link to="/learn" className={styles.btnSecondary}>
                  <Compass size={15} className={styles.btnSecondaryIcon} />
                  <span>Explore Curriculum</span>
                </Link>
              </div>

              {/* Three-Phase Learning Progression */}
              <div className={styles.hero__progression}>
                <div className={styles.progressionItem}>
                  <span className={styles.progressionNum}>01</span>
                  <div className={styles.progressionText}>
                    <strong>Write Python</strong>
                    <span>In-Browser Pyodide 3.12</span>
                  </div>
                </div>
                <span className={styles.progressionArrow} aria-hidden="true">&rarr;</span>
                <div className={styles.progressionItem}>
                  <span className={styles.progressionNum}>02</span>
                  <div className={styles.progressionText}>
                    <strong>Trace Memory</strong>
                    <span>Step-by-step state</span>
                  </div>
                </div>
                <span className={styles.progressionArrow} aria-hidden="true">&rarr;</span>
                <div className={styles.progressionItem}>
                  <span className={styles.progressionNum}>03</span>
                  <div className={styles.progressionText}>
                    <strong>Master Logic</strong>
                    <span>Evidence-based coaching</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Python Execution Flow Atlas */}
            <div className={styles.hero__atlasCol}>
              <div className={styles.atlasConnected}>
                {/* 1. Orchestration Masthead */}
                <div className={styles.atlasMasthead}>
                  <div className={styles.atlasMastheadLeft}>
                    <span className={styles.pulseNode} />
                    <span className={styles.atlasFlowBadge}>STEP 03 OF 03</span>
                    <span className={styles.atlasFlowTitle}>
                      binary_search(nums, target=21)
                    </span>
                  </div>
                  <div className={styles.atlasMastheadRight}>
                    <span className={styles.atlasEnvTag}>Pyodide WASM · Python 3.12</span>
                  </div>
                </div>

                {/* 2. Coherent Flow Matrix: Code Instruction -> State Transformation */}
                <div className={styles.atlasFlowBody}>
                  {/* Left Column: Code Instruction with Active Step */}
                  <div className={styles.atlasCodeStream}>
                    <div className={styles.streamLabel}>
                      <span>EXECUTION THREAD</span>
                      <span className={styles.streamSub}>binary_search.py</span>
                    </div>

                    <div className={styles.codeListing}>
                      <div className={styles.codeRow}>
                        <span className={styles.rowNum}>1</span>
                        <code className={styles.rowCode}>
                          <span className={styles.cKw}>def</span>{' '}
                          <span className={styles.cFn}>binary_search</span>(
                          <span className={styles.cVar}>nums</span>,{' '}
                          <span className={styles.cVar}>target</span>):
                        </code>
                      </div>
                      <div className={styles.codeRow}>
                        <span className={styles.rowNum}>2</span>
                        <code className={styles.rowCode}>
                          {'  '}<span className={styles.cVar}>low</span>,{' '}
                          <span className={styles.cVar}>high</span> ={' '}
                          <span className={styles.cNum}>0</span>,{' '}
                          <span className={styles.cFn}>len</span>(<span className={styles.cVar}>nums</span>) -{' '}
                          <span className={styles.cNum}>1</span>
                        </code>
                      </div>
                      <div className={styles.codeRow}>
                        <span className={styles.rowNum}>3</span>
                        <code className={styles.rowCode}>
                          {'  '}<span className={styles.cKw}>while</span>{' '}
                          <span className={styles.cVar}>low</span> &lt;={' '}
                          <span className={styles.cVar}>high</span>:
                        </code>
                      </div>
                      <div className={styles.codeRow}>
                        <span className={styles.rowNum}>4</span>
                        <code className={styles.rowCode}>
                          {'    '}<span className={styles.cVar}>mid</span> = (
                          <span className={styles.cVar}>low</span> +{' '}
                          <span className={styles.cVar}>high</span>) //{' '}
                          <span className={styles.cNum}>2</span>
                        </code>
                      </div>
                      <div className={styles.codeRow}>
                        <span className={styles.rowNum}>5</span>
                        <code className={styles.rowCode}>
                          {'    '}<span className={styles.cKw}>if</span>{' '}
                          <span className={styles.cVar}>nums</span>[
                          <span className={styles.cVar}>mid</span>] =={' '}
                          <span className={styles.cVar}>target</span>:
                        </code>
                      </div>

                      {/* Active Execution Line with Connected Trace Origin */}
                      <div className={`${styles.codeRow} ${styles.codeRowActive}`}>
                        <span className={styles.rowNumActive}>6</span>
                        <code className={styles.rowCode}>
                          {'      '}<span className={styles.cKw}>return</span>{' '}
                          <span className={styles.cVar}>mid</span>
                        </code>
                        <div className={styles.activeStepTag}>
                          <span className={styles.activeStepDot} />
                          <span>Matched</span>
                        </div>
                      </div>

                      <div className={styles.codeRow}>
                        <span className={styles.rowNum}>7</span>
                        <code className={styles.rowCode}>
                          {'    '}<span className={styles.cKw}>elif</span>{' '}
                          <span className={styles.cVar}>nums</span>[
                          <span className={styles.cVar}>mid</span>] &lt;{' '}
                          <span className={styles.cVar}>target</span>:
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Visual Connection Conduit between Code and State */}
                  <div className={styles.atlasConnectorRail} aria-hidden="true">
                    <div className={styles.connectorLineTop} />
                    <div className={styles.connectorNode}>
                      <span className={styles.nodeCore} />
                    </div>
                    <div className={styles.connectorLineBottom} />
                  </div>

                  {/* Right Column: Live Memory Array & Pointer Transformation */}
                  <div className={styles.atlasStateStream}>
                    <div className={styles.streamLabel}>
                      <span>MEMORY BUFFER &amp; POINTER MATRIX</span>
                      <span className={styles.streamSub}>nums: list[int]</span>
                    </div>

                    {/* Array Cells Visualization */}
                    <div className={styles.arrayContainer}>
                      <div className={styles.arrayMeta}>
                        <span>Contiguous Array Buffer (len=6)</span>
                        <span className={styles.arrayTargetTag}>target = 21</span>
                      </div>

                      <div className={styles.arrayCellsGrid}>
                        <div className={styles.arrayCell}>
                          <span className={styles.cellIndex}>[0]</span>
                          <span className={styles.cellVal}>4</span>
                          <span className={styles.cellStatus}>eliminated</span>
                        </div>
                        <div className={styles.arrayCell}>
                          <span className={styles.cellIndex}>[1]</span>
                          <span className={styles.cellVal}>9</span>
                          <span className={styles.cellStatus}>eliminated</span>
                        </div>
                        <div className={styles.arrayCell}>
                          <span className={styles.cellIndex}>[2]</span>
                          <span className={styles.cellVal}>15</span>
                          <span className={styles.cellStatus}>step 1</span>
                        </div>
                        <div className={`${styles.arrayCell} ${styles.cellActive}`}>
                          <span className={styles.cellIndexActive}>[3]</span>
                          <span className={styles.cellValActive}>21</span>
                          <div className={styles.pointerPill}>
                            <span className={styles.pointerCaret}>▲</span>
                            <span>mid = 3</span>
                          </div>
                        </div>
                        <div className={styles.arrayCell}>
                          <span className={styles.cellIndex}>[4]</span>
                          <span className={styles.cellVal}>34</span>
                          <span className={styles.cellStatus}>step 2</span>
                        </div>
                        <div className={styles.arrayCell}>
                          <span className={styles.cellIndex}>[5]</span>
                          <span className={styles.cellVal}>50</span>
                          <span className={styles.cellStatus}>eliminated</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Register Telemetry */}
                    <div className={styles.registerMatrix}>
                      <div className={styles.regField}>
                        <span className={styles.regLabel}>low / high</span>
                        <span className={styles.regValue}>3, 3</span>
                      </div>
                      <div className={styles.regField}>
                        <span className={styles.regLabel}>evaluated</span>
                        <span className={styles.regValue}>nums[3] = 21</span>
                      </div>
                      <div className={`${styles.regField} ${styles.regFieldHighlight}`}>
                        <span className={styles.regLabel}>equality</span>
                        <span className={styles.regValueMatch}>21 == 21 (True)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Output & Pipeline Conduit */}
                <div className={styles.atlasOutputStrip}>
                  <div className={styles.outputLeft}>
                    <div className={styles.outputLeadIcon}>
                      <Workflow size={13} />
                    </div>
                    <div className={styles.outputText}>
                      <span className={styles.outputReturnBadge}>RETURN</span>
                      <span className={styles.outputVal}>Index 3</span>
                      <span className={styles.outputDivider}>/</span>
                      <span className={styles.outputDesc}>
                        Target 21 resolved in 3 logarithmic subdivisions
                      </span>
                    </div>
                  </div>
                  <div className={styles.outputTelemetry}>
                    <span>Pyodide WebAssembly · 0.8ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 2. THE THREE CRUCIBLES (Asymmetrical Editorial Dossier)             */}
      {/* ================================================================== */}
      <section className={styles.triadSection} aria-labelledby="triad-heading">
        <div className={styles.triadContainer}>
          <div className={styles.triadHeader}>
            <span className={styles.editorialChapter}>[ ARCHITECTURE ]</span>
            <h2 id="triad-heading" className={styles.triadMainTitle}>
              Three Pillars of Python Mastery
            </h2>
            <p className={styles.triadLead}>
              CodeCraft eliminates passive video watching. Everything is anchored
              in writing code, inspecting runtime state, and resolving mistakes.
            </p>
          </div>

          <div className={styles.dossierGrid}>
            {/* Dossier 01: Lead Feature — Code Studio */}
            <div className={styles.dossierLead}>
              <div className={styles.dossierIndexTag}>
                <span className={styles.dossierIndexNum}>01</span>
                <span className={styles.dossierBadge}>CORE WORKSPACE</span>
              </div>
              <div className={styles.dossierLeadBody}>
                <div className={styles.dossierLeadMain}>
                  <h3 className={styles.dossierTitle}>The Code Studio</h3>
                  <p className={styles.dossierDescription}>
                    Run real Python 3.12 in WebAssembly without cloud servers,
                    installation, or environment setup. Step forward and backward
                    through program memory, observe variables mutate in real time,
                    and receive evidence-based guidance from the Smart Debugging Coach.
                  </p>
                  <ul className={styles.dossierSpecsList}>
                    <li>
                      <CheckCircle2 size={13} className={styles.specCheck} />
                      <span>Monaco editor with full Python language syntax intelligence</span>
                    </li>
                    <li>
                      <CheckCircle2 size={13} className={styles.specCheck} />
                      <span>Deterministic step-by-step visual execution tracer</span>
                    </li>
                    <li>
                      <CheckCircle2 size={13} className={styles.specCheck} />
                      <span>3-level progressive Smart Debugging Coach (Hint &rarr; Explanation &rarr; Solution)</span>
                    </li>
                  </ul>
                  <Link to="/studio" className={styles.dossierActionPrimary}>
                    <span>Launch Code Studio</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
                <div className={styles.dossierLeadAside}>
                  <div className={styles.asidePill}>
                    <Code2 size={18} className={styles.asideIcon} />
                    <span className={styles.asideTitle}>WebAssembly Worker</span>
                    <span className={styles.asideSubtitle}>Zero Cloud Latency</span>
                  </div>
                  <div className={styles.asideTerminal}>
                    <div className={styles.asideTermHeader}>
                      <Terminal size={11} />
                      <span>stdout · stdout.io</span>
                    </div>
                    <code>
                      $ python main.py<br />
                      &gt;&gt;&gt; Fibonacci sequence verified.<br />
                      [Finished in 0.8ms · 0 memory leaks]
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Dossier 02 & 03: Asymmetrical Companions */}
            <div className={styles.dossierSubGrid}>
              {/* Dossier 02: AI Test Lab */}
              <div className={styles.dossierSubCard}>
                <div className={styles.dossierIndexTag}>
                  <span className={styles.dossierIndexNum}>02</span>
                  <span className={styles.dossierBadge}>ASSESSMENT LAB</span>
                </div>
                <h3 className={styles.dossierTitle}>AI Test Lab</h3>
                <p className={styles.dossierDescription}>
                  Practice with generated assessments where every single question
                  and test case is compiled and verified directly by the live Python
                  engine. No hallucinations or misleading answer keys.
                </p>
                <ul className={styles.dossierSpecsListSmall}>
                  <li>Verified by client Pyodide runtime</li>
                  <li>Adaptive difficulty tailored to your progress</li>
                  <li>Targeted retesting directly from debugging diagnoses</li>
                </ul>
                <Link to="/testlab" className={styles.dossierAction}>
                  <span>Enter Test Lab</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Dossier 03: The Curriculum */}
              <div className={styles.dossierSubCard}>
                <div className={styles.dossierIndexTag}>
                  <span className={styles.dossierIndexNum}>03</span>
                  <span className={styles.dossierBadge}>CURRICULUM</span>
                </div>
                <h3 className={styles.dossierTitle}>Learn</h3>
                <p className={styles.dossierDescription}>
                  A structured modular roadmap from Python fundamentals to data
                  structures, complete with real-time mastery tracking, error
                  taxonomies, and dedicated debugging exercises.
                </p>
                <ul className={styles.dossierSpecsListSmall}>
                  <li>Curated progressive lessons with mastery milestones</li>
                  <li>Real-time mastery tracking with learning event history</li>
                  <li>Targeted debugging exercises with pre-set bugs</li>
                </ul>
                <Link to="/learn" className={styles.dossierAction}>
                  <span>Explore Curriculum</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 3. TECHNICAL MANIFESTO (Engineering Principles)                     */}
      {/* ================================================================== */}
      <section className={styles.manifestoSection} aria-label="Engineering principles">
        <div className={styles.manifestoContainer}>
          <div className={styles.manifestoGrid}>
            <div className={styles.manifestoLeadCol}>
              <span className={styles.editorialChapter}>[ PHILOSOPHY ]</span>
              <h2 className={styles.manifestoHeadline}>
                Engineered for Truth.
              </h2>
              <p className={styles.manifestoSub}>
                No fake streaks. No invented performance metrics. No simulated outputs.
                Every interaction is grounded in real Python compiler mechanics.
              </p>
            </div>

            <div className={styles.manifestoSpecsCol}>
              <div className={styles.specRow}>
                <div className={styles.specIconMark}>
                  <Cpu size={16} strokeWidth={1.75} />
                </div>
                <div className={styles.specRowContent}>
                  <h3 className={styles.specTitle}>True Runtime Execution</h3>
                  <p className={styles.specDesc}>
                    Your Python code executes in a genuine WebAssembly Pyodide runtime
                    inside a dedicated browser Web Worker with authentic stdout, stderr,
                    and tracebacks.
                  </p>
                </div>
              </div>

              <div className={styles.specRow}>
                <div className={styles.specIconMark}>
                  <Layers size={16} strokeWidth={1.75} />
                </div>
                <div className={styles.specRowContent}>
                  <h3 className={styles.specTitle}>Deterministic State Snapshots</h3>
                  <p className={styles.specDesc}>
                    The Smart Debugging Coach analyzes concrete trace state and test
                    assertions, guiding you with three progressive levels rather than
                    generic advice.
                  </p>
                </div>
              </div>

              <div className={styles.specRow}>
                <div className={styles.specIconMark}>
                  <ShieldCheck size={16} strokeWidth={1.75} />
                </div>
                <div className={styles.specRowContent}>
                  <h3 className={styles.specTitle}>Hardened Host Privacy</h3>
                  <p className={styles.specDesc}>
                    AI mentor features communicate exclusively with a secured server
                    relay. Your code runs locally in your browser, and API keys are
                    never exposed to the client.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 4. EDITORIAL CLOSING INVITATION                                    */}
      {/* ================================================================== */}
      <section className={styles.closingSection} aria-labelledby="closing-heading">
        <div className={styles.closingContainer}>
          <div className={styles.closingCard}>
            <span className={styles.editorialChapter}>[ READY TO BEGIN ]</span>
            <h2 id="closing-heading" className={styles.closingTitle}>
              Start coding with clear understanding.
            </h2>
            <p className={styles.closingLead}>
              Open Code Studio to write, trace, and diagnose Python code in WebAssembly,
              or test your skills in the AI Test Lab.
            </p>
            <div className={styles.closingButtons}>
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
      {/* 5. ARCHITECTURAL FOOTER                                             */}
      {/* ================================================================== */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrandCol}>
            <div className={styles.footerLogo}>
              <div className={styles.footerLogoMark}>
                <BrandSymbol size={18} />
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
