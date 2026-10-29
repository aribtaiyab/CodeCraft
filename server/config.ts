// ============================================================================
// CodeCraft Backend — Configuration & Environment Loading
// ============================================================================

import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export interface ServerConfig {
  port: number
  groqApiKey: string
  groqModel: string
  groqApiUrl: string
  maxPayloadBytes: number
  requestTimeoutMs: number
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  groqApiKey: (process.env.GROQ_API_KEY || '').trim(),
  // Official Groq recommended general & coding model (131k context)
  groqModel: (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').trim(),
  groqApiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  maxPayloadBytes: 100 * 1024, // 100 KB max request body
  requestTimeoutMs: 25 * 1000,  // 25 second timeout for Groq API calls
}

export function hasGroqKey(): boolean {
  return config.groqApiKey.length > 0 && config.groqApiKey !== 'your_groq_api_key_here'
}
