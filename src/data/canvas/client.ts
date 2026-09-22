/**
 * The Canvas client: four requests in, one snapshot out.
 *
 * This is where Canvas stops and FARO begins. Everything above this file
 * works on FARO's own types and has never heard of a `RawModuleItem`; every
 * Canvas-ism — module items pointing at assignments by `content_id`, page
 * views bucketed by hour, an "unsubmitted" submission stub that means *not
 * done* — is absorbed here.
 *
 * Three mapping decisions worth naming, because each one is a place where a
 * careless integration would quietly lie:
 *
 *  1. **Module membership comes from module items, not from assignments.**
 *     A Canvas assignment does not know which module it belongs to; the
 *     module's item list points at it. Getting this backwards would put
 *     every assignment in the wrong place on the route.
 *  2. **"Done" means the submission says so, not the due date.** An
 *     unsubmitted stub with a past due date is a missed step, which is
 *     exactly what Recovery reopens the route with.
 *  3. **Estimated minutes are FARO's, and labelled as such.** Canvas has no
 *     such field. It is looked up from FARO's own table; an assignment with
 *     no estimate gets a conservative default rather than a fabricated one.
 */
import { endpoints } from './endpoints'
import { estimatedMinutes, rawActivity, rawCourse, rawAssignments, rawModules, studyProfile } from './fixtures'
import type { RawAssignment, RawCourse, RawModule, RawUserActivity } from './raw'
import {
  HttpCanvasTransport,
  MockCanvasTransport,
  type CanvasTransport,
  type FixtureRoute,
} from './transport'
import { canvasConfig, launchContext, type LaunchContext } from './config'
import type { CourseSnapshot, FaroClient } from '../client'
import type { CanvasActivityEvent, CanvasAssignment, CanvasModule } from '@/types'

/**
 * Fallback length for an activity with no estimate on file.
 *
 * Twenty minutes, and deliberately not clever. A wrong-but-stated default is
 * honest; guessing from points or word count would look smarter and be
 * unfalsifiable.
 */
const DEFAULT_MINUTES = 20

/* ------------------------------------------------------------- mapping */

/** Canvas module state maps to ours one-for-one; absent state means the caller is not a student. */
function mapModule(m: RawModule, completedByModule: Map<number, number>): CanvasModule {
  return {
    id: m.id,
    course_id: rawCourse.id,
    name: m.name,
    position: m.position,
    state: m.state ?? 'unlocked',
    items_count: m.items_count,
    completed_items_count: completedByModule.get(m.id) ?? 0,
  }
}

function mapAssignment(a: RawAssignment, moduleId: number): CanvasAssignment {
  const sub = a.submission
  const submitted = Boolean(sub && sub.workflow_state !== 'unsubmitted' && sub.submitted_at)

  return {
    id: a.id,
    course_id: a.course_id,
    module_id: moduleId,
    name: a.name,
    due_at: a.due_at,
    points_possible: a.points_possible ?? 0,
    estimated_minutes: estimatedMinutes[a.id] ?? DEFAULT_MINUTES,
    submission:
      submitted && sub
        ? {
            id: sub.id,
            assignment_id: sub.assignment_id,
            submitted_at: sub.submitted_at,
            score: sub.score,
            workflow_state: sub.workflow_state === 'graded' ? 'graded' : 'submitted',
          }
        : null,
  }
}

/**
 * Flattens Canvas's hour-bucketed analytics into the event list the friction
 * engine reads.
 *
 * Only the timestamps survive: how many page views an hour held is not
 * something FARO needs, and keeping it would be collecting data for no
 * stated purpose.
 */
function mapActivity(activity: RawUserActivity, courseId: number): CanvasActivityEvent[] {
  const views: CanvasActivityEvent[] = Object.keys(activity.page_views).map((at) => ({
    course_id: courseId,
    at,
    kind: 'page_view',
  }))
  const parts: CanvasActivityEvent[] = activity.participations.map((p) => ({
    course_id: courseId,
    at: p.created_at,
    kind: 'submission',
  }))
  return [...views, ...parts].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )
}

/* -------------------------------------------------------------- client */

export class CanvasFaroClient implements FaroClient {
  constructor(
    private readonly transport: CanvasTransport,
    private readonly launch: LaunchContext,
  ) {}

  async getCourseSnapshot(): Promise<CourseSnapshot> {
    const { courseId, userId } = this.launch

    // Four calls, issued together. Canvas has no combined endpoint for this,
    // and serialising them would make every FARO open four round trips long.
    const [course, modules, assignments, activity] = await Promise.all([
      this.transport.get<RawCourse>(endpoints.course(courseId)),
      this.transport.get<RawModule[]>(endpoints.modules(courseId)),
      this.transport.get<RawAssignment[]>(endpoints.assignments(courseId)),
      this.transport.get<RawUserActivity>(endpoints.userActivity(courseId, userId)),
    ])

    // Which module each assignment lives in — read off the module items,
    // because the assignment itself does not carry it.
    const moduleOfAssignment = new Map<number, number>()
    const completedByModule = new Map<number, number>()

    for (const m of modules) {
      let done = 0
      for (const item of m.items ?? []) {
        if (item.content_id && (item.type === 'Assignment' || item.type === 'Quiz')) {
          moduleOfAssignment.set(item.content_id, m.id)
        }
        if (item.completion_requirement?.completed) done += 1
      }
      completedByModule.set(m.id, done)
    }

    // Assignments not referenced by any module item are not on the route:
    // Canvas allows unlinked assignments, and putting them on the journey
    // would invent structure the teacher did not create.
    const onRoute = assignments.filter((a) => moduleOfAssignment.has(a.id))

    return {
      course: {
        id: course.id,
        name: course.name,
        course_code: course.course_code,
        start_at: course.start_at,
        end_at: course.end_at,
      },
      modules: modules.map((m) => mapModule(m, completedByModule)),
      assignments: onRoute.map((a) => mapAssignment(a, moduleOfAssignment.get(a.id) as number)),
      activity: mapActivity(activity, courseId),
      profile: studyProfile,
    }
  }
}

/* ------------------------------------------------------ mock wiring */

/**
 * The fixture routes, matched against the same paths `endpoints.ts` builds.
 *
 * Written as patterns rather than a lookup table on purpose: a typo in an
 * endpoint produces a 404 in the request log, exactly as a wrong path against
 * a real Canvas would, instead of silently resolving.
 */
export const fixtureRoutes: FixtureRoute[] = [
  { match: /^\/api\/v1\/courses\/(\d+)$/, resolve: () => rawCourse },
  { match: /^\/api\/v1\/courses\/(\d+)\/modules/, resolve: () => rawModules },
  { match: /^\/api\/v1\/courses\/(\d+)\/assignments/, resolve: () => rawAssignments },
  { match: /^\/api\/v1\/courses\/(\d+)\/analytics\/users\/([\w-]+)\/activity$/, resolve: () => rawActivity },
]

export function createCanvasClient(): CanvasFaroClient {
  const transport: CanvasTransport =
    canvasConfig.mode === 'http'
      ? new HttpCanvasTransport(canvasConfig)
      : new MockCanvasTransport(fixtureRoutes)
  return new CanvasFaroClient(transport, launchContext)
}
