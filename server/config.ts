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
  maxTokens: number
  allowedOrigins: string[]
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  groqApiKey: (process.env.GROQ_API_KEY || '').trim(),
  // Model configured via GROQ_MODEL; defaults to openai/gpt-oss-120b or llama-3.3-70b-versatile
  groqModel: (process.env.GROQ_MODEL || 'openai/gpt-oss-120b').trim(),
  groqApiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  maxPayloadBytes: 100 * 1024, // 100 KB max request body
  requestTimeoutMs: 35 * 1000,  // 35 second timeout for Groq API calls
  maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '4096', 10), // 4096 tokens for complete generation
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}

export function hasGroqKey(): boolean {
  return config.groqApiKey.length > 0 && config.groqApiKey !== 'your_groq_api_key_here'
}
