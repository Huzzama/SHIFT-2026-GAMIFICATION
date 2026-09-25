/**
 * The Journey: "Where am I going?"
 *
 * A route with checkpoints, not a game board. Missed work appears as a stop on
 * the route that is still open - never as a red overdue count - and when the
 * route has drifted, FARO recalculates it instead of declaring Game Over.
 */
import { Icon, type IconName } from '@/components/Icon'
import { RouteMap } from '@/components/RouteMap'
import { mockPresence } from '@/data/community.mock'
import { courseRoute } from '@/lib/route'
import { useStore } from '@/state/store'
import type { Dict } from '@/i18n'
import type { JourneyMilestone } from '@/types'

const fmtDue = (iso: string | null, t: Dict) => {
  if (!iso) return null
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days === 0) return t.journey.due.today
  if (days > 0) return t.journey.due.in(days)
  return t.journey.due.ago(Math.abs(days))
}

/** Route nodes from the FARO set: a checkpoint is a buoy, any other stop a ring. */
const nodeIcon = (m: JourneyMilestone): IconName => {
  const state = m.status === 'missed' ? 'upcoming' : m.status
  const cap = state.charAt(0).toUpperCase() + state.slice(1)
  return `state${m.checkpoint ? 'Checkpoint' : 'Node'}${cap}` as IconName
}

function Stop({ m, t }: { m: JourneyMilestone; t: Dict }) {
  const due = fmtDue(m.dueAt, t)
  const meta =
    m.status === 'completed'
      ? t.journey.stop.done
      : m.status === 'locked'
        ? t.journey.stop.locked
        : [`${m.estimatedMinutes} ${t.journey.stop.min}`, due].filter(Boolean).join(' · ')

  return (
    <li className={`stop stop--${m.status}${m.checkpoint ? ' stop--checkpoint' : ''}`}>
      <span className="stop__node" aria-hidden="true">
        <Icon name={nodeIcon(m)} size={24} />
      </span>
      <div className="stop__title">
        {m.title}
        {m.checkpoint && <span className="checkpoint-flag">{t.journey.stop.checkpoint}</span>}
      </div>
      <div className="stop__meta">
        {m.status === 'current' ? (
          <>
            <Icon name="stateShipSailing" size={14} className="stop__ship" /> {t.journey.stop.here} · {meta}
          </>
        ) : (
          meta
        )}
      </div>
    </li>
  )
}

export function JourneyView({
  onAskMentor,
  onOpenCommunity,
}: {
  onAskMentor: () => void
  onOpenCommunity: () => void
}) {
  const {
    t,
    journey,
    friction,
    nextAction,
    recovery,
    purpose,
    availableMinutes,
    completeMilestone,
    snapshot,
  } = useStore()

  if (!journey || !friction) return <p className="muted">{t.journey.loading}</p>

  const nextMilestone = nextAction
    ? journey.milestones.find((m) => m.id === nextAction.milestoneId)
    : undefined

  const route = courseRoute(journey, new Map((snapshot?.modules ?? []).map((m) => [m.id, m.name])))
  const mapCopy = t.journey.map

  const groups = journey.milestones.reduce<Record<string, JourneyMilestone[]>>((acc, m) => {
    const key = m.subtitle ?? journey.courseName
    ;(acc[key] ??= []).push(m)
    return acc
  }, {})

  return (
    <div className="journey">
      {/* The chart of the voyage: where am I, where am I going, and what
          happens when the route changes. */}
      <section className="card journey__map">
        <div className="row row--between">
          <div className="eyebrow">{mapCopy.eyebrow}</div>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{mapCopy.legend}</span>
        </div>
        <RouteMap
          route={route}
          labels={{
            start: mapCopy.start,
            destination: mapCopy.destination,
            destinationSub: purpose?.destination || null,
            here: mapCopy.here,
            harbor: mapCopy.harbor,
            recalculating: mapCopy.recalculating,
            recalculated: mapCopy.recalculated,
            module: mapCopy.module,
          }}
        />
      </section>

      <div className="journey__side stack">
      {journey.recalculated && (
        <div className="recalc">
          <span className="recalc__icon">
            <Icon name="recalculate" size={22} />
          </span>
          <div>
            <div className="recalc__title">{t.journey.recalc.title}</div>
            <div className="recalc__body">
              {friction.headline} {t.journey.recalc.body}
            </div>
          </div>
        </div>
      )}

      <div className="card stack">
        <div className="row row--between">
          <div className="row">
            <span className="ibadge ibadge--tile">
              <Icon name="route" size={22} />
            </span>
            <div>
              <div className="eyebrow">{t.journey.eyebrow}</div>
              <div className="h2" style={{ margin: '2px 0 0' }}>{journey.courseName}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="journey__pct">
              {journey.progressPercent}%
            </div>
            <div className="muted" style={{ fontSize: 'var(--text-xs)' }}>{t.home.ofRoute}</div>
          </div>
        </div>
        <div className="meter">
          <div className="meter__fill" style={{ width: `${journey.progressPercent}%` }} />
        </div>
        {purpose?.destination && (
          <p className="muted" style={{ margin: 0 }}>
            {t.journey.headingToward} {purpose.destination}
          </p>
        )}
      </div>

      {nextAction && (
        <div className="nba">
          <div className="nba__eyebrow">
            <Icon name="compass" size={16} /> {t.home.nba.eyebrow}
          </div>
          <div className="nba__title">{nextAction.title}</div>
          <div className="nba__meta">
            {t.home.nba.meta(nextAction.estimatedMinutes, availableMinutes)}
            <br />
            {nextAction.reason}
          </div>
          <div className="nba__cta row">
            <button
              className="btn"
              style={{ flex: 1 }}
              disabled={!nextMilestone}
              onClick={() => nextMilestone && completeMilestone(nextMilestone)}
            >
              {t.home.nba.start} <Icon name="arrow" size={16} />
            </button>
            <button className="btn btn--ghost" onClick={onAskMentor}>
              {t.home.nba.ask}
            </button>
          </div>
        </div>
      )}

      {journey.recalculated && recovery.length > 0 && (
        <div className="card">
          <div className="eyebrow">{t.journey.wayBack.eyebrow}</div>
          <p className="muted" style={{ margin: '6px 0 12px' }}>{t.journey.wayBack.body}</p>
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

      {/* One line, and deliberately one line. Journey is not a social feed;
          this only says the road is not empty. */}
      <button className="cm-signal" onClick={onOpenCommunity}>
        <span className="cm-signal__dot" aria-hidden="true" />
        {t.community.journeySignal(mockPresence.completedThisWeek)}
        <Icon name="arrow" size={14} />
      </button>

      <div className="card">
        <div className="eyebrow">{t.journey.theRoute}</div>
        <div style={{ marginTop: 'var(--space-3)' }}>
          {Object.entries(groups).map(([module, stops]) => (
            <div key={module}>
              <div className="module-head">{module}</div>
              <ul className="track">
                {stops.map((m) => (
                  <Stop key={m.id} m={m} t={t} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
