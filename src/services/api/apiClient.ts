// ============================================================================
// CodeCraft — Unified API Client URL Resolver for Multi-Cloud Deployments
// ============================================================================

/**
 * Resolves the full URL for a backend API route.
 * 
 * In production with frontend on Vercel and backend on Render:
 * - VITE_API_BASE_URL (e.g. "https://codecraft-backend.onrender.com") is prepended.
 * 
 * In local development or unified deployments:
 * - Defaults to relative paths (e.g. "/api/ai/health") which Vite proxies to port 3001.
 */
export function getApiUrl(path: string): string {
  const base =
    (typeof import.meta !== 'undefined' &&
      typeof import.meta.env !== 'undefined' &&
      import.meta.env.VITE_API_BASE_URL) ||
    ''

  const cleanBase = String(base).trim().replace(/\/+$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  return `${cleanBase}${cleanPath}`
}

