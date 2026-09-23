/**
 * GET /canvas/api/v1/... - the read-only, allow-listed Canvas proxy.
 *
 * The extension asks for a Canvas path; this route checks it against the
 * allow list, forwards it with the institutional token, follows pagination,
 * and returns the merged JSON. The extension never sees the token and never
 * chooses a path the allow list does not name.
 *
 * Canvas errors are passed through as their status code with a stable error
 * string, so the extension can tell "this student may not view analytics"
 * (401/403) from "the course does not exist" (404) and react honestly, for
 * instance by falling back to submission dates for activity.
 */
import { allow } from '../allowlist.ts'
import { canvasGet, CanvasError, type Fetch } from '../canvas.ts'
import type { Env } from '../env.ts'
import { json, type Handler } from '../http.ts'

const PREFIX = '/canvas'

export function canvasRoute(env: Env, fetchImpl?: Fetch): Handler {
  return async (req) => {
    const pathname = req.url.pathname.slice(PREFIX.length)
    const decision = allow(pathname, req.url.search)
    if (!decision.ok || !decision.forward) {
      return json(403, { error: decision.reason ?? 'path_not_allowed' })
    }

    try {
      const result = await canvasGet(env, decision.forward, fetchImpl)
      return json(200, result.data, {
        'X-FARO-Canvas-Pages': String(result.pages),
        'X-FARO-Canvas-Endpoint': decision.name ?? '',
      })
    } catch (err) {
      if (err instanceof CanvasError) {
        if (err.kind === 'timeout') return json(504, { error: 'canvas_timeout' })
        if (err.kind === 'network') return json(502, { error: 'canvas_unreachable' })
        // 401/403/404 from Canvas keep their code: they mean something to the client.
        const status = [401, 403, 404].includes(err.status) ? err.status : 502
        return json(status, { error: 'canvas_error', canvasStatus: err.status })
      }
      throw err
    }
  }
}
