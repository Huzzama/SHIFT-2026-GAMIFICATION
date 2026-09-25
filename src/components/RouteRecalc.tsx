/**
 * "Recalculating your route…", drawn.
 *
 * The old route (dotted, fading) ran straight through the storm. The new
 * route bends around it, draws itself in the accent colour and ends at the
 * same pennant: the destination never moves. The ship sails the new line and
 * stops part-way — the student is on the route, not at the end of it.
 *
 * SMIL + CSS only, no library. With reduced motion the final state is shown
 * at once and nothing moves.
 */
import { faroGlyphs } from './faroGlyphs'

const OLD = 'M14 56 L144 18'
const NEW = 'M14 56 C 44 72, 66 64, 84 48 S 118 16, 144 18'

export function RouteRecalc({ animate, className }: { animate: boolean; className?: string }) {
  return (
    <svg
      className={`rrecalc${animate ? ' rrecalc--animate' : ''}${className ? ` ${className}` : ''}`}
      viewBox="0 0 160 80"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path className="rrecalc__old" d={OLD} strokeDasharray="0.1 5" />
      <svg x={60} y={20} width={22} height={22} viewBox="0 0 24 24" className="rrecalc__storm">
        {faroGlyphs.storm}
      </svg>
      <path className="rrecalc__new" d={NEW} pathLength={1} />
      <circle cx={14} cy={56} r={4.5} fill="var(--surface)" />
      <svg x={132} y={-2} width={26} height={26} viewBox="0 0 24 24" className="rrecalc__flag">
        {faroGlyphs.destination}
      </svg>
      <g className="rrecalc__ship">
        <svg x={-10} y={-17} width={20} height={20} viewBox="0 0 24 24">
          {faroGlyphs.ship}
        </svg>
        <animateMotion
          dur={animate ? '1.2s' : '0.001s'}
          begin={animate ? '0.35s' : '0s'}
          fill="freeze"
          path={NEW}
          keyPoints="0;0.58"
          keyTimes="0;1"
          calcMode="spline"
          keySplines="0.4 0 0.2 1"
        />
      </g>
    </svg>
  )
}
