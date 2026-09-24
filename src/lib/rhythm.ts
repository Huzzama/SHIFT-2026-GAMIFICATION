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

/**
 * This week, Monday to Sunday: which days had any learning in them.
 *
 * "Consistencia flexible": for someone who works, five days out of seven is
 * a great week, and a gap on Wednesday is not a broken streak. A day counts
 * if the student finished something in FARO or Canvas recorded activity for
 * the course that day. Days after today are marked `future`, not missed.
 */
export interface RhythmDay {
  /** 0 = Monday … 6 = Sunday. */
  weekday: number
  date: string
  active: boolean
  today: boolean
  future: boolean
}

export function weekRhythm(sessions: StudySession[], activity: { at: string }[], now = new Date()): RhythmDay[] {
  const active = new Set([...sessions.map((s) => s.at), ...activity.map((a) => a.at)].map((at) => new Date(at).toDateString()))
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const todayKey = now.toDateString()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const key = d.toDateString()
    return {
      weekday: i,
      date: d.toISOString(),
      active: active.has(key),
      today: key === todayKey,
      future: d.getTime() > now.getTime() && key !== todayKey,
    }
  })
}

export const activeDays = (week: RhythmDay[]) => week.filter((d) => d.active).length
