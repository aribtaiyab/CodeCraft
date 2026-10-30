# Development & Setup Guide

This guide covers local setup, running tests, linting, and starting development and production servers.

---

## 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **npm**: v9.0.0 or higher.
- *(Optional)* **Groq API Key**: Required only for live AI features. The application falls back to verified curated questions and deterministic rule-based coaching if no key is provided.

---

## 2. Installation & Configuration

1. Clone or navigate to the repository directory:
   ```bash
   cd CodeCraft--
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to supply your `GROQ_API_KEY` (if using Groq AI features):
   ```env
   PORT=3001
   GROQ_API_KEY=gsk_your_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

---

## 3. Running Locally

### Option A: Full Stack Development (Frontend + Backend)
Run the backend server and frontend development server concurrently in separate terminals:

**Terminal 1 (Backend API):**
```bash
npm run server
```
*Runs on `http://127.0.0.1:3001`.*

**Terminal 2 (Frontend Client):**
```bash
npm run dev
```
*Runs on `http://localhost:5173` with proxy forwarding `/api` requests to port 3001.*

### Option B: Production Build & Serve
```bash
# 1. Build client bundle
npm run build

# 2. Run Express production server (serves API and dist/ static assets)
npm start
```

---

## 4. Verification & Testing

### Run Vitest Test Suite
```bash
npm test -- --run
```
Runs all 20 test suites (116 tests) covering Pyodide execution, security isolation, bug taxonomy, assessment evaluation, and AI client verification.

### Run Static Analysis / Linter
```bash
npm run lint
```
Runs Oxlint across the codebase with 0 errors and 0 warnings.

### Run TypeScript Verification
```bash
# Client TypeScript check
npx tsc -b --noEmit

# Server TypeScript check
npx tsc -p tsconfig.server.json --noEmit
```

### Run Dependency Security Audit
```bash
npm audit
```
Verifies 0 known vulnerabilities.
