/**
 * Achievements = resilience.
 *
 * Deliberately five, deliberately hard to trip over by accident. Every one of
 * them marks persisting through something real: coming back, rebuilding a
 * rhythm, holding on during a bad week, working inside the time you had,
 * finishing. Nothing here rewards a click.
 */
import { frictionRules } from './friction'
import { dict } from '@/i18n'
import type { Achievement, AchievementId, Journey, Lang, StudySession } from '@/types'

/** Order of display. Copy for each lives in `i18n/`. */
const order: AchievementId[] = [
  'the_comeback',
  'back_on_track',
  'weathered_the_storm',
  'smart_session',
  'finisher',
]

export function evaluateAchievements(args: {
  sessions: StudySession[]
  journey: Journey | null
  momentum: number
  /** Days the student had been away when this visit started. */
  awayGap: number
  lang: Lang
}): Achievement[] {
  const { sessions, journey, momentum, awayGap, lang } = args
  const copy = dict(lang).achievements
  const first = sessions[0] ?? null

  const earnedAt: Partial<Record<AchievementId, string>> = {}

  if (awayGap >= frictionRules.frictionDays && first) {
    earnedAt.the_comeback = first.at
  }
  if (sessions.length >= 2 && momentum >= 65) {
    earnedAt.back_on_track = sessions[1].at
  }
  const storm = sessions.find((s) => s.pendingAtStart >= 2)
  if (storm) earnedAt.weathered_the_storm = storm.at

  const smart = sessions.find((s) => s.fitAvailableTime)
  if (smart) earnedAt.smart_session = smart.at

  if (journey && journey.progressPercent >= 100) {
    earnedAt.finisher = sessions[sessions.length - 1]?.at ?? new Date().toISOString()
  }

  return order.map((id) => ({
    id,
    ...copy[id],
    earned: Boolean(earnedAt[id]),
    earnedAt: earnedAt[id] ?? null,
  }))
}
