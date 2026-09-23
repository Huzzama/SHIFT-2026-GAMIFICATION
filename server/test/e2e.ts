/**
 * End-to-end checks: FARO backend in front of a fake Canvas.
 *
 * Run with `npm test` inside `server/`. No test framework: each check is a
 * line, and the process exits non-zero on the first failure. What is
 * checked is what the security documentation claims:
 *
 *   - the token reaches Canvas and never reaches the client
 *   - only allow-listed paths are forwarded; the rest are refused locally
 *   - pagination is followed to the end and merged
 *   - a disallowed browser origin is refused
 *   - Canvas's 401 on analytics is passed through, not hidden
 *   - the rate limit trips
 *   - nothing sensitive appears in the log
 */
import assert from 'node:assert/strict'
import { buildApp } from '../src/app.ts'
import { parseDotenv, type Env } from '../src/env.ts'
import { startFakeCanvas, fixtures } from './fake-canvas.ts'

const TOKEN = 'test-token-7f3a9c'
const ORIGIN = 'http://localhost:5173'

let passed = 0
function check(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1
      console.log(`  ok  ${name}`)
    })
    .catch((err) => {
      console.error(`  FAIL ${name}`)
      console.error(err)
      process.exit(1)
    })
}

async function run() {
  const canvas = await startFakeCanvas({ token: TOKEN, perPage: 2 })
  const logLines: Record<string, unknown>[] = []

  const env: Env = {
    canvasApiUrl: canvas.baseUrl,
    canvasAccessToken: TOKEN,
    courseId: null,
    host: '127.0.0.1',
    port: 0,
    allowedOrigins: [ORIGIN],
    rateLimitPerMinute: 40,
    canvasTimeoutMs: 3000,
    logLevel: 'info',
  }

  const app = buildApp({ env, log: (l) => logLines.push(l) })
  await app.listen(0, '127.0.0.1')
  const addr = app.server.address()
  const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`
  const get = (path: string, headers: Record<string, string> = {}) =>
    fetch(`${base}${path}`, { headers: { Origin: ORIGIN, ...headers } })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (res: Response): Promise<any> => res.json()

  console.log('FARO backend e2e')

  await check('health names the Canvas host and never the token', async () => {
    const res = await get('/health')
    assert.equal(res.status, 200)
    const text = await res.text()
    assert.ok(text.includes(new URL(canvas.baseUrl).host))
    assert.ok(!text.includes(TOKEN))
  })

  await check('launch resolves the token owner and the first active course', async () => {
    const res = await get('/api/launch')
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.deepEqual(body, {
      courseId: 4021,
      courseName: 'Gestión de Proyectos',
      userId: 77120,
      verified: false,
      source: 'enrollment',
    })
  })

  await check('course proxy returns the Canvas object', async () => {
    const res = await get('/canvas/api/v1/courses/4021')
    assert.equal(res.status, 200)
    assert.equal((await body(res)).course_code, 'GP-101')
  })

  await check('modules are paginated by Canvas and merged by the backend', async () => {
    const res = await get('/canvas/api/v1/courses/4021/modules?include[]=items&per_page=100')
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('x-faro-canvas-pages'), '2')
    const rows = await body(res)
    assert.equal(rows.length, fixtures.modules.length)
    assert.equal(rows[2].items[0].content_id, 301)
  })

  await check('assignments carry submissions across three pages', async () => {
    const res = await get('/canvas/api/v1/courses/4021/assignments?include[]=submission&per_page=100')
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('x-faro-canvas-pages'), '3')
    const rows = await body(res)
    assert.equal(rows.length, 6)
    assert.equal(rows.find((r: { id: number }) => r.id === 202).submission.workflow_state, 'unsubmitted')
  })

  await check('activity is forwarded for the token owner', async () => {
    const res = await get('/canvas/api/v1/courses/4021/analytics/users/77120/activity')
    assert.equal(res.status, 200)
    assert.equal(Object.keys((await body(res)).page_views).length, 2)
  })

  await check('a path outside the allow list is refused locally (no Canvas call)', async () => {
    const before = canvas.calls.length
    const res = await get('/canvas/api/v1/courses/4021/enrollments')
    assert.equal(res.status, 403)
    assert.equal((await body(res)).error, 'path_not_allowed')
    assert.equal(canvas.calls.length, before)
  })

  await check('a write is refused even on an allowed path', async () => {
    const res = await fetch(`${base}/canvas/api/v1/courses/4021`, { method: 'POST', headers: { Origin: ORIGIN } })
    assert.equal(res.status, 405)
  })

  await check('an unknown query parameter is refused', async () => {
    const res = await get('/canvas/api/v1/courses/4021/assignments?include[]=submission&all_dates=1')
    assert.equal(res.status, 403)
    assert.match((await body(res)).error, /query_not_allowed/)
  })

  await check('path traversal is refused', async () => {
    const res = await get('/canvas/api/v1/courses/4021/..%2F..%2Fusers')
    assert.equal(res.status, 403)
  })

  await check('a browser origin outside the list gets 403 and no data', async () => {
    const res = await get('/canvas/api/v1/courses/4021', { Origin: 'https://evil.example' })
    assert.equal(res.status, 403)
    assert.equal(res.headers.get('access-control-allow-origin'), null)
  })

  await check('CORS preflight succeeds for an allowed origin', async () => {
    const res = await fetch(`${base}/canvas/api/v1/courses/4021`, {
      method: 'OPTIONS',
      headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'GET' },
    })
    assert.equal(res.status, 204)
    assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN)
    assert.equal(res.headers.get('access-control-allow-methods'), 'GET, OPTIONS')
  })

  await check('responses carry no-store and nosniff', async () => {
    const res = await get('/canvas/api/v1/courses/4021')
    assert.equal(res.headers.get('cache-control'), 'no-store')
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
  })

  await check('Canvas 404 is passed through as 404', async () => {
    const res = await get('/canvas/api/v1/courses/9999')
    assert.equal(res.status, 404)
  })

  await check('the token was sent to Canvas on every call, and only there', () => {
    assert.ok(canvas.calls.length > 5)
    const dumped = JSON.stringify(logLines)
    assert.ok(!dumped.includes(TOKEN), 'token must not appear in logs')
  })

  await check('log lines carry no query strings', () => {
    assert.ok(logLines.every((l) => typeof l.path !== 'string' || !l.path.includes('?')))
  })

  await check('rate limit trips after the configured burst', async () => {
    let limited = 0
    for (let i = 0; i < 60; i += 1) {
      const res = await get('/health')
      if (res.status === 429) limited += 1
    }
    assert.ok(limited > 0, 'expected some 429s')
  })

  await app.close()
  canvas.server.close()

  // Second scenario: a student who may not view analytics.
  const strict = await startFakeCanvas({ token: TOKEN, analyticsForbidden: true })
  const app2 = buildApp({ env: { ...env, canvasApiUrl: strict.baseUrl }, log: () => {} })
  await app2.listen(0, '127.0.0.1')
  const addr2 = app2.server.address()
  const base2 = `http://127.0.0.1:${typeof addr2 === 'object' && addr2 ? addr2.port : 0}`

  await check('Canvas 401 on analytics is passed through so the client can fall back', async () => {
    const res = await fetch(`${base2}/canvas/api/v1/courses/4021/analytics/users/77120/activity`, {
      headers: { Origin: ORIGIN },
    })
    assert.equal(res.status, 401)
    assert.equal((await body(res)).error, 'canvas_error')
  })

  await check('a wrong token is reported as rejected, not as a generic failure', async () => {
    const app3 = buildApp({ env: { ...env, canvasApiUrl: strict.baseUrl, canvasAccessToken: 'wrong' }, log: () => {} })
    await app3.listen(0, '127.0.0.1')
    const a = app3.server.address()
    const b = `http://127.0.0.1:${typeof a === 'object' && a ? a.port : 0}`
    const res = await fetch(`${b}/api/launch`, { headers: { Origin: ORIGIN } })
    assert.equal(res.status, 502)
    assert.equal((await body(res)).error, 'canvas_token_rejected')
    await app3.close()
  })

  await check('.env parser handles comments, quotes and CRLF', () => {
    const parsed = parseDotenv('# c\r\nA=1\r\nB="two words"\r\nC=\'x\'\r\nbad\r\n')
    assert.deepEqual(parsed, { A: '1', B: 'two words', C: 'x' })
  })

  await app2.close()
  strict.server.close()

  console.log(`\n${passed} checks passed`)
}

void run()
