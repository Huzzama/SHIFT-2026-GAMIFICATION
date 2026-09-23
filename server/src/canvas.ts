/**
 * The one function that talks to Canvas.
 *
 * It attaches the token, follows `Link` pagination to the end, and returns
 * the merged result. Nothing else in the server constructs a request to
 * Canvas, which is what makes "every call is a GET with these headers" a
 * statement about the code rather than a hope about it.
 *
 * Pagination follows `rel="next"` from the `Link` header because that is the
 * documented contract; guessing `?page=n+1` breaks on endpoints that page
 * with opaque bookmarks.
 *
 * Errors carry the Canvas status code and the path, never the response body:
 * Canvas error bodies can echo request details, and the token must not end
 * up in a log line by way of an exception message.
 */
import type { Env } from './env.ts'

export class CanvasError extends Error {
  readonly status: number
  readonly path: string
  readonly kind: 'http' | 'timeout' | 'network'

  constructor(status: number, path: string, kind: 'http' | 'timeout' | 'network') {
    super(`Canvas ${kind} ${status} on ${path.split('?')[0]}`)
    this.status = status
    this.path = path
    this.kind = kind
  }
}

export interface CanvasResult<T = unknown> {
  status: number
  data: T
  /** Pages fetched to assemble `data`. 1 for single objects. */
  pages: number
}

export function nextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  for (const part of linkHeader.split(',')) {
    const [urlPart, ...rels] = part.split(';')
    if (rels.some((r) => r.trim() === 'rel="next"')) {
      return urlPart.trim().replace(/^<|>$/g, '')
    }
  }
  return null
}

/** Hard ceiling on pages per call. A course with 5,000 assignments is a data error, not a use case. */
const MAX_PAGES = 50

export type Fetch = typeof fetch

export async function canvasGet<T = unknown>(
  env: Env,
  pathWithQuery: string,
  fetchImpl: Fetch = fetch,
): Promise<CanvasResult<T>> {
  let url: string | null = `${env.canvasApiUrl}${pathWithQuery}`
  let merged: unknown[] | null = null
  let single: unknown = null
  let status = 0
  let pages = 0

  while (url && pages < MAX_PAGES) {
    // Pagination links must stay on the configured Canvas host. A `Link`
    // header pointing elsewhere would otherwise carry the token off-site.
    if (!url.startsWith(env.canvasApiUrl + '/')) {
      throw new CanvasError(0, pathWithQuery, 'network')
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), env.canvasTimeoutMs)
    let res: Response
    try {
      res = await fetchImpl(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${env.canvasAccessToken}`,
          Accept: 'application/json',
          'User-Agent': 'FARO/0.1 (+learning-persistence; read-only)',
        },
        signal: controller.signal,
        redirect: 'manual',
      })
    } catch (err) {
      clearTimeout(timer)
      const aborted = err instanceof Error && err.name === 'AbortError'
      throw new CanvasError(0, pathWithQuery, aborted ? 'timeout' : 'network')
    }
    clearTimeout(timer)

    status = res.status
    pages += 1
    if (!res.ok) throw new CanvasError(res.status, pathWithQuery, 'http')

    const body: unknown = await res.json()
    if (Array.isArray(body)) {
      merged = merged ? merged.concat(body) : body
      url = nextPageUrl(res.headers.get('link'))
    } else {
      single = body
      url = null
    }
  }

  return { status, data: (merged ?? single) as T, pages }
}
