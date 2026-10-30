// ============================================================================
// Automated Tests: Assessment Schema & Invariant Validation
// ============================================================================

import { describe, it, expect } from 'vitest'
import {
  validateAssessmentConfig,
  validateAssessmentDefinition,
  validateStudentAnswer,
} from '../validation'
import type { AssessmentDefinition, AssessmentConfig } from '../types'

describe('Assessment Schema & Invariant Validation', () => {
  describe('validateAssessmentConfig', () => {
    it('accepts valid configuration', () => {
      const config: AssessmentConfig = {
        topic: 'python_fundamentals',
        difficulty: 'beginner',
        questionTypes: 'mixed',
        questionCount: 5,
        timeLimitMinutes: 15,
        mode: 'curated',
      }
      const res = validateAssessmentConfig(config)
      expect(res.valid).toBe(true)
      expect(res.errors).toHaveLength(0)
    })

    it('rejects invalid topic and difficulty', () => {
      const config = {
        topic: 'invalid_topic',
        difficulty: 'super_hard',
        questionTypes: 'mixed',
        questionCount: 5,
        timeLimitMinutes: 15,
        mode: 'curated',
      }
      const res = validateAssessmentConfig(config)
      expect(res.valid).toBe(false)
      expect(res.errors.some((e) => e.includes('Invalid topic'))).toBe(true)
      expect(res.errors.some((e) => e.includes('Invalid difficulty'))).toBe(true)
    })

    it('rejects invalid question counts and time limits', () => {
      const config = {
        topic: 'control_flow',
        difficulty: 'intermediate',
        questionTypes: 'mcq_only',
        questionCount: 0,
        timeLimitMinutes: 300,
        mode: 'curated',
      }
      const res = validateAssessmentConfig(config)
      expect(res.valid).toBe(false)
      expect(res.errors.some((e) => e.includes('Question count'))).toBe(true)
      expect(res.errors.some((e) => e.includes('Time limit'))).toBe(true)
    })
  })

  describe('validateAssessmentDefinition', () => {
    const validDefinition: AssessmentDefinition = {
      id: 'test_123',
      version: '1.0.0',
      title: 'Python Fundamentals Test',
      description: 'Introductory test',
      topic: 'python_fundamentals',
      difficulty: 'beginner',
      timeLimitMinutes: 10,
      totalPoints: 35,
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          topic: 'python_fundamentals',
          difficulty: 'beginner',
          points: 10,
          prompt: 'What does print(type(5)) output?',
          options: [
            { id: 'opt_1', text: "<class 'int'>" },
            { id: 'opt_2', text: "<class 'float'>" },
          ],
          correctOptionId: 'opt_1',
          explanation: '5 is an integer literal in Python.',
        },
        {
          id: 'q2',
          type: 'coding',
          topic: 'python_fundamentals',
          difficulty: 'beginner',
          points: 25,
          prompt: 'Write a function add(a, b) that returns a + b.',
          starterCode: 'def add(a, b):\n    pass\n',
          testCases: [
            {
              id: 'tc_1',
              name: 'Basic addition',
              callExpr: 'add(2, 3)',
              expected: '5',
            },
          ],
          explanation: 'Return a + b.',
        },
      ],
      createdAt: Date.now(),
    }

    it('accepts valid assessment definition', () => {
      const res = validateAssessmentDefinition(validDefinition)
      expect(res.valid).toBe(true)
      expect(res.errors).toHaveLength(0)
    })

    it('rejects duplicate question IDs', () => {
      const invalid = {
        ...validDefinition,
        questions: [
          validDefinition.questions[0],
          { ...validDefinition.questions[1], id: 'q1' }, // Duplicate ID 'q1'
        ],
      }
      const res = validateAssessmentDefinition(invalid)
      expect(res.valid).toBe(false)
      expect(res.errors.some((e) => e.includes("duplicate question ID 'q1'"))).toBe(true)
    })

    it('rejects MCQ with missing or mismatched correctOptionId', () => {
      const invalid = {
        ...validDefinition,
        questions: [
          {
            ...validDefinition.questions[0],
            correctOptionId: 'non_existent_option',
          },
        ],
        totalPoints: 10,
      }
      const res = validateAssessmentDefinition(invalid)
      expect(res.valid).toBe(false)
      expect(res.errors.some((e) => e.includes('does not match any valid option ID'))).toBe(true)
    })

    it('rejects MCQ with fewer than 2 options or duplicate option text', () => {
      const invalid = {
        ...validDefinition,
        questions: [
          {
            ...validDefinition.questions[0],
            options: [
              { id: 'opt_1', text: 'Same text' },
              { id: 'opt_2', text: 'same text' }, // Duplicate normalized text
            ],
          },
        ],
        totalPoints: 10,
      }
      const res = validateAssessmentDefinition(invalid)
      expect(res.valid).toBe(false)
      expect(res.errors.some((e) => e.includes('Duplicate option text'))).toBe(true)
    })

    it('rejects coding question without test cases or starter code', () => {
      const invalid = {
        ...validDefinition,
        questions: [
          {
            ...validDefinition.questions[1],
            starterCode: '',
            testCases: [],
          },
        ],
        totalPoints: 25,
      }
      const res = validateAssessmentDefinition(invalid)
      expect(res.valid).toBe(false)
      expect(res.errors.some((e) => e.includes('must provide starter code'))).toBe(true)
      expect(res.errors.some((e) => e.includes('must have at least 1 test case'))).toBe(true)
    })

    it('rejects when totalPoints does not match the sum of question points', () => {
      const invalid = {
        ...validDefinition,
        totalPoints: 100, // Actual sum is 35 (10 + 25)
      }
      const res = validateAssessmentDefinition(invalid)
      expect(res.valid).toBe(false)
      expect(res.errors.some((e) => e.includes('totalPoints (100) does not match sum'))).toBe(true)
    })
  })

  describe('validateStudentAnswer', () => {
    it('accepts valid student answer', () => {
      const res = validateStudentAnswer({
        questionId: 'q1',
        questionType: 'mcq',
        selectedOptionId: 'opt_1',
        lastUpdated: Date.now(),
      })
      expect(res.valid).toBe(true)
    })

    it('rejects answer missing questionId or invalid questionType', () => {
      const res = validateStudentAnswer({
        questionType: 'essay',
      })
      expect(res.valid).toBe(false)
      expect(res.errors.some((e) => e.includes('valid'))).toBe(true)
    })
  })
})
