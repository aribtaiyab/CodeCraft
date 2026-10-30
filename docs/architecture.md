# CodeCraft Architecture & Engineering Design

This document provides a concise overview of the CodeCraft architecture, runtime environments, execution isolation, and request flows.

---

## 1. High-Level System Architecture

CodeCraft is an interactive coding education platform engineered with a strict boundary between browser-side Python WebAssembly execution and server-side LLM inference.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BROWSER RUNTIME (Vite / React 19)                │
│                                                                             │
│  ┌───────────────────────┐      ┌────────────────────────────────────────┐  │
│  │   UI & Pages (App)    │      │         Pyodide Web Worker             │  │
│  │  - Code Studio        │◄────►│  - WebAssembly (Python 3.12)           │  │
│  │  - AI Test Lab        │      │  - AST Tracing (sys.settrace)          │  │
│  │  - Learn & Progress   │      │  - Isolated Assessment Runner          │  │
│  └───────────┬───────────┘      │  - 15s Watchdog Timeout Guard          │  │
│              │                  └────────────────────────────────────────┘  │
│              │ JSON REST (Proxy / Direct)                                   │
└──────────────┼──────────────────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────────────┐
│                            NODE.JS BACKEND (Express 5)                      │
│                                                                             │
│  ┌───────────────────────┐      ┌────────────────────────────────────────┐  │
│  │   Express API         │      │         External AI Provider           │  │
│  │  - /api/ai/health     │◄────►│  - Groq Cloud API                      │  │
│  │  - /api/ai/explain    │      │  - LLaMA-3.3-70B-Versatile             │  │
│  │  - /api/ai/ask        │      │  (GROQ_API_KEY held securely)          │  │
│  │  - /api/ai/generate   │      └────────────────────────────────────────┘  │
│  └───────────────────────┘                                                  │
│  * Strict Invariant: Node server NEVER executes student or model Python.    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Structure

### A. Frontend (`src/`)
- **`src/app/`**: Application entry point, global router, and page layout shell (`App.tsx`).
- **`src/features/`**: Feature-level pages:
  - **`LandingPage`**: Hero section, technical principles, feature highlights.
  - **`CodeStudioPage`**: Monaco editor, live output, stepping tracer, bug coach, and AI mentor panel.
  - **`AITestLabPage`**: Assessment configurator, timed exam runner, question palette, and instant score evaluator.
  - **`LearnPage`**: Curricula lessons, mastery breakdown, and targeted practice recommendations.
  - **`NotFoundPage`**: 404 fallback page.
- **`src/components/`**: Reusable design system primitives:
  - `Button`, `Badge`, `Tabs`, `Spinner`, `EmptyState`, `Navigation`.
- **`src/services/`**: Isolated core domain services:
  - `pyodide/`: Web Worker lifecycle, worker messaging protocol, execution timeout supervisor.
  - `coach/`: Deterministic bug taxonomy, 3-level progressive hints, "Test Your Fix" runner.
  - `ai/`: Frontend AI client with code hash staleness checking and schema verification.
  - `assessment/`: Assessment generator, 31-question curated bank, duplicate fingerprinting, isolated test runner, and grading evaluator.
  - `learning/`: Unified 10-concept taxonomy, sliding-window mastery calculation, and recommendation engine.

### B. Backend (`server/`)
- **`app.ts`**: Express application configuration, CORS rules, and API routes.
- **`config.ts`**: Environment variable validation and server settings.
- **`groqClient.ts`**: Server-side client communicating with Groq API endpoints.
- **`middleware.ts`**: Rate limiting (60 req/15 min) and request payload size validation (100KB body, 50k char code limit).
- **`verificationEngine.ts`**: Python output validation ensuring the host operating system never executes arbitrary student code.

---

## 3. Python Execution Isolation

1. **Zero Server Execution**: Student Python is never passed to Node child processes or evaluated on the server host.
2. **Dedicated Web Worker**: Pyodide runs inside `src/services/pyodide/pyodide.worker.ts` off the main browser UI thread.
3. **Execution Guardrails**:
   - 15-second CPU execution timeout.
   - 500-line output buffer limit.
   - 500-step maximum AST trace depth.
4. **Assessment Isolation**: The AI Test Lab evaluates test cases in a fresh temporary namespace without polluting Code Studio's editor state or console buffers.

---

## 4. Assessment Pipeline & Diversity

1. **AI Question Generation**: Requests to `/api/ai/generate-mcqs` request questions for specific syllabus topics and difficulties.
2. **Schema & Answer-Key Validation**: The client validates each question schema, verifying option presence, correct option indexing, and explanation completeness.
3. **Fingerprinting**: `computeQuestionFingerprint()` strips case, punctuation, and whitespace variations to prevent duplicate questions within the same test and across student history.
4. **Curated Fallback**: If the external AI provider is unavailable, rate-limited, or returns fewer questions than requested, the system automatically draws from the 31-question verified curated question bank.
