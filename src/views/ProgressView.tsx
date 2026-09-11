/**
 * Progress: what you have built, including the parts that were hard.
 *
 * Two halves on purpose. Course progress is the ordinary academic picture.
 * Resilience is the one FARO actually cares about - returning, rebuilding a
 * rhythm, holding on through a bad week. No risk score appears anywhere on
 * this screen; the internal friction state stays internal.
 */
import { useStore } from '@/state/store'
import { totalMinutes } from '@/lib/sessions'
import type { Achievement, JourneyMilestone } from '@/types'

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  )
}

function Badge({ a }: { a: Achievement }) {
  return (
    <li className={`badge${a.earned ? ' badge--earned' : ''}`}>
      <span className="badge__mark" aria-hidden="true" />
      <div>
        <div className="badge__title">{a.title}</div>
        <div className="badge__body">{a.earned ? a.description : a.hint}</div>
      </div>
    </li>
  )
}

export function ProgressView({
  onOpenJourney,
  onEditPurpose,
}: {
  onOpenJourney: () => void
  onEditPurpose: () => void
}) {
  const { journey, friction, sessions, achievements, snapshot, purpose } = useStore()

  if (!journey || !friction || !snapshot) return <p className="muted">Loading…</p>

  const byModule = journey.milestones.reduce<Record<number, JourneyMilestone[]>>(
    (acc, m) => {
      ;(acc[m.moduleId] ??= []).push(m)
      return acc
    },
    {},
  )

  const modulesDone = Object.values(byModule).filter((ms) =>
    ms.every((m) => m.status === 'completed'),
  ).length
  const moduleCount = Object.keys(byModule).length
  const minutes = totalMinutes(sessions)
  const earned = achievements.filter((a) => a.earned)

  return (
    <div className="stack">
      <div className="card stack">
        <div>
          <div className="eyebrow">Course progress</div>
          <div className="h2" style={{ margin: '6px 0 0' }}>{journey.courseName}</div>
        </div>
        <div className="meter">
          <div className="meter__fill" style={{ width: `${journey.progressPercent}%` }} />
        </div>
        <div className="stats">
          <Stat value={`${journey.progressPercent}%`} label="of the route" />
          <Stat value={`${modulesDone}/${moduleCount}`} label="modules done" />
          <Stat value={`${friction.momentum}%`} label="momentum" />
        </div>
      </div>

      <div className="card">
        <div className="eyebrow">Modules</div>
        <ul className="modules">
          {snapshot.modules.map((mod) => {
            const stops = byModule[mod.id] ?? []
            const done = stops.filter((s) => s.status === 'completed').length
            const pct = stops.length ? Math.round((done / stops.length) * 100) : 0
            return (
              <li key={mod.id} className="module-row">
                <div className="module-row__head">
                  <span className="module-row__name">{mod.name}</span>
                  <span className="module-row__count">
                    {done}/{stops.length || mod.items_count}
                  </span>
                </div>
                <div className="meter meter--thin">
                  <div
                    className={`meter__fill${pct === 100 ? ' meter__fill--moss' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="card">
        <div className="row row--between">
          <div className="eyebrow">Resilience</div>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            {earned.length} of {achievements.length}
          </span>
        </div>
        <p className="muted" style={{ margin: '6px 0 12px', lineHeight: 1.55 }}>
          These are not for finishing work on time. They are for continuing when
          it would have been easier to stop.
        </p>
        <ul className="badges">
          {achievements.map((a) => (
            <Badge key={a.id} a={a} />
          ))}
        </ul>
      </div>

      <div className="card">
        <div className="eyebrow">Study sessions in FARO</div>
        {sessions.length === 0 ? (
          <p className="muted" style={{ margin: '8px 0 0', lineHeight: 1.55 }}>
            Nothing recorded yet. FARO counts the sessions you do from here, so
            this fills up as you go — starting with one step.
          </p>
        ) : (
          <>
            <div className="stats" style={{ marginTop: 'var(--space-3)' }}>
              <Stat value={String(sessions.length)} label="sessions" />
              <Stat value={`${minutes} min`} label="time invested" />
            </div>
            <ul className="sessions">
              {[...sessions].reverse().map((s) => (
                <li key={s.id}>
                  <span className="sessions__title">{s.title}</span>
                  <span className="sessions__time">{s.minutes} min</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {purpose?.destination && (
        <button className="destination destination--button" onClick={onEditPurpose}>
          <div className="destination__label">Your destination</div>
          <div className="destination__value">{purpose.destination}</div>
          <div className="destination__quote">
            Every session above is a step toward this, including the ones that came
            after a gap. Tap to change where you are heading.
          </div>
        </button>
      )}

      <button className="btn btn--ghost btn--block" onClick={onOpenJourney}>
        See the full route
      </button>
    </div>
  )
}
