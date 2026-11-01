import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CANONICAL_PYTHON_STARTER, isLegacyPythonStarter } from '../starterCode'

describe('CodeStudio Python Default Code & Legacy Migration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('canonical starter contains exactly two lines with correct comment and print statement', () => {
    const lines = CANONICAL_PYTHON_STARTER.split('\n')
    expect(lines.length).toBe(2)
    expect(lines[0]).toBe('# Write your Python code here')
    expect(lines[1]).toBe('print("Hello World")')
  })

  it('correctly identifies all variations of legacy starter/sample code', () => {
    // 1. Old 7-line multi-step arithmetic starter
    const legacyArithmetic = `# Print a message
print("Hello, World!")

# Simple calculation
a = 5
b = 10
print(a + b)
`
    expect(isLegacyPythonStarter(legacyArithmetic)).toBe(true)

    // 2. Old inventory scanner starter
    const legacyInventory = `# CodeCraft — Python Execution & Tracing Studio
# Phase 4: Smart Debugging Coach + Test Your Fix

def process_inventory(items: list[str]) -> dict:
    counts = {}
    return counts
`
    expect(isLegacyPythonStarter(legacyInventory)).toBe(true)

    // 3. Old Hello World with comma
    expect(isLegacyPythonStarter('print("Hello, World!")')).toBe(true)
    expect(isLegacyPythonStarter("print('Hello, World!')")).toBe(true)
    expect(isLegacyPythonStarter('# Print a message\nprint("Hello, World!")')).toBe(true)

    // 4. Fragmented arithmetic starter
    expect(isLegacyPythonStarter('a = 5\nb = 10\nprint(a + b)')).toBe(true)
    expect(isLegacyPythonStarter('# Simple calculation\na = 5\nb = 10')).toBe(true)
  })

  it('never flags user-written code as legacy starter code', () => {
    // Genuine user custom code
    expect(isLegacyPythonStarter('def calculate_sum(nums):\n    return sum(nums)\nprint(calculate_sum([1, 2, 3]))')).toBe(false)
    expect(isLegacyPythonStarter('x = 42\nprint(f"The answer is {x}")')).toBe(false)
    expect(isLegacyPythonStarter('name = input("Enter name: ")\nprint(f"Hi {name}")')).toBe(false)
    expect(isLegacyPythonStarter('class User:\n    def __init__(self, name):\n        self.name = name')).toBe(false)

    // The canonical code itself is not legacy
    expect(isLegacyPythonStarter(CANONICAL_PYTHON_STARTER)).toBe(false)
    expect(isLegacyPythonStarter(`${CANONICAL_PYTHON_STARTER}\n`)).toBe(false)
  })
})
