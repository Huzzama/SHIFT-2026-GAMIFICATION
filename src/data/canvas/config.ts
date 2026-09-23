/**
 * Where FARO gets its Canvas, and how it knows which course it is in.
 *
 * Two modes, chosen at build time by `VITE_CANVAS_MODE`:
 *
 *  - `mock`  the prototype. Requests are answered by fixtures; the launch is
 *            a fixed course and student, labelled as simulated in the UI.
 *  - `http`  the real one. Requests go to the FARO backend (`server/`),
 *            which holds the institutional token and forwards only the
 *            allow-listed, read-only Canvas paths. The launch is asked from
 *            the backend at start-up.
 *
 * There is deliberately no token here and no way to put one: the extension
 * has no Canvas credential in either mode. A token in front-end code is a
 * token published to every student who installs the extension.
 *
 * In production the launch comes from a signed LTI 1.3 launch, in which case
 * `verified` is true. The backend marks it false today because nothing has
 * signed it, and the UI says "simulated launch" rather than implying an
 * integration that is not there yet.
 */
import { COURSE_ID, STUDENT_ID } from './fixtures'

export type CanvasMode = 'mock' | 'http'

export interface CanvasConfig {
  mode: CanvasMode
  /** The FARO backend, e.g. http://127.0.0.1:3000 — no trailing slash. Unused in mock mode. */
  apiUrl: string
}

/**
 * The course and person a launch is about.
 *
 * In LTI 1.3 these come from the `id_token` claims — the course from
 * `https://purl.imsglobal.org/spec/lti/claim/context`, the person from the
 * `sub` claim. Both are signed by Canvas, which is why FARO never has to ask
 * a student who they are.
 */
export interface LaunchContext {
  courseId: number
  courseName: string | null
  userId: number | 'self'
  /** True only when this came from a real signed LTI launch. */
  verified: boolean
  /** Where the launch was resolved from. */
  source: 'fixture' | 'config' | 'enrollment' | 'lti'
}

const envMode = (import.meta.env.VITE_CANVAS_MODE as string | undefined) ?? 'mock'

export const canvasConfig: CanvasConfig = {
  mode: envMode === 'http' ? 'http' : 'mock',
  apiUrl: ((import.meta.env.VITE_FARO_API_URL as string | undefined) ?? 'http://127.0.0.1:3000').replace(/\/+$/, ''),
}

/** The launch the prototype runs under when there is no backend. */
export const mockLaunch: LaunchContext = {
  courseId: COURSE_ID,
  courseName: null,
  userId: STUDENT_ID,
  verified: false,
  source: 'fixture',
}

/* --------------------------------------------------------------- launch */

let resolved: LaunchContext | null = canvasConfig.mode === 'mock' ? mockLaunch : null
let pending: Promise<LaunchContext> | null = null
const listeners = new Set<(l: LaunchContext | null) => void>()

/**
 * Resolves the launch once and caches it. In mock mode it is immediate; in
 * http mode it asks the backend, which works it out from the token's owner
 * and configured course (see `server/src/routes/launch.ts`).
 */
export function resolveLaunch(): Promise<LaunchContext> {
  if (resolved) return Promise.resolve(resolved)
  if (pending) return pending

  pending = fetch(`${canvasConfig.apiUrl}/api/launch`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`FARO backend ${res.status} on /api/launch`)
      const body = (await res.json()) as {
        courseId: number
        courseName: string
        userId: number
        verified: boolean
        source: 'config' | 'enrollment'
      }
      resolved = {
        courseId: body.courseId,
        courseName: body.courseName,
        userId: body.userId,
        verified: body.verified,
        source: body.source,
      }
      listeners.forEach((fn) => fn(resolved))
      return resolved
    })
    .finally(() => {
      pending = null
    })
  return pending
}

/** The launch if already known; null while the backend is still being asked. */
export function currentLaunch(): LaunchContext | null {
  return resolved
}

export function onLaunch(fn: (l: LaunchContext | null) => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
