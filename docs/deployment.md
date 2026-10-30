# CodeCraft Deployment Guide

This guide details deployment strategies, production environment variables, and rollback procedures for CodeCraft.

---

## 1. Hosting Architectures

CodeCraft supports two production deployment models:

### Model A: Unified Full-Stack Container (Recommended for PaaS: Render, Railway, Fly.io, Docker)
In this mode, a single Express server process handles both the backend `/api` endpoints and statically serves the compiled frontend single-page application (`dist/`).

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start` (runs `tsx server/index.ts`)
- **Single Port**: The server listens on `PORT` (default: 3001 or assigned by host). Any non-API route serves `dist/index.html` with client-side routing fallback.

### Model B: Decoupled Deployment (Vercel / Netlify / Cloudflare Pages + Node Backend)
- **Frontend**: Static deploy from `dist/` with SPA rewrite rule (`/* -> /index.html`).
- **Backend**: Express API deployed to a Node.js host.
- **CORS Setup**: Set the `ALLOWED_ORIGINS` environment variable on the backend to match the frontend domain (e.g. `https://codecraft.vercel.app`).

---

## 2. Production Environment Variables

Configure these variables securely in your hosting provider's dashboard (never commit `.env` to Git):

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Optional | `3001` | Port for the backend Express server. |
| `GROQ_API_KEY` | Optional | *None* | Groq API key for AI Mentor & question generation. If absent, system gracefully falls back to 31 curated questions and deterministic coaching. |
| `GROQ_MODEL` | Optional | `llama-3.3-70b-versatile` | LLM model identifier for Groq completions. |
| `ALLOWED_ORIGINS` | Optional | *Localhost origins* | Comma-separated list of allowed origins for CORS. |
| `NODE_ENV` | Optional | `development` | Set to `production` in live environments. |

---

## 3. Production Verification Checklist

1. Confirm `GROQ_API_KEY` is not present in client bundle:
   ```bash
   # Inspect dist assets for credentials
   grep -rn "gsk_" dist/
   # (Must return 0 results)
   ```
2. Verify Pyodide WebAssembly files in `public/pyodide/` are accessible under `/pyodide/` in production.
3. Confirm API health check endpoint returns 200 OK:
   ```bash
   curl -i https://your-domain.com/api/ai/health
   ```
4. Verify direct deep-linking to `/studio`, `/test-lab`, and `/learn` loads correctly without 404 errors.

---

## 4. Rollback Procedure

If a production defect is discovered:
1. Revert to the previous stable release tag:
   ```bash
   git checkout <previous-stable-tag>
   ```
2. Rebuild and restart:
   ```bash
   npm run build
   npm start
   ```
