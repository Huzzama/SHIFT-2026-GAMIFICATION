/**
 * Purpose onboarding.
 *
 * Three questions, no more: why, what it unlocks, how much time is real.
 * This is personalisation - it is never presented as a psychological formula,
 * and the answers exist so the mentor and the journey can speak to something
 * the student actually cares about.
 */
import { useState } from 'react'
import { useStore } from '@/state/store'
import type { PurposeGoal } from '@/types'

const GOALS: { id: PurposeGoal; label: string }[] = [
  { id: 'career_growth', label: 'Career growth' },
  { id: 'better_income', label: 'Better income' },
  { id: 'career_change', label: 'Career change' },
  { id: 'promotion', label: 'A promotion' },
  { id: 'finish_degree', label: 'Finish my degree' },
  { id: 'personal_achievement', label: 'Personal achievement' },
  { id: 'personal_development', label: 'Personal development' },
  { id: 'other', label: 'Something else' },
]

export const GOAL_LABELS: Record<PurposeGoal, string> = Object.fromEntries(
  GOALS.map((g) => [g.id, g.label]),
) as Record<PurposeGoal, string>

const TIMES = [10, 20, 30, 45, 60]

export function PurposeView({ onDone }: { onDone?: () => void }) {
  const { purpose, setPurpose } = useStore()
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
          <div className="destination__label">Your destination</div>
          <div className="destination__value">{GOAL_LABELS[purpose.goal]}</div>
          {purpose.destination && (
            <div className="destination__quote">“{purpose.destination}”</div>
          )}
        </div>
        <div className="card stack">
          <div>
            <div className="eyebrow">Time you actually have</div>
            <p className="muted" style={{ margin: '6px 0 12px' }}>
              FARO plans around this, not around an ideal week.
            </p>
            <div className="chips">
              {TIMES.map((t) => (
                <button
                  key={t}
                  className={`chip${purpose.weekdayMinutes === t ? ' chip--on' : ''}`}
                  onClick={() =>
                    setPurpose({ ...purpose, weekdayMinutes: t })
                  }
                >
                  {t} min
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn--ghost" onClick={() => setStep(0)}>
            Change my destination
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="purpose stack">
      <div className="purpose__steps">STEP {step + 1} OF 3</div>

      {step === 0 && (
        <div className="card stack">
          <div>
            <h2 className="h2">Why are you studying?</h2>
            <p className="muted">
              There will be a week when you do not feel like opening this course.
              This is what FARO will remind you of.
            </p>
          </div>
          <div className="chips">
            {GOALS.map((g) => (
              <button
                key={g.id}
                className={`chip${goal === g.id ? ' chip--on' : ''}`}
                onClick={() => setGoal(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
          <button className="btn btn--block" disabled={!goal} onClick={() => setStep(1)}>
            Continue
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="card stack">
          <div>
            <h2 className="h2">What would finishing this let you do?</h2>
            <p className="muted">In your own words. One line is enough.</p>
          </div>
          <textarea
            className="purpose__input"
            placeholder="Lead my own projects instead of only executing them."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <div className="row">
            <button className="btn btn--ghost" onClick={() => setStep(0)}>Back</button>
            <button className="btn" style={{ flex: 1 }} onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card stack">
          <div>
            <h2 className="h2">How much time do you really have on a normal day?</h2>
            <p className="muted">
              Be honest rather than ambitious. Every plan FARO makes fits inside this.
            </p>
          </div>
          <div className="chips">
            {TIMES.map((t) => (
              <button
                key={t}
                className={`chip${minutes === t ? ' chip--on' : ''}`}
                onClick={() => setMinutes(t)}
              >
                {t} min
              </button>
            ))}
          </div>
          <div className="row">
            <button className="btn btn--ghost" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn--beacon" style={{ flex: 1 }} onClick={save}>
              Set my destination
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
