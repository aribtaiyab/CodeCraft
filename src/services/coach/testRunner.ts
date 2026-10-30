// ============================================================================
// CodeCraft — Test Your Fix Test Runner (Uses Real Pyodide Runtime)
// ============================================================================

import type { TestCaseAssertion, TestAssertionResult } from './types'

export function buildTestRunnerScript(
  userCode: string,
  testCases: TestCaseAssertion[]
): string {
  const testsJson = JSON.stringify(testCases)

  return `
import json, time

user_code = ${JSON.stringify(userCode)}
test_cases = json.loads(${JSON.stringify(testsJson)})

results = []
ns = {}

# Execute user definition
load_error = None
try:
    compiled = compile(user_code, '<test_run>', 'exec')
    exec(compiled, ns)
except Exception as e:
    load_error = f"{type(e).__name__}: {str(e)}"

for tc in test_cases:
    tc_id = tc['id']
    tc_name = tc['name']
    call_expr = tc['callExpr']
    expected_str = str(tc['expected']).strip()
    input_desc = tc.get('inputDescription', '')

    # Completely clean, isolated namespace per test to prevent variable leaks
    clean_ns = {}
    load_error = None
    try:
        compiled = compile(user_code, '<test_run>', 'exec')
        exec(compiled, clean_ns)
    except Exception as e:
        load_error = f"{type(e).__name__}: {str(e)}"

    if load_error is not None:
        results.append({
            'id': tc_id,
            'name': tc_name,
            'inputDescription': input_desc,
            'status': 'error',
            'expected': expected_str,
            'actual': None,
            'error': f"Failed to load user code: {load_error}",
            'durationMs': 0
        })
        continue

    start_t = time.perf_counter()
    try:
        val = eval(call_expr, clean_ns)
        dur = round((time.perf_counter() - start_t) * 1000, 2)
        actual_repr = repr(val)
        actual_str = str(val)
        
        # Compare representation with expected
        is_pass = (actual_repr == expected_str or actual_str == expected_str)
        # Also check numeric float equivalence (e.g. 20.0 == 20)
        if not is_pass:
            try:
                if isinstance(val, (int, float)) and abs(float(val) - float(expected_str)) < 1e-6:
                    is_pass = True
            except Exception:
                pass

        if not is_pass:
            try:
                if expected_str.strip('"').strip("'") == actual_str.strip('"').strip("'"):
                    is_pass = True
            except Exception:
                pass

        results.append({
            'id': tc_id,
            'name': tc_name,
            'inputDescription': input_desc,
            'status': 'passed' if is_pass else 'failed',
            'expected': expected_str,
            'actual': actual_str if isinstance(val, (int, float, str)) else actual_repr,
            'durationMs': dur
        })
    except Exception as e:
        dur = round((time.perf_counter() - start_t) * 1000, 2)
        results.append({
            'id': tc_id,
            'name': tc_name,
            'inputDescription': input_desc,
            'status': 'error',
            'expected': expected_str,
            'actual': None,
            'error': f"{type(e).__name__}: {str(e)}",
            'durationMs': dur
        })

print("__CODECRAFT_TEST_RESULTS__:" + json.dumps(results))
`
}

export function parseTestResultsFromOutput(output: string): TestAssertionResult[] | null {
  const marker = '__CODECRAFT_TEST_RESULTS__:'
  const idx = output.indexOf(marker)
  if (idx === -1) return null

  try {
    const textAfter = output.slice(idx + marker.length).trim()
    const firstLine = textAfter.split('\n')[0]
    try {
      return JSON.parse(firstLine) as TestAssertionResult[]
    } catch {
      const match = textAfter.match(/\[[\s\S]*?\]/)
      if (match) {
        return JSON.parse(match[0]) as TestAssertionResult[]
      }
      return null
    }
  } catch {
    return null
  }
}
