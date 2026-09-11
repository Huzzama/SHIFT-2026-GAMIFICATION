/**
 * The Journey: "Where am I going?"
 *
 * A route with checkpoints, not a game board. Missed work appears as a stop on
 * the route that is still open - never as a red overdue count - and when the
 * route has drifted, FARO recalculates it instead of declaring Game Over.
 */
import { useStore } from '@/state/store'
import type { JourneyMilestone } from '@/types'

const fmtDue = (iso: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  const days = Math.round((d.getTime() - Date.now()) / 86_400_000)
  if (days === 0) return 'due today'
  if (days > 0) return `due in ${days} day${days === 1 ? '' : 's'}`
  return `was due ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
}

function Stop({ m }: { m: JourneyMilestone }) {
  const due = fmtDue(m.dueAt)
  const meta =
    m.status === 'completed'
      ? 'Done'
      : m.status === 'locked'
        ? 'Opens later'
        : [`${m.estimatedMinutes} min`, due].filter(Boolean).join(' · ')

  return (
    <li className={`stop stop--${m.status}${m.checkpoint ? ' stop--checkpoint' : ''}`}>
      <span className="stop__dot" />
      <div className="stop__title">
        {m.title}
        {m.checkpoint && <span className="checkpoint-flag">checkpoint</span>}
      </div>
      <div className="stop__meta">
        {m.status === 'current' ? `You are here · ${meta}` : meta}
      </div>
    </li>
  )
}

export function JourneyView({ onAskMentor }: { onAskMentor: () => void }) {
  const { journey, friction, nextAction, recovery, purpose, availableMinutes } = useStore()

  if (!journey || !friction) return <p className="muted">Loading your route…</p>

  const groups = journey.milestones.reduce<Record<string, JourneyMilestone[]>>(
    (acc, m) => {
      const key = m.subtitle ?? 'Course'
      ;(acc[key] ??= []).push(m)
      return acc
    },
    {},
  )

  return (
    <div className="stack">
      {journey.recalculated && (
        <div className="recalc">
          <span aria-hidden="true">↻</span>
          <div>
            <div className="recalc__title">Recalculating your route…</div>
            <div className="recalc__body">
              {friction.headline} Nothing is lost - the route below is reordered
              around where you actually are.
            </div>
          </div>
        </div>
      )}

      <div className="card stack">
        <div className="row row--between">
          <div>
            <div className="eyebrow">Your journey</div>
            <div className="h2" style={{ margin: '4px 0 0' }}>{journey.courseName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 650 }}>
              {journey.progressPercent}%
            </div>
            <div className="muted" style={{ fontSize: 'var(--text-xs)' }}>of the route</div>
          </div>
        </div>
        <div className="meter">
          <div className="meter__fill" style={{ width: `${journey.progressPercent}%` }} />
        </div>
        {purpose?.destination && (
          <p className="muted" style={{ margin: 0 }}>
            Heading toward: {purpose.destination}
          </p>
        )}
      </div>

      {nextAction && (
        <div className="nba">
          <div className="nba__eyebrow">Next best action</div>
          <div className="nba__title">{nextAction.title}</div>
          <div className="nba__meta">
            About {nextAction.estimatedMinutes} minutes · you have {availableMinutes}.
            <br />
            {nextAction.reason}
          </div>
          <div className="nba__cta row">
            <button className="btn btn--beacon" style={{ flex: 1 }}>Start this step</button>
            <button className="btn btn--ghost" onClick={onAskMentor}>Ask FARO</button>
          </div>
        </div>
      )}

      {journey.recalculated && recovery.length > 0 && (
        <div className="card">
          <div className="eyebrow">Your way back</div>
          <p className="muted" style={{ margin: '6px 0 12px' }}>
            You do not need to catch everything up. Three small sessions.
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

      <div className="card">
        <div className="eyebrow">The route</div>
        <div style={{ marginTop: 'var(--space-3)' }}>
          {Object.entries(groups).map(([module, stops]) => (
            <div key={module}>
              <div className="module-head">{module}</div>
              <ul className="track">
                {stops.map((m) => (
                  <Stop key={m.id} m={m} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
