/**
 * Assembles the server: routes on top of the HTTP layer.
 *
 * Kept separate from `index.ts` so tests can build the app against a fake
 * Canvas without starting the real process or touching `.env`.
 */
import { allowedPaths } from './allowlist.ts'
import type { Fetch } from './canvas.ts'
import { describe, type Env } from './env.ts'
import { HttpApp, json } from './http.ts'
import { canvasRoute } from './routes/canvas.ts'
import { launchRoute } from './routes/launch.ts'
import { ltiJwks, ltiLaunch, ltiLogin } from './routes/lti.ts'

export interface AppOptions {
  env: Env
  /** Injected by tests; the real process uses global fetch. */
  fetchImpl?: Fetch
  log?: (line: Record<string, unknown>) => void
}

const startedAt = Date.now()

export function buildApp({ env, fetchImpl, log }: AppOptions): HttpApp {
  const app = new HttpApp({
    allowedOrigins: env.allowedOrigins,
    rateLimitPerMinute: env.rateLimitPerMinute,
    log: log ?? ((line) => console.log(JSON.stringify({ t: new Date().toISOString(), ...line }))),
  })

  app.get(/^\/health$/, () =>
    json(200, {
      ok: true,
      service: 'faro-server',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      canvas: { host: describe(env).canvasHost, mode: 'live', readOnly: true },
      allowedEndpoints: allowedPaths.map((p) => ({ name: p.name, purpose: p.purpose })),
    }),
  )

  app.get(/^\/api\/launch$/, launchRoute(env, fetchImpl))
  app.get(/^\/canvas\/api\/v1\/.+/, canvasRoute(env, fetchImpl))

  app.get(/^\/lti\/login$/, ltiLogin)
  app.post(/^\/lti\/launch$/, ltiLaunch)
  app.get(/^\/\.well-known\/jwks\.json$/, ltiJwks)

  return app
}
