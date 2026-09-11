/**
 * Achievements = resilience.
 *
 * Deliberately five, deliberately hard to trip over by accident. Every one of
 * them marks persisting through something real: coming back, rebuilding a
 * rhythm, holding on during a bad week, working inside the time you had,
 * finishing. Nothing here rewards a click.
 */
import { frictionRules } from './friction'
import type { Achievement, AchievementId, Journey, StudySession } from '@/types'

interface Catalogue {
  id: AchievementId
  title: string
  description: string
  hint: string
}

const catalogue: Catalogue[] = [
  {
    id: 'the_comeback',
    title: 'The Comeback',
    description: 'You returned after a difficult stretch away.',
    hint: 'Earned by coming back and completing one step after time away.',
  },
  {
    id: 'back_on_track',
    title: 'Back on Track',
    description: 'You rebuilt a learning rhythm instead of starting over.',
    hint: 'Earned by completing two steps and bringing your momentum back up.',
  },
  {
    id: 'weathered_the_storm',
    title: 'Weathered the Storm',
    description: 'You kept moving during a week when work had piled up.',
    hint: 'Earned by completing a step while more than one item was still open.',
  },
  {
    id: 'smart_session',
    title: 'Smart Session',
    description: 'You finished a step inside the time you actually had.',
    hint: 'Earned by completing a step that fitted your available time.',
  },
  {
    id: 'finisher',
    title: 'Finisher',
    description: 'You completed the course.',
    hint: 'Earned at the end of the route.',
  },
]

export function evaluateAchievements(args: {
  sessions: StudySession[]
  journey: Journey | null
  momentum: number
  /** Days the student had been away when this visit started. */
  awayGap: number
}): Achievement[] {
  const { sessions, journey, momentum, awayGap } = args
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

  return catalogue.map((c) => ({
    ...c,
    earned: Boolean(earnedAt[c.id]),
    earnedAt: earnedAt[c.id] ?? null,
  }))
}
