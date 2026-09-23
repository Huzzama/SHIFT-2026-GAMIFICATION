/**
 * A fake Canvas for the backend tests.
 *
 * It behaves like the real API in the ways the backend depends on: it
 * demands a bearer token, it pages list endpoints with a `Link` header,
 * and it answers 401 for the analytics endpoint when told that the caller
 * may not view analytics (which a student account often may not). It does
 * not try to be Canvas beyond that.
 */
import { createServer, type Server } from 'node:http'

export interface FakeCanvasOptions {
  token: string
  /** Rows per page for list endpoints. Small on purpose, to force pagination. */
  perPage?: number
  /** When true, the analytics endpoint answers 401 as Canvas does for a student without the permission. */
  analyticsForbidden?: boolean
}

export const fixtures = {
  self: { id: 77120, name: 'Estudiante Prueba', avatar_url: 'https://example.invalid/a.png' },
  courses: [
    { id: 4021, name: 'Gestión de Proyectos', course_code: 'GP-101', workflow_state: 'available', start_at: null, end_at: null },
  ],
  modules: [
    { id: 1, name: 'Módulo 1', position: 1, items_count: 2, state: 'completed', items: [
      { id: 11, module_id: 1, position: 1, title: 'Lectura', type: 'Assignment', content_id: 101, completion_requirement: { type: 'must_submit', completed: true } },
      { id: 12, module_id: 1, position: 2, title: 'Quiz', type: 'Quiz', content_id: 102, completion_requirement: { type: 'must_submit', completed: true } },
    ] },
    { id: 2, name: 'Módulo 2', position: 2, items_count: 2, state: 'started', items: [
      { id: 21, module_id: 2, position: 1, title: 'Caso', type: 'Assignment', content_id: 201, completion_requirement: { type: 'must_submit', completed: true } },
      { id: 22, module_id: 2, position: 2, title: 'Entrega', type: 'Assignment', content_id: 202, completion_requirement: { type: 'must_submit', completed: false } },
    ] },
    { id: 3, name: 'Módulo 3', position: 3, items_count: 1, state: 'locked', items: [
      { id: 31, module_id: 3, position: 1, title: 'Proyecto', type: 'Assignment', content_id: 301, completion_requirement: { type: 'must_submit', completed: false } },
    ] },
  ],
  assignments: [
    { id: 101, course_id: 4021, name: 'Lectura', due_at: null, points_possible: 10, submission: { id: 1, assignment_id: 101, user_id: 77120, submitted_at: '2026-09-01T10:00:00Z', score: 10, workflow_state: 'graded' } },
    { id: 102, course_id: 4021, name: 'Quiz', due_at: null, points_possible: 10, submission: { id: 2, assignment_id: 102, user_id: 77120, submitted_at: '2026-09-03T10:00:00Z', score: 8, workflow_state: 'graded' } },
    { id: 201, course_id: 4021, name: 'Caso', due_at: null, points_possible: 20, submission: { id: 3, assignment_id: 201, user_id: 77120, submitted_at: '2026-09-10T10:00:00Z', score: null, workflow_state: 'submitted' } },
    { id: 202, course_id: 4021, name: 'Entrega', due_at: '2026-09-20T23:59:00Z', points_possible: 20, submission: { id: 4, assignment_id: 202, user_id: 77120, submitted_at: null, score: null, workflow_state: 'unsubmitted' } },
    { id: 301, course_id: 4021, name: 'Proyecto', due_at: '2026-10-01T23:59:00Z', points_possible: 40, submission: { id: 5, assignment_id: 301, user_id: 77120, submitted_at: null, score: null, workflow_state: 'unsubmitted' } },
    // Not referenced by any module item: must be excluded by the extension's mapping.
    { id: 999, course_id: 4021, name: 'Huérfana', due_at: null, points_possible: 5, submission: { id: 6, assignment_id: 999, user_id: 77120, submitted_at: null, score: null, workflow_state: 'unsubmitted' } },
  ],
  activity: {
    page_views: { '2026-09-10T10:00:00Z': 4, '2026-09-10T11:00:00Z': 2 },
    participations: [{ created_at: '2026-09-10T10:20:00Z', url: 'https://example.invalid/x' }],
  },
}

export function startFakeCanvas(opts: FakeCanvasOptions): Promise<{ server: Server; baseUrl: string; calls: string[] }> {
  const perPage = opts.perPage ?? 2
  const calls: string[] = []

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://fake.local')
    calls.push(`${req.method} ${url.pathname}${url.search}`)

    const reply = (status: number, body: unknown, headers: Record<string, string> = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json', ...headers })
      res.end(JSON.stringify(body))
    }

    if (req.headers.authorization !== `Bearer ${opts.token}`) {
      return reply(401, { errors: [{ message: 'Invalid access token.' }] })
    }
    if (req.method !== 'GET') return reply(405, { error: 'method' })

    const paged = (rows: unknown[]) => {
      const page = Number(url.searchParams.get('page') ?? '1')
      const size = Math.min(Number(url.searchParams.get('per_page') ?? perPage), perPage)
      const start = (page - 1) * size
      const slice = rows.slice(start, start + size)
      const links: string[] = []
      const mk = (p: number) => {
        const u = new URL(url.toString())
        u.searchParams.set('page', String(p))
        u.searchParams.set('per_page', String(size))
        return `<${baseUrl}${u.pathname}${u.search}>`
      }
      links.push(`${mk(page)}; rel="current"`)
      if (start + size < rows.length) links.push(`${mk(page + 1)}; rel="next"`)
      links.push(`${mk(1)}; rel="first"`)
      links.push(`${mk(Math.max(1, Math.ceil(rows.length / size)))}; rel="last"`)
      return reply(200, slice, { Link: links.join(',') })
    }

    const p = url.pathname
    if (p === '/api/v1/users/self') return reply(200, fixtures.self)
    if (p === '/api/v1/courses') return paged(fixtures.courses)
    if (p === '/api/v1/courses/4021') return reply(200, fixtures.courses[0])
    if (p === '/api/v1/courses/4021/modules') return paged(fixtures.modules)
    if (p === '/api/v1/courses/4021/assignments') return paged(fixtures.assignments)
    if (/^\/api\/v1\/courses\/4021\/analytics\/users\/(77120|self)\/activity$/.test(p)) {
      if (opts.analyticsForbidden) return reply(401, { status: 'unauthorized' })
      return reply(200, fixtures.activity)
    }
    if (p === '/api/v1/courses/4021/enrollments') return reply(200, [{ secret: 'should never be reachable' }])
    return reply(404, { errors: [{ message: 'The specified resource does not exist.' }] })
  })

  let baseUrl = ''
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      baseUrl = `http://127.0.0.1:${port}`
      resolve({ server, baseUrl, calls })
    })
  })
}
