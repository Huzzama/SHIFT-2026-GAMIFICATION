/**
 * The Journey as a chart of the voyage: harbour at the bottom, destination at
 * the top, one waypoint per module, the ship where the student is.
 *
 *  - Behind the ship the line is solid ink; ahead it is dotted.
 *  - A module with overdue work has a storm beside it — friction on the
 *    water, never a mark against the student.
 *  - When FARO recalculated the route, a safe harbour appears just before the
 *    student's module. The old line (straight into the storm) fades, the new
 *    one draws itself through the harbour in the accent colour, and the ship
 *    sails to the harbour. The destination never moves.
 *
 * Paths and the ship live in one SVG (viewBox units, so SMIL motion scales
 * with it); icons and labels are HTML laid over it at the same percentages,
 * so text stays at reading size at any width. Everything comes from
 * `CourseRoute` — nothing here is specific to the demo course.
 */
import { useEffect, useMemo, useState } from 'react'
import { Icon, type IconName } from './Icon'
import { faroGlyphs } from './faroGlyphs'
import type { CourseRoute, RouteModule } from '@/lib/route'

type Pt = { x: number; y: number }

type WaypointKind =
  | { kind: 'start' }
  | { kind: 'module'; module: RouteModule }
  | { kind: 'harbor' }
  | { kind: 'destination' }
type Waypoint = WaypointKind & { pt: Pt }

export interface RouteMapLabels {
  start: string
  destination: string
  destinationSub?: string | null
  here: string
  harbor: string
  recalculating: string
  recalculated: string
  module: (n: number, name: string) => string
}

const W = 320
const ROW = 76
const PAD_Y = 44
/** Horizontal swing of the route: a natural meander, never a straight bar. */
const swing = (i: number) => W * (0.5 + 0.26 * Math.sin(i * 1.05 + 0.4))

const node = (m: RouteModule): IconName =>
  m.state === 'completed'
    ? 'stateNodeCompleted'
    : m.state === 'current'
      ? 'stateNodeCurrent'
      : m.state === 'locked'
        ? 'stateNodeLocked'
        : 'stateNodeUpcoming'

