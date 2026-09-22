/**
 * Where FARO gets its Canvas, and how it knows which course it is in.
 *
 * One switch, one file. `canvasMode` decides whether the app talks to
 * fixtures or to an institution; everything above this line is identical
 * either way.
 *
 * In production none of these values are hard-coded. The base URL comes from
 * the institution's configuration, the token is minted by the FARO backend
 * after the LTI launch (never stored in the browser), and the course and user
 * ids arrive inside the signed LTI launch claim. The prototype stands in for
 * that with a mock launch, labelled as such wherever it surfaces.
 */
import { COURSE_ID, STUDENT_ID } from './fixtures'

export type CanvasMode = 'mock' | 'http'

export interface CanvasConfig {
  mode: CanvasMode
  /** e.g. https://tecmilenio.instructure.com — no trailing slash. */
  baseUrl: string
  /**
   * Bearer token for the Canvas API.
   *
   * Empty in the prototype, and it must stay that way: a token in front-end
   * code is a token published to every student. In production the extension
   * or LTI page calls the FARO backend, and the backend holds the token.
   */
  accessToken: string
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
  userId: number | 'self'
  /** True when this came from a real signed LTI launch. */
  verified: boolean
}

/**
 * The prototype's mode.
 *
 * Change this to `'http'`, fill in `baseUrl`, and point `accessToken` at a
 * backend-issued token: no other file changes.
 */
export const canvasMode: CanvasMode = 'mock'

export const canvasConfig: CanvasConfig = {
  mode: canvasMode,
  baseUrl: '',
  accessToken: '',
}

/**
 * The launch FARO is running under.
 *
 * `verified: false` is the honest flag: nothing signed this. The UI shows it
 * as simulated wherever it appears, the same way the institutional account
 * link is labelled, rather than letting a demo imply an integration that is
 * not there.
 */
export const launchContext: LaunchContext = {
  courseId: COURSE_ID,
  userId: STUDENT_ID,
  verified: canvasConfig.mode === 'http',
}
