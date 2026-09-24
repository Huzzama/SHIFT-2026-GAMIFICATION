/**
 * Teach me — the local tutor loop.
 *
 *   explain briefly → ask one question → student answers → adapt
 *
 * With Gemini on, open topics go to the model under the same loop (the
 * backend's TEACH MODE). This file is what runs without it: the demo
 * course's review bank already holds, per module, a question, its options
 * and a short explanation, which is exactly a micro-lesson.
 *
 * A wrong answer is never a dead end: FARO re-explains from another angle
 * and asks again, without the option already tried. No points are at stake.
 */
import { touchedModules } from './reviewCards'
import type { Journey, ReviewQuestion } from '@/types'

export interface TeachTopic {
  moduleId: number
  name: string
}

/** Modules the student has touched come first; the rest follow in course order. */
export function teachTopics(journey: Journey, bank: ReviewQuestion[], moduleNames: Map<number, string>): TeachTopic[] {
  const withQuestions = new Set(bank.map((q) => q.moduleId))
  const touched = touchedModules(journey).filter((id) => withQuestions.has(id))
  const rest = [...withQuestions].filter((id) => !touched.includes(id)).sort((a, b) => a - b)
  return [...touched, ...rest]
    .filter((id) => moduleNames.has(id))
    .map((id) => ({ moduleId: id, name: moduleNames.get(id) as string }))
}

export function lessonQuestions(bank: ReviewQuestion[], moduleId: number): ReviewQuestion[] {
  return bank.filter((q) => q.moduleId === moduleId)
}

export interface TeachState {
  moduleId: number
  /** Index into `lessonQuestions(bank, moduleId)`. */
  index: number
  /** Options already tried on the current question. */
  tried: number[]
}

export type TeachStep =
  | { kind: 'right'; next: ReviewQuestion | null }
  | { kind: 'wrong'; question: ReviewQuestion; remaining: number[] }

/** What happens after the student picks `option` on the current question. */
export function answerTeach(bank: ReviewQuestion[], state: TeachState, option: number): TeachStep {
  const qs = lessonQuestions(bank, state.moduleId)
  const q = qs[state.index]
  if (option === q.correct) return { kind: 'right', next: qs[state.index + 1] ?? null }
  const tried = [...state.tried, option]
  const remaining = q.options.map((_, i) => i).filter((i) => !tried.includes(i))
  return { kind: 'wrong', question: q, remaining }
}
