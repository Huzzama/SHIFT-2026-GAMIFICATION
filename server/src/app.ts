/**
 * Assembles the server: routes on top of the HTTP layer.
 *
 * Kept separate from `index.ts` so tests can build the app against a fake
 * Canvas without starting the real process or touching `.env`.
 */
import { allowedPaths } from './allowlist.ts'
import type { Fetch } from './canvas.ts'
import { canvasEnabled, describe, type Env } from './env.ts'
import { HttpApp, json, type Handler } from './http.ts'
import { canvasRoute } from './routes/canvas.ts'
import { launchRoute } from './routes/launch.ts'
import { ltiJwks, ltiLaunch, ltiLogin } from './routes/lti.ts'
import { mentorRoute } from './routes/mentor.ts'

export interface AppOptions {
  env: Env
  /** Injected by tests; the real process uses global fetch. */
  fetchImpl?: Fetch
  /** Injected by tests for the Gemini call. */
  geminiFetch?: typeof fetch
  log?: (line: Record<string, unknown>) => void
}

const startedAt = Date.now()

export function buildApp({ env, fetchImpl, geminiFetch, log }: AppOptions): HttpApp {
  const app = new HttpApp({
    allowedOrigins: env.allowedOrigins,
    allowExtensionOrigins: env.allowExtensionOrigins,
    rateLimitPerMinute: env.rateLimitPerMinute,
    log: log ?? ((line) => console.log(JSON.stringify({ t: new Date().toISOString(), ...line }))),
  })

  app.get(/^\/health$/, () =>
    json(200, {
      ok: true,
      service: 'faro-server',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      canvas: canvasEnabled(env) ? { host: describe(env).canvasHost, mode: 'live', readOnly: true } : null,
      mentor: describe(env).mentor,
      allowedEndpoints: allowedPaths.map((p) => ({ name: p.name, purpose: p.purpose })),
    }),
  )

  // Without Canvas configured the server still runs (mentor only); these say why they are empty.
  const canvasOff: Handler = () => json(503, { error: 'canvas_not_configured' })
  app.get(/^\/api\/launch$/, canvasEnabled(env) ? launchRoute(env, fetchImpl) : canvasOff)
  app.get(/^\/canvas\/api\/v1\/.+/, canvasEnabled(env) ? canvasRoute(env, fetchImpl) : canvasOff)

  app.post(/^\/api\/mentor$/, mentorRoute(env, geminiFetch))

  app.get(/^\/lti\/login$/, ltiLogin)
  app.post(/^\/lti\/launch$/, ltiLaunch)
  app.get(/^\/\.well-known\/jwks\.json$/, ltiJwks)

  return app
}
