// ============================================================================
// CodeCraft — Progress & Concept Mastery Dashboard Component
// Phase 7: Real evidence-based learning analytics, history, & targeted retesting
// ============================================================================

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  History,
  ArrowRight,
  Compass,
  Trash2,
} from 'lucide-react'
import { Button, Badge, EmptyState } from '../../../components'
import {
  getLearningHistory,
  getHistoricalResults,
  clearLearningHistory,
  clearAllAssessmentHistory,
  computeConceptMastery,
  generateRecommendations,
  type ConceptMastery,
} from '../../../services/learning'
import styles from './ProgressDashboard.module.css'

export const ProgressDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState(() => getLearningHistory())
  const [results, setResults] = useState(() => getHistoricalResults())

  // Deterministically compute concept mastery matrix
  const masteries = useMemo(() => computeConceptMastery(events), [events])

  // Generate prioritized recommendations
  const recommendations = useMemo(() => generateRecommendations(masteries), [masteries])

  // Overview metrics
  const totalEvents = events.length
  const completedAttempts = results.length
  const consistentCount = Object.values(masteries).filter((m) => m.status === 'consistent').length
  const needsPracticeCount = Object.values(masteries).filter((m) => m.status === 'needs_practice').length

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your local learning history and assessment attempts? This action cannot be undone.')) {
      clearLearningHistory()
      clearAllAssessmentHistory()
      setEvents([])
      setResults([])
    }
  }

  const getStatusBadge = (m: ConceptMastery) => {
    switch (m.status) {
      case 'consistent':
        return <Badge variant="success" size="sm">Consistent</Badge>
      case 'developing':
        return <Badge variant="bronze" size="sm">Developing</Badge>
      case 'needs_practice':
        return <Badge variant="error" size="sm">Needs Practice</Badge>
      case 'no_evidence':
      default:
        return <Badge variant="default" size="sm">No Evidence</Badge>
    }
  }

  return (
    <div className={styles.container}>
      {/* 1. Header Overview Metrics */}
      <section className={styles.metricsGrid} aria-label="Learning metrics summary">
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Verified Evaluations</span>
          <span className={styles.metricValue}>{totalEvents}</span>
          <span className={styles.metricSubtext}>Recorded from Studio & Test Lab</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Completed Assessments</span>
          <span className={styles.metricValue}>{completedAttempts}</span>
          <span className={styles.metricSubtext}>Saved in local history</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Consistent Concepts</span>
          <span className={styles.metricValue} style={{ color: 'var(--color-success)' }}>
            {consistentCount}
          </span>
          <span className={styles.metricSubtext}>≥70% win rate across ≥3 evals</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Targeted Concepts</span>
          <span className={styles.metricValue} style={{ color: needsPracticeCount > 0 ? 'var(--color-error)' : 'var(--color-ivory)' }}>
            {needsPracticeCount}
          </span>
          <span className={styles.metricSubtext}>Identified for practice</span>
        </div>
      </section>

      {/* 2. Targeted Practice Recommendations */}
      <section className={styles.section} aria-label="Targeted Practice Recommendations">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Compass size={18} style={{ color: 'var(--color-bronze)' }} />
            Targeted Retesting & Practice Recommendations
          </h2>
        </div>

        <div className={styles.recsList}>
          {recommendations.map((rec) => (
            <div key={rec.id} className={styles.recCard}>
              <div className={styles.recHeader}>
                <h3 className={styles.recTitle}>{rec.title}</h3>
                <Badge variant={rec.priority === 1 ? 'error' : 'bronze'} size="sm">
                  {rec.priority === 1 ? 'Priority Retest' : 'Recommended'}
                </Badge>
              </div>

              <p className={styles.recReason}>{rec.reason}</p>

              <div className={styles.recFooter}>
                <span className={styles.recEvidence}>{rec.evidenceSource}</span>
                <Button
                  variant="primary"
                  size="sm"
                  iconRight={<ArrowRight size={13} />}
                  onClick={() => navigate(rec.actionUrl)}
                >
                  {rec.actionLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Concept Mastery Matrix */}
      <section className={styles.section} aria-label="Concept Mastery Matrix">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Award size={18} style={{ color: 'var(--color-bronze)' }} />
            Evidence-Based Concept Mastery
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-subtle)' }}>
            Computed deterministically from verified student attempts
          </span>
        </div>

        <div className={styles.matrixGrid}>
          {Object.values(masteries).map((m) => (
            <div key={m.conceptId} className={styles.conceptCard}>
              <div className={styles.conceptTop}>
                <div>
                  <h3 className={styles.conceptName}>{m.name}</h3>
                  <span className={styles.conceptTopic}>{m.topicLabel}</span>
                </div>
                {getStatusBadge(m)}
              </div>

              {/* Progress Bar */}
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${styles[`progressFill--${m.status}`]}`}
                  style={{ width: `${m.status === 'no_evidence' ? 0 : m.winRate}%` }}
                />
              </div>

              <div className={styles.conceptFooter}>
                <span>{m.evidenceSummary}</span>
                {m.evidenceCount > 0 && <span>{m.winRate}%</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Completed Assessment Attempt History */}
      <section className={styles.section} aria-label="Assessment Attempt History">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <History size={18} style={{ color: 'var(--color-bronze)' }} />
            Saved Assessment Attempts & Results
          </h2>
        </div>

        {results.length === 0 ? (
          <EmptyState
            icon={<Award size={32} strokeWidth={1.5} />}
            title="No Completed Assessments Yet"
            description="Take an assessment in AI Test Lab to evaluate your Python skills and populate your verified attempt history."
            size="md"
            action={
              <Button
                variant="primary"
                size="sm"
                iconRight={<ArrowRight size={14} />}
                onClick={() => navigate('/testlab')}
              >
                Go to AI Test Lab
              </Button>
            }
          />
        ) : (
          <div className={styles.historyList}>
            {results.map((res) => {
              const formattedDate = new Date(res.completedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div key={res.attemptId} className={styles.historyItem}>
                  <div className={styles.historyLeft}>
                    <h3 className={styles.historyTitle}>{res.assessmentTitle}</h3>
                    <div className={styles.historyMeta}>
                      <span>{formattedDate}</span>
                      <span>·</span>
                      <span>{res.mcqSummary.correct}/{res.mcqSummary.total} MCQs</span>
                      <span>·</span>
                      <span>{res.codingSummary.passed}/{res.codingSummary.total} Coding</span>
                    </div>
                  </div>

                  <div className={styles.historyRight}>
                    <div className={styles.historyScore}>
                      <div>{res.scorePercentage}%</div>
                      <div className={styles.historyScorePoints}>
                        {res.totalPointsEarned}/{res.totalPointsMax} pts
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      iconRight={<ArrowRight size={13} />}
                      onClick={() => navigate(`/testlab?revisit=${res.attemptId}`)}
                    >
                      Review Result
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Clear history option */}
        {(results.length > 0 || events.length > 0) && (
          <div className={styles.clearRow}>
            <Button
              variant="ghost"
              size="xs"
              iconLeft={<Trash2 size={13} />}
              onClick={handleClearHistory}
            >
              Clear Local Learning History
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
