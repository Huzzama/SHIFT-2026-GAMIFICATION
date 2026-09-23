/**
 * The Canvas paths this server will forward. All of them, and nothing else.
 *
 * This file mirrors `src/data/canvas/endpoints.ts` in the extension, and the
 * two must agree: the extension asks for a path, and this list decides
 * whether the backend will attach the institutional token to it. A path not
 * matched here is answered 403 before any network call is made, so a
 * compromised or modified extension cannot turn the backend into a general
 * Canvas proxy. Every entry is a GET; the router refuses other methods
 * before it gets here.
 *
 * Query parameters are allow-listed too. `include[]` and `per_page` are the
 * only ones FARO's calls need, and forwarding arbitrary parameters would let
 * a caller change what Canvas returns in ways this list does not describe.
 */

export interface AllowedPath {
  name: string
  pattern: RegExp
  /** Why FARO needs it - shown to administrators, kept next to the pattern. */
  purpose: string
}

export const allowedPaths: readonly AllowedPath[] = [
  {
    name: 'course',
    pattern: /^\/api\/v1\/courses\/(\d+)$/,
    purpose: 'Course name, code and end date (Recovery needs the end date).',
  },
  {
    name: 'modules',
    pattern: /^\/api\/v1\/courses\/(\d+)\/modules$/,
    purpose: 'Modules with items and this student\'s completion state: the route.',
  },
  {
    name: 'assignments',
    pattern: /^\/api\/v1\/courses\/(\d+)\/assignments$/,
    purpose: 'Assignments with this student\'s submission: what is done.',
  },
  {
    name: 'userActivity',
    pattern: /^\/api\/v1\/courses\/(\d+)\/analytics\/users\/(\d+|self)\/activity$/,
    purpose: 'Page views and participations: days since last activity.',
  },
  {
    name: 'activeCourses',
    pattern: /^\/api\/v1\/courses$/,
    purpose: 'Which course to open when no course id is configured.',
  },
  {
    name: 'self',
    pattern: /^\/api\/v1\/users\/self$/,
    purpose: 'The numeric id of the token\'s owner, needed by the activity path. Only the id is kept.',
  },
] as const

const allowedQueryKeys = new Set(['include[]', 'per_page', 'enrollment_state', 'page'])

const allowedQueryValues: Record<string, RegExp> = {
  'include[]': /^(items|submission)$/,
  per_page: /^\d{1,3}$/,
  enrollment_state: /^(active)$/,
  page: /^[\w-]{1,64}$/,
}

export interface AllowDecision {
  ok: boolean
  name?: string
  /** The exact path + query that will be sent to Canvas. */
  forward?: string
  reason?: string
}

/**
 * Decides whether `pathname?search` may be forwarded, and normalises it.
 *
 * The path is compared after URL decoding, so `%2e%2e` cannot slip past the
 * patterns, and the query is rebuilt from the allowed keys only, so nothing
 * the caller added beyond them survives.
 */
export function allow(pathname: string, search: string): AllowDecision {
  let path: string
  try {
    path = decodeURIComponent(pathname)
  } catch {
    return { ok: false, reason: 'malformed_path' }
  }
  if (path.includes('..') || path.includes('//')) return { ok: false, reason: 'malformed_path' }

  const match = allowedPaths.find((p) => p.pattern.test(path))
  if (!match) return { ok: false, reason: 'path_not_allowed' }

  const params = new URLSearchParams(search)
  const kept = new URLSearchParams()
  for (const [key, value] of params) {
    if (!allowedQueryKeys.has(key)) return { ok: false, reason: `query_not_allowed:${key}` }
    if (!allowedQueryValues[key].test(value)) return { ok: false, reason: `query_value_not_allowed:${key}` }
    kept.append(key, value)
  }

  const qs = kept.toString()
  return { ok: true, name: match.name, forward: qs ? `${path}?${qs}` : path }
}
