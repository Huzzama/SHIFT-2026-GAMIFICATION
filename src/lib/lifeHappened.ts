/**
 * Life Happened.
 *
 * The student says what got in the way; FARO changes what it asks of them.
 * Nothing here touches deadlines or academic rules - those belong to the
 * institution. This only changes the size and shape of the next step.
 */
import type { Intervention, LifeState } from '@/types'

export const lifeStateLabels: Record<LifeState, string> = {
  less_time: 'I have less time',
  overwhelmed: "I'm overwhelmed",
  dont_understand: "I don't understand the material",
  lost_routine: 'I lost my routine',
  need_break: 'I need a break',
  ready: "I'm ready to continue",
}

const interventions: Record<LifeState, Intervention> = {
  less_time: {
    kind: 'shrink_session',
    headline: 'Then we make the sessions smaller.',
    body:
      'Ten minutes still moves the route forward. FARO will size every next step to the time you actually have, not the time a syllabus assumed.',
    minutes: 10,
    cta: 'Use 10-minute sessions',
  },
  overwhelmed: {
    kind: 'single_action',
    headline: 'One thing. Not the list.',
    body:
      'When everything feels due at once, the problem is usually the deciding, not the doing. FARO will hide the pile and show you a single step until this passes.',
    minutes: 15,
    cta: 'Show me one step only',
  },
  dont_understand: {
    kind: 'mentor',
    headline: 'Let us take the concept apart.',
    body:
      'Not understanding something is information, not failure. FARO can explain it another way, give you a hint, or break it into smaller pieces.',
    minutes: 15,
    cta: 'Ask FARO to explain',
  },
  lost_routine: {
    kind: 'comeback_mission',
    headline: 'Routines are rebuilt, not remembered.',
    body:
      'You do not need to catch up today. One short session breaks the inertia, and the rhythm follows from there.',
    minutes: 10,
    cta: 'Start a comeback mission',
  },
  need_break: {
    kind: 'pause',
    headline: 'Then take one, properly.',
    body:
      'A planned pause is not the same as disappearing. Your progress stays exactly where it is, and FARO will be here with a route when you come back.',
    minutes: 0,
    cta: 'Pause in safe harbor',
  },
  ready: {
    kind: 'continue',
    headline: 'Good. Let us pick the route back up.',
    body:
      'Your progress is still here. FARO will point you at the one step that reopens the route.',
    minutes: 20,
    cta: 'Continue the journey',
  },
}

export function interventionFor(state: LifeState): Intervention {
  return interventions[state]
}

/**
 * The time budget a life state implies. `ready` and `need_break` keep whatever
 * the student already told us they have - the state is about direction, not
 * a new estimate.
 */
export function minutesFor(state: LifeState, current: number): number {
  const i = interventions[state]
  return i.minutes > 0 ? i.minutes : current
}
