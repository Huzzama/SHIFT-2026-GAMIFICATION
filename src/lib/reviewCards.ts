/**
 * Review Cards - three questions to reconnect after time away.
 *
 * The problem they solve is not "check what the student knows". It is the
 * inertia of returning: after five days away, the hardest part of opening
 * the course is not the next assignment, it is the feeling of having
 * forgotten everything. Three short recognition questions about what they
 * last studied prove, in two minutes, that they have not - and turn the
 * first action of the comeback into something they can succeed at.
 *
 * Rules that keep them from becoming another test:
 *
 *  - They are about the modules the student already worked on, most recent
 *    first. Never about content they have not reached.
 *  - A wrong answer shows the explanation and lets them try again. The set
 *    is complete when all three are answered, however many tries it takes.
 *  - Points are for finishing the set, not for getting it right first time.
 *    First-try count is recorded for the student's own feedback only; it is
 *    never a grade and never leaves FARO.
 *  - At most one rewarded set per day, so the cards cannot be farmed.
 */
import type { Journey, ReviewQuestion, ReviewRecord } from '@/types'

export const reviewRules = {
  /** Cards per set. */
  SET_SIZE: 3,
  /** At most this many cards from a single module, so the set spans what they studied. */
  MAX_PER_MODULE: 2,
}

/**
 * Modules the student has actually worked in, most recent first.
 *
 * "Worked in" means at least one completed step. Ordered by the course's
 * own sequence, latest first - the module they were in when they stopped is
 * the one most worth reconnecting with.
 */
export function touchedModules(journey: Journey): number[] {
  const order: number[] = []
  const done = new Set<number>()
  for (const m of journey.milestones) {
    if (!order.includes(m.moduleId)) order.push(m.moduleId)
    if (m.status === 'completed') done.add(m.moduleId)
  }
  return order.filter((id) => done.has(id)).reverse()
}

/**
 * Picks the set: up to `MAX_PER_MODULE` from the latest touched module, then
 * the one before, until `SET_SIZE`. Deterministic, so the same return shows
 * the same cards and a demo can be rehearsed.
 *
 * Returns an empty array when there is nothing to review - no completed
 * modules, or a course with no bank. The screen hides the offer then rather
 * than inventing questions.
 */
export function pickReviewSet(journey: Journey, bank: ReviewQuestion[]): ReviewQuestion[] {
  const picked: ReviewQuestion[] = []
  const modules = touchedModules(journey)

  for (const moduleId of modules) {
    const fromModule = bank.filter((q) => q.moduleId === moduleId).slice(0, reviewRules.MAX_PER_MODULE)
    for (const q of fromModule) {
      if (picked.length >= reviewRules.SET_SIZE) break
      picked.push(q)
    }
    if (picked.length >= reviewRules.SET_SIZE) break
  }

  // Short on questions from the recent modules: fill from any touched module.
  if (picked.length < reviewRules.SET_SIZE) {
    for (const q of bank) {
      if (picked.length >= reviewRules.SET_SIZE) break
      if (modules.includes(q.moduleId) && !picked.includes(q)) picked.push(q)
    }
  }

  return picked.length === reviewRules.SET_SIZE ? picked : []
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** One rewarded set per day. */
export function reviewedToday(records: ReviewRecord[], now = new Date()): boolean {
  return records.some((r) => sameDay(new Date(r.at), now))
}

/**
 * Whether Recovery should offer the cards: the student is back after enough
 * time away to count as friction, there is something to review, and they
 * have not already done a set today.
 */
export function shouldOfferReview(args: {
  awayGap: number
  frictionDays: number
  questions: ReviewQuestion[]
  records: ReviewRecord[]
}): boolean {
  return (
    args.awayGap >= args.frictionDays &&
    args.questions.length === reviewRules.SET_SIZE &&
    !reviewedToday(args.records)
  )
}
