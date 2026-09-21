/**
 * Progress: what you have built, including the parts that were hard.
 *
 * Two halves on purpose. Course progress is the ordinary academic picture.
 * Resilience is the one FARO actually cares about - returning, rebuilding a
 * rhythm, holding on through a bad week. No risk score appears anywhere on
 * this screen; the internal friction state stays internal.
 *
 * Violet is the reward colour from the brand sheet — it appears here and
 * nowhere else, so an earned achievement is recognisable at a glance.
 */
import { Icon } from '@/components/Icon'
import { communityRecognitionState, evaluateCommunityAchievements } from '@/lib/community'
import { totalMinutes } from '@/lib/sessions'
import { useCommunity } from '@/state/community'
import { useStore } from '@/state/store'
import type { Achievement, CommunityAchievement, JourneyMilestone } from '@/types'

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  )
}

function Badge({ a }: { a: Achievement | CommunityAchievement }) {
  return (
    <li className={`badge${a.earned ? ' badge--earned' : ''}`}>
      <span className="badge__mark" aria-hidden="true">
        <Icon name={a.earned ? 'trophy' : 'flag'} size={18} />
      </span>
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
  onOpenProfile,
}: {
  onOpenJourney: () => void
  onEditPurpose: () => void
  onOpenProfile: () => void
}) {
  const { t, journey, friction, sessions, achievements, snapshot, purpose, awayGap } = useStore()
  const community = useCommunity()

  const recognitions = evaluateCommunityAchievements(
    communityRecognitionState(community, awayGap),
    t.community.achievements,
  )
  const communityEarned = recognitions.filter((r) => r.earned)

  if (!journey || !friction || !snapshot) return <p className="muted">{t.progress.loading}</p>

  const byModule = journey.milestones.reduce<Record<number, JourneyMilestone[]>>((acc, m) => {
    ;(acc[m.moduleId] ??= []).push(m)
    return acc
  }, {})

  const modulesDone = Object.values(byModule).filter((ms) => ms.every((m) => m.status === 'completed')).length
  const moduleCount = Object.keys(byModule).length
  const minutes = totalMinutes(sessions)
  const earned = achievements.filter((a) => a.earned)

  return (
    <div className="stack">
      <div className="card stack">
        <div className="row">
          <span className="ibadge ibadge--forest">
            <Icon name="chart" size={22} />
          </span>
          <div>
            <div className="eyebrow">{t.progress.course}</div>
            <div className="h2" style={{ margin: '2px 0 0' }}>{journey.courseName}</div>
          </div>
        </div>
        <div className="meter">
          <div className="meter__fill" style={{ width: `${journey.progressPercent}%` }} />
        </div>
        <div className="stats">
          <Stat value={`${journey.progressPercent}%`} label={t.progress.ofRoute} />
          <Stat value={`${modulesDone}/${moduleCount}`} label={t.progress.modulesDone} />
          <Stat value={`${friction.momentum}%`} label={t.progress.momentum} />
        </div>
      </div>

      <div className="card">
        <div className="eyebrow">{t.progress.modules}</div>
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
                  <div className="meter__fill" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="card">
        <div className="row row--between">
          <div className="row">
            <span className="ibadge ibadge--sm ibadge--violet">
              <Icon name="trophy" size={18} />
            </span>
            <div className="eyebrow">{t.progress.resilience.eyebrow}</div>
          </div>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            {t.progress.resilience.of(earned.length, achievements.length)}
          </span>
        </div>
        <p className="muted" style={{ margin: '10px 0 12px', lineHeight: 1.55 }}>{t.progress.resilience.body}</p>
        <ul className="badges">
          {achievements.map((a) => (
            <Badge key={a.id} a={a} />
          ))}
        </ul>
      </div>

      <div className="card">
        <div className="row row--between">
          <div className="row">
            <span className="ibadge ibadge--sm ibadge--forest">
              <Icon name="user" size={18} />
            </span>
            <div className="eyebrow">{t.progress.community.eyebrow}</div>
          </div>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            {t.progress.community.of(communityEarned.length, recognitions.length)}
          </span>
        </div>
        <p className="muted" style={{ margin: '10px 0 12px', lineHeight: 1.55 }}>{t.progress.community.body}</p>
        <ul className="badges">
          {recognitions.map((r) => (
            <Badge key={r.id} a={r} />
          ))}
        </ul>
        <button className="btn btn--ghost btn--block" style={{ marginTop: 'var(--space-3)' }} onClick={onOpenProfile}>
          {t.progress.community.viewProfile}
        </button>
      </div>

      <div className="card">
        <div className="eyebrow">{t.progress.sessions.eyebrow}</div>
        {sessions.length === 0 ? (
          <p className="muted" style={{ margin: '8px 0 0', lineHeight: 1.55 }}>{t.progress.sessions.none}</p>
        ) : (
          <>
            <div className="stats" style={{ marginTop: 'var(--space-3)' }}>
              <Stat value={String(sessions.length)} label={t.progress.sessions.count} />
              <Stat value={`${minutes} ${t.journey.stop.min}`} label={t.progress.sessions.time} />
            </div>
            <ul className="sessions">
              {[...sessions].reverse().map((s) => (
                <li key={s.id}>
                  <span className="sessions__title">{s.title}</span>
                  <span className="sessions__time">{s.minutes} {t.journey.stop.min}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {purpose?.destination && (
        <button className="destination destination--button" onClick={onEditPurpose}>
          <div className="destination__label">{t.progress.destination.label}</div>
          <div className="destination__value">{purpose.destination}</div>
          <div className="destination__quote">{t.progress.destination.body}</div>
        </button>
      )}

      <button className="btn btn--ghost btn--block" onClick={onOpenJourney}>
        {t.progress.fullRoute}
      </button>
    </div>
  )
}
