/**
 * The card vocabulary from the brand sheet.
 *
 *  - StatCard: tinted surface, coloured circle icon, eyebrow / value / sub,
 *    trailing arrow. The mockup's "3 recompensas · Racha · Comunidad" row.
 *  - PillarCard: Focus / Advance / Reward / Own — tinted, icon on top, title,
 *    one line, arrow. Doubles as quick navigation.
 *  - CourseCard: dark tile, category, title, progress bar, percent, chevron.
 */
import { Icon, type IconName } from './Icon'

export type Tone = 'forest' | 'mint' | 'violet' | 'orange' | 'teal'

export function StatCard({
  tone,
  icon,
  eyebrow,
  value,
  sub,
  onClick,
}: {
  tone: Tone
  icon: IconName
  eyebrow: string
  value: string
  sub?: string
  onClick?: () => void
}) {
  return (
    <button className={`statcard tint--${tone}`} onClick={onClick} disabled={!onClick}>
      <span className={`ibadge ibadge--${tone}`}>
        <Icon name={icon} size={22} tone="none" />
      </span>
      <span className="statcard__text">
        <span className="statcard__eyebrow">{eyebrow}</span>
        <span className="statcard__value">{value}</span>
        {sub && <span className="statcard__sub">{sub}</span>}
      </span>
      {onClick && (
        <span className={`statcard__arrow statcard__arrow--${tone}`}>
          <Icon name="arrow" size={18} />
        </span>
      )}
    </button>
  )
}

export function PillarCard({
  tone,
  icon,
  title,
  body,
  onClick,
}: {
  tone: Tone
  icon: IconName
  title: string
  body: string
  onClick: () => void
}) {
  return (
    <button className={`pillar tint--${tone}`} onClick={onClick}>
      <span className={`ibadge ibadge--${tone}`}>
        <Icon name={icon} size={22} tone="none" />
      </span>
      <span className={`pillar__title pillar__title--${tone}`}>{title}</span>
      <span className="pillar__body">{body}</span>
      <span className={`pillar__arrow pillar__arrow--${tone}`}>
        <Icon name="arrow" size={16} />
      </span>
    </button>
  )
}

export function CourseCard({
  category,
  title,
  progressLabel,
  percent,
  onClick,
}: {
  category: string
  title: string
  progressLabel: string
  percent: number
  onClick?: () => void
}) {
  return (
    <button className="coursecard" onClick={onClick} disabled={!onClick}>
      <span className="ibadge ibadge--lg ibadge--tile">
        <Icon name="laptop" size={26} />
      </span>
      <span className="coursecard__text">
        <span className="coursecard__cat">{category}</span>
        <span className="coursecard__title">{title}</span>
        <span className="coursecard__label">{progressLabel}</span>
        <span className="coursecard__meter">
          <span className="meter">
            <span className="meter__fill" style={{ width: `${percent}%` }} />
          </span>
          <span className="coursecard__pct">{percent}%</span>
        </span>
      </span>
      {onClick && (
        <span className="coursecard__chev">
          <Icon name="chevron" size={18} />
        </span>
      )}
    </button>
  )
}
