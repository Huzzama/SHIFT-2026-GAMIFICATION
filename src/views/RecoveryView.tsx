/**
 * Recovery: the screen FARO exists for.
 *
 * Two rules govern everything here. The student is never shown what they owe -
 * no overdue count, no red, no Game Over - and whatever they say about their
 * week changes what FARO asks of them, not what the institution requires.
 */
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { useStore } from '@/state/store'
import { comebackMilestone } from '@/lib/journey'
import { interventionFor, lifeStateLabel, lifeStateOrder } from '@/lib/lifeHappened'

export function RecoveryView({
  onAskMentor,
  onGoHome,
}: {
  onAskMentor: () => void
  onGoHome: () => void
}) {
  const {
    t,
    lang,
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

  if (!journey || !friction) return <p className="muted">{t.recovery.loading}</p>

  const intervention = lifeState ? interventionFor(lifeState, lang) : null
  const mission = comebackMilestone(journey)
  const missionDone = mission ? sessions.some((s) => s.milestoneId === mission.id) : false

  const showMission =
    !intervention ||
    intervention.kind === 'comeback_mission' ||
    intervention.kind === 'continue' ||
    intervention.kind === 'single_action'

  const runIntervention = () => {
    if (!intervention) return
    if (intervention.kind === 'mentor') return onAskMentor()
    return onGoHome()
  }

  return (
    <div className="stack">
      <div className="card stack">
        <div className="row">
          <span className="ibadge ibadge--orange">
            <Icon name="refresh" size={22} />
          </span>
          <div>
            <div className="eyebrow">{t.recovery.eyebrow}</div>
            <div className="h2" style={{ margin: '2px 0 0' }}>{friction.headline}</div>
          </div>
        </div>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>{t.recovery.body}</p>

        <div className="chips">
          {lifeStateOrder.map((s) => (
            <button
              key={s}
              className={`chip${lifeState === s ? ' chip--on' : ''}`}
              onClick={() => setLifeState(lifeState === s ? null : s)}
            >
              {lifeStateLabel(s, lang)}
            </button>
          ))}
        </div>
      </div>

      {intervention && (
        <div className="intervention">
          <div className="intervention__headline">{intervention.headline}</div>
          <p className="intervention__body">{intervention.body}</p>
          {intervention.minutes > 0 && (
            <div className="intervention__meta">{t.recovery.sizedTo(intervention.minutes)}</div>
          )}
          {intervention.kind !== 'comeback_mission' && (
            <button className="btn btn--block" style={{ marginTop: 'var(--space-4)' }} onClick={runIntervention}>
              {intervention.cta} <Icon name="arrow" size={16} />
            </button>
          )}
        </div>
      )}

      {showMission && mission && !missionDone && (
        <div className="mission">
          <div className="mission__flag">
            <Icon name="flag" size={14} /> {t.recovery.mission.flag}
          </div>
          <div className="mission__title">{mission.title}</div>
          <p className="mission__body">{t.recovery.mission.body(Math.min(10, mission.estimatedMinutes))}</p>
          <button
            className="btn btn--beacon btn--block"
            onClick={() => {
              completeMilestone(mission, Math.min(10, mission.estimatedMinutes))
              setJustFinished(mission.title)
            }}
          >
            {t.recovery.mission.start} <Icon name="arrow" size={16} />
          </button>
        </div>
      )}

      {justFinished && (
        <div className="mission mission--done">
          <div className="mission__flag">
            <Icon name="check" size={14} /> {t.recovery.mission.doneFlag}
          </div>
          <div className="mission__title">{t.recovery.mission.doneTitle}</div>
          <p className="mission__body">{t.recovery.mission.doneBody(justFinished, friction.momentum)}</p>
          <button className="btn btn--onDark btn--block" onClick={onGoHome}>
            {t.recovery.mission.seeNext}
          </button>
        </div>
      )}

      {recovery.length > 0 && (
        <div className="card">
          <div className="eyebrow">{t.recovery.wayBack.eyebrow}</div>
          <p className="muted" style={{ margin: '6px 0 12px' }}>{t.recovery.wayBack.body(availableMinutes)}</p>
          <ul className="route">
            {recovery.map((s) => (
              <li key={s.when}>
                <div className="route__when">{t.journey.when[s.when]}</div>
                <div>
                  <div className="route__title">{s.title}</div>
                  <div className="route__time">{s.estimatedMinutes} {t.journey.stop.min}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mentor__note">{t.recovery.note}</p>
    </div>
  )
}
