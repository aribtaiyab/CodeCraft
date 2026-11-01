import { describe, it, expect, afterEach } from 'vitest'
import { getApiUrl } from '../apiClient'

describe('getApiUrl Resolver', () => {
  const originalEnv = import.meta.env.VITE_API_BASE_URL

  afterEach(() => {
    import.meta.env.VITE_API_BASE_URL = originalEnv
  })

  it('returns relative path when VITE_API_BASE_URL is not set', () => {
    import.meta.env.VITE_API_BASE_URL = ''
    expect(getApiUrl('/api/ai/health')).toBe('/api/ai/health')
    expect(getApiUrl('api/ai/health')).toBe('/api/ai/health')
  })

  it('prepends configured backend URL and strips trailing slashes', () => {
    import.meta.env.VITE_API_BASE_URL = 'https://codecraft-backend.onrender.com'
    expect(getApiUrl('/api/ai/health')).toBe('https://codecraft-backend.onrender.com/api/ai/health')

    // Trailing slash on base URL
    import.meta.env.VITE_API_BASE_URL = 'https://codecraft-backend.onrender.com/'
    expect(getApiUrl('/api/ai/explain')).toBe('https://codecraft-backend.onrender.com/api/ai/explain')
    expect(getApiUrl('api/ai/explain')).toBe('https://codecraft-backend.onrender.com/api/ai/explain')
  })
})

