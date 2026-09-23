/**
 * A small HTTP layer on `node:http`: routing, CORS, rate limiting, logging.
 *
 * Why not a framework: this process holds an institutional credential, and
 * the fewer third-party packages that run inside it, the smaller the surface
 * a supply-chain incident can reach. Everything here is under two hundred
 * lines and uses only Node built-ins. If the project later wants Fastify,
 * the handlers in `routes/` take a plain `(req) => reply` shape that ports
 * without change.
 *
 * What is logged: method, path (without query), status, duration, a short
 * request id. What is never logged: headers, bodies, query strings, the
 * client's Canvas data. Query strings are dropped because Canvas paths can
 * carry ids that identify a person.
 */
import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http'
import { randomBytes } from 'node:crypto'

export interface Req {
  id: string
  method: string
  url: URL
  headers: IncomingMessage['headers']
  params: string[]
}

export interface Reply {
  status: number
  body?: unknown
  headers?: Record<string, string>
}

export type Handler = (req: Req) => Promise<Reply> | Reply

interface Route {
  method: 'GET' | 'POST'
  pattern: RegExp
  handler: Handler
}

export interface HttpOptions {
  allowedOrigins: string[]
  rateLimitPerMinute: number
  log: (line: Record<string, unknown>) => void
}

export const json = (status: number, body: unknown, headers?: Record<string, string>): Reply => ({
  status,
  body,
  headers,
})

/* --------------------------------------------------------------- limiter */

/**
 * Fixed-window counter per client address. Enough to stop a runaway loop in
 * a buggy extension from hammering Canvas with the institution's token,
 * which is the failure this actually guards against.
 */
class RateLimiter {
  private readonly hits = new Map<string, { count: number; windowStart: number }>()
  private readonly perMinute: number

  constructor(perMinute: number) {
    this.perMinute = perMinute
  }

  allow(key: string, now = Date.now()): boolean {
    const entry = this.hits.get(key)
    if (!entry || now - entry.windowStart >= 60_000) {
      this.hits.set(key, { count: 1, windowStart: now })
      return true
    }
    entry.count += 1
    return entry.count <= this.perMinute
  }

  /** Forget stale windows so the map cannot grow without bound. */
  sweep(now = Date.now()) {
    for (const [k, v] of this.hits) if (now - v.windowStart >= 120_000) this.hits.delete(k)
  }
}

/* ---------------------------------------------------------------- server */

export class HttpApp {
  private readonly routes: Route[] = []
  private readonly limiter: RateLimiter
  readonly server: Server
  private readonly opts: HttpOptions

  constructor(opts: HttpOptions) {
    this.opts = opts
    this.limiter = new RateLimiter(opts.rateLimitPerMinute)
    this.server = createServer((req, res) => void this.dispatch(req, res))
    const sweep = setInterval(() => this.limiter.sweep(), 60_000)
    sweep.unref()
  }

  get(pattern: RegExp, handler: Handler) {
    this.routes.push({ method: 'GET', pattern, handler })
    return this
  }

  post(pattern: RegExp, handler: Handler) {
    this.routes.push({ method: 'POST', pattern, handler })
    return this
  }

  listen(port: number, host: string): Promise<void> {
    return new Promise((resolve) => this.server.listen(port, host, resolve))
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) =>
      this.server.close((err) => (err ? reject(err) : resolve())),
    )
  }

  private corsHeaders(origin: string | undefined): Record<string, string> | null {
    if (!origin) return {}
    if (!this.opts.allowedOrigins.includes(origin)) return null
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    }
  }

  private async dispatch(req: IncomingMessage, res: ServerResponse) {
    const started = process.hrtime.bigint()
    const id = randomBytes(4).toString('hex')
    const method = req.method ?? 'GET'
    const url = new URL(req.url ?? '/', 'http://faro.local')
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined

    const send = (reply: Reply) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'X-FARO-Request': id,
        ...(this.corsHeaders(origin) ?? {}),
        ...(reply.headers ?? {}),
      }
      res.writeHead(reply.status, headers)
      res.end(reply.body === undefined ? '' : JSON.stringify(reply.body))
      const ms = Number(process.hrtime.bigint() - started) / 1e6
      this.opts.log({ id, method, path: url.pathname, status: reply.status, ms: Math.round(ms) })
    }

    // Browser origin check first: a disallowed origin gets nothing, not even a 404.
    if (origin && this.corsHeaders(origin) === null) {
      return send(json(403, { error: 'origin_not_allowed' }))
    }

    if (method === 'OPTIONS') {
      return send({ status: 204 })
    }

    const client = req.socket.remoteAddress ?? 'unknown'
    if (!this.limiter.allow(client)) {
      return send(json(429, { error: 'rate_limited' }, { 'Retry-After': '60' }))
    }

    const route = this.routes.find((r) => r.method === method && r.pattern.test(url.pathname))
    if (!route) {
      const known = this.routes.some((r) => r.pattern.test(url.pathname))
      return send(json(known ? 405 : 404, { error: known ? 'method_not_allowed' : 'not_found' }))
    }

    const params = url.pathname.match(route.pattern)?.slice(1) ?? []
    try {
      const reply = await route.handler({ id, method, url, headers: req.headers, params })
      send(reply)
    } catch (err) {
      // Deliberately generic: the client never sees an internal message.
      this.opts.log({ id, level: 'error', error: err instanceof Error ? err.message : 'unknown' })
      send(json(500, { error: 'internal' }))
    }
  }
}
