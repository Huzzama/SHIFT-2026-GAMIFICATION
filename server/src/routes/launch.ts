/**
 * GET /api/launch - which course and which person this FARO is about.
 *
 * In production this answer comes from the signed LTI 1.3 launch: Canvas
 * tells FARO the course (`context` claim) and the person (`sub` claim), and
 * FARO never has to ask anyone who they are. See `routes/lti.ts`.
 *
 * In the pilot there is no launch, so the backend works it out from the
 * token: the token's owner is the student (`/users/self`), and the course is
 * either `FARO_COURSE_ID` or their first active enrollment. `verified: false`
 * says so; the extension labels the connection accordingly.
 *
 * Only the numeric user id is kept from `/users/self`. Canvas returns the
 * person's name and avatar in that response; the server reads the id and
 * discards the rest, because nothing in FARO needs them.
 */
import { canvasGet, CanvasError, type Fetch } from '../canvas.ts'
import type { Env } from '../env.ts'
import { json, type Handler } from '../http.ts'

export interface LaunchResponse {
  courseId: number
  courseName: string
  userId: number
  /** True only for a signed LTI launch. Never true in the pilot. */
  verified: boolean
  source: 'config' | 'enrollment'
}

interface RawSelf { id: number }
interface RawCourse { id: number; name: string; workflow_state?: string }

export function launchRoute(env: Env, fetchImpl?: Fetch): Handler {
  let cached: LaunchResponse | null = null

  return async () => {
    if (cached) return json(200, cached)

    try {
      const self = await canvasGet<RawSelf>(env, '/api/v1/users/self', fetchImpl)

      let course: RawCourse
      let source: LaunchResponse['source']
      if (env.courseId !== null) {
        course = (await canvasGet<RawCourse>(env, `/api/v1/courses/${env.courseId}`, fetchImpl)).data
        source = 'config'
      } else {
        const list = await canvasGet<RawCourse[]>(
          env,
          '/api/v1/courses?enrollment_state=active&per_page=100',
          fetchImpl,
        )
        const first = list.data.find((c) => c.workflow_state !== 'unpublished') ?? list.data[0]
        if (!first) return json(404, { error: 'no_active_course' })
        course = first
        source = 'enrollment'
      }

      cached = {
        courseId: course.id,
        courseName: course.name,
        userId: self.data.id,
        verified: false,
        source,
      }
      return json(200, cached)
    } catch (err) {
      if (err instanceof CanvasError) {
        if (err.status === 401) return json(502, { error: 'canvas_token_rejected' })
        return json(502, { error: 'canvas_error', canvasStatus: err.status })
      }
      throw err
    }
  }
}
