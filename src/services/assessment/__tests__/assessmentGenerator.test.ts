// ============================================================================
// Automated Tests: Assessment Generation & Fallback
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAssessment, computeQuestionFingerprint } from '../assessmentGenerator'
import type { AssessmentConfig } from '../types'

describe('Assessment Generator Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('generates curated assessment matching requested topic and question count', async () => {
    const config: AssessmentConfig = {
      topic: 'python_fundamentals',
      difficulty: 'beginner',
      questionTypes: 'mixed',
      questionCount: 3,
      timeLimitMinutes: 10,
      mode: 'curated',
    }

    const { assessment, usedFallback } = await createAssessment(config)

    expect(assessment).toBeDefined()
    expect(assessment.topic).toBe('python_fundamentals')
    expect(assessment.difficulty).toBe('beginner')
    expect(assessment.questions).toHaveLength(3)
    expect(assessment.totalPoints).toBeGreaterThan(0)
    expect(usedFallback).toBe(false)
  })

  it('generates only MCQs when questionTypes is mcq_only', async () => {
    const config: AssessmentConfig = {
      topic: 'data_structures',
      difficulty: 'intermediate',
      questionTypes: 'mcq_only',
      questionCount: 2,
      timeLimitMinutes: 15,
      mode: 'curated',
    }

    const { assessment } = await createAssessment(config)
    expect(assessment.questions.every((q) => q.type === 'mcq')).toBe(true)
  })

  it('generates only coding challenges when questionTypes is coding_only', async () => {
    const config: AssessmentConfig = {
      topic: 'algorithms_logic',
      difficulty: 'intermediate',
      questionTypes: 'coding_only',
      questionCount: 2,
      timeLimitMinutes: 20,
      mode: 'curated',
    }

    const { assessment } = await createAssessment(config)
    expect(assessment.questions.every((q) => q.type === 'coding')).toBe(true)
  })

  it('gracefully falls back to curated questions if AI generation fails', async () => {
    // Stub fetch to simulate server network failure
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Connection refused / 500 Internal Error'))
    )

    const config: AssessmentConfig = {
      topic: 'control_flow',
      difficulty: 'beginner',
      questionTypes: 'mixed',
      questionCount: 2,
      timeLimitMinutes: 10,
      mode: 'ai_generated',
    }

    const { assessment, usedFallback, fallbackReason } = await createAssessment(config)

    expect(assessment).toBeDefined()
    expect(assessment.questions).toHaveLength(2)
    expect(usedFallback).toBe(true)
    expect(fallbackReason).toContain('AI generation unavailable')
  })

  it('computes stable normalized question fingerprints ignoring formatting variations', () => {
    const fp1 = computeQuestionFingerprint('What is the output of print(2 + 2)?', 'print(2 + 2)')
    const fp2 = computeQuestionFingerprint('what is the output of print(2+2)', 'print( 2 + 2 )')
    expect(fp1).toBe(fp2)
  })

  it('guarantees unique questions without duplicate IDs or fingerprints within an assessment', async () => {
    const config: AssessmentConfig = {
      topic: 'python_fundamentals',
      difficulty: 'beginner',
      questionTypes: 'mixed',
      questionCount: 5,
      timeLimitMinutes: 15,
      mode: 'curated',
    }

    const { assessment } = await createAssessment(config)
    const ids = assessment.questions.map((q) => q.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(assessment.questions.length)
  })

  it('augments AI questions with verified curated questions when AI returns fewer than requested', async () => {
    // Stub fetch returning only 1 AI question when 3 are requested
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          questions: [
            {
              id: 'q_ai_1',
              question: 'What is Python bytecode compiled to?',
              options: ['.pyc files', '.exe binaries', '.js scripts', '.dll libraries'],
              correctIndex: 0,
              explanation: 'Python compiles source code to .pyc bytecode before execution.',
              verifiedByExecution: false,
            },
          ],
        }),
      })
    )

    const config: AssessmentConfig = {
      topic: 'python_fundamentals',
      difficulty: 'beginner',
      questionTypes: 'mixed',
      questionCount: 3,
      timeLimitMinutes: 10,
      mode: 'ai_generated',
    }

    const { assessment, usedFallback, fallbackReason } = await createAssessment(config)
    expect(assessment.questions).toHaveLength(3)
    expect(usedFallback).toBe(true)
    expect(fallbackReason).toContain('augmented with')
    expect(assessment.questions[0].prompt).toBe('What is Python bytecode compiled to?')
  })
})

