/**
 * "Module 3 of 6", drawn: one node per module and the destination at the end.
 *
 * Solid line behind the student, dotted line ahead. Node states come from
 * FARO's icon set (done, current, upcoming, locked), so the trail reads the
 * same way as the Journey map. A module with overdue work gets a small storm
 * above its node: friction on the water, not a mark against the student.
 */
import { Icon, type IconName } from './Icon'
import type { CourseRoute, RouteModule } from '@/lib/route'

const node = (m: RouteModule): IconName =>
  m.state === 'completed'
    ? 'stateNodeCompleted'
    : m.state === 'current'
      ? 'stateNodeCurrent'
      : m.state === 'locked'
        ? 'stateNodeLocked'
        : 'stateNodeUpcoming'

export function ModuleTrail({ route, destinationLabel }: { route: CourseRoute; destinationLabel: string }) {
  return (
    <ol className="mtrail" aria-label={route.modules.map((m) => `${m.number}: ${m.name}`).join(', ')}>
      {route.modules.map((m, i) => (
        <li key={m.moduleId} className={`mtrail__stop mtrail__stop--${m.state}`} title={`${m.number}. ${m.name}`}>
          {m.friction && m.state !== 'completed' && (
            <span className="mtrail__storm" aria-hidden="true">
              <Icon name="storm" size={14} tone="none" />
            </span>
          )}
          <Icon name={node(m)} size={22} />
          <span
            className={`mtrail__line${i < route.position ? ' mtrail__line--done' : ''}`}
            aria-hidden="true"
          />
        </li>
      ))}
      <li className="mtrail__stop mtrail__stop--destination" title={destinationLabel}>
        <Icon name="destination" size={24} />
      </li>
    </ol>
  )
}
