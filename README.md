# CodeCraft — Craftsman's Coding Studio

CodeCraft is an interactive Python learning and assessment platform combining in-browser WebAssembly execution, execution tracing, deterministic error coaching, and Groq LLM assessment generation.

---

## 🌟 Key Features

- **In-Browser Python 3.12**: Executes Python using Pyodide WebAssembly in an isolated Web Worker. Zero student code is executed on the Node server.
- **Predict Before You Run**: Hypothesize output lines before execution with automated diff comparison.
- **Real Execution Tracing**: Step-by-step debugger with live variable inspection and Monaco line synchronization.
- **Smart Debugging Coach**: Deterministic, evidence-based bug diagnosis with 3-level progressive hints and a "Test Your Fix" runner.
- **AI Test Lab**: Customizable assessments with MCQ and coding challenges, timer controls, confidential hidden test cases, and anti-duplicate question fingerprinting.
- **Curated Fallback**: 31 pre-verified curated questions guarantee reliable testing offline or during AI rate limits.
- **Unified Learning & Mastery**: Shared 10-concept taxonomy across studio and tests, rolling-window mastery scoring, and automated targeted practice recommendations.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Frontend Framework** | React 19, TypeScript |
| **Build & Dev Tool** | Vite 8, Rolldown / ESBuild |
| **Code Editor** | Monaco Editor React |
| **Python Engine** | Pyodide 314 WebAssembly + Web Worker |
| **Backend API** | Node.js, Express 5, TSX |
| **AI Integration** | Groq API (`llama-3.3-70b-versatile`) |
| **Testing & Linting** | Vitest, Supertest, Oxlint |
| **Aesthetics** | Dark Craftsman palette (Charcoal `#191815`, Graphite `#24221E`, Bronze `#B8895B`, Ivory `#F4F0E8`) |

---

## 📁 Repository Structure

```
CodeCraft--/
├── docs/                 # Documentation (architecture, features, setup)
│   ├── architecture.md
│   ├── features.md
│   └── setup.md
├── public/               # Static assets & local Pyodide WebAssembly files
├── server/               # Express backend API & host security isolation
│   ├── __tests__/        # Backend & security tests
│   ├── app.ts            # Express app & route definitions
│   ├── config.ts         # Environment variables & CORS configuration
│   ├── groqClient.ts     # Groq API client
│   └── index.ts          # Server entrypoint
├── src/                  # React frontend application
│   ├── app/              # Application entry, router & layout shell (App.tsx)
│   ├── assets/           # Application images
│   ├── components/       # Reusable UI primitives (Badge, Button, Tabs, Navigation)
│   ├── features/         # Application pages and feature views
│   │   ├── LandingPage/
│   │   ├── CodeStudioPage/
│   │   ├── AITestLabPage/
│   │   ├── LearnPage/
│   │   └── NotFoundPage/
│   ├── services/         # Domain business logic & background workers
│   │   ├── ai/           # Frontend AI client & verification
│   │   ├── assessment/   # Test generator, bank, runner, and evaluator
│   │   ├── coach/        # Bug taxonomy, exercises, and fix runner
│   │   ├── learning/     # Mastery engine, history storage, and recommendations
│   │   └── pyodide/      # Web Worker execution engine and tracing harness
│   └── types/            # Shared TypeScript type declarations
├── .env.example          # Environment variable placeholders
├── package.json          # Dependencies & scripts
└── vite.config.ts        # Vite configuration & API proxy
```

---

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   *(Optional)* Add your `GROQ_API_KEY` to `.env` to enable live AI features.

3. **Start development servers**:
   ```bash
   # Terminal 1: Backend API
   npm run server

   # Terminal 2: Frontend Client
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Run production build**:
   ```bash
   npm run build
   npm start
   ```

---

## 🧪 Testing & Quality Gates

Run all automated verification gates:
```bash
npm test -- --run   # Vitest (116 tests across 20 suites)
npm run lint        # Oxlint (0 errors, 0 warnings)
npm run build       # Client TypeScript & Vite bundle
npx tsc -p tsconfig.server.json --noEmit # Server TypeScript check
npm audit           # 0 vulnerabilities
```

---

## 🔒 Security Invariants

- **Zero Host Execution**: Student Python is evaluated solely within the browser Pyodide Web Worker; the server never executes arbitrary student code.
- **Server-Only Credentials**: `GROQ_API_KEY` is loaded and utilized strictly on the Express server. No secrets are bundled into client assets.
- **Confidential Test Cases**: Pre-submission question payloads keep hidden assessment test cases private.
