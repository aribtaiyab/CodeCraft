# CodeCraft — Craftsman's Coding Studio

> **Phase 1: Foundation Complete**  
> **Phase 2: Real Python Editor and Execution Engine Complete**  
> **Phase 3: Predict Before You Run + Real Execution Visualization Complete**  
> **Phase 4: Smart Debugging Coach + Test Your Fix Complete**  
> **Phase 5: Groq-Powered Explanations, Follow-up Q&A, and MCQs Complete**  
> A premium, responsive web studio for developers and learners. Built with React, TypeScript, Monaco Editor, Pyodide WebAssembly, and Groq LLM integration.

---

## 🎨 Design Philosophy & Palette

CodeCraft adheres to a disciplined, craftsman aesthetic designed for long sessions and visual clarity without distracting neon glows or generic AI tropes:

- **Warm Charcoal (`#191815`)**: Deep, low-fatigue page canvas
- **Graphite (`#24221E`)**: Elevated cards, editor frames, and navigation surfaces
- **Muted Bronze (`#B8895B`)**: Subtle accents, active states, and focal points
- **Ivory (`#F4F0E8`)**: High-contrast, readable primary typography
- **Warm Gray Borders (`#38342D`)**: Tactile borders and structural divisions
- **Typography**: Google Fonts Inter for UI, JetBrains Mono for code

---

## 🧭 Application Structure & Routes

| Route | Workspace | Description |
|---|---|---|
| `/` | **Landing Page** | Value proposition, engineering principles, workspace cards, and roadmap |
| `/studio` | **Code Studio** | Monaco Python editor, Pyodide Web Worker execution, interactive `input()`, Execution Tracing & Stepper, Predict Before You Run, and Console Output |
| `/testlab` | **AI Test Lab** | Test suite configuration, test runners, assertion viewers, and honest empty states |
| `/learn` | **Curriculum** | Interactive learning paths, modular curriculum trees, and progress indicators |
| `/*` | **404 Page** | Honest fallback route adhering to the dark craftsman theme |

---

## 🔍 Phase 3: Predict Before You Run + Execution Visualization

### 1. Predict Before You Run
- **Mental Modeling**: Formulate a hypothesis of program output before executing.
- **Diff & Comparison Engine**: Compares predicted lines against actual stdout upon run completion.
- **Line-by-Line Verdict**: Visual badges (`✓ match`, `✕ diff`) with exact line-by-line comparison tables.
- **Stale-Result Invalidation**: Modifying code in Monaco automatically flags previous predictions with a `Modified` badge and warning banner.

### 2. Real Execution Tracing (`sys.settrace`)
- **Zero Fabrication**: Every visualization step is derived from real Python execution events inside the Web Worker.
- **Supported Python Subset**:
  - Variable assignments (`x = 10`, `name = "CodeCraft"`)
  - Arithmetic & boolean expressions
  - Print statements (`print(...)`)
  - Conditional branching (`if`, `elif`, `else`)
  - Loops (`for`, `while`, `break`, `continue`)
  - List creation, indexing, and mutations (`.append()`, in-place updates)
  - Dictionary creation, key assignment, lookups, and iteration
  - Simple function definitions, argument passing, and returns
- **Historical Snapshots**: Local variables and call stacks are safely snapshot at every step (primitives, capped collections up to 50 items, safe repr fallback for complex objects).
- **Step-Synced Stdout**: Shows cumulative output emitted up to the currently inspected step.
- **Truncation & Performance Limit**: Capped at 500 steps (`MAX_STEPS = 500`) to prevent browser memory exhaustion on large loops.

### 3. Step Controls & Monaco Synchronization
- **Navigation Controls**:
  - `|<<`: Jump to start (Step 1)
  - `< Step`: Step backward
  - `Step >`: Step forward
  - `>>|`: Jump to end
  - Interactive timeline scrubber slider
- **Source Line Highlighting**: Monaco editor highlights the active line (`monaco-active-trace-line`) with warm bronze styling and glyph marker (`▶`), smoothly revealing lines outside the viewport.
- **Variable Inspector**: Displays in-scope variables with types, current values, and `updated` tags highlighting variables that mutated on the current step.
- **Pure History Navigation**: Navigating steps reads from stored snapshots and **never re-runs code**.

---

## 🛠️ Phase 4: Smart Debugging Coach + Test Your Fix

