/**
 * Rewards — foundation only.
 *
 * This is the config layer and a real, transparent mock balance: every line
 * below comes from something the student actually did (`lib/points.ts`), not
 * from opening this screen. There is deliberately no catalog and no redeem
 * button yet — that is its own later phase, per the build order this session
 * chose. Nothing here is a currency; it is points earned, shown honestly.
 */
import { Icon } from '@/components/Icon'
import { useStore } from '@/state/store'

export function RewardsView() {
  const { t, points } = useStore()

  return (
    <div className="stack">
      <div className="card stack">
        <div className="row">
          <span className="ibadge ibadge--violet">
            <Icon name="gift" size={22} />
          </span>
          <div>
            <div className="eyebrow">{t.rewards.eyebrow}</div>
            <div className="h2" style={{ margin: '2px 0 0' }}>{t.rewards.title}</div>
          </div>
        </div>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>{t.rewards.body}</p>

        <div className="statcard tint--violet" style={{ cursor: 'default' }}>
          <span className="ibadge ibadge--violet">
            <Icon name="trophy" size={22} />
          </span>
          <span className="statcard__text">
            <span className="statcard__eyebrow">{t.rewards.balance}</span>
            <span className="statcard__value">{points.total}</span>
          </span>
        </div>
      </div>

      <div className="card">
        <div className="eyebrow">{t.rewards.breakdown.title}</div>
        <ul className="sessions" style={{ marginTop: 'var(--space-3)' }}>
          <li>
            <span className="sessions__title">{t.rewards.breakdown.activities(points.activityCount)}</span>
            <span className="sessions__time">+{points.fromActivities}</span>
          </li>
          <li>
            <span className="sessions__title">{t.rewards.breakdown.modules(points.moduleCount)}</span>
            <span className="sessions__time">+{points.fromModules}</span>
          </li>
          <li>
            <span className="sessions__title">{t.rewards.breakdown.rhythm}</span>
            <span className="sessions__time">+{points.fromRhythm}</span>
          </li>
          {points.comebackEarned && (
            <li>
              <span className="sessions__title">{t.rewards.breakdown.comeback}</span>
              <span className="sessions__time">+{points.fromComebacks}</span>
            </li>
          )}
        </ul>
      </div>

      <div className="banner">
        <div className="banner__title">{t.rewards.comingSoon.title}</div>
        <div className="banner__body">{t.rewards.comingSoon.body}</div>
      </div>
    </div>
  )
}
