// ============================================================================
// CodeCraft Backend — Server Entrypoint
// ============================================================================

import { app } from './app.ts'
import { config, hasGroqKey } from './config.ts'

const host = '0.0.0.0'
const server = app.listen(config.port, host, () => {
  console.log(`[CodeCraft AI Backend] Running on http://${host}:${config.port}`)
  console.log(`[CodeCraft AI Backend] Model: ${config.groqModel}`)
  console.log(
    `[CodeCraft AI Backend] Groq Key Configured: ${
      hasGroqKey() ? 'YES (Valid key loaded)' : 'NO (Set GROQ_API_KEY in environment)'
    }`
  )
})

process.on('SIGTERM', () => {
  console.log('[CodeCraft AI Backend] Shutting down gracefully...')
  server.close()
})

process.on('SIGINT', () => {
  console.log('[CodeCraft AI Backend] Shutting down gracefully...')
  server.close()
})
