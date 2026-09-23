/**
 * How a Canvas request is actually made — and the log that proves it.
 *
 * Two implementations behind one interface:
 *
 *  - `BackendCanvasTransport` is the real one. It sends the Canvas path to
 *    the FARO backend (`server/`), which checks it against its allow list,
 *    attaches the institutional token, follows Canvas's pagination and
 *    returns the merged JSON. The extension holds no credential and sends
 *    none: there is no `Authorization` header in this file, on purpose.
 *  - `MockCanvasTransport` answers the same paths from fixtures, with a
 *    little latency. Swapping one for the other is a build-time variable
 *    (`VITE_CANVAS_MODE`) and changes nothing above this layer.
 *
 * Every request either one makes goes through `logRequest`, and the Profile
 * screen renders that log. That matters more than it looks: it is the
 * difference between claiming an integration and showing one. A reviewer can
 * open FARO and read the exact Canvas paths being called.
 */
import type { CanvasConfig } from './config'

export interface CanvasRequestRecord {
  at: string
  method: 'GET'
  path: string
  mode: 'mock' | 'http'
  status: number
  /** Round-trip time in ms. */
  ms: number
  /** Rows returned, for list endpoints. */
  items?: number
  error?: string
}

/** Last 30 requests, newest first. Memory only — never persisted, never sent anywhere. */
const log: CanvasRequestRecord[] = []
const listeners = new Set<(l: CanvasRequestRecord[]) => void>()
const LOG_MAX = 30

function logRequest(record: CanvasRequestRecord) {
  log.unshift(record)
  if (log.length > LOG_MAX) log.length = LOG_MAX
  listeners.forEach((fn) => fn([...log]))
}

export const canvasLog = {
  all: () => [...log],
  subscribe(fn: (l: CanvasRequestRecord[]) => void) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
  clear() {
    log.length = 0
    listeners.forEach((fn) => fn([]))
  },
}

export interface CanvasTransport {
  readonly mode: 'mock' | 'http'
  /** One GET, paginated to completion when Canvas says there is more. */
  get<T>(path: string): Promise<T>
}

/* ------------------------------------------------------------------ real */

/** A non-2xx answer from the backend (or from Canvas, passed through it). */
export class CanvasHttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, path: string) {
    super(`FARO backend ${status} (${code}) on ${path.split('?')[0]}`)
    this.status = status
    this.code = code
  }
}

export class BackendCanvasTransport implements CanvasTransport {
  readonly mode = 'http' as const
  private readonly apiUrl: string

  constructor(config: CanvasConfig) {
    this.apiUrl = config.apiUrl
  }

  async get<T>(path: string): Promise<T> {
    const started = performance.now()
    let status = 0
    try {
      // The backend paginates; one round trip here is the whole answer.
      const res = await fetch(`${this.apiUrl}/canvas${path}`, {
        headers: { Accept: 'application/json' },
      })
      status = res.status
      if (!res.ok) {
        let code = 'error'
        try {
          code = String(((await res.json()) as { error?: string }).error ?? code)
        } catch {
          /* body was not JSON; keep the generic code */
        }
        throw new CanvasHttpError(res.status, code, path)
      }
      const data = (await res.json()) as T
      logRequest({
        at: new Date().toISOString(),
        method: 'GET',
        path,
        mode: 'http',
        status,
        ms: Math.round(performance.now() - started),
        items: Array.isArray(data) ? data.length : undefined,
      })
      return data
    } catch (err) {
      logRequest({
        at: new Date().toISOString(),
        method: 'GET',
        path,
        mode: 'http',
        status: status || 0,
        ms: Math.round(performance.now() - started),
        error: err instanceof Error ? err.message : 'unknown error',
      })
      throw err
    }
  }
}

/* ------------------------------------------------------------------ mock */

/** A fixture handler: given the path, return what Canvas would return. */
export type FixtureRoute = {
  /** Matched against the path, capture groups passed to `resolve`. */
  match: RegExp
  resolve: (groups: string[]) => unknown
}

export class MockCanvasTransport implements CanvasTransport {
  readonly mode = 'mock' as const

  constructor(
    private readonly routes: FixtureRoute[],
    /** Simulated round trip, so the UI's cached-first rendering stays honest. */
    private readonly latencyMs = 140,
  ) {}

  async get<T>(path: string): Promise<T> {
    const started = performance.now()
    await new Promise((r) => setTimeout(r, this.latencyMs))

    const route = this.routes.find((r) => r.match.test(path))
    if (!route) {
      logRequest({
        at: new Date().toISOString(),
        method: 'GET',
        path,
        mode: 'mock',
        status: 404,
        ms: Math.round(performance.now() - started),
        error: 'no fixture for this path',
      })
      throw new Error(`No Canvas fixture for ${path}`)
    }

    const groups = path.match(route.match)?.slice(1) ?? []
    const data = route.resolve(groups)

    logRequest({
      at: new Date().toISOString(),
      method: 'GET',
      path,
      mode: 'mock',
      status: 200,
      ms: Math.round(performance.now() - started),
      items: Array.isArray(data) ? data.length : undefined,
    })
    return data as T
  }
}