### 1. Deterministic Bug Taxonomy (Zero External AI Dependencies)
- **Evidence-Based Analysis**: Analyzes real execution traces, Python traceback strings, and explicit test failure assertion diffs. Never hallucinates line numbers or guesses student intent.
- **Supported Bug Taxonomy**:
  - `ZeroDivisionError`: Missing empty list / zero-divisor guard checks before division or modulo operations.
  - `IndexError` (Off-by-One): Loop headers overshooting list boundaries (`range(len(...) + 1)`) and direct `list[len(list)]` out-of-bounds indexing.
  - `NameError` (Typo & Scope): Levenshtein distance matching against in-scope identifiers and function arguments.
  - `TypeError` (Operand Mismatch): Mixing strings and numbers in arithmetic expressions without `int()` / `float()` conversion.
  - `KeyError` (Dictionary Lookup): Missing key guards or recommending `.get(key, default)`.
  - `Early Return in Loop`: Premature indentation of `return` statements inside iteration blocks.
  - `Missing Return`: Functions computing results locally but implicitly returning `None`.

### 2. Progressive 3-Level Hint System
- **Level 1: Gentle Guidance (Guiding Question)**: Socratic prompt encouraging mental debugging without spoiling the answer.
- **Level 2: Diagnosis & Concrete Evidence**: Pinpoints exact failing line, observed value vs. expected behavior, and beginner-friendly root cause explanation.
- **Level 3: Suggested Fix with Before/After Diff**: Visual comparison showing original code vs. proposed fix.
- **Explicit User Action & Undo Protection**: Suggested fixes are **never silently applied**. The user must click `Apply Suggested Fix`. An `Undo Fix` button instantly restores previous code.
- **Stale Suggestion Detection**: If student edits code after receiving a diagnosis, suggestions are marked stale with a re-run prompt.

### 3. Test Your Fix Runner (Real Pyodide Execution)
- **Isolated Namespace**: Evaluates test expressions in a dedicated dictionary namespace inside the real Pyodide WebAssembly worker.
- **Structured Test Assertions**: Curated catalog of paired debugging exercises with trusted assertions, expected return values, and concept tags:
  - `Safe Average Calculator` ↔ `Pass Rate Percentage` (`zero-division-guard`)
  - `Find Maximum Index` ↔ `Last Item Getter` (`loops-indexing`)
  - `Vowel Counter` ↔ `Sum Positive Numbers` (`functions-returns`)
  - `Player Score Lookup` ↔ `Check Inventory` (`dict-key-lookup`)
  - `Sum String Numbers` ↔ `Double Numeric String` (`type-conversion`)
- **Status Badges**: Real-time per-test results (`PASSED`, `FAILED`, `ERROR`, `IDLE`).
- **Related Challenge Recommendation**: Upon all tests passing, displays a celebration card with a one-click loader for a paired exercise sharing the same concept tag.

---

## 🤖 Phase 5: Groq-Powered Code Explanations, Follow-up Q&A, and MCQs

