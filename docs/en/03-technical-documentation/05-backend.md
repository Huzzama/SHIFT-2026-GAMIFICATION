# 5. The backend (`server/`)

A Node.js process, with no dependencies, that holds the Canvas token and serves the FARO API. It runs TypeScript directly (`node src/index.ts`, Node 22.18+).

## 5.1 Configuration (`env.ts`)

Read once at start-up, from `process.env` with a fallback to `server/.env`. The process **refuses to start** without `CANVAS_API_URL` and `CANVAS_ACCESS_TOKEN`, and without `https://` (except localhost).

| Variable | Default | What it is |
|---|---|---|
| `CANVAS_API_URL` | — (required) | `https://canvas.instructure.com` or `https://<institution>.instructure.com` |
| `CANVAS_ACCESS_TOKEN` | — (required) | Token of the student account |
| `FARO_COURSE_ID` | empty | Course to open; if absent, the first active enrolment |
| `FARO_HOST` | `127.0.0.1` | Listening interface |
| `FARO_PORT` | `3000` | Port |
| `FARO_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed browser origins, comma-separated |
| `FARO_RATE_LIMIT_PER_MINUTE` | `120` | Requests per minute per client |
| `FARO_CANVAS_TIMEOUT_MS` | `10000` | Maximum time for one Canvas call |
| `FARO_LOG_LEVEL` | `info` | `info` or `debug` |

`describe(env)` is the only representation of the configuration that may be printed or returned: Canvas host, port, origins and `tokenPresent: true`. Never the token.

## 5.2 Allow list (`allowlist.ts`)

Six patterns, each with its `purpose` written next to it. `allow(pathname, search)`:

1. Decodes the path (`%2e%2e` cannot escape).
2. Rejects `..` and `//`.
3. Looks for a matching pattern; if none, `path_not_allowed`.
4. Rebuilds the query with allowed keys only (`include[]`, `per_page`, `enrollment_state`, `page`) and validated values (`include[]` only `items` or `submission`; `enrollment_state` only `active`).
5. Returns the exact path that will be sent to Canvas.

This file **must match** `src/data/canvas/endpoints.ts` in the extension. If a path is added in one, it is added in the other, and its purpose is documented.

## 5.3 The Canvas call (`canvas.ts`)

`canvasGet(env, path)` is the only function that builds a request to Canvas:

- `GET`, `Authorization: Bearer`, `Accept: application/json`, `User-Agent: FARO/0.1 (read-only)`.
- `AbortController` with the configured timeout.
- `redirect: 'manual'`: a redirect is not followed (it could carry the token to another host).
- Follows `Link: rel="next"` to the end and concatenates arrays; maximum 50 pages.
- Before each page, verifies the URL is still on `env.canvasApiUrl`.
- Errors as `CanvasError { status, path, kind: 'http' | 'timeout' | 'network' }`. No response body.

## 5.4 The HTTP layer (`http.ts`)

`HttpApp` on top of `node:http`:

- **Router** by method and regular expression. Unknown path → `404`; known path with the wrong method → `405`.
- **CORS**: if there is an `Origin` and it is not in the list → `403 origin_not_allowed`, with no CORS headers. `OPTIONS` preflight → `204` with `GET, OPTIONS`.
- **Rate limit**: fixed window per remote address; when exceeded → `429` with `Retry-After: 60`. A sweep every minute discards old windows.
- **Headers** on every response: `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-FARO-Request: <id>`.
- **Log**: one JSON line per request with `id`, `method`, `path` (no query), `status`, `ms`. Internal errors are logged with their message and the client receives `500 internal`, never the detail.

Handlers have the shape `(req: Req) => Reply | Promise<Reply>`, with `json(status, body, headers?)` as a helper. That shape ports to Fastify unchanged.

## 5.5 Routes (`routes/`)

| Route | Handler | Response |
|---|---|---|
| `GET /health` | `app.ts` | `{ ok, service, uptimeSeconds, canvas: { host, mode: 'live', readOnly: true }, allowedEndpoints: [{ name, purpose }] }` |
| `GET /api/launch` | `launch.ts` | `{ courseId, courseName, userId, verified: false, source: 'config' \| 'enrollment' }`. Resolves `users/self` (keeps only the id) and the course from `FARO_COURSE_ID` or the first active enrolment. Cached in memory. Invalid token → `502 canvas_token_rejected`. |
| `GET /canvas/api/v1/...` | `canvas.ts` | Allow list → `canvasGet` → full JSON. Headers `X-FARO-Canvas-Pages` and `X-FARO-Canvas-Endpoint`. Errors: `403` (not allowed), `401/403/404` (passed through from Canvas), `502 canvas_unreachable`, `504 canvas_timeout`. |
| `GET /lti/login`, `POST /lti/launch`, `GET /.well-known/jwks.json` | `lti.ts` | `501 lti_not_configured` with the missing step. The full flow specification is in the file's comments. |

## 5.6 Start-up (`index.ts`)

```text
[faro-server] listening on http://127.0.0.1:3000 -> Canvas canvas.instructure.com (read-only, token in memory only)
```

Without a valid `.env`:

```text
[faro-server] CANVAS_ACCESS_TOKEN is required
[faro-server] Copy server/.env.example to server/.env and fill it in.
```

`SIGINT` / `SIGTERM` close the server cleanly.

## 5.7 Tests (`test/`)

`fake-canvas.ts` is a fake Canvas that demands the Bearer, paginates with `Link` (2 rows per page to force several pages), and can answer `401` on analytics the way Canvas does for a student without the permission.

`e2e.ts` starts the backend on top of that Canvas and runs 20 checks. It runs with `npm test` and exits non-zero on the first failure. What it checks is, literally, what Book 1 claims.

## 5.8 Adding a Canvas path (procedure)

1. Justify it: which screen needs it and what minimum data it reads.
2. Add the function in `src/data/canvas/endpoints.ts` and the scope in `requiredScopes`.
3. Add the pattern and its `purpose` in `server/src/allowlist.ts`.
4. Declare only the fields that are read in `src/data/canvas/raw.ts`.
5. Add the fixture in `fixtures.ts` and the route in `fixtureRoutes` (`client.ts`).
6. Add the path to `fake-canvas.ts` and a check to `e2e.ts`.
7. Update Book 1 (chapter 2, data inventory) and this chapter.

If step 1 has no clear answer, the path is not added.
