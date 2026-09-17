/**
 * Learning Rhythm - a second, softer continuity signal alongside Momentum.
 *
 * Momentum (in `lib/friction.ts`) is the friction engine's decaying,
 * floored connection score. Rhythm is simpler and purely additive: how many
 * days in a row, ending today, the student did something in FARO. It never
 * goes negative and a missed day never "breaks" anything to display - it
 * just stops counting, and the copy for zero is an invitation ("Your rhythm
 * is waiting for you"), never a loss ("Your streak is gone").
 */
import type { StudySession } from '@/types'

export function learningRhythm(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0

  const activeDays = new Set(sessions.map((s) => new Date(s.at).toDateString()))
  let count = 0
  const cursor = new Date()
  while (activeDays.has(cursor.toDateString())) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}
