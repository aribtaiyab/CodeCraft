// ============================================================================
// CodeCraft — Assessment Generation Service
// Phase 6 & 8: Deterministic assembly, question diversity, and resilient AI augmentation
// ============================================================================

import type {
  AssessmentConfig,
  AssessmentDefinition,
  AssessmentQuestion,
  AssessmentMcqQuestion,
} from './types'
import { CURATED_QUESTIONS } from './curatedBank'
import { validateAssessmentConfig, validateAssessmentDefinition } from './validation'
import {
  getServedQuestionFingerprints,
  recordServedQuestionFingerprints,
} from './attemptStorage'

export interface GenerationResult {
  assessment: AssessmentDefinition
  usedFallback: boolean
  fallbackReason?: string
}

/**
 * Computes a stable, normalized content fingerprint for duplicate detection.
 * Normalizes case, whitespace, and punctuation so trivial formatting changes
 * are recognized as the same underlying question.
 */
export function computeQuestionFingerprint(prompt: string, codeSnippet?: string): string {
  const p = prompt
    .toLowerCase()
    .replace(/[^\w]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const s = (codeSnippet || '')
    .toLowerCase()
    .replace(/[^\w]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  let hash = 0
  const str = `${p}#${s}`
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return `fp_${Math.abs(hash)}`
}

export async function createAssessment(
  config: AssessmentConfig
): Promise<GenerationResult> {
  const configVal = validateAssessmentConfig(config)
  if (!configVal.valid) {
    throw new Error(`Invalid assessment configuration: ${configVal.errors.join('; ')}`)
  }

  let questions: AssessmentQuestion[] = []
  let usedFallback = false
  let fallbackReason: string | undefined

  // 1. AI Generation Workflow (when selected)
  if (config.mode === 'ai_generated') {
    try {
      const aiQuestions = await fetchAiGeneratedQuestions(config)
      if (aiQuestions.length > 0) {
        questions = aiQuestions

        // If AI returned fewer questions than requested (e.g. rate limit, schema drops, or coding asked),
        // augment with verified curated questions so student gets full requested count
        if (questions.length < config.questionCount) {
          const needed = config.questionCount - questions.length
          const existingFps = new Set(questions.map((q) => getQuestionFingerprint(q)))
          const curatedAugment = selectCuratedQuestions(config, needed, existingFps)
          questions = [...questions, ...curatedAugment]
          usedFallback = true
          fallbackReason = `Generated ${aiQuestions.length} AI questions; augmented with ${curatedAugment.length} verified curated questions to fulfill requested count of ${config.questionCount}.`
        }
      } else {
        usedFallback = true
        fallbackReason = 'AI service returned 0 valid questions. Loaded verified curated test.'
      }
    } catch (err) {
      usedFallback = true
      fallbackReason = `AI generation unavailable (${err instanceof Error ? err.message : 'network error'}). Loaded verified curated test.`
    }
  }

  // 2. Curated Assembly (used directly or as full fallback)
  if (questions.length === 0) {
    questions = selectCuratedQuestions(config, config.questionCount)
  }

  // If still empty (e.g. very strict filter), fall back to broader curated items for that topic
  if (questions.length === 0) {
    questions = CURATED_QUESTIONS.filter((q) => q.topic === config.topic).slice(
      0,
      config.questionCount
    )
    if (questions.length === 0) {
      questions = CURATED_QUESTIONS.slice(0, config.questionCount)
    }
  }

  // Deduplicate within the single assessment by both ID and content fingerprint
  const seenIds = new Set<string>()
  const seenFps = new Set<string>()
  const uniqueQuestions: AssessmentQuestion[] = []

  for (const q of questions) {
    const fp = getQuestionFingerprint(q)
    if (!seenIds.has(q.id) && !seenFps.has(fp)) {
      seenIds.add(q.id)
      seenFps.add(fp)
      uniqueQuestions.push(q)
    }
  }

  questions = uniqueQuestions

  // Record served fingerprints locally for subsequent assessment diversity
  recordServedQuestionFingerprints(Array.from(seenFps))

  // Calculate total points
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
  const topicTitle = config.topic.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const assessment: AssessmentDefinition = {
    id: `test_${config.topic}_${Date.now()}`,
    version: '1.0.0',
    title: `${topicTitle} (${config.difficulty.toUpperCase()}) Assessment`,
    description: `A ${config.timeLimitMinutes}-minute timed assessment covering ${topicTitle} with ${questions.length} questions.`,
    topic: config.topic,
    difficulty: config.difficulty,
    timeLimitMinutes: config.timeLimitMinutes,
    totalPoints,
    questions,
    createdAt: Date.now(),
    isAiGenerated: config.mode === 'ai_generated' && !usedFallback,
  }

  const defVal = validateAssessmentDefinition(assessment)
  if (!defVal.valid) {
    throw new Error(`Constructed assessment failed validation: ${defVal.errors.join('; ')}`)
  }

  return { assessment, usedFallback, fallbackReason }
}

function getQuestionFingerprint(q: AssessmentQuestion): string {
  const codeSnippet = q.type === 'mcq' ? (q as AssessmentMcqQuestion).codeSnippet : q.starterCode
  return computeQuestionFingerprint(q.prompt, codeSnippet)
}

/**
 * Selects curated questions prioritizing diversity (unseen questions first),
 * matching difficulty, and requested question types.
 */
function selectCuratedQuestions(
  config: AssessmentConfig,
  count = config.questionCount,
  excludeFingerprints: Set<string> = new Set()
): AssessmentQuestion[] {
  let pool = CURATED_QUESTIONS.filter((q) => q.topic === config.topic)

  if (config.questionTypes === 'mcq_only') {
    pool = pool.filter((q) => q.type === 'mcq')
  } else if (config.questionTypes === 'coding_only') {
    pool = pool.filter((q) => q.type === 'coding')
  }

  const servedFingerprints = getServedQuestionFingerprints()

  // Separate candidates into unseen and previously seen questions
  const unseenPool: AssessmentQuestion[] = []
  const seenPool: AssessmentQuestion[] = []

  for (const q of pool) {
    const fp = getQuestionFingerprint(q)
    if (excludeFingerprints.has(fp)) continue
    if (servedFingerprints.has(fp)) {
      seenPool.push(q)
    } else {
      unseenPool.push(q)
    }
  }

  // Prioritization within pools: exact difficulty first, then others
  const sortExactDifficultyFirst = (list: AssessmentQuestion[]) => {
    const exact = list.filter((q) => q.difficulty === config.difficulty)
    const others = list.filter((q) => q.difficulty !== config.difficulty)
    return [...exact, ...others]
  }

  const prioritizedCandidates = [
    ...sortExactDifficultyFirst(unseenPool),
    ...sortExactDifficultyFirst(seenPool),
  ]

  // If pool was filtered too strictly, add back remaining questions
  if (prioritizedCandidates.length < count) {
    const fallbackPool = CURATED_QUESTIONS.filter(
      (q) => q.topic === config.topic && !prioritizedCandidates.some((c) => c.id === q.id)
    )
    prioritizedCandidates.push(...sortExactDifficultyFirst(fallbackPool))
  }

  return prioritizedCandidates.slice(0, count)
}

async function fetchAiGeneratedQuestions(
  config: AssessmentConfig
): Promise<AssessmentQuestion[]> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const starterSample = getTopicStarterCode(config.topic)

    // Resilient endpoint resolution: use relative /api in browser/Vite proxy, fallback to port 3001
    const endpoint =
      typeof window !== 'undefined'
        ? '/api/ai/generate-mcqs'
        : 'http://127.0.0.1:3001/api/ai/generate-mcqs'

    let res: Response
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: starterSample,
          count: Math.min(config.questionCount, 5),
        }),
        signal: controller.signal,
      })
    } catch (fetchErr) {
      // If relative URL failed (e.g. test environment), try localhost:3001 directly
      if (endpoint.startsWith('/')) {
        res = await fetch('http://127.0.0.1:3001/api/ai/generate-mcqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: starterSample,
            count: Math.min(config.questionCount, 5),
          }),
          signal: controller.signal,
        })
      } else {
        throw fetchErr
      }
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Malformed AI response format')
    }

    const validQuestions: AssessmentQuestion[] = []
    const seenPrompts = new Set<string>()

    data.questions.forEach((q: {
      id?: string
      question?: string
      options?: string[]
      correctIndex?: number
      explanation?: string
      verifiedByExecution?: boolean
    }, i: number) => {
      if (
        q.question &&
        typeof q.question === 'string' &&
        q.question.trim().length > 0 &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correctIndex === 'number' &&
        q.correctIndex >= 0 &&
        q.correctIndex < q.options.length
      ) {
        // Distinct options check
        const distinctOpts = Array.from(new Set(q.options.map((opt) => String(opt).trim())))
        if (distinctOpts.length < 2) return

        // Prevent duplicate questions within the AI response
        const promptKey = q.question.trim().toLowerCase()
        if (seenPrompts.has(promptKey)) return
        seenPrompts.add(promptKey)

        const optionObjects = distinctOpts.map((optStr, optIdx) => ({
          id: `opt_${optIdx + 1}`,
          text: optStr,
        }))

        const correctIdx = Math.min(q.correctIndex, optionObjects.length - 1)

        const mcq: AssessmentMcqQuestion = {
          id: `ai_${config.topic}_${Date.now()}_${i + 1}`,
          type: 'mcq',
          topic: config.topic,
          difficulty: config.difficulty,
          points: 10,
          prompt: q.question.trim(),
          options: optionObjects,
          correctOptionId: optionObjects[correctIdx].id,
          explanation: q.explanation || 'Evaluated based on Python execution semantics.',
          verifiedByExecution: q.verifiedByExecution ?? false,
          isConceptual: !q.verifiedByExecution,
        }
        validQuestions.push(mcq)
      }
    })

    return validQuestions
  } finally {
    clearTimeout(timeoutId)
  }
}

function getTopicStarterCode(topic: string): string {
  switch (topic) {
    case 'python_fundamentals':
      return 'a = 15\nb = 4\nprint(a // b, a % b)'
    case 'control_flow':
      return 'nums = [1, 2, 3, 4, 5]\ntotal = 0\nfor x in nums:\n    if x % 2 == 0:\n        total += x\nprint(total)'
    case 'functions_scope':
      return 'def greet(name, times=2):\n    return f"{name}! " * times\nprint(greet("Python"))'
    case 'data_structures':
      return 'data = {"a": 1, "b": 2}\nprint(data.get("c", 100))'
    case 'algorithms_logic':
      return 'def factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)\nprint(factorial(4))'
    default:
      return 'print("Python execution")'
  }
}

