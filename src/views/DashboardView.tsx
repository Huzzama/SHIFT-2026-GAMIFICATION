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
import { useStore } from '@/state/store'
import type { LifeState } from '@/types'

const hour = () => new Date().getHours()

export function DashboardView({
  onAskMentor,
  onOpenRecovery,
  onOpenJourney,
  onOpenProgress,
  onOpenPurpose,
}: {
  onAskMentor: () => void
  onOpenRecovery: (state?: LifeState) => void
  onOpenJourney: () => void
  onOpenProgress: () => void
  onOpenPurpose: () => void
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
    rhythmDays,
    completeMilestone,
  } = useStore()

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
  const rhythmSub = rhythmDays > 0 ? t.home.rhythmCard.active(rhythmDays) : t.home.rhythmCard.waiting

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
          value={rhythmDays > 0 ? String(rhythmDays) : '—'}
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
