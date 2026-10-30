// ============================================================================
// CodeCraft — Evidence-Based Concept Mastery Engine
// Phase 7: Deterministic mastery evaluation computed from verified learning events
// ============================================================================

import type { ConceptId } from './taxonomy'
import { CONCEPT_REGISTRY } from './taxonomy'
import type { LearningEvent, ConceptMastery, MasteryStatus } from './types'

export interface MasteryThresholds {
  minEvidenceCount: number // Minimum evaluations needed to leave 'no_evidence' (2)
  consistentEvidenceCount: number // Minimum evaluations for 'consistent' (3)
  consistentWinRate: number // Win rate required for 'consistent' (70%)
  developingWinRate: number // Win rate for 'developing' (40%)
}

export const DEFAULT_MASTERY_THRESHOLDS: MasteryThresholds = {
  minEvidenceCount: 2,
  consistentEvidenceCount: 3,
  consistentWinRate: 70,
  developingWinRate: 40,
}

/**
 * Computes deterministic concept mastery profiles from a stream of learning events.
 *
 * Rules:
 * 1. Excludes system errors (crashes, timeouts) from penalizing mastery.
 * 2. Inconclusive executions without explicit assertions do not inflate mastery.
 * 3. Requires at least 2 distinct evaluations before diagnosing learning gaps or progress.
 * 4. A single failure never permanently labels a student 'needs_practice'.
 * 5. 'consistent' requires >= 3 evaluations, >= 70% win rate, and recent success.
 */
export function computeConceptMastery(
  events: LearningEvent[],
  thresholds: MasteryThresholds = DEFAULT_MASTERY_THRESHOLDS
): Record<ConceptId, ConceptMastery> {
  const result: Record<ConceptId, ConceptMastery> = {} as Record<ConceptId, ConceptMastery>

  // Initialize every canonical concept in 'no_evidence'
  for (const [id, def] of Object.entries(CONCEPT_REGISTRY)) {
    const conceptId = id as ConceptId
    result[conceptId] = {
      conceptId,
      name: def.name,
      topic: def.topic,
      topicLabel: def.topicLabel,
      status: 'no_evidence',
      evidenceCount: 0,
      successCount: 0,
      failureCount: 0,
      winRate: 0,
      confidence: 'none',
      evidenceSummary: 'No verified evaluations recorded yet.',
    }
  }

  // Filter events: only include events that provide meaningful evaluation evidence
  // Exclude system errors and raw unasserted executions
  const validEvents = events.filter((e) => {
    if (e.outcome === 'system_error' || e.metadata?.isSystemError) return false
    if (e.outcome === 'inconclusive') return false
    return e.evidenceQuality === 'high' || e.evidenceQuality === 'medium'
  })

  // Group events by concept
  const groupedByConcept = new Map<ConceptId, LearningEvent[]>()
  for (const ev of validEvents) {
    if (!result[ev.conceptId]) continue
    const list = groupedByConcept.get(ev.conceptId) ?? []
    list.push(ev)
    groupedByConcept.set(ev.conceptId, list)
  }

  // Evaluate each concept with evidence
  for (const [cId, evList] of groupedByConcept.entries()) {
    // Sort chronological: oldest to newest
    evList.sort((a, b) => a.timestamp - b.timestamp)

    let successes = 0
    let failures = 0
    let lastEvaluatedAt = 0
    let recentError = undefined

    for (const ev of evList) {
      lastEvaluatedAt = Math.max(lastEvaluatedAt, ev.timestamp)
      if (ev.outcome === 'passed') {
        successes++
      } else if (ev.outcome === 'failed') {
        failures++
        if (ev.errorCategory) {
          recentError = ev.errorCategory
        }
      } else if (ev.outcome === 'partial') {
        // Partial credit: count as half success
        successes += 0.5
        failures += 0.5
      }
    }

    const totalEvals = evList.length
    const winRate = totalEvals > 0 ? Math.round((successes / totalEvals) * 100) : 0

    // Determine Status
    let status: MasteryStatus = 'no_evidence'
    let confidence: 'none' | 'low' | 'medium' | 'high' = 'none'

    if (totalEvals < thresholds.minEvidenceCount) {
      status = 'no_evidence'
      confidence = totalEvals === 1 ? 'low' : 'none'
    } else {
      // 2 or more evaluations
      confidence = totalEvals >= thresholds.consistentEvidenceCount ? 'high' : 'medium'

      const latestEvent = evList[evList.length - 1]
      const secondLatest = evList.length >= 2 ? evList[evList.length - 2] : null
      const recentTwoFailed = latestEvent?.outcome === 'failed' && secondLatest?.outcome === 'failed'

      if (recentTwoFailed || successes === 0 || (winRate < thresholds.developingWinRate && latestEvent?.outcome !== 'passed')) {
        status = 'needs_practice'
      } else if (
        totalEvals >= thresholds.consistentEvidenceCount &&
        winRate >= thresholds.consistentWinRate &&
        latestEvent?.outcome === 'passed'
      ) {
        status = 'consistent'
      } else {
        status = 'developing'
      }
    }

    // Generate human-readable evidence summary
    let summary = 'No verified evaluations recorded yet.'
    if (status === 'consistent') {
      summary = `Consistent performance: ${successes}/${totalEvals} passed (${winRate}%).`
    } else if (status === 'developing') {
      summary = `Developing skill: ${successes}/${totalEvals} successful attempts (${winRate}%).`
    } else if (status === 'needs_practice') {
      summary = `Needs targeted practice: ${failures}/${totalEvals} attempts encountered issues.`
    } else if (totalEvals === 1) {
      summary = `1 attempt recorded. More evidence needed for confident diagnosis.`
    }

    result[cId] = {
      ...result[cId],
      status,
      evidenceCount: totalEvals,
      successCount: successes,
      failureCount: failures,
      winRate,
      confidence,
      lastEvaluatedAt: lastEvaluatedAt || undefined,
      recentErrorCategory: recentError,
      evidenceSummary: summary,
    }
  }

  return result
}
