/**
 * The Canvas REST endpoints FARO uses. All of them, and nothing else.
 *
 * Keeping the paths in one file is not tidiness — it is the audit surface. A
 * Canvas administrator reviewing this integration can read this file in
 * thirty seconds and know exactly what FARO touches, without trusting a
 * description of it. Anything not listed here, FARO does not call.
 *
 * Two absences are deliberate and load-bearing:
 *
 *  - Nothing writes. Every entry is a GET. FARO cannot alter a grade, a
 *    submission or a due date, because it never asks to.
 *  - No user-directory endpoint. FARO never lists who else is in a course by
 *    name; Community works on aggregate counts, so the endpoint that would
 *    return classmates' identities is not here.
 *
 * Verified against the Canvas LMS REST API documentation:
 * https://canvas.instructure.com/doc/api/courses.html
 * https://canvas.instructure.com/doc/api/modules.html
 * https://canvas.instructure.com/doc/api/assignments.html
 * https://canvas.instructure.com/doc/api/analytics.html
 */

/** Canvas paginates; 100 is its maximum page size. Fewer round trips, same data. */
export const PER_PAGE = 100

export const endpoints = {
  /**
   * The course itself — name, code, and the end date Recovery needs to
   * answer "can I still finish?".
   */
  course: (courseId: number) => `/api/v1/courses/${courseId}`,

  /**
   * Modules with their items in one call.
   *
   * `include[]=items` avoids one request per module, and the items carry
   * `completion_requirement`, which is how FARO knows what "done" means for
   * each step. Canvas returns this caller's own module state (locked /
   * unlocked / started / completed) when the caller is a student in the
   * course.
   */
  modules: (courseId: number) =>
    `/api/v1/courses/${courseId}/modules?include[]=items&per_page=${PER_PAGE}`,

  /**
   * Assignments, each with this student's submission attached.
   *
   * `include[]=submission` is what lets FARO tell "not done" from "done
   * late" without a second call per assignment.
   */
  assignments: (courseId: number) =>
    `/api/v1/courses/${courseId}/assignments?include[]=submission&per_page=${PER_PAGE}`,

  /**
   * Per-student activity: page views bucketed by hour, participations as
   * timestamps. This is the only input to the friction engine's "days since
   * last activity", and the reason FARO's thresholds are in days rather than
   * minutes — Canvas does not offer a live feed here, and the documented
   * alternative (Live Events) explicitly warns against using it when data
   * must be current.
   */
  userActivity: (courseId: number, userId: number | 'self') =>
    `/api/v1/courses/${courseId}/analytics/users/${userId}/activity`,

  /**
   * Which courses this student is actively enrolled in. Used once, at
   * launch, to know which course FARO is being opened for when the LTI
   * context does not already say.
   */
  activeCourses: () =>
    `/api/v1/courses?enrollment_state=active&per_page=${PER_PAGE}`,
} as const

/**
 * The OAuth scopes a Canvas developer key must grant for the calls above.
 *
 * Written in Canvas's own `url:METHOD|path` form so an administrator can
 * paste them into the developer key screen. Every one is a GET.
 */
export const requiredScopes = [
  'url:GET|/api/v1/courses/:id',
  'url:GET|/api/v1/courses/:course_id/modules',
  'url:GET|/api/v1/courses/:course_id/assignments',
  'url:GET|/api/v1/courses/:course_id/analytics/users/:student_id/activity',
  'url:GET|/api/v1/courses',
] as const

/**
 * LTI 1.3 service scopes FARO requests at launch — and the two it refuses.
 *
 * `score` and `lineitem` would let FARO write to the gradebook. Not asking
 * for them is the technical guarantee behind the product promise that FARO
 * cannot change anyone's academic record, and it is verifiable by the
 * administrator on the developer key screen rather than taken on faith.
 */
export const ltiScopes = {
  requested: [
    'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
    'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
  ],
  refused: [
    'https://purl.imsglobal.org/spec/lti-ags/scope/score',
    'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
  ],
} as const
