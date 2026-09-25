# 5. The backend (`server/`)

A Node.js process, with no dependencies, that holds the Canvas token and the Gemini key, and serves the FARO API. It runs TypeScript directly (`node src/index.ts`, Node 22.18+). Canvas and the mentor are separately optional, but at least one must be configured.

## 5.1 Configuration (`env.ts`)

Read once at start-up, from `process.env` with a fallback to `server/.env`. The process **refuses to start**:

- with half a Canvas configuration (`CANVAS_API_URL` without `CANVAS_ACCESS_TOKEN`, or the other way round);
- with nothing to serve (neither Canvas nor `GEMINI_API_KEY`);
- with `CANVAS_API_URL` or `GEMINI_API_BASE` not using `https://` (except localhost).

With only `GEMINI_API_KEY`, it starts **mentor-only**: `/api/launch` and `/canvas/*` answer `503 canvas_not_configured`, and the extension stays in `mock` mode for Canvas.

| Variable | Default | What it is |
|---|---|---|
| `CANVAS_API_URL` | empty (optional, paired with the token) | `https://canvas.instructure.com` or `https://<institution>.instructure.com` |
| `CANVAS_ACCESS_TOKEN` | empty (optional, paired with the URL) | Token of the student account |
| `FARO_COURSE_ID` | empty | Course to open; if absent, the first active enrolment |
| `FARO_HOST` | `127.0.0.1` | Listening interface |
| `FARO_PORT` | `3000` | Port |
| `FARO_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed browser origins, comma-separated |
| `FARO_STRICT_ORIGINS` | empty (`false`) | `true` = accept only `FARO_ALLOWED_ORIGINS`, on loopback too (see 5.4) |
| `FARO_RATE_LIMIT_PER_MINUTE` | `120` | Requests per minute per client |
| `FARO_CANVAS_TIMEOUT_MS` | `10000` | Maximum time for one Canvas call |
| `FARO_LOG_LEVEL` | `info` | `info` or `debug` |
| `GEMINI_API_KEY` | empty (optional) | Gemini API key. Empty = mentor off; the extension uses its local mentor |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Model code. Names change: check `ai.google.dev/gemini-api/docs/models` |
| `GEMINI_TIMEOUT_MS` | `20000` | Maximum time for one Gemini call |
| `FARO_MENTOR_PER_MINUTE` | `20` | Model calls per minute per client (cost control), on top of the global limit |
| `GEMINI_API_BASE` | `https://generativelanguage.googleapis.com` | Tests only: point at a fake Gemini |

`describe(env)` is the only representation of the configuration that may be printed or returned: Canvas host (or `null`), port, origins, `tokenPresent` and `mentor: { provider: 'gemini', model }` (or `null`). Never the token or the key.

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
- **CORS**: if there is an `Origin` and it is not in the list → `403 origin_not_allowed`, with no CORS headers. `OPTIONS` preflight → `204` with `GET, POST, OPTIONS`. When the server listens on loopback (`FARO_HOST` = `127.0.0.1`, `localhost` or `::1`, the default), it also accepts any `chrome-extension://<32 letters a–p>` origin (`allowExtensionOrigins`), so the unpacked extension works without copying its id. It is turned off with `FARO_STRICT_ORIGINS=true`, and is only on when the server listens on loopback (not on e.g. `0.0.0.0`). In production: the exact id in `FARO_ALLOWED_ORIGINS` and `FARO_STRICT_ORIGINS=true`.
- **POST body**: `application/json` only (otherwise `415 json_required`), at most 32 KB (`MAX_BODY_BYTES`; otherwise `413 body_too_large`), valid JSON (otherwise `400 invalid_json`). The body is never logged or echoed in an error.
- **Rate limit**: fixed window per remote address; when exceeded → `429` with `Retry-After: 60`. A sweep every minute discards old windows.
- **Headers** on every response: `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-FARO-Request: <id>`.
- **Log**: one JSON line per request with `id`, `method`, `path` (no query), `status`, `ms`. Never headers, bodies or query strings: a mentor message is a student's own words. Internal errors are logged with their message and the client receives `500 internal`, never the detail.

Handlers have the shape `(req: Req) => Reply | Promise<Reply>`, with `json(status, body, headers?)` as a helper. That shape ports to Fastify unchanged.

## 5.5 Routes (`routes/`)

| Route | Handler | Response |
|---|---|---|
| `GET /health` | `app.ts` | `{ ok, service, uptimeSeconds, canvas: { host, mode: 'live', readOnly: true } \| null, mentor: { provider, model } \| null, allowedEndpoints: [{ name, purpose }] }` |
| `GET /api/launch` | `launch.ts` | `{ courseId, courseName, userId, verified: false, source: 'config' \| 'enrollment' }`. Resolves `users/self` (keeps only the id) and the course from `FARO_COURSE_ID` or the first active enrolment. Cached in memory. Invalid token → `502 canvas_token_rejected`. Without Canvas configured → `503 canvas_not_configured`. |
| `GET /canvas/api/v1/...` | `canvas.ts` | Allow list → `canvasGet` → full JSON. Headers `X-FARO-Canvas-Pages` and `X-FARO-Canvas-Endpoint`. Errors: `403` (not allowed), `401/403/404` (passed through from Canvas), `502 canvas_unreachable`, `504 canvas_timeout`; without Canvas configured, `503 canvas_not_configured`. |
| `POST /api/mentor` | `mentor.ts` | `{ text, suggestions, source: 'gemini' \| 'guardrail', model }`. See 5.6. |
| `GET /lti/login`, `POST /lti/launch`, `GET /.well-known/jwks.json` | `lti.ts` | `501 lti_not_configured` with the missing step. The full flow specification is in the file's comments. |

