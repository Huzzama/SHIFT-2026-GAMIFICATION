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
 *
 * One fallback, also named: a student account is often not allowed to read
 * the analytics endpoint (Canvas answers 401/403). When that happens FARO
 * does not invent activity — it derives "last activity" from the dates of
 * the student's own submissions, which are always visible to them, and the
 * Profile panel says the fallback is in use.
 */
import { endpoints } from './endpoints'
import { estimatedMinutes, rawActivity, rawCourse, rawAssignments, rawModules, studyProfile } from './fixtures'
import { integrationStatus } from './status'
import type { RawAssignment, RawCourse, RawModule, RawUserActivity } from './raw'
import {
  BackendCanvasTransport,
  CanvasHttpError,
  MockCanvasTransport,
  type CanvasTransport,
  type FixtureRoute,
} from './transport'
import { canvasConfig, mockLaunch, resolveLaunch, type LaunchContext } from './config'
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
function mapModule(m: RawModule, courseId: number, completedByModule: Map<number, number>): CanvasModule {
  return {
    id: m.id,
    course_id: courseId,
    name: m.name,
    position: m.position,
    state: m.state ?? 'unlocked',
    items_count: m.items_count,
    completed_items_count: completedByModule.get(m.id) ?? 0,
  }
}

/** Where the minutes-per-activity estimate comes from. Fixtures have a table; a live course does not yet. */
export type EstimateLookup = (assignmentId: number) => number | undefined

function mapAssignment(a: RawAssignment, moduleId: number, estimate: EstimateLookup): CanvasAssignment {
  const sub = a.submission
  const submitted = Boolean(sub && sub.workflow_state !== 'unsubmitted' && sub.submitted_at)

  return {
    id: a.id,
    course_id: a.course_id,
    module_id: moduleId,
    name: a.name,
    due_at: a.due_at,
    points_possible: a.points_possible ?? 0,
    estimated_minutes: estimate(a.id) ?? DEFAULT_MINUTES,
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

/**
 * What a student can always see about themselves: when they submitted.
 * Used as activity when the analytics endpoint is closed to them.
 */
function activityFromSubmissions(assignments: RawAssignment[], courseId: number): CanvasActivityEvent[] {
  return assignments
    .filter((a) => a.submission?.submitted_at)
    .map((a) => ({ course_id: courseId, at: a.submission?.submitted_at as string, kind: 'submission' as const }))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

/* -------------------------------------------------------------- client */

export class CanvasFaroClient implements FaroClient {
  private readonly transport: CanvasTransport
  private readonly launch: () => Promise<LaunchContext>
  private readonly estimate: EstimateLookup

  constructor(transport: CanvasTransport, launch: () => Promise<LaunchContext>, estimate: EstimateLookup) {
    this.transport = transport
    this.launch = launch
    this.estimate = estimate
  }

  async getCourseSnapshot(): Promise<CourseSnapshot> {
    const { courseId, userId } = await this.launch()

    // Four calls, issued together. Canvas has no combined endpoint for this,
    // and serialising them would make every FARO open four round trips long.
    const [course, modules, assignments, activity] = await Promise.all([
      this.transport.get<RawCourse>(endpoints.course(courseId)),
      this.transport.get<RawModule[]>(endpoints.modules(courseId)),
      this.transport.get<RawAssignment[]>(endpoints.assignments(courseId)),
      this.transport.get<RawUserActivity>(endpoints.userActivity(courseId, userId)).catch((err: unknown) => {
        // Not allowed to read analytics: fall back, and say so. Anything
        // else is a real failure and must surface.
        if (err instanceof CanvasHttpError && (err.status === 401 || err.status === 403)) {
          integrationStatus.set({ activityFallback: true })
          return null
        }
        throw err
      }),
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
      modules: modules.map((m) => mapModule(m, course.id, completedByModule)),
      assignments: onRoute.map((a) => mapAssignment(a, moduleOfAssignment.get(a.id) as number, this.estimate)),
      activity: activity ? mapActivity(activity, courseId) : activityFromSubmissions(onRoute, courseId),
      // The study profile is measured by the backend in production. Until
      // it exists, only the fixture scenario carries one; a live course is
      // honest about not knowing the student's rhythm yet.
      profile: this.transport.mode === 'mock' ? studyProfile : undefined,
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

/**
 * The demo scenario, always from fixtures: five days away, twelve days and
 * four and a half hours of work left, four modules open. Used by Progress →
 * "Try the scenario" so the recovery flow can be shown even when the build
 * is pointed at a live Canvas; the student's real course is not touched.
 */
export function createScenarioClient(): CanvasFaroClient {
  return new CanvasFaroClient(new MockCanvasTransport(fixtureRoutes), () => Promise.resolve(mockLaunch), (id) => estimatedMinutes[id])
}

export function createCanvasClient(): CanvasFaroClient {
  if (canvasConfig.mode === 'http') {
    // The fixture estimate table is keyed by fixture ids; against a real
    // course it would match by coincidence. Every live activity gets the
    // stated default until estimates come from the course configuration.
    return new CanvasFaroClient(new BackendCanvasTransport(canvasConfig), resolveLaunch, () => undefined)
  }
  return new CanvasFaroClient(new MockCanvasTransport(fixtureRoutes), resolveLaunch, (id) => estimatedMinutes[id])
}
