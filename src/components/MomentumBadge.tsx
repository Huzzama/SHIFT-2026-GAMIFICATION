import type { FrictionSignal } from '@/types'

/**
 * Momentum, not a streak. Deliberately shows no number of missed days and no
 * risk label - the internal friction state stays internal.
 */
export function MomentumBadge({ friction }: { friction: FrictionSignal }) {
  const strong = friction.momentum >= 65
  return (
    <div className="momentum" title="Your connection to the course">
      <div className="momentum__row">
        <span className="momentum__value">{friction.momentum}%</span>
        <span className="momentum__label">momentum</span>
      </div>
      <div className="meter" style={{ width: 72 }}>
        <div
          className={`meter__fill${strong ? ' meter__fill--moss' : ''}`}
          style={{ width: `${friction.momentum}%` }}
        />
      </div>
    </div>
  )
}
