/**
 * Counts a number up to its new value instead of snapping to it.
 *
 * Used where a number going up is the reward itself: the points balance,
 * the "+75" at the end of the review cards. Short (under a second), eased,
 * and skipped entirely when the OS asks for reduced motion - then the
 * number simply changes.
 */
import { useEffect, useRef, useState } from 'react'

export const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function useCountUp(target: number, durationMs = 700, from?: number): number {
  const [value, setValue] = useState(from ?? target)
  const current = useRef(from ?? target)

  useEffect(() => {
    const start = current.current
    if (start === target || prefersReducedMotion()) {
      current.current = target
      setValue(target)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = Math.round(start + (target - start) * eased)
      current.current = v
      setValue(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}
