/**
 * Home: "Where am I and what should I do next?"
 *
 * The whole screen is built to answer that in one look and then get out of the
 * way. There is exactly one recommended step, never a list of what is pending -
 * decision fatigue is part of the friction FARO exists to remove.
 */
import { useStore } from '@/state/store'
import type { LifeState } from '@/types'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 19) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardView({
  onAskMentor,
  onOpenRecovery,
  onOpenJourney,
}: {
  onAskMentor: () => void
  onOpenRecovery: (state?: LifeState) => void
  onOpenJourney: () => void
}) {
  const {
    journey,
    friction,
    nextAction,
    purpose,
    availableMinutes,
    sessions,
    paused,
    completeMilestone,
  } = useStore()

  if (!journey || !friction) return <p className="muted">Finding your position…</p>

  const milestone = nextAction
    ? journey.milestones.find((m) => m.id === nextAction.milestoneId)
    : undefined

  const needsAttention =
    friction.state !== 'FLOWING' && friction.state !== 'RECOVERY'
  const returning = friction.state === 'RECOVERY'

  if (paused) {
    return (
      <div className="stack">
        <div className="harbor">
          <div className="harbor__label">Safe harbor</div>
          <div className="harbor__title">You are on a planned pause.</div>
          <p className="harbor__body">
            Your progress is exactly where you left it. Nothing is expiring inside
            FARO, and there is no streak to lose. Come back when you are ready and
            the route will be waiting.
          </p>
          <button className="btn btn--beacon btn--block" onClick={() => onOpenRecovery('ready')}>
            I'm ready to continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="hero">
        <div className="hero__greet">{greeting()}</div>
        <div className="hero__course">{journey.courseName}</div>
        <div className="hero__meter">
          <div className="meter">
            <div className="meter__fill" style={{ width: `${journey.progressPercent}%` }} />
          </div>
          <div className="hero__stats">
            <span>{journey.progressPercent}% of the route</span>
            <span>{friction.momentum}% momentum</span>
          </div>
        </div>
        {purpose?.destination && (
          <div className="hero__dest">
            <span className="hero__dest-label">Heading toward</span>
            {purpose.destination}
          </div>
        )}
      </div>

      {returning && (
        <button className="banner banner--welcome" onClick={() => onOpenRecovery()}>
          <div className="banner__title">Welcome back.</div>
          <div className="banner__body">
            Your progress is still here. Let us find a way back in that fits your
            week — no catching up required.
          </div>
          <span className="banner__cta">Recalculate my route →</span>
        </button>
      )}

      {needsAttention && !returning && (
        <button className="banner" onClick={() => onOpenRecovery()}>
          <div className="banner__title">{friction.headline}</div>
          <div className="banner__body">
            If something got in the way this week, tell FARO and the plan changes.
          </div>
          <span className="banner__cta">Life happened →</span>
        </button>
      )}

      {nextAction && milestone ? (
        <div className="nba">
          <div className="nba__eyebrow">Next best action</div>
          <div className="nba__title">{nextAction.title}</div>
          <div className="nba__meta">
            About {nextAction.estimatedMinutes} minutes · you told us you have{' '}
            {availableMinutes}.
            <br />
            {nextAction.reason}
          </div>
          <div className="nba__cta row">
            <button
              className="btn btn--beacon"
              style={{ flex: 1 }}
              onClick={() => completeMilestone(milestone)}
            >
              Start this step
            </button>
            <button className="btn btn--ghost" onClick={onAskMentor}>
              Ask FARO
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="eyebrow">Next best action</div>
          <p style={{ margin: '8px 0 0' }}>
            Nothing is waiting for you right now. You have reached the end of the
            route.
          </p>
        </div>
      )}

      <div className="card">
        <div className="row row--between">
          <div>
            <div className="eyebrow">This visit</div>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              {sessions.length === 0
                ? 'Nothing completed yet — one step is enough.'
                : `${sessions.length} step${sessions.length === 1 ? '' : 's'} completed. That is how momentum comes back.`}
            </p>
          </div>
        </div>
        <div className="row" style={{ marginTop: 'var(--space-4)' }}>
          <button className="btn btn--ghost" style={{ flex: 1 }} onClick={onOpenJourney}>
            See the route
          </button>
          <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => onOpenRecovery()}>
            Life happened
          </button>
        </div>
      </div>
    </div>
  )
}
