// ============================================================================
// CodeCraft — Learning Events & Analytics Domain Types
// Phase 7: Event pipeline, concept mastery, and history models
// ============================================================================

import type { ConceptId } from './taxonomy'
import type { AssessmentTopic, AssessmentDifficulty } from '../assessment/types'
import type { BugCategory } from '../coach/types'

export type LearningEventSource =
  | 'code_studio'
  | 'ai_test_lab'
  | 'debugging_coach'
  | 'practice'

export type LearningActivityType =
  | 'code_execution'
  | 'coach_diagnosis'
  | 'test_your_fix'
  | 'assessment_question_evaluated'
  | 'assessment_completed'
  | 'prediction_attempt'

export type LearningOutcome =
  | 'passed'
  | 'failed'
  | 'partial'
  | 'inconclusive'
  | 'system_error'

export type EvidenceQuality = 'high' | 'medium' | 'low'

export interface LearningEvent {
  id: string
  timestamp: number
  source: LearningEventSource
  activityType: LearningActivityType
  conceptId: ConceptId
  topicId: AssessmentTopic
  outcome: LearningOutcome
  evidenceQuality: EvidenceQuality
  errorCategory?: BugCategory
  title: string
  summary: string
  metadata?: {
    questionId?: string
    attemptId?: string
    runId?: string
    earnedPoints?: number
    maxPoints?: number
    scorePercentage?: number
    durationMs?: number
    isSystemError?: boolean
    [key: string]: string | number | boolean | undefined
  }
  dedupKey: string
  schemaVersion: 1
}

export type MasteryStatus =
  | 'no_evidence'
  | 'needs_practice'
  | 'developing'
  | 'consistent'

export interface ConceptMastery {
  conceptId: ConceptId
  name: string
  topic: AssessmentTopic
  topicLabel: string
  status: MasteryStatus
  evidenceCount: number
  successCount: number
  failureCount: number
  winRate: number // percentage 0 - 100
  confidence: 'none' | 'low' | 'medium' | 'high'
  lastEvaluatedAt?: number
  recentErrorCategory?: BugCategory
  evidenceSummary: string
}

export interface PracticeRecommendation {
  id: string
  conceptId: ConceptId
  conceptName: string
  topic: AssessmentTopic
  topicLabel: string
  targetExerciseId: string
  exerciseType: 'testlab_coding' | 'testlab_mcq' | 'coach_exercise' | 'testlab_assessment'
  title: string
  reason: string
  suggestedDifficulty: AssessmentDifficulty
  actionUrl: string
  actionLabel: string
  evidenceSource: string
  priority: number
}
