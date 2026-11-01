import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { createApp } from './server/app.ts'

function apiServerPlugin(): Plugin {
  const apiApp = createApp()
  return {
    name: 'codecraft-api-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          return (apiApp as any)(req, res, next)
        }
        next()
      })
    },
  }
}

/**
 * Resolves unreachable Node built-in imports inside Pyodide's isomorphic bundle
 * for browser/worker targets without installing heavy polyfills.
 */
function pyodideBrowserResolverPlugin(): Plugin {
  const virtualId = '\0virtual:pyodide-node-empty'
  const nodeBuiltinRegex = /^node:(fs\/promises|fs|path|url|vm|crypto|child_process)$/

  return {
    name: 'pyodide-browser-resolver',
    enforce: 'pre',
    resolveId(id) {
      if (id.startsWith('node:') && nodeBuiltinRegex.test(id)) {
        return virtualId
      }
      return null
    },
    load(id) {
      if (id === virtualId) {
        return 'export default {}; export const sep = "/";'
      }
      return null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [pyodideBrowserResolverPlugin(), react(), apiServerPlugin()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  worker: {
    format: 'es',
    plugins: () => [pyodideBrowserResolverPlugin()],
  },
})
