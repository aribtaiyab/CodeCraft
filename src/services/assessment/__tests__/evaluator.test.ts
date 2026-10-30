// ============================================================================
// Automated Tests: Assessment Scoring & Evaluation Engine Invariants
// ============================================================================

import { describe, it, expect } from 'vitest'
import { evaluateAttempt } from '../evaluator'
import type { StudentAttempt, AssessmentDefinition } from '../types'

describe('Assessment Evaluation & Scoring Engine', () => {
  const sampleDefinition: AssessmentDefinition = {
    id: 'test_eval_1',
    version: '1.0.0',
    title: 'Python Core Assessment',
    description: 'Scoring test suite',
    topic: 'python_fundamentals',
    difficulty: 'beginner',
    timeLimitMinutes: 15,
    totalPoints: 60,
    questions: [
      {
        id: 'q_mcq_1',
        type: 'mcq',
        topic: 'python_fundamentals',
        difficulty: 'beginner',
        points: 10,
        prompt: 'MCQ Question 1',
        options: [
          { id: 'opt_1', text: 'Option A' },
          { id: 'opt_2', text: 'Option B' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Option A is correct.',
      },
      {
        id: 'q_mcq_2',
        type: 'mcq',
        topic: 'python_fundamentals',
        difficulty: 'beginner',
        points: 10,
        prompt: 'MCQ Question 2',
        options: [
          { id: 'opt_1', text: 'Option A' },
          { id: 'opt_2', text: 'Option B' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Option B is correct.',
      },
      {
        id: 'q_mcq_3',
        type: 'mcq',
        topic: 'control_flow',
        difficulty: 'beginner',
        points: 15,
        prompt: 'MCQ Question 3',
        options: [
          { id: 'opt_1', text: 'Option A' },
          { id: 'opt_2', text: 'Option B' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Option A is correct.',
      },
      {
        id: 'q_code_1',
        type: 'coding',
        topic: 'python_fundamentals',
        difficulty: 'beginner',
        points: 25,
        prompt: 'Implement double_val(x)',
        starterCode: 'def double_val(x):\n    pass\n',
        testCases: [
          {
            id: 'tc_1',
            name: 'Positive integer',
            callExpr: 'double_val(5)',
            expected: '10',
          },
          {
            id: 'tc_2',
            name: 'Zero',
            callExpr: 'double_val(0)',
            expected: '0',
          },
        ],
        explanation: 'Return x * 2.',
      },
    ],
    createdAt: Date.now(),
  }

  it('evaluates a perfect attempt with 100% score and satisfies all invariants', async () => {
    const attempt: StudentAttempt = {
      id: 'att_perfect',
      assessmentId: sampleDefinition.id,
      assessmentDefinition: sampleDefinition,
      startedAt: Date.now() - 300000,
      deadlineAt: Date.now() + 600000,
      timeLimitMinutes: 15,
      status: 'in_progress',
      answers: {
        q_mcq_1: {
          questionId: 'q_mcq_1',
          questionType: 'mcq',
          selectedOptionId: 'opt_1', // correct (+10)
          lastUpdated: Date.now(),
        },
        q_mcq_2: {
          questionId: 'q_mcq_2',
          questionType: 'mcq',
          selectedOptionId: 'opt_2', // correct (+10)
          lastUpdated: Date.now(),
        },
        q_mcq_3: {
          questionId: 'q_mcq_3',
          questionType: 'mcq',
          selectedOptionId: 'opt_1', // correct (+15)
          lastUpdated: Date.now(),
        },
        q_code_1: {
          questionId: 'q_code_1',
          questionType: 'coding',
          codeAnswer: 'def double_val(x):\n    return x * 2\n', // correct (+25)
          lastUpdated: Date.now(),
        },
      },
    }

    const result = await evaluateAttempt(attempt)

    // Verify points
    expect(result.totalPointsEarned).toBe(60)
    expect(result.totalPointsMax).toBe(60)
    expect(result.scorePercentage).toBe(100)

    // Verify MCQ invariants: total = correct + incorrect + unanswered
    expect(result.mcqSummary.total).toBe(3)
    expect(result.mcqSummary.correct).toBe(3)
    expect(result.mcqSummary.incorrect).toBe(0)
    expect(result.mcqSummary.unanswered).toBe(0)
    expect(
      result.mcqSummary.correct +
        result.mcqSummary.incorrect +
        result.mcqSummary.unanswered
    ).toBe(result.mcqSummary.total)

    // Verify Coding invariants: total = passed + failed + partial + unanswered + systemError
    expect(result.codingSummary.total).toBe(1)
    expect(result.codingSummary.passed).toBe(1)
    expect(
      result.codingSummary.passed +
        result.codingSummary.failed +
        result.codingSummary.partial +
        result.codingSummary.unanswered +
        result.codingSummary.systemError
    ).toBe(result.codingSummary.total)

    // Verify Topic Mastery Breakdown
    expect(result.topicBreakdown.python_fundamentals.percentage).toBe(100)
    expect(result.topicBreakdown.python_fundamentals.status).toBe('strength')
  })

  it('correctly tracks unanswered and incorrect questions with exact invariant satisfaction', async () => {
    const attempt: StudentAttempt = {
      id: 'att_mixed',
      assessmentId: sampleDefinition.id,
      assessmentDefinition: sampleDefinition,
      startedAt: Date.now() - 300000,
      deadlineAt: Date.now() + 600000,
      timeLimitMinutes: 15,
      status: 'in_progress',
      answers: {
        q_mcq_1: {
          questionId: 'q_mcq_1',
          questionType: 'mcq',
          selectedOptionId: 'opt_1', // correct (+10)
          lastUpdated: Date.now(),
        },
        q_mcq_2: {
          questionId: 'q_mcq_2',
          questionType: 'mcq',
          selectedOptionId: 'opt_1', // wrong (expected opt_2) (0)
          lastUpdated: Date.now(),
        },
        // q_mcq_3 is left completely unanswered (0)
        q_code_1: {
          questionId: 'q_code_1',
          questionType: 'coding',
          codeAnswer: 'def double_val(x):\n    pass\n', // unchanged starter code (0)
          lastUpdated: Date.now(),
        },
      },
    }

    const result = await evaluateAttempt(attempt)

    // Points earned = 10 out of 60 -> 17%
    expect(result.totalPointsEarned).toBe(10)
    expect(result.totalPointsMax).toBe(60)
    expect(result.scorePercentage).toBe(17)

    // Invariant: total = correct (1) + incorrect (1) + unanswered (1) = 3
    expect(result.mcqSummary.correct).toBe(1)
    expect(result.mcqSummary.incorrect).toBe(1)
    expect(result.mcqSummary.unanswered).toBe(1)
    expect(
      result.mcqSummary.correct +
        result.mcqSummary.incorrect +
        result.mcqSummary.unanswered
    ).toBe(result.mcqSummary.total)

    // Coding unanswered
    expect(result.codingSummary.unanswered).toBe(1)
    expect(result.codingSummary.passed).toBe(0)

    // Evaluations inspectable
    expect(result.questionEvaluations.q_mcq_3.isUnanswered).toBe(true)
    expect(result.questionEvaluations.q_mcq_2.isCorrect).toBe(false)
  })

  it('marks timeout flag when attempt expires', async () => {
    const attempt: StudentAttempt = {
      id: 'att_timeout',
      assessmentId: sampleDefinition.id,
      assessmentDefinition: sampleDefinition,
      startedAt: Date.now() - 900000,
      deadlineAt: Date.now() - 1000,
      timeLimitMinutes: 15,
      status: 'expired',
      answers: {},
    }

    const result = await evaluateAttempt(attempt, { isExpiredTimeout: true })
    expect(result.isExpiredTimeout).toBe(true)
    expect(result.totalPointsEarned).toBe(0)
    expect(result.scorePercentage).toBe(0)
    expect(result.mcqSummary.unanswered).toBe(3)
    expect(result.codingSummary.unanswered).toBe(1)
  })
})