/** Catmull-Rom → cubic Bézier for the segment p1→p2. */
function seg(p0: Pt, p1: Pt, p2: Pt, p3: Pt): string {
  const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
  const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
  return `C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
}

function pathThrough(pts: Pt[], from: number, to: number): string {
  if (to <= from) return ''
  let d = `M ${pts[from].x.toFixed(1)} ${pts[from].y.toFixed(1)}`
  for (let i = from; i < to; i++) {
    d += ' ' + seg(pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(pts.length - 1, i + 2)])
  }
  return d
}

const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function RouteMap({ route, labels }: { route: CourseRoute; labels: RouteMapLabels }) {
  const harborAt = route.recalculated ? route.position : -1

  const { points, waypoints, height, lastDone, target, current } = useMemo(() => {
    const wps: WaypointKind[] = [{ kind: 'start' }]
    route.modules.forEach((m, i) => {
      if (i === harborAt) wps.push({ kind: 'harbor' })
      wps.push({ kind: 'module', module: m })
    })
    wps.push({ kind: 'destination' })

    const h = PAD_Y * 2 + ROW * (wps.length - 1)
    const pts = wps.map((_, i) => ({ x: swing(i), y: h - PAD_Y - i * ROW }))
    // The harbour sits off the old line, so the detour is visible.
    const hi = wps.findIndex((w) => w.kind === 'harbor')
    if (hi > 0) pts[hi] = { x: pts[hi].x < W / 2 ? pts[hi].x + W * 0.3 : pts[hi].x - W * 0.3, y: pts[hi].y }

    const withPt = wps.map((w, i) => ({ ...w, pt: pts[i] }) as Waypoint)
    const cur = withPt.findIndex((w) => w.kind === 'module' && w.module.state === 'current')
    const currentIdx = cur === -1 ? withPt.length - 1 : cur
    // Last point behind the student: the start, or the last finished module.
    let done = 0
    withPt.forEach((w, i) => {
      if (w.kind === 'module' && w.module.state === 'completed' && i < currentIdx) done = i
    })
    return {
      points: pts,
      waypoints: withPt,
      height: h,
      lastDone: done,
      current: currentIdx,
      target: hi > 0 ? hi : currentIdx,
    }
  }, [route, harborAt])

  const animate = !reducedMotion()
  const [arrived, setArrived] = useState(!animate)
  useEffect(() => {
    if (!animate) return setArrived(true)
    setArrived(false)
    const id = setTimeout(() => setArrived(true), 1700)
    return () => clearTimeout(id)
  }, [animate, target, lastDone])

  const behind = pathThrough(points, 0, lastDone)
  const ahead = pathThrough(points, current, points.length - 1)
  // The leg the student is on: through the harbour when recalculated.
  const leg = pathThrough(points, lastDone, current)
  // The old leg, straight from the last finished module into the storm.
  const oldPts = points.filter((_, i) => i !== target || target === current)
  const oldFrom = lastDone
  const oldTo = target === current ? current : current - 1
  const oldLeg = route.recalculated ? pathThrough(oldPts, oldFrom, oldTo) : ''
  const travel = pathThrough(points, lastDone, target)

  const pct = (p: Pt) => ({ left: `${(p.x / W) * 100}%`, top: `${(p.y / height) * 100}%` })
  const side = (p: Pt) => (p.x > W / 2 ? 'left' : 'right')

  return (
    <div className={`rmap${animate ? ' rmap--animate' : ''}`} style={{ aspectRatio: `${W} / ${height}` }}>
      <svg
        key={`${lastDone}-${target}-${route.recalculated}`}
        className="rmap__svg"
        viewBox={`0 0 ${W} ${height}`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {behind && <path className="rmap__behind" d={behind} />}
        {oldLeg && <path className="rmap__old" d={oldLeg} />}
        {leg && <path className={route.recalculated ? 'rmap__new' : 'rmap__behind'} d={leg} pathLength={1} />}
        {ahead && <path className="rmap__ahead" d={ahead} />}
        <g className={`rmap__ship${arrived && route.recalculated ? ' rmap__ship--docked' : ''}`}>
          <svg x={-13} y={-40} width={26} height={26} viewBox="0 0 24 24" strokeWidth={1.8}>
            {faroGlyphs.stateShipSailing}
          </svg>
          {travel ? (
            <animateMotion
              dur={animate ? '1.3s' : '0.001s'}
              begin={animate ? '0.45s' : '0s'}
              fill="freeze"
              path={travel}
              calcMode="spline"
              keyPoints="0;1"
              keyTimes="0;1"
              keySplines="0.4 0 0.2 1"
            />
          ) : (
            <animateMotion dur="0.001s" fill="freeze" path={`M ${points[target].x} ${points[target].y} L ${points[target].x} ${points[target].y}`} />
          )}
        </g>
      </svg>

      <ol className="rmap__points">
        {waypoints.map((w, i) => {
          const at = pct(w.pt)
          const s = side(w.pt)
          const isTarget = i === target
          let icon: IconName
          let title: string
          let sub: string | null = null
          let cls = ''
          if (w.kind === 'start') {
            icon = 'harbor'
            title = labels.start
          } else if (w.kind === 'destination') {
            icon = 'destination'
            title = labels.destination
            sub = labels.destinationSub ?? null
            cls = ' rmap__pt--destination'
          } else if (w.kind === 'harbor') {
            icon = 'navSafeHarborSmall'
            title = labels.harbor
            sub = arrived ? labels.recalculated : labels.recalculating
            cls = ' rmap__pt--harbor'
          } else {
            icon = node(w.module)
            title = labels.module(w.module.number, w.module.name)
            cls = ` rmap__pt--${w.module.state}`
          }
          return (
            <li key={i} className={`rmap__pt rmap__pt--${s}${cls}`} style={at}>
              <span className="rmap__icon">
                <Icon name={icon} size={w.kind === 'module' ? 24 : 28} />
              </span>
              {w.kind === 'module' && w.module.friction && w.module.state !== 'completed' && (
                <span className="rmap__storm" title="">
                  <Icon name="storm" size={26} tone="none" />
                </span>
              )}
              <span className="rmap__label">
                <span className="rmap__title">{title}</span>
                {sub && <span className={`rmap__sub${w.kind === 'harbor' ? ' rmap__sub--pill' : ''}`}>{sub}</span>}
                {isTarget && <span className={`rmap__here${arrived ? ' rmap__here--on' : ''}`}>{labels.here}</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
