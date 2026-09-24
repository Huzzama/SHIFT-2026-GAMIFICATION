/**
 * Your Impact (the Rewards tab) - what the effort was, then what it unlocks.
 *
 * FARO does not pretend to be a payment system: it counts FARO Points, and
 * the reward is framed as TecmiRewards, whose equivalence, eligibility and
 * redemption belong to Tecmilenio. The prototype only shows the flow.
 *
 * Top to bottom:
 *
 *   1. Your effort: the semester's FARO Points, counting up, and what they
 *      stand for — activities, modules, a comeback, this week's rhythm.
 *   2. The next reward: one track to $200 MXN, with the $50 and $100 tiers
 *      marked on it, how far is left, and what finishing this course is
 *      worth - so the reward always points back at the course.
 *   3. The catalog: three tiers, unlocked (not bought) by points. Redeeming
 *      closes the semester's reward at that tier, and the confirmation says
 *      so before it happens.
 *   4. Where every point came from, including the semester's earlier
 *      courses, labelled as simulated.
 *
 * All amounts and the redemption are simulated in the prototype; the screen
 * says so twice (the badge, and the footer). See `lib/rewards.ts`.
 */
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { useCountUp } from '@/components/useCountUp'
import { activeDays } from '@/lib/rhythm'
import { useStore } from '@/state/store'
import { previousCourses, semesterLabel } from '@/data/rewards.mock'
import { canRedeem, remainingCoursePoints, rewardsConfig, rewardTiers } from '@/lib/rewards'
import type { RewardTier } from '@/types'

