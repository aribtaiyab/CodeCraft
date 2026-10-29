// ============================================================================
// CodeCraft Backend — Server Entrypoint
// ============================================================================

import { app } from './app.ts'
import { config, hasGroqKey } from './config.ts'

const server = app.listen(config.port, () => {
  console.log(`[CodeCraft AI Backend] Running on http://127.0.0.1:${config.port}`)
  console.log(`[CodeCraft AI Backend] Model: ${config.groqModel}`)
  console.log(
    `[CodeCraft AI Backend] Groq Key Configured: ${
      hasGroqKey() ? 'YES (Valid local key loaded)' : 'NO (Set GROQ_API_KEY in .env)'
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
