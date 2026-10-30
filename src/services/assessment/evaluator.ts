// ============================================================================
// CodeCraft — Authoritative Assessment Evaluation & Scoring Engine
// Phase 6: Deterministic grading, score aggregation, and invariant validation
// ============================================================================

import type {
  StudentAttempt,
  AssessmentResult,
  QuestionEvaluation,
  TopicPerformance,
  CodingTestCaseOutcome,
  AssessmentMcqQuestion,
  AssessmentCodingQuestion,
  AssessmentTopic,
} from './types'
import { TOPIC_METADATA } from './types'
import { evaluateCodingSubmission } from './isolatedRunner'
import type { PyodideService } from '../pyodide/pyodideService'

export async function evaluateAttempt(
  attempt: StudentAttempt,
  options?: {
    pyodideService?: PyodideService
    isExpiredTimeout?: boolean
  }
): Promise<AssessmentResult> {
  const def = attempt.assessmentDefinition
  const answers = attempt.answers || {}
  const questionEvaluations: Record<string, QuestionEvaluation> = {}

  let totalPointsEarned = 0
  let totalPointsMax = 0

  let mcqCorrect = 0
  let mcqIncorrect = 0
  let mcqUnanswered = 0

  let codingPassed = 0
  let codingFailed = 0
  let codingPartial = 0
  let codingUnanswered = 0
  let codingSystemError = 0

  // Topic-level tracking
  const topicPoints: Record<string, { max: number; earned: number }> = {}

  for (const q of def.questions) {
    totalPointsMax += q.points

    if (!topicPoints[q.topic]) {
      topicPoints[q.topic] = { max: 0, earned: 0 }
    }
    topicPoints[q.topic].max += q.points

    const studentAns = answers[q.id]

    if (q.type === 'mcq') {
      const mcq = q as AssessmentMcqQuestion
      const selectedOptionId = studentAns?.selectedOptionId

      if (!selectedOptionId || selectedOptionId.trim() === '') {
        // Unanswered MCQ
        mcqUnanswered += 1
        questionEvaluations[q.id] = {
          questionId: q.id,
          questionType: 'mcq',
          earnedPoints: 0,
          maxPoints: q.points,
          isCorrect: false,
          isUnanswered: true,
          correctOptionId: mcq.correctOptionId,
          explanation: mcq.explanation,
        }
      } else {
        const isMatch = selectedOptionId === mcq.correctOptionId
        const earned = isMatch ? q.points : 0
        totalPointsEarned += earned
        topicPoints[q.topic].earned += earned

        if (isMatch) {
          mcqCorrect += 1
        } else {
          mcqIncorrect += 1
        }

        questionEvaluations[q.id] = {
          questionId: q.id,
          questionType: 'mcq',
          earnedPoints: earned,
          maxPoints: q.points,
          isCorrect: isMatch,
          isUnanswered: false,
          selectedOptionId,
          correctOptionId: mcq.correctOptionId,
          explanation: mcq.explanation,
        }
      }
    } else if (q.type === 'coding') {
      const coding = q as AssessmentCodingQuestion
      const code = studentAns?.codeAnswer

      if (!code || code.trim() === '' || code.trim() === coding.starterCode.trim()) {
        // Unanswered coding
        codingUnanswered += 1
        questionEvaluations[q.id] = {
          questionId: q.id,
          questionType: 'coding',
          earnedPoints: 0,
          maxPoints: q.points,
          isCorrect: false,
          isUnanswered: true,
          submittedCode: code,
          testOutcomes: coding.testCases.map((tc) => ({
            testCaseId: tc.id,
            name: tc.name,
            passed: false,
            expected: tc.expected,
            actual: undefined,
            error: 'No code submitted or starter code unchanged.',
            durationMs: 0,
            isHidden: tc.isHidden,
          })),
          explanation: coding.explanation,
        }
      } else {
        // Execute grading test cases via browser isolated runner
        const testOutcomes: CodingTestCaseOutcome[] = await evaluateCodingSubmission(
          code,
          coding.testCases,
          options?.pyodideService
        )

        const totalCases = testOutcomes.length
        const passedCases = testOutcomes.filter((t) => t.passed).length
        const hasErrors = testOutcomes.some((t) => t.error?.includes('SyntaxError'))
        const hasSystemError = testOutcomes.some((t) =>
          t.error?.includes('Worker execution error')
        )

        // Points proportional to passed test cases (all-or-nothing or proportional)
        const earnedRatio = totalCases > 0 ? passedCases / totalCases : 0
        const earned = Math.round(earnedRatio * q.points)
        totalPointsEarned += earned
        topicPoints[q.topic].earned += earned

        const isFullyCorrect = passedCases === totalCases && totalCases > 0

        if (hasSystemError) {
          codingSystemError += 1
        } else if (isFullyCorrect) {
          codingPassed += 1
        } else if (passedCases > 0) {
          codingPartial += 1
        } else {
          codingFailed += 1
        }

        questionEvaluations[q.id] = {
          questionId: q.id,
          questionType: 'coding',
          earnedPoints: earned,
          maxPoints: q.points,
          isCorrect: isFullyCorrect,
          isUnanswered: false,
          submittedCode: code,
          testOutcomes,
          hasSyntaxError: hasErrors,
          isSystemError: hasSystemError,
          errorMessage: testOutcomes.find((t) => t.error)?.error,
          explanation: coding.explanation,
        }
      }
    }
  }

  // Enforce Invariant 1: total MCQs = correct + incorrect + unanswered
  const totalMcqs = def.questions.filter((q) => q.type === 'mcq').length
  const mcqSum = mcqCorrect + mcqIncorrect + mcqUnanswered
  if (totalMcqs !== mcqSum) {
    throw new Error(
      `MCQ invariant violation: total MCQs (${totalMcqs}) !== correct (${mcqCorrect}) + incorrect (${mcqIncorrect}) + unanswered (${mcqUnanswered}).`
    )
  }

  // Enforce Invariant 2: total Coding = passed + failed + partial + unanswered + systemError
  const totalCoding = def.questions.filter((q) => q.type === 'coding').length
  const codingSum =
    codingPassed + codingFailed + codingPartial + codingUnanswered + codingSystemError
  if (totalCoding !== codingSum) {
    throw new Error(
      `Coding invariant violation: total coding (${totalCoding}) !== passed (${codingPassed}) + failed (${codingFailed}) + partial (${codingPartial}) + unanswered (${codingUnanswered}) + systemError (${codingSystemError}).`
    )
  }

  // Calculate score percentage based on earned points / maximum possible points
  const scorePercentage =
    totalPointsMax > 0 ? Math.round((totalPointsEarned / totalPointsMax) * 100) : 0

  // Topic breakdown
  const topicBreakdown: Record<string, TopicPerformance> = {}
  for (const [topicKey, data] of Object.entries(topicPoints)) {
    const topic = topicKey as AssessmentTopic
    const pct = data.max > 0 ? Math.round((data.earned / data.max) * 100) : 0
    let status: 'strength' | 'satisfactory' | 'needs_review' = 'needs_review'
    if (pct >= 80) status = 'strength'
    else if (pct >= 50) status = 'satisfactory'

    topicBreakdown[topicKey] = {
      topic,
      topicLabel: TOPIC_METADATA[topic]?.label || topicKey,
      totalPoints: data.max,
      earnedPoints: data.earned,
      percentage: pct,
      status,
    }
  }

  // Recommendations based on evaluated performance
  const recommendations: string[] = []
  for (const [_, perf] of Object.entries(topicBreakdown)) {
    if (perf.status === 'needs_review') {
      recommendations.push(
        `Review fundamental concepts and practice interactive exercises in ${perf.topicLabel} (Score: ${perf.percentage}%).`
      )
    }
  }
  if (scorePercentage >= 90) {
    recommendations.unshift('Excellent mastery! Ready for intermediate and advanced challenges.')
  } else if (scorePercentage >= 70) {
    recommendations.unshift('Solid foundation! Focus on the missed edge cases and syntax details.')
  } else {
    recommendations.unshift(
      'Targeted review recommended. Work through the step-by-step trace and debugging coach in Code Studio.'
    )
  }

  const completedAt = Date.now()
  const durationSeconds = Math.max(0, Math.round((completedAt - attempt.startedAt) / 1000))

  return {
    attemptId: attempt.id,
    assessmentId: def.id,
    assessmentTitle: def.title,
    topic: def.topic,
    difficulty: def.difficulty,
    startedAt: attempt.startedAt,
    completedAt,
    durationSeconds,
    isExpiredTimeout: Boolean(options?.isExpiredTimeout || attempt.status === 'expired'),
    totalPointsEarned,
    totalPointsMax,
    scorePercentage,
    mcqSummary: {
      total: totalMcqs,
      correct: mcqCorrect,
      incorrect: mcqIncorrect,
      unanswered: mcqUnanswered,
    },
    codingSummary: {
      total: totalCoding,
      passed: codingPassed,
      failed: codingFailed,
      partial: codingPartial,
      unanswered: codingUnanswered,
      systemError: codingSystemError,
    },
    questionEvaluations,
    topicBreakdown,
    recommendations,
  }
}
