/**
 * Recovery: the screen FARO exists for.
 *
 * Two rules govern everything here. The student is never shown what they owe -
 * no overdue count, no red, no Game Over - and whatever they say about their
 * week changes what FARO asks of them, not what the institution requires.
 */
import { useState } from 'react'
import { useStore } from '@/state/store'
import { comebackMilestone } from '@/lib/journey'
import { interventionFor, lifeStateLabels } from '@/lib/lifeHappened'
import type { LifeState } from '@/types'

const order: LifeState[] = [
  'less_time',
  'overwhelmed',
  'dont_understand',
  'lost_routine',
  'need_break',
  'ready',
]

export function RecoveryView({
  onAskMentor,
  onGoHome,
}: {
  onAskMentor: () => void
  onGoHome: () => void
}) {
  const {
    journey,
    friction,
    recovery,
    lifeState,
    setLifeState,
    completeMilestone,
    sessions,
    availableMinutes,
  } = useStore()
  const [justFinished, setJustFinished] = useState<string | null>(null)

  if (!journey || !friction) return <p className="muted">Loading…</p>

  const intervention = lifeState ? interventionFor(lifeState) : null
  const mission = comebackMilestone(journey)
  const missionDone = mission
    ? sessions.some((s) => s.milestoneId === mission.id)
    : false

  const showMission =
    !intervention ||
    intervention.kind === 'comeback_mission' ||
    intervention.kind === 'continue' ||
    intervention.kind === 'single_action'

  const runIntervention = () => {
    if (!intervention) return
    if (intervention.kind === 'mentor') return onAskMentor()
    if (intervention.kind === 'pause') return onGoHome()
    if (intervention.kind === 'shrink_session') return onGoHome()
    if (intervention.kind === 'continue' || intervention.kind === 'single_action')
      return onGoHome()
  }

  return (
    <div className="stack">
      <div className="card stack">
        <div>
          <div className="eyebrow">Life happened</div>
          <div className="h2" style={{ margin: '6px 0 0' }}>
            {friction.headline}
          </div>
          <p className="muted" style={{ margin: '6px 0 0', lineHeight: 1.55 }}>
            Nothing you have done is lost, and there is nothing to make up before
            you can start again. Tell FARO what got in the way and the plan
            changes to match.
          </p>
        </div>

        <div className="chips">
          {order.map((s) => (
            <button
              key={s}
              className={`chip${lifeState === s ? ' chip--on' : ''}`}
              onClick={() => setLifeState(lifeState === s ? null : s)}
            >
              {lifeStateLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {intervention && (
        <div className="intervention">
          <div className="intervention__headline">{intervention.headline}</div>
          <p className="intervention__body">{intervention.body}</p>
          {intervention.minutes > 0 && (
            <div className="intervention__meta">
              Sessions sized to {intervention.minutes} minutes from here on.
            </div>
          )}
          {intervention.kind !== 'comeback_mission' && (
            <button
              className="btn btn--beacon btn--block"
              style={{ marginTop: 'var(--space-4)' }}
              onClick={runIntervention}
            >
              {intervention.cta}
            </button>
          )}
        </div>
      )}

      {showMission && mission && !missionDone && (
        <div className="mission">
          <div className="mission__flag">Comeback mission available</div>
          <div className="mission__title">{mission.title}</div>
          <p className="mission__body">
            You do not need to catch up today. Spend about{' '}
            {Math.min(10, mission.estimatedMinutes)} minutes reconnecting with your
            course. That is the whole mission.
          </p>
          <button
            className="btn btn--beacon btn--block"
            onClick={() => {
              completeMilestone(mission, Math.min(10, mission.estimatedMinutes))
              setJustFinished(mission.title)
            }}
          >
            Start the mission
          </button>
        </div>
      )}

      {justFinished && (
        <div className="mission mission--done">
          <div className="mission__flag">Mission complete</div>
          <div className="mission__title">You broke the inertia.</div>
          <p className="mission__body">
            “{justFinished}” is done, your momentum is back up to{' '}
            {friction.momentum}%, and the route has been recalculated around where
            you actually are.
          </p>
          <button className="btn btn--ghost btn--block" onClick={onGoHome}>
            See what is next
          </button>
        </div>
      )}

      {recovery.length > 0 && (
        <div className="card">
          <div className="eyebrow">Your way back</div>
          <p className="muted" style={{ margin: '6px 0 12px' }}>
            Three small sessions, sized to the {availableMinutes} minutes you have.
            Not a backlog.
          </p>
          <ul className="route">
            {recovery.map((s) => (
              <li key={s.when}>
                <div className="route__when">
                  {s.when === 'next_session' ? 'Next session' : s.when}
                </div>
                <div>
                  <div className="route__title">{s.title}</div>
                  <div className="route__time">{s.estimatedMinutes} min</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mentor__note">
        FARO changes what it asks of you, never what your course requires.
        Deadlines, grades and extensions stay with your institution.
      </p>
    </div>
  )
}