### 1. Backend & Security Architecture
- **Server-Only Secret Isolation**: The `GROQ_API_KEY` is strictly managed server-side in Node.js. It is **never exposed** in React bundles, `VITE_` client variables, network responses, error messages, Git history, or client console logs.
- **`.gitignore` & `.env.example`**: `.env` and `.env.*` are explicitly ignored in `.gitignore`. A placeholder-only template is provided in [`.env.example`](file:///c:/Users/dell/Downloads/CodeCraft--/.env.example).
- **Hardened API Gateway**:
  - **CORS Protection**: Restricted to frontend application origins.
  - **Payload Size Capping**: Request bodies strictly capped at 100KB with 50,000-character code bounds to prevent resource abuse.
  - **Rate Limiting**: In-memory token bucket limiter (60 requests / 15 min per IP) with HTTP 429 and `Retry-After` headers.
  - **No Unrestricted Proxy**: Endpoints validate explicit JSON input schemas (`code`, `selection`, `question`, `conceptTag`, `sourceHash`).
  - **Isolation**: Groq downtime or missing keys **never break ordinary Python execution**, tracing, or testing.

### 2. Supported Official Groq Model
- **Model**: `llama-3.3-70b-versatile` (131K context window, fast inference, low temperature 0.2 for deterministic code analysis).
- **Fallback**: Configurable via `GROQ_MODEL=llama-3.1-8b-instant`.

### 3. API Endpoints
- `GET /api/ai/health`: Returns service health and whether a valid local `GROQ_API_KEY` is loaded (without revealing the key).
- `POST /api/ai/explain`: Generates a high-level summary, key concept tags, and line-by-line breakdown for the full script or user-selected lines.
- `POST /api/ai/ask`: Contextual follow-up Q&A grounded in user code, selection range, and runtime context (stdout, error messages, and trace summaries).
- `POST /api/ai/generate-mcqs`: Generates 4-option code-specific multiple-choice questions with answer keys and explanations.

### 4. Answer Correctness & Verification Architecture
- **Schema Validation & Static Analysis**: Validates that all generated questions have at least 2 distinct non-empty options and a valid `correctIndex`. Server-side host process execution is strictly disabled.
- **Browser Pyodide Runtime Verification**: Code-output questions are dynamically verified against the actual Python stdout generated inside the browser's dedicated Pyodide Web Worker.
- **Sandbox Boundary Clarity**: WebAssembly and a dedicated Web Worker isolate client-side Python execution from the Node.js server and host filesystem. However, this is not a perfect security sandbox; execution is subject to browser tab memory limits, UI thread synchronization, and browser-level security boundaries.
- **Stale Invalidation**: If user code changes in Monaco, output is cleared, or an execution error occurs, verification results are immediately invalidated and marked with `Stale Output`.
- **Honest Labeling**: Conceptual questions are strictly marked `Conceptual Reasoning` (`verifiedByExecution: false`) and are never presented as execution-verified.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Commands

```bash
# Install dependencies
npm install

# Start development server (with COOP/COEP headers for SharedArrayBuffer)
npm run dev

# Start CodeCraft AI backend (port 3001)
npm run server

# Run all automated tests (Vitest: 46 tests across 8 suites)
npm test

# Run TypeScript type checks
npx tsc --noEmit

# Run Linter (Oxlint)
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🧪 Test Suite

- **Automated Tests (`npm test`)**: 46 passing unit and integration tests across 8 suites covering:
  - **Phase 5 AI Backend (`server/__tests__/api.test.ts`)**: 11 tests covering health, request validation, 50k character bounds, missing API key 401 handling, Groq mock explanations, selected-line range context, contextual follow-up Q&A, MCQ schema verification, deterministic output validation, and 429 rate limit handling.
  - **Phase 5 Frontend AI Client (`src/services/ai/__tests__/aiService.test.ts`)**: 6 tests covering deterministic code hashes, health checks, unreachable server handling, explain payloads, question asking, and MCQ generation.
  - **Phase 4 Bug Taxonomy & Coach Journeys**: 16 tests covering `ZeroDivisionError`, `IndexError` off-by-one loops, `NameError` typos, `TypeError` operand mismatches, early returns in loops, `KeyError`, missing returns, end-to-end journey tests, and test runner harness generation.
  - **Phase 2 & 3 Pyodide Worker & Tracing**: 13 tests covering Pyodide worker protocol, interactive `input()`, hard timeouts, output caps, step snapshots, and prediction diff engine.
- **Manual & Browser Tests**:
  - Predict Before You Run: correct prediction evaluation, mismatch diff reporting, and stale-code invalidation.
  - Step navigation forward/backward, jumping, and timeline scrubbing.
  - Variable inspection across loops, conditionals, list mutations, and function calls.
  - Exception step visualization up to point of failure.
  - Phase 1 & 2 regression verification across all routes (`/`, `/testlab`, `/learn`, `/*`).

---

## 📌 Phase Roadmap

- [x] **Phase 1: Foundation (Complete)**
  - Cohesive design system & token architecture
  - Multi-page responsive navigation and routing
  - Monaco editor workspace with output split pane
  - AI Test Lab configuration interface and test cases
  - Learning paths curriculum tree
- [x] **Phase 2: Execution Engine (Complete)**
  - Real Pyodide WebAssembly Python 3.12 runtime in dedicated Web Worker
  - Real-time stdout, stderr, and exception tracebacks
  - Interactive console `input()` with Atomics synchronization
  - Stop button with hard worker termination & auto-respawn
  - Configurable execution timeouts (5s / 15s / 30s / 60s)
  - Stale-run protection & output volume capping
- [x] **Phase 3: Prediction & Execution Visualization (Complete)**
  - Predict Before You Run with line-by-line diff comparison
  - Real Python execution tracing via `sys.settrace`
  - Step Forward, Step Backward, Jump, and Reset timeline controls
  - Monaco source-line highlighting & glyph margin indicators
  - Variable Scope Inspector with mutation tags
  - Code modification tracking & stale-result marking
- [ ] **Phase 4: Intelligence & Persistence (Future)**
  - AI diagnostic feedback & hints
  - Local storage workspace persistence & project exports
  - AI Test Lab automated evaluation
