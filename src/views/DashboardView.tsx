/**
 * Home: "Where am I and what should I do next?"
 *
 * Laid out like the brand sheet — hero, course card, three tinted stats, the
 * four pillars, the effort banner — but every card carries FARO's logic:
 * momentum instead of a streak, resilience achievements instead of points,
 * the mentor where the mockup had "Comunidad". There is exactly one
 * recommended step, never a list of what is pending.
 */
import { CourseCard, PillarCard, StatCard } from '@/components/Cards'
import { HeroArt } from '@/components/HeroArt'
import { Icon } from '@/components/Icon'
import { Wordmark } from '@/components/Wordmark'
import { useState } from 'react'
import { mockPresence } from '@/data/community.mock'
import { activeDays } from '@/lib/rhythm'
import { buildTimeSession, sessionMinutes, sessionRules } from '@/lib/timeSession'
import { useStore } from '@/state/store'
import type { LifeState } from '@/types'

const TIME_OPTIONS = [5, 10, 20, sessionRules.OPEN_ENDED_MINUTES] as const

const hour = () => new Date().getHours()

export function DashboardView({
  onAskMentor,
  onOpenRecovery,
  onOpenJourney,
  onOpenProgress,
  onOpenPurpose,
  onOpenCommunity,
}: {
  onAskMentor: () => void
  onOpenRecovery: (state?: LifeState) => void
  onOpenJourney: () => void
  onOpenProgress: () => void
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
    achievements,
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

  if (!journey || !friction || !snapshot) return <p className="muted">{t.shell.loading}</p>

  const h = hour()
  const greeting =
    h < 12 ? t.home.greeting.morning : h < 19 ? t.home.greeting.afternoon : t.home.greeting.evening

  const milestone = nextAction
    ? journey.milestones.find((m) => m.id === nextAction.milestoneId)
    : undefined

  const needsAttention = friction.state !== 'FLOWING' && friction.state !== 'RECOVERY'
  const returning = friction.state === 'RECOVERY'
  const earned = achievements.filter((a) => a.earned).length
  const momentumWord =
    friction.momentum >= 65
      ? t.home.momentumCard.strong
      : friction.momentum >= 40
        ? t.home.momentumCard.building
        : t.home.momentumCard.low
  const daysThisWeek = activeDays(week)
  const rhythmSub = daysThisWeek > 0 ? t.home.rhythmCard.weekSub : t.home.rhythmCard.waiting

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
    <div className="stack">
      {/* Hero ------------------------------------------------------------- */}
      <section className="hero">
        <HeroArt className="hero__art" />
        <div className="hero__brand">
          <Wordmark size={24} taglineText={t.shell.tagline} />
        </div>
        <div className="hero__greet">{greeting} 👋</div>
        <p className="hero__sub">{t.home.heroSub}</p>
        <button className="hero__panel" onClick={onOpenJourney}>
          <span className="ibadge ibadge--mint">
            <Icon name="target" size={22} />
          </span>
          <div className="hero__panel-text">
            <div className="hero__panel-label">{t.home.yourRoute}</div>
            <div className="hero__panel-title">{journey.courseName}</div>
            <div className="hero__panel-meter">
              <span className="meter meter--onDark">
                <span className="meter__fill" style={{ width: `${journey.progressPercent}%` }} />
              </span>
              <span className="hero__pct">{journey.progressPercent}% {t.home.ofRoute}</span>
            </div>
          </div>
          <span className="effort__go">
            <Icon name="chevron" size={18} />
          </span>
        </button>
      </section>

      {/* Welcome back / attention ----------------------------------------- */}
      {returning && (
        <button className="banner banner--welcome" onClick={() => onOpenRecovery()}>
          <div className="banner__title">{t.home.welcomeBack.title}</div>
          <div className="banner__body">{t.home.welcomeBack.body}</div>
          <span className="banner__cta">
            {t.home.welcomeBack.cta} <Icon name="arrow" size={16} />
          </span>
        </button>
      )}
      {needsAttention && !returning && (
        <button className="banner" onClick={() => onOpenRecovery()}>
          <div className="banner__title">{friction.headline}</div>
          <div className="banner__body">{t.home.attention.body}</div>
          <span className="banner__cta">
            {t.home.attention.cta} <Icon name="arrow" size={16} />
          </span>
        </button>
      )}

      {/* Next best action --------------------------------------------------- */}
      {nextAction && milestone ? (
        <div className="nba">
          <div className="nba__eyebrow">
            <Icon name="flag" size={14} /> {t.home.nba.eyebrow}
          </div>
          <div className="nba__title">{nextAction.title}</div>
          <div className="nba__meta">
            {t.home.nba.meta(nextAction.estimatedMinutes, availableMinutes)}
            <br />
            {nextAction.reason}
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
      ) : (
        <div className="card">
          <div className="eyebrow">{t.home.nba.eyebrow}</div>
          <p style={{ margin: '8px 0 0' }}>{t.home.nba.empty}</p>
        </div>
      )}

      {/* How much time do you have? ------------------------------------------ */}
      <section className="timepick">
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

      {/* A plan accepted in the mentor ------------------------------------------ */}
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

      {/* Community — contextual, and only when there is someone to find ------ */}
      {mockPresence.studyingNow > 0 && (
        <button className="cm-homecard" onClick={onOpenCommunity}>
          <span className="cm-homecard__dot" aria-hidden="true" />
          <span className="cm-homecard__text">
            <span className="cm-homecard__label">{t.community.homeCard.label}</span>
            <span className="cm-homecard__body">
              {t.community.homeCard.studying(mockPresence.studyingNow, journey.courseName)}
            </span>
          </span>
          <span className="cm-homecard__cta">
            {t.community.homeCard.cta} <Icon name="arrow" size={16} />
          </span>
        </button>
      )}

      {/* Pillars ------------------------------------------------------------ */}
      <div className="grid-2 grid-2--wide">
        <PillarCard tone="mint" icon="target" title={t.pillars.focus.title} body={t.pillars.focus.body} onClick={onOpenPurpose} />
        <PillarCard tone="orange" icon="trend" title={t.pillars.advance.title} body={t.pillars.advance.body} onClick={onOpenJourney} />
        <PillarCard tone="violet" icon="gift" title={t.pillars.reward.title} body={t.pillars.reward.body} onClick={onOpenProgress} />
        <PillarCard tone="forest" icon="user" title={t.pillars.own.title} body={t.pillars.own.body} onClick={onAskMentor} />
      </div>

      {/* My courses ---------------------------------------------------------- */}
      <div className="section">
        <div className="section__title">
          <Icon name="book" size={22} /> {t.home.myCourses}
        </div>
        <button className="section__link" onClick={onOpenJourney}>
          {t.home.visit.seeRoute} <Icon name="arrow" size={16} />
        </button>
      </div>
      <CourseCard
        category={snapshot.course.course_code}
        title={journey.courseName}
        progressLabel={t.home.courseProgress}
        percent={journey.progressPercent}
        onClick={onOpenJourney}
      />

      {/* Stats: achievements · momentum · rhythm · mentor ---------------------- */}
      <div className="grid-2 grid-2--wide">
        <StatCard
          tone="violet"
          icon="trophy"
          eyebrow={t.home.achievementsCard.label}
          value={t.home.achievementsCard.earned(earned)}
          sub={t.home.achievementsCard.sub}
          onClick={onOpenProgress}
        />
        <StatCard
          tone="orange"
          icon="wave"
          eyebrow={t.home.momentumCard.label}
          value={`${friction.momentum}%`}
          sub={momentumWord}
          onClick={() => onOpenRecovery()}
        />
        <StatCard
          tone="mint"
          icon="clock"
          eyebrow={t.home.rhythmCard.label}
          value={daysThisWeek > 0 ? t.home.rhythmCard.week(daysThisWeek) : '—'}
          sub={rhythmSub}
          onClick={onOpenProgress}
        />
        <StatCard
          tone="forest"
          icon="lighthouse"
          eyebrow={t.home.mentorCard.label}
          value={t.home.mentorCard.title}
          sub={t.home.mentorCard.sub}
          onClick={onAskMentor}
        />
      </div>

      {/* Effort banner -------------------------------------------------------- */}
      <button className="effort" onClick={onOpenPurpose}>
        <HeroArt className="effort__art" />
        <div className="effort__text">
          <div className="effort__title">{t.home.effort.title}</div>
          <div className="effort__body">
            {purpose?.destination ? t.home.effort.bodyWithDest(purpose.destination) : t.home.effort.body}
          </div>
        </div>
        <span className="effort__go">
          <Icon name="arrow" size={18} />
        </span>
      </button>

      {/* This visit ------------------------------------------------------------ */}
      <div className="card">
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
  )
}
