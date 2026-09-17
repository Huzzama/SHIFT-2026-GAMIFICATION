/**
 * Purpose onboarding — "Focus" on the brand sheet.
 *
 * Three questions, no more: why, what it unlocks, how much time is real.
 * This is personalisation - it is never presented as a psychological formula,
 * and the answers exist so the mentor and the journey can speak to something
 * the student actually cares about.
 */
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { useStore } from '@/state/store'
import type { PurposeGoal } from '@/types'

const GOALS: PurposeGoal[] = [
  'career_growth',
  'better_income',
  'career_change',
  'promotion',
  'finish_degree',
  'personal_achievement',
  'personal_development',
  'other',
]

const TIMES = [10, 20, 30, 45, 60]

export function PurposeView({ onDone }: { onDone?: () => void }) {
  const { t, purpose, setPurpose } = useStore()
  const [step, setStep] = useState(purpose ? 3 : 0)
  const [goal, setGoal] = useState<PurposeGoal | null>(purpose?.goal ?? null)
  const [destination, setDestination] = useState(purpose?.destination ?? '')
  const [minutes, setMinutes] = useState(purpose?.weekdayMinutes ?? 20)

  const save = () => {
    if (!goal) return
    setPurpose({
      goal,
      destination: destination.trim(),
      weekdayMinutes: minutes,
      createdAt: new Date().toISOString(),
    })
    setStep(3)
    onDone?.()
  }

  if (step === 3 && purpose) {
    return (
      <div className="purpose stack">
        <div className="destination">
          <div className="destination__label">{t.purpose.destination.label}</div>
          <div className="destination__value">{t.purpose.goals[purpose.goal]}</div>
          {purpose.destination && <div className="destination__quote">“{purpose.destination}”</div>}
        </div>
        <div className="card stack">
          <div>
            <div className="row">
              <span className="ibadge ibadge--sm ibadge--mint">
                <Icon name="clock" size={18} />
              </span>
              <div className="eyebrow">{t.purpose.destination.timeEyebrow}</div>
            </div>
            <p className="muted" style={{ margin: '8px 0 12px' }}>{t.purpose.destination.timeBody}</p>
            <div className="chips">
              {TIMES.map((m) => (
                <button
                  key={m}
                  className={`chip${purpose.weekdayMinutes === m ? ' chip--on' : ''}`}
                  onClick={() => setPurpose({ ...purpose, weekdayMinutes: m })}
                >
                  {m} {t.purpose.min}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn--ghost" onClick={() => setStep(0)}>
            {t.purpose.destination.change}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="purpose stack">
      <div className="purpose__steps">{t.purpose.step(step + 1)}</div>

      {step === 0 && (
        <div className="card stack">
          <div className="row">
            <span className="ibadge ibadge--mint">
              <Icon name="target" size={22} />
            </span>
            <div>
              <h2 className="h2" style={{ margin: 0 }}>{t.purpose.q1.title}</h2>
            </div>
          </div>
          <p className="muted" style={{ margin: 0 }}>{t.purpose.q1.body}</p>
          <div className="chips">
            {GOALS.map((g) => (
              <button key={g} className={`chip${goal === g ? ' chip--on' : ''}`} onClick={() => setGoal(g)}>
                {t.purpose.goals[g]}
              </button>
            ))}
          </div>
          <button className="btn btn--block" disabled={!goal} onClick={() => setStep(1)}>
            {t.purpose.continue} <Icon name="arrow" size={16} />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="card stack">
          <div className="row">
            <span className="ibadge ibadge--orange">
              <Icon name="trend" size={22} />
            </span>
            <h2 className="h2" style={{ margin: 0 }}>{t.purpose.q2.title}</h2>
          </div>
          <p className="muted" style={{ margin: 0 }}>{t.purpose.q2.body}</p>
          <textarea
            className="purpose__input"
            placeholder={t.purpose.q2.placeholder}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <div className="row">
            <button className="btn btn--ghost" onClick={() => setStep(0)}>
              {t.purpose.back}
            </button>
            <button className="btn" style={{ flex: 1 }} onClick={() => setStep(2)}>
              {t.purpose.continue} <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card stack">
          <div className="row">
            <span className="ibadge ibadge--violet">
              <Icon name="clock" size={22} />
            </span>
            <h2 className="h2" style={{ margin: 0 }}>{t.purpose.q3.title}</h2>
          </div>
          <p className="muted" style={{ margin: 0 }}>{t.purpose.q3.body}</p>
          <div className="chips">
            {TIMES.map((m) => (
              <button key={m} className={`chip${minutes === m ? ' chip--on' : ''}`} onClick={() => setMinutes(m)}>
                {m} {t.purpose.min}
              </button>
            ))}
          </div>
          <div className="row">
            <button className="btn btn--ghost" onClick={() => setStep(1)}>
              {t.purpose.back}
            </button>
            <button className="btn btn--beacon" style={{ flex: 1 }} onClick={save}>
              {t.purpose.set} <Icon name="flag" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