## 5.6 The mentor (`mentor.ts`, `routes/mentor.ts`)

`POST /api/mentor` answers the Mentor's open conversation with Google Gemini. Three things live in `mentor.ts` and nowhere else.

**1. `sanitizeMentorRequest` — the second privacy boundary.** The request is `{ message, context, history?, mode? }`. It is rebuilt from scratch:

- `context`: only the eleven `MentorContext` fields (`course`, `progress`, `next_activity`, `estimated_time`, `student_goal`, `destination`, `available_time`, `momentum`, `friction_state`, `style`, `language`). Enums are checked against their list, numbers are clamped, texts are capped (`LIMITS`); any extra field is dropped.
- `history`: the last 8 turns (`LIMITS.historyTurns`), only `role` (`student` or `faro`) and `text`.
- `mode`: `chat`, `teach`, `focus`, `recovery` or `planning` (default `chat`).
- An invalid field → `400 invalid_request`.

**2. `systemPrompt(context, mode)` — the rules are the product.** Rules that do not change with voice or mode: guide and never produce graded work; never label the student (no "at risk", no overdue counts); at most 90 words, plain text, at most one question; ask more than tell; calm, no cheerleading; when motivation is low, quote the destination the student wrote; only use the facts in the context; deadlines, extensions and grades belong to the institution; in a crisis, respond with care, stop the study talk and point to the university's student support or emergency services. Each mode adds its own text; for example, TEACH MODE: explain in at most three sentences with an everyday example, ask exactly one check question, then evaluate and adapt. The reply is requested as JSON `{ text, suggestions (≤ 3) }`; a prose reply is also accepted (`parseReply`).

**3. `callGemini` — a single call.** `POST {GEMINI_API_BASE}/v1beta/models/{GEMINI_MODEL}:generateContent` with the key **only in the `x-goog-api-key` header**, never in the URL; `AbortSignal.timeout(GEMINI_TIMEOUT_MS)`; the model's "thought" parts are dropped. Gemini's error body is never read into a message or a log.

**Order in the route:** no key → `503`; invalid request → `400`; a "do my graded work" request → a fixed server answer, `source: 'guardrail'`, **without calling the model** (no cost, same answer every time); per-client cap → `429`; then Gemini.

**Codes the extension falls back to the local mentor on:**

| Code | When |
|---|---|
| `503 mentor_not_configured` | No `GEMINI_API_KEY` |
| `502 mentor_key_rejected` | Google refused the key (401/403) |
| `502 mentor_upstream` | Any other Gemini error |
| `502 mentor_blocked` | The model's safety filter stopped the reply |
| `504 mentor_timeout` | Gemini did not answer in time |
| `429 mentor_rate_limited` | `FARO_MENTOR_PER_MINUTE` exceeded for that client |
| `400 invalid_request` | The body failed the allow list |

Plus the HTTP layer's: `413 body_too_large`, `415 json_required`.

**Logging:** nothing about the conversation is logged (not the message, not the reply, not the context), and the key never appears in logs or responses. The log line is the same as any route's.

## 5.7 Start-up (`index.ts`)

```text
[faro-server] listening on http://127.0.0.1:3000
[faro-server] Accepting the unpacked FARO extension (any chrome-extension:// origin, loopback only)
[faro-server] Canvas: canvas.instructure.com (read-only, token in memory only)
[faro-server] Mentor: Gemini gemini-3.5-flash (key in memory only)
```

The second line appears only when extension origins are accepted (loopback without `FARO_STRICT_ORIGINS=true`). If Canvas or the mentor is missing, its line says `not configured`. With an invalid configuration:

```text
[faro-server] Nothing to serve: set CANVAS_API_URL + CANVAS_ACCESS_TOKEN, GEMINI_API_KEY, or both
[faro-server] Copy server/.env.example to server/.env and fill it in.
```

`SIGINT` / `SIGTERM` close the server cleanly.

## 5.8 Tests (`test/`)

`fake-canvas.ts` is a fake Canvas that demands the Bearer, paginates with `Link` (2 rows per page to force several pages), and can answer `401` on analytics the way Canvas does for a student without the permission.

`fake-gemini.ts` is a fake Gemini: it demands the key in the header the way Google does, records every body and URL it receives so tests can check what would have left for Google, and answers whatever the test picks (JSON, prose, a safety block, an HTTP status or a delay).

`e2e.ts` starts the backend on top of those fakes and runs 38 checks: 21 for Canvas, CORS (including that an extension origin is refused when they are not enabled), logs and `.env`, and 17 for the mentor (including the call from the unpacked extension on loopback), the mentor-only mode and the configuration rules (loopback default, `FARO_STRICT_ORIGINS` and the `0.0.0.0` case). It runs with `npm test` and exits non-zero on the first failure. What it checks is, literally, what Book 1 claims.

## 5.9 Adding a Canvas path (procedure)

1. Justify it: which screen needs it and what minimum data it reads.
2. Add the function in `src/data/canvas/endpoints.ts` and the scope in `requiredScopes`.
3. Add the pattern and its `purpose` in `server/src/allowlist.ts`.
4. Declare only the fields that are read in `src/data/canvas/raw.ts`.
5. Add the fixture in `fixtures.ts` and the route in `fixtureRoutes` (`client.ts`).
6. Add the path to `fake-canvas.ts` and a check to `e2e.ts`.
7. Update Book 1 (chapter 2, data inventory) and this chapter.

If step 1 has no clear answer, the path is not added.
