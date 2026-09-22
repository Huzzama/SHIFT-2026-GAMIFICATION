/**
 * How a Canvas request is actually made — and the log that proves it.
 *
 * Two implementations behind one interface:
 *
 *  - `HttpCanvasTransport` is the real one. It sends the bearer token,
 *    follows Canvas's `Link` header pagination, and is what runs against an
 *    institutional Canvas. It is not exercised in the prototype because
 *    there is no Canvas to call, but it is the code that would run, not a
 *    sketch of it.
 *  - `MockCanvasTransport` answers the same paths from fixtures, with the
 *    same pagination behaviour and a little latency. Swapping one for the
 *    other changes one line in `config.ts` and nothing above it.
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

/**
 * Parses Canvas's `Link` header to find the next page.
 *
 * Canvas returns `<https://…/modules?page=2>; rel="next", <…>; rel="last"`.
 * Following `rel="next"` is the documented way to page; guessing `?page=n+1`
 * is not, and breaks on endpoints that use bookmark cursors.
 */
export function nextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  for (const part of linkHeader.split(',')) {
    const [urlPart, relPart] = part.split(';')
    if (relPart && relPart.includes('rel="next"')) {
      return urlPart.trim().replace(/^<|>$/g, '')
    }
  }
  return null
}

export class HttpCanvasTransport implements CanvasTransport {
  readonly mode = 'http' as const

  constructor(private readonly config: CanvasConfig) {}

  async get<T>(path: string): Promise<T> {
    const started = performance.now()
    let url: string | null = `${this.config.baseUrl}${path}`
    let merged: unknown[] | null = null
    let single: unknown = null
    let status = 0

    try {
      while (url) {
        const res: Response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            Accept: 'application/json+canvas-string-ids',
          },
        })
        status = res.status
        if (!res.ok) throw new Error(`Canvas ${res.status} on ${path}`)

        const body: unknown = await res.json()
        if (Array.isArray(body)) {
          merged = merged ? [...merged, ...body] : body
          url = nextPageUrl(res.headers.get('Link'))
        } else {
          single = body
          url = null
        }
      }

      const data = (merged ?? single) as T
      logRequest({
        at: new Date().toISOString(),
        method: 'GET',
        path,
        mode: 'http',
        status,
        ms: Math.round(performance.now() - started),
        items: merged?.length,
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
