/**
 * "+50 points" - the small confirmation that an action counted.
 *
 * Watches the points total and, when it goes up, floats the difference for
 * a moment. It never appears on first load (the balance you already had is
 * not news), never for decreases, and never blocks anything: it is
 * `pointer-events: none` and announced politely to screen readers.
 */
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/state/store'

export function PointsToast() {
  const { points, t } = useStore()
  const last = useRef<number | null>(null)
  // Stored state (community, reviews) can land a moment after the shell
  // mounts; that is the balance arriving, not points being earned.
  const mountedAt = useRef(Date.now())
  const [gain, setGain] = useState<{ n: number; key: number } | null>(null)

  useEffect(() => {
    const prev = last.current
    last.current = points.total
    if (prev === null || points.total <= prev) return
    if (Date.now() - mountedAt.current < 1500) return
    setGain({ n: points.total - prev, key: Date.now() })
    const id = setTimeout(() => setGain(null), 1900)
    return () => clearTimeout(id)
  }, [points.total])

  return (
    <div className="pts-toast-slot" aria-live="polite">
      {gain && (
        <div key={gain.key} className="pts-toast">
          {t.shell.pointsToast(gain.n)}
        </div>
      )}
    </div>
  )
}
