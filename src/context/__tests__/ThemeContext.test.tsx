import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { ThemeProvider, useTheme } from '../ThemeContext'

describe('ThemeContext & Daylight Behavior', () => {
  it('defaults permanently to dark mode on every fresh initial load without depending on system preference', () => {
    let captured: ReturnType<typeof useTheme> | null = null

    function Consumer() {
      const themeCtx = useTheme()
      captured = themeCtx
      return <div data-theme={themeCtx.theme}>{themeCtx.theme}</div>
    }

    const html = renderToString(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    )

    expect(html).toContain('data-theme="dark"')
    expect(captured).not.toBeNull()
    expect(captured!.theme).toBe('dark')
    expect(captured!.isLight).toBe(false)
  })
})
