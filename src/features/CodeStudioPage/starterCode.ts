// ============================================================================
// CodeCraft — Canonical Starter Code & Legacy Workspace Migration Helpers
// ============================================================================

export const CANONICAL_PYTHON_STARTER = `# Write your Python code here
print("Hello World")`

/**
 * Detects whether a string in localStorage or an editor model is a legacy
 * default sample code from earlier phases of CodeCraft.
 *
 * Genuine user-written code returns false so it is safely preserved.
 */
export function isLegacyPythonStarter(code: string | null | undefined): boolean {
  if (!code) return false
  const normalized = code.replace(/\r\n/g, '\n').trim()

  // Canonical starter is valid and active
  if (normalized === CANONICAL_PYTHON_STARTER.trim()) return false

  // 1. Old inventory scanner starter
  if (
    normalized.includes('process_inventory') ||
    normalized.includes('Initializing inventory scan') ||
    normalized.includes('total_unique = len(result)')
  ) {
    return true
  }

  // 2. Old multi-step arithmetic starter or variations
  if (
    normalized.includes('# Print a message') ||
    normalized.includes('Simple calculation') ||
    normalized.includes('print(a + b)') ||
    (normalized.includes('a = 5') && normalized.includes('b = 10'))
  ) {
    return true
  }

  // 3. Old Hello World with comma or quotes variations
  if (
    normalized === 'print("Hello, World!")' ||
    normalized === "print('Hello, World!')" ||
    normalized === '# Print a message\nprint("Hello, World!")' ||
    normalized === "# Print a message\nprint('Hello, World!')" ||
    normalized === 'print("Hello, World!")\n'
  ) {
    return true
  }

  // 4. Old Phase 4 studio header
  if (
    normalized.includes('# CodeCraft — Python Execution & Tracing Studio') ||
    normalized.includes('# Phase 4: Smart Debugging Coach')
  ) {
    return true
  }

  return false
}

