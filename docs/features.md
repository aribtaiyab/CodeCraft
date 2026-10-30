# CodeCraft Features Overview

CodeCraft delivers an integrated, evidence-based coding studio and assessment platform.

---

## 1. Code Studio & Real Execution
- **Monaco Code Editor**: Full syntax highlighting, auto-indentation, and error markers for Python 3.
- **Browser-Side Pyodide**: Real Python 3.12 runtime compiled to WebAssembly running inside a dedicated Web Worker.
- **Predict Before You Run**: Students hypothesize output lines before running; the diff engine performs exact line-by-line verification upon execution.
- **Real Execution Tracing**: Step forward, step backward, or jump across execution steps with live variable inspection synchronized with line highlights in the editor.
- **Standard Input**: Interactive prompt support using `SharedArrayBuffer` and `Atomics`.

---

## 2. Smart Debugging Coach & Test Your Fix
- **Deterministic Bug Taxonomy**: Detects common programming bugs without hallucinations:
  - `ZeroDivisionError`: Missing empty list / zero-divisor checks.
  - `IndexError`: Off-by-one errors and out-of-bounds indexing.
  - `NameError`: Levenshtein distance matching against in-scope identifiers.
  - `TypeError`: String-to-number concatenation and operand mismatches.
  - `KeyError`: Dictionary key lookup missing guard.
  - `Early Return / Missing Return`: Loop indentation and void return errors.
- **Progressive 3-Level Hints**: Socratic question (Level 1) → Root cause explanation (Level 2) → Concrete diff fix (Level 3).
- **Test Your Fix**: Built-in test runner verifies whether student modifications genuinely resolve the detected bug.

---

## 3. Groq-Powered AI Mentor
- **Explain Code**: Line-by-line or whole-file code explanation.
- **Contextual Q&A**: Follow-up questions scoped to current editor code.
- **Stale Explanation Invalidation**: Modifying code after generating an explanation displays an explicit warning that the diagnosis is out of date.
- **Secure Architecture**: `GROQ_API_KEY` remains strictly on the Node server.

---

## 4. AI Test Lab
- **Flexible Configuration**: Choose topic, difficulty (beginner, intermediate, advanced), format (MCQ, Coding, Mixed), question count, and time limit.
- **Confidential Hidden Test Cases**: Coding challenges run visible and hidden unit tests in an isolated WebAssembly runner; hidden test expectations are never exposed pre-submission.
- **Question Fingerprinting & Diversity**: Normalizes prompts to prevent duplicate questions in single assessments and across student history.
- **Curated Fallback**: 31 pre-verified curated questions guarantee reliable tests even when offline or during AI provider rate limits.
- **Crash Recovery & Heartbeat**: In-progress answers and timers persist to `localStorage` every 5 seconds.

---

## 5. Unified Learning & Progress
- **Unified 10-Concept Taxonomy**: Maps errors from Studio, Coach, and Test Lab to consistent concept tags.
- **Evidence-Based Mastery**: Computes student mastery (Needs Practice, Developing, Consistent) using rolling window accuracy across verified evaluations.
- **Targeted Practice Recommendations**: Automatically detects the student's weakest concept and provides a 1-click action to generate a targeted practice assessment.
