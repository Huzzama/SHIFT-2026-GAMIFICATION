import { useStore } from '@/state/store'
import type { FrictionSignal } from '@/types'

/**
 * Momentum, not a streak. Shows no count of missed days and no risk label -
 * the internal friction state stays internal. Orange is momentum's colour
 * everywhere in FARO.
 */
export function MomentumBadge({
  friction,
  onDark = false,
}: {
  friction: FrictionSignal
  onDark?: boolean
}) {
  const { t } = useStore()
  return (
    <div className={`momentum${onDark ? ' momentum--onDark' : ''}`} title={t.shell.momentumTitle}>
      <div className="momentum__row">
        <span className="momentum__value">{friction.momentum}%</span>
        <span className="momentum__label">{t.shell.momentum}</span>
      </div>
      <div className={`meter meter--thin${onDark ? ' meter--onDark' : ''}`} style={{ width: 84 }}>
        <div className="meter__fill meter__fill--orange" style={{ width: `${friction.momentum}%` }} />
      </div>
    </div>
  )
}
