/**
 * Home: "Where am I and what should I do next?"
 *
 * The order is the answer, top to bottom: why (your horizon), what now (one
 * next step, with the compass), how it is going (two numbers: momentum and
 * route), what FARO thinks about today (one sentence), where you are on the
 * course (module N of M, destination in sight), and where to get help (SOS,
 * a study room). There is exactly one recommended step, never a list of what
 * is pending.
 *
 * One DOM, two shapes: a single column in the side panel, two columns when
 * the page is wide (see `.home` in views.css). The icons are FARO's own
 * language (components/faroGlyphs.tsx), each used for one meaning only.
 */
import { Icon } from '@/components/Icon'
import { ModuleTrail } from '@/components/ModuleTrail'
import { SOSPanel } from '@/components/CommunityBits'
import { useMemo, useState } from 'react'
import { mockPresence } from '@/data/community.mock'
import { sosRouting } from '@/lib/community'
import { courseRoute } from '@/lib/route'
import { activeDays } from '@/lib/rhythm'
import { buildTimeSession, sessionMinutes, sessionRules } from '@/lib/timeSession'
import { useStore } from '@/state/store'
import type { LifeState, SosNeed } from '@/types'

const TIME_OPTIONS = [5, 10, 20, sessionRules.OPEN_ENDED_MINUTES] as const

const hour = () => new Date().getHours()

