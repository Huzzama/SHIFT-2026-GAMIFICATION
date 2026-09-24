# 1. Architecture

## 1.1 The pieces

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Canvas LMS                                   academic source of truth   │
│  courses · modules · assignments · submissions · student activity        │
└───────────────────────────────▲──────────────────────────────────────────┘
                                │ HTTPS · Authorization: Bearer · GET only
                                │ 6 allowed paths · Link pagination
┌───────────────────────────────┴──────────────────────────────────────────┐
│  FARO Backend  (server/, Node.js, no dependencies)                       │
│                                                                          │
│   env.ts ─── allowlist.ts ─── canvas.ts ─── http.ts ─── routes/          │
│   token       6 patterns       pagination    CORS        /health         │
│   config      + query          timeout       rate limit  /api/launch     │
│                                              logging     /canvas/*       │
│   mentor.ts ─ 11-field filter · prompt · Gemini ───────── /api/mentor     │
│                                                          /lti/* (501)    │
└───────────────────────────────▲──────────────────────────────────────────┘
                                │ HTTP · no credential · JSON already paginated
                                │ CORS by origin · Cache-Control: no-store
┌───────────────────────────────┴──────────────────────────────────────────┐
│  Extension  (src/, React + Vite, Manifest V3 side panel)                 │
│                                                                          │
│   data/canvas/      →  data/client.ts   →   lib/*          →   views/    │
│   transport (mock   →  CourseSnapshot   →   friction       →   Home      │
│    or backend)         (the seam)           journey            Journey   │
│   client (mapping)                          recoveryPlanner    Recovery  │
│   config (mode)                             points, community  Mentor…   │
│                                                                          │
│   state/store.tsx   chrome.storage.local (purpose, sessions, profile)    │
│   services/mentor   LocalMentorService · HybridMentorService (Gemini via │
│                     backend + local fallback) per VITE_MENTOR_MODE       │
└──────────────────────────────────────────────────────────────────────────┘
```

And, only when the AI mentor is on:

```text
 FARO Backend ──► Google Gemini       POST /v1beta/models/{model}:generateContent
                                      key only in the x-goog-api-key header
                                      11 fields + message + last 8 turns; no identity
```

## 1.2 The four principles the shape follows

**1. Canvas is the source of truth; FARO never copies or alters it.**
Every FARO open re-reads the course. There is no grade database in FARO, and there will not be: what FARO persists is what FARO creates (purpose, sessions, preferences).

**2. The credential lives in a single process.**
The backend exists for this reason. An extension is public code; a token inside it is a published token. The backend holds the token, decides which paths it accepts and returns JSON. The extension does not know which token exists or what the header is called. The same rule holds for the Gemini key: it lives on the backend, and the extension only knows `POST /api/mentor`.

**3. The seam is a type, not a class.**
`CourseSnapshot` (`src/data/client.ts`) is the only way course data enters the rest of the application. Everything above it (`lib/`, `views/`) works on that type and does not know whether it came from fixtures or an institution. That is why switching modes is an environment variable and not a rewrite.

**4. The logic does not know React exists.**
`src/lib/` are pure functions: data in, a decision out. They can be tested without mounting the interface, and can move to the backend unchanged when the friction engine must run on the server.

## 1.3 The two modes

| | `mock` | `http` |
|---|---|---|
| Chosen with | `VITE_CANVAS_MODE=mock` (default) | `VITE_CANVAS_MODE=http` |
| Who answers the Canvas paths | `MockCanvasTransport` with `fixtures.ts` | `BackendCanvasTransport` → backend → Canvas |
| Launch (course + person) | Fixed: course 4021, student 77120 | `GET /api/launch` to the backend |
| Study profile (measured rhythm) | Fixture: 35 min/session, 4 days/week | Absent; Recovery says so |
| Minutes estimate per activity | Fixture table | 20 min default for all |
| Needs a backend | No | Yes |

What does **not** change between modes: `client.ts` (the mapping), `lib/` (all the rules), `views/` (all the screens), `i18n/`. It is the same code against a different transport.

The mentor has its own switch, independent of Canvas's:

| | `local` | `gemini` |
|---|---|---|
| Chosen with | `VITE_MENTOR_MODE=local` (default) | `VITE_MENTOR_MODE=gemini` |
| Who answers open conversation | `LocalMentorService`, on the device | `HybridMentorService`: `HttpMentorService` → `POST /api/mentor` → Gemini; on failure, `LocalMentorService` |
| What leaves the device | Nothing | The 11-field context, the message and the last 8 turns, to the backend |
| Needs a backend | No | Yes, with `GEMINI_API_KEY` (Canvas may be unconfigured) |

In both modes, the mentor's structured moments (check-in, Focus, Way back, weekend plan, points, local Teach me) are computed in the extension with `lib/`; a model never decides them.

## 1.4 The flow of one open

1. `main.tsx` mounts `App` inside `StoreProvider`.
2. `store.tsx` reads `chrome.storage.local` (purpose, sessions, preferences, profile, the saved `weekPlan`).
3. `store.tsx` calls `faroClient.getCourseSnapshot()`.
4. `CanvasFaroClient` resolves the launch (`resolveLaunch`), issues the four requests in parallel and maps the responses to `CourseSnapshot`.
5. `store.tsx` derives everything else with `lib/`: friction, journey, next best action, recovery plan, points, achievements and the rhythm week (`week`).
6. `App.tsx` shows Purpose if there is no destination; otherwise the active tab.
7. If step 3 fails, `App.tsx` shows the error with a *Retry* button. A course is never invented.

## 1.5 What the backend does and does not do

**Does:** hold the token and the Gemini key, validate paths, talk to Canvas, paginate, rate-limit, restrict origins, log without personal data, resolve the launch in the pilot, and answer `POST /api/mentor` by calling Gemini with a re-checked context (chapter 5). Canvas and the mentor are separately optional: the backend can run mentor-only.

**Does not do yet [pending]:** persist FARO state (PostgreSQL), run the friction engine, store conversations (on purpose: they are not stored), verify LTI launches (the routes answer 501 with the specification in comments).

The rule for moving something to the backend: when it needs data from more than one device, when it needs a credential, or when it must be auditable by the institution. Until then, it stays in the extension.