export function RewardsView({ onOpenJourney }: { onOpenJourney: () => void }) {
  const { t, lang, points, semester, journey, redeem, week } = useStore()
  const r = t.rewards
  const [confirm, setConfirm] = useState<RewardTier | null>(null)

  const shownTotal = useCountUp(semester.total, 900, Math.max(0, semester.total - points.thisWeek))
  const courseName = journey?.courseName ?? ''
  const remaining = remainingCoursePoints(journey)
  const goalTier = rewardTiers[rewardTiers.length - 1]
  const goalReached = semester.total >= goalTier.points
  const fmt = (n: number) => n.toLocaleString(lang === 'es' ? 'es-MX' : 'en-US')

  const prevActivities = previousCourses.reduce((s, c) => s + c.activities, 0)
  const prevModules = previousCourses.reduce((s, c) => s + c.modules, 0)
  const daysThisWeek = activeDays(week)
  const impact = [
    r.impact.activities(points.activityCount + prevActivities),
    r.impact.modules(points.moduleCount + prevModules),
    ...(points.comebackEarned ? [r.impact.comeback] : []),
    ...(points.reviewSets > 0 ? [r.impact.reviews(points.reviewSets)] : []),
    ...(daysThisWeek > 0 ? [r.impact.week(daysThisWeek)] : []),
  ]

  const doRedeem = (tier: RewardTier) => {
    redeem(tier)
    setConfirm(null)
  }

  return (
    <div className="stack">
      {/* 1 — Balance */}
      <section className="rw-hero">
        <div className="rw-hero__top">
          <span className="rw-hero__eyebrow">{r.balance}</span>
          <span className="rw-tag">{r.simulated}</span>
        </div>
        <div className="rw-hero__value">{fmt(shownTotal)}</div>
        <div className="rw-hero__label">{r.points}</div>
        <div className="rw-hero__sub">
          {semesterLabel[lang]}
          {points.thisWeek > 0 && <span className="rw-hero__week">{r.thisWeek(points.thisWeek)}</span>}
        </div>
        <div className="rw-impact">
          <div className="rw-impact__lead">{r.impact.lead}</div>
          <ul>
            {impact.map((line) => (
              <li key={line}>
                <Icon name="check" size={16} /> {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2 — Next reward (or the one already redeemed) */}
      {semester.redemption ? (
        <section className="rw-next rw-next--redeemed">
          <div className="rw-next__eyebrow">
            <Icon name="check" size={14} /> {r.catalog.redeemed}
          </div>
          <div className="rw-next__reward">{r.redeemedCard.title(semester.redemption.mxn)}</div>
          <p className="rw-next__body">{r.redeemedCard.body}</p>
        </section>
      ) : goalReached ? (
        <section className="rw-next rw-next--unlocked">
          <div className="rw-next__burst" aria-hidden="true">
            <Icon name="gift" size={30} />
          </div>
          <div className="rw-next__eyebrow">{r.next.reachedEyebrow}</div>
          <div className="rw-next__reward">{r.next.reachedTitle}</div>
          <p className="rw-next__body">{r.next.reachedBody(goalTier.mxn)}</p>
          <button className="btn btn--beacon btn--block" onClick={() => setConfirm(goalTier)}>
            {r.catalog.redeem} {r.next.reward(goalTier.mxn)} <Icon name="arrow" size={16} />
          </button>
        </section>
      ) : (
        <section className="rw-next">
          <div className="rw-next__eyebrow">{r.next.eyebrow}</div>
          <div className="rw-next__reward">
            {r.next.reward(goalTier.mxn)} <span className="rw-program">{r.next.program}</span>
          </div>
          <div className="rw-next__of">{r.next.of(semester.total, semester.goal)}</div>

          <div className="rw-track" role="img" aria-label={r.next.percent(semester.percent)}>
            <div className="rw-track__fill" style={{ width: `${semester.percent}%` }} />
            {rewardTiers.slice(0, -1).map((tier) => (
              <span
                key={tier.id}
                className={`rw-track__mark${semester.total >= tier.points ? ' rw-track__mark--on' : ''}`}
                style={{ left: `${(tier.points / rewardsConfig.SEMESTER_GOAL) * 100}%` }}
              >
                <span className="rw-track__label">${tier.mxn}</span>
              </span>
            ))}
          </div>

          <div className="rw-next__percent">{r.next.percent(semester.percent)}</div>
          <p className="rw-next__body">
            {r.next.toNext(goalTier.points - semester.total)}.{' '}
            {remaining > 0 && courseName && r.next.finishCourse(remaining, courseName)}
          </p>
          <button className="btn btn--beacon btn--block" onClick={onOpenJourney}>
            {r.next.keep} <Icon name="arrow" size={16} />
          </button>
        </section>
      )}

      {/* 3 — Catalog: tiers on one track, unlocked by points */}
      <section className="card">
        <div className="eyebrow">{r.catalog.eyebrow}</div>
        <p className="muted" style={{ margin: '6px 0 12px', lineHeight: 1.55 }}>{r.catalog.body}</p>
        <ul className="rw-tiers">
          {rewardTiers.map((tier) => {
            const reached = semester.total >= tier.points
            const redeemedThis = semester.redemption?.tierId === tier.id
            const closed = semester.redemption !== null && !redeemedThis
            return (
              <li
                key={tier.id}
                className={`rw-tier${reached ? ' rw-tier--reached' : ''}${redeemedThis ? ' rw-tier--redeemed' : ''}`}
              >
                <span className="rw-tier__icon" aria-hidden="true">
                  <Icon name={reached ? 'gift' : 'lock'} size={18} />
                </span>
                <span className="rw-tier__text">
                  <span className="rw-tier__mxn">{r.next.reward(tier.mxn)}</span>
                  <span className="rw-tier__pts">{r.catalog.points(tier.points)}</span>
                </span>
                {redeemedThis ? (
                  <span className="rw-tier__state rw-tier__state--done">{r.catalog.redeemed}</span>
                ) : closed ? (
                  <span className="rw-tier__state">{r.catalog.closed}</span>
                ) : canRedeem(tier, semester) ? (
                  <button className="btn rw-tier__btn" onClick={() => setConfirm(tier)}>
                    {r.catalog.redeem}
                  </button>
                ) : (
                  <span className="rw-tier__state">{r.catalog.locked(tier.points - semester.total)}</span>
                )}
              </li>
            )
          })}
        </ul>

        {confirm && (
          <div className="rw-confirm" role="alertdialog" aria-labelledby="rw-confirm-title">
            <div id="rw-confirm-title" className="rw-confirm__title">
              {r.catalog.confirm.title(confirm.mxn)}
            </div>
            {confirm.mxn < rewardsConfig.SEMESTER_CAP_MXN && (
              <p className="rw-confirm__body">{r.catalog.confirm.body(rewardsConfig.SEMESTER_CAP_MXN)}</p>
            )}
            <div className="rw-confirm__actions">
              <button className="btn" style={{ flex: 1 }} onClick={() => doRedeem(confirm)}>
                {r.catalog.confirm.yes}
              </button>
              <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setConfirm(null)}>
                {r.catalog.confirm.no}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4 — Where they came from */}
      <section className="card">
        <div className="eyebrow">{r.breakdown.title}</div>
        <div className="rw-group">
          <div className="rw-group__head">
            <span>{r.breakdown.thisCourse(courseName)}</span>
            <span>{fmt(points.total)}</span>
          </div>
          <ul className="sessions">
            <li>
              <span className="sessions__title">{r.breakdown.activities(points.activityCount)}</span>
              <span className="sessions__time">+{fmt(points.fromActivities)}</span>
            </li>
            <li>
              <span className="sessions__title">{r.breakdown.modules(points.moduleCount)}</span>
              <span className="sessions__time">+{fmt(points.fromModules)}</span>
            </li>
            {points.fromRhythm > 0 && (
              <li>
                <span className="sessions__title">{r.breakdown.rhythm}</span>
                <span className="sessions__time">+{fmt(points.fromRhythm)}</span>
              </li>
            )}
            {points.comebackEarned && (
              <li>
                <span className="sessions__title">{r.breakdown.comeback}</span>
                <span className="sessions__time">+{fmt(points.fromComebacks)}</span>
              </li>
            )}
            {points.reviewSets > 0 && (
              <li>
                <span className="sessions__title">{r.breakdown.reviews(points.reviewSets)}</span>
                <span className="sessions__time">+{fmt(points.fromReviews)}</span>
              </li>
            )}
            {points.fromCommunity > 0 && (
              <li>
                <span className="sessions__title">{r.breakdown.community}</span>
                <span className="sessions__time">+{fmt(points.fromCommunity)}</span>
              </li>
            )}
          </ul>
        </div>

        <div className="rw-group">
          <div className="rw-group__head">
            <span>
              {r.breakdown.previous} <span className="rw-tag rw-tag--light">{r.simulated}</span>
            </span>
            <span>{fmt(previousCourses.reduce((s, c) => s + c.points, 0))}</span>
          </div>
          <ul className="sessions">
            {previousCourses.map((c) => (
              <li key={c.name}>
                <span className="sessions__title">{c.name}</span>
                <span className="sessions__time">{fmt(c.points)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mentor__note">{r.disclaimer}</p>
    </div>
  )
}