export function DashboardView({
  onAskMentor,
  onOpenRecovery,
  onOpenJourney,
  onOpenPurpose,
  onOpenCommunity,
}: {
  onAskMentor: () => void
  onOpenRecovery: (state?: LifeState) => void
  onOpenJourney: () => void
  /** Kept for the App's call site; Progress is one tab away. */
  onOpenProgress?: () => void
  onOpenPurpose: () => void
  onOpenCommunity: () => void
}) {
  const {
    t,
    journey,
    friction,
    nextAction,
    purpose,
    availableMinutes,
    sessions,
    snapshot,
    paused,

    completeMilestone,
    setAvailableMinutes,
    reviewOffered,
    week,
    weekPlan,
    setWeekPlan,
  } = useStore()
  const [picked, setPicked] = useState<number | null>(null)
  const [sosOpen, setSosOpen] = useState(false)
  const moduleNames = useMemo(
    () => new Map((snapshot?.modules ?? []).map((m) => [m.id, m.name])),
    [snapshot],
  )

  if (!journey || !friction || !snapshot) return <p className="muted">{t.shell.loading}</p>

  const h = hour()
  const greeting =
    h < 12 ? t.home.greeting.morning : h < 19 ? t.home.greeting.afternoon : t.home.greeting.evening

  const milestone = nextAction
    ? journey.milestones.find((m) => m.id === nextAction.milestoneId)
    : undefined

  const needsAttention = friction.state !== 'FLOWING' && friction.state !== 'RECOVERY'
  const returning = friction.state === 'RECOVERY'
  const daysThisWeek = activeDays(week)
  const route = courseRoute(journey, moduleNames)

  // The horizon is the student's own words when they wrote some; the goal
  // they picked is the fallback, never a slogan of ours.
  const goalLabel = purpose ? t.purpose.goals[purpose.goal] : null
  const horizonTitle = purpose?.destination?.trim() || goalLabel || t.home.horizon.empty
  const horizonSub = purpose?.destination?.trim() && goalLabel ? goalLabel : null

  // One sentence from FARO about today, from the same numbers as the rest.
  const nextMin = nextAction?.estimatedMinutes ?? 0
  const faroLine = !nextAction
    ? t.home.says.done
    : returning
      ? t.home.says.returning(Math.min(10, nextMin))
      : nextMin <= availableMinutes
        ? t.home.says.fits(availableMinutes)
        : t.home.says.longer(nextMin, availableMinutes)

  const chooseSos = (need: SosNeed) => {
    setSosOpen(false)
    const target = sosRouting[need]
    if (target === 'mentor') return onAskMentor()
    if (target === 'recovery') return onOpenRecovery()
    onOpenCommunity()
  }

  const tp = t.home.timePicker
  const session = picked ? buildTimeSession(journey, picked, { reviewAvailable: reviewOffered }) : []
  const doneIds = new Set(journey.milestones.filter((m) => m.status === 'completed').map((m) => m.id))
  const startFirst = () => {
    const first = session[0]
    if (!first) return
    if (first.kind === 'review') onOpenRecovery()
    else completeMilestone(first.milestone, first.minutes)
  }

  if (paused) {
    return (
      <div className="stack">
        <div className="harbor">
          <div className="harbor__label">{t.home.harbor.label}</div>
          <div className="harbor__title">{t.home.harbor.title}</div>
          <p className="harbor__body">{t.home.harbor.body}</p>
          <button className="btn btn--beacon btn--block" onClick={() => onOpenRecovery('ready')}>
            {t.home.harbor.cta}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="home">
      {/* Horizon: why this journey. The student's own destination, first. */}
      <button className="horizon home__horizon" onClick={onOpenPurpose}>
        <span className="horizon__mark" aria-hidden="true">
          <Icon name="horizon" size={30} />
        </span>
        <span className="horizon__text">
          <span className="horizon__eyebrow">{t.home.horizon.eyebrow}</span>
          <span className="horizon__title">{horizonTitle}</span>
          {horizonSub && <span className="horizon__sub">{horizonSub}</span>}
        </span>
        <span className="horizon__greet">{greeting}</span>
      </button>

      {/* Welcome back / attention: the door to Recovery, never a backlog. */}
      {(returning || needsAttention) && (
        <button
          className={`banner home__banner${returning ? ' banner--welcome' : ''}`}
          onClick={() => onOpenRecovery()}
        >
          <span className="banner__row">
            <Icon name={returning ? 'safeHarbor' : 'recalculate'} size={22} />
            <span>
              <span className="banner__title">{returning ? t.home.welcomeBack.title : friction.headline}</span>
              <span className="banner__body">{returning ? t.home.welcomeBack.body : t.home.attention.body}</span>
            </span>
          </span>
          <span className="banner__cta">
            {returning ? t.home.welcomeBack.cta : t.home.attention.cta} <Icon name="arrow" size={16} />
          </span>
        </button>
      )}

      <div className="home__col home__col--main">
        {/* Next best action: one direction, not a list. */}
        {nextAction && milestone ? (
          <section className="nba nba--compass home__nba">
            <span className="nba__compass" aria-hidden="true">
              <Icon name="compass" size={30} />
            </span>
            <div className="nba__content">
              <div className="nba__eyebrow">{t.home.nba.eyebrow}</div>
              <div className="nba__title">{nextAction.title}</div>
              <div className="nba__meta">
                {t.home.nba.minutes(nextAction.estimatedMinutes)} · {nextAction.reason}
              </div>
              <div className="nba__cta row">
                <button className="btn" style={{ flex: 1 }} onClick={() => completeMilestone(milestone)}>
                  {t.home.nba.start} <Icon name="arrow" size={16} />
                </button>
                <button className="btn btn--ghost" onClick={onAskMentor}>
                  {t.home.nba.ask}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="card home__nba">
            <div className="eyebrow">{t.home.nba.eyebrow}</div>
            <p style={{ margin: '8px 0 0' }}>{t.home.nba.empty}</p>
          </section>
        )}

        {/* The route in modules: where am I, and the destination still there. */}
        <button className="card trail home__trail" onClick={onOpenJourney}>
          <span className="trail__head">
            <span className="trail__title">
              {route.finished ? t.home.trail.finished : t.home.trail.title(route.position + 1, route.modules.length)}
            </span>
            <span className="trail__course">{journey.courseName}</span>
          </span>
          <ModuleTrail route={route} destinationLabel={t.home.trail.destination} />
        </button>

        {/* How much time do you have? ----------------------------------------- */}
        <section className="timepick home__time">
          <div className="timepick__title">
            <Icon name="clock" size={18} /> {tp.title}
          </div>
          <div className="timepick__options" role="group" aria-label={tp.title}>
            {TIME_OPTIONS.map((m) => (
              <button
                key={m}
                className={`timepick__opt${picked === m ? ' timepick__opt--on' : ''}`}
                aria-pressed={picked === m}
                onClick={() => {
                  setPicked(m)
                  setAvailableMinutes(m)
                }}
              >
                {m === sessionRules.OPEN_ENDED_MINUTES ? tp.open : tp.option(m)}
              </button>
            ))}
          </div>
          {picked !== null &&
            (session.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>{tp.empty}</p>
            ) : (
              <div className="timepick__session">
                <div className="timepick__head">{tp.session(sessionMinutes(session))}</div>
                <ol className="timepick__list">
                  {session.map((item, i) => (
                    <li key={i}>
                      <span>
                        {item.kind === 'review'
                          ? tp.review
                          : item.kind === 'partial'
                            ? `${item.milestone.title} — ${tp.partial(item.minutes)}`
                            : item.milestone.title}
                      </span>
                      <span className="timepick__min">{item.minutes} min</span>
                    </li>
                  ))}
                </ol>
                <button className="btn btn--block" onClick={startFirst}>
                  {tp.start} <Icon name="arrow" size={16} />
                </button>
              </div>
            ))}
        </section>

        {/* A plan accepted in the mentor ---------------------------------------- */}
        {weekPlan && (
          <section className="card weekplan">
            <div className="row row--between">
              <div className="eyebrow">
                <Icon name="calendar" size={14} /> {t.home.weekPlan.eyebrow}
              </div>
              <button className="section__link" onClick={() => setWeekPlan(null)}>
                {t.home.weekPlan.clear}
              </button>
            </div>
            {weekPlan.days
              .filter((d) => d.items.length > 0)
              .map((d) => (
                <div key={d.label} className="weekplan__day">
                  <div className="weekplan__label">
                    {d.label} · {d.minutes} min
                  </div>
                  <ul>
                    {d.items.map((it) => (
                      <li key={it.milestoneId} className={doneIds.has(it.milestoneId) ? 'weekplan__item--done' : ''}>
                        {it.title} <span className="muted">· {it.minutes} min</span>
                        {doneIds.has(it.milestoneId) && <span className="weekplan__done"> · {t.home.weekPlan.done}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </section>
        )}
      </div>

      <div className="home__col home__col--side">
        {/* Two numbers, no more: connection and distance travelled. */}
        <div className="home__stats">
          <button className="stat-mini" onClick={() => onOpenRecovery()}>
            <Icon name="rhythm" size={26} />
            <span className="stat-mini__text">
              <span className="stat-mini__value">{friction.momentum}%</span>
              <span className="stat-mini__label">{t.home.stats.momentum}</span>
              <span className="stat-mini__sub">{t.home.stats.rhythm(daysThisWeek)}</span>
            </span>
          </button>
          <button className="stat-mini" onClick={onOpenJourney}>
            <Icon name="route" size={26} />
            <span className="stat-mini__text">
              <span className="stat-mini__value">{journey.progressPercent}%</span>
              <span className="stat-mini__label">{t.home.stats.route}</span>
              <span className="stat-mini__sub">{t.home.stats.modules(route.modules.filter((m) => m.state === 'completed').length, route.modules.length)}</span>
            </span>
          </button>
        </div>

        {/* FARO, in one sentence, about today. */}
        <button className="faro-says home__says" onClick={onAskMentor}>
          <Icon name="lighthouse" size={26} />
          <span className="faro-says__text">“{faroLine}”</span>
        </button>

        {/* Help without a new section: SOS routes to the right place. */}
        {sosOpen ? (
          <div className="home__support">
            <SOSPanel t={t} onChoose={chooseSos} onCancel={() => setSosOpen(false)} />
          </div>
        ) : (
          <div className="home__support quick">
            <button className="quick__btn" onClick={() => setSosOpen(true)}>
              <Icon name="lifeBuoy" size={22} />
              <span className="quick__text">
                <span className="quick__title">{t.home.support.sos}</span>
                <span className="quick__sub">{t.home.support.sosSub}</span>
              </span>
            </button>
            <button className="quick__btn" onClick={onOpenCommunity}>
              <Icon name="fleet" size={22} />
              <span className="quick__text">
                <span className="quick__title">{t.home.support.room}</span>
                <span className="quick__sub">{t.home.support.roomSub(mockPresence.studyingNow)}</span>
              </span>
            </button>
          </div>
        )}

        {/* This visit ----------------------------------------------------------- */}
        <div className="card home__visit">
          <div className="eyebrow">{t.home.visit.eyebrow}</div>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            {sessions.length === 0 ? t.home.visit.none : t.home.visit.some(sessions.length)}
          </p>
          <div className="row" style={{ marginTop: 'var(--space-4)' }}>
            <button className="btn btn--ghost" style={{ flex: 1 }} onClick={onOpenJourney}>
              {t.home.visit.seeRoute}
            </button>
            <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => onOpenRecovery()}>
              {t.home.visit.lifeHappened}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
