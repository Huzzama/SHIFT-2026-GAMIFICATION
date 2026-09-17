/**
 * Life Happened.
 *
 * The student says what got in the way; FARO changes what it asks of them.
 * Nothing here touches deadlines or academic rules - those belong to the
 * institution. This only changes the size and shape of the next step.
 *
 * The rules (kind + minutes) live here. The words live in `i18n/`.
 */
import { dict } from '@/i18n'
import type { Intervention, InterventionKind, Lang, LifeState } from '@/types'

const rules: Record<LifeState, { kind: InterventionKind; minutes: number }> = {
  less_time: { kind: 'shrink_session', minutes: 10 },
  overwhelmed: { kind: 'single_action', minutes: 15 },
  dont_understand: { kind: 'mentor', minutes: 15 },
  lost_routine: { kind: 'comeback_mission', minutes: 10 },
  need_break: { kind: 'pause', minutes: 0 },
  ready: { kind: 'continue', minutes: 20 },
}

export const lifeStateOrder: LifeState[] = [
  'less_time',
  'overwhelmed',
  'dont_understand',
  'lost_routine',
  'need_break',
  'ready',
]

export function lifeStateLabel(state: LifeState, lang: Lang): string {
  return dict(lang).recovery.states[state]
}

export function interventionFor(state: LifeState, lang: Lang): Intervention {
  const copy = dict(lang).recovery.interventions[state]
  return { ...rules[state], ...copy }
}

/**
 * The time budget a life state implies. `ready` and `need_break` keep whatever
 * the student already told us they have - the state is about direction, not
 * a new estimate.
 */
export function minutesFor(state: LifeState, current: number): number {
  const r = rules[state]
  return r.minutes > 0 ? r.minutes : current
}
