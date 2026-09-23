# 4. The Canvas layer in the extension (`src/data/canvas/`)

Seven files. It is the only part of the extension that knows Canvas exists.

## 4.1 `endpoints.ts` — the audit surface

The paths FARO uses, each built from one function:

```text
course(id)             GET /api/v1/courses/:id
modules(id)            GET /api/v1/courses/:id/modules?include[]=items&per_page=100
assignments(id)        GET /api/v1/courses/:id/assignments?include[]=submission&per_page=100
userActivity(id, uid)  GET /api/v1/courses/:id/analytics/users/:uid/activity
activeCourses()        GET /api/v1/courses?enrollment_state=active&per_page=100
self()                 GET /api/v1/users/self          (backend only, when resolving the launch)
```

And two lists for the Canvas administrator: `requiredScopes` in the developer key's `url:GET|/api/v1/...` form, and `ltiScopes` with what FARO requests (`contextmembership.readonly`, `result.readonly`) and what it refuses (`score`, `lineitem`).

`PER_PAGE = 100` is Canvas's maximum: fewer round trips, same data.

## 4.2 `raw.ts` — Canvas's shape

`snake_case` types that declare **only the fields FARO reads**. Canvas sends many more; they are ignored rather than modelled, so a new Canvas release that adds fields cannot break this layer. When this file and the Canvas documentation disagree, the difference should be visible: that is why it is not translated into the code style.

Important fields:

- `RawModule.items` — present when `include[]=items` was requested. Each item has `content_id` (the id of the assignment it points at) and `completion_requirement.completed` (whether *this* student met it).
- `RawModule.state` — `locked | unlocked | started | completed`. **Only present if the caller is a student in the course.** An instructor does not see it.
- `RawAssignment.submission` — present with `include[]=submission`. A `workflow_state: 'unsubmitted'` is a stub that means *not done*.
- `RawUserActivity.page_views` — an object whose keys are ISO dates rounded to the hour and whose values are counts. FARO keeps the keys and discards the values.

## 4.3 `transport.ts` — how the request is made

One interface, two implementations:

```ts
interface CanvasTransport {
  readonly mode: 'mock' | 'http'
  get<T>(path: string): Promise<T>
}
```

**`MockCanvasTransport`** — looks the path up in a list of patterns (`fixtureRoutes` in `client.ts`), waits 140 simulated ms and returns the fixture. A path with no pattern produces **404 in the log**, exactly like a wrong path against a real Canvas. A typo in `endpoints.ts` shows; it is not hidden.

**`BackendCanvasTransport`** — does `fetch(`${apiUrl}/canvas${path}`)` with no authorisation header. The backend paginates; here a single round trip is the whole answer. A non-2xx status throws `CanvasHttpError` with the code and the `error` from the backend's JSON body (`path_not_allowed`, `canvas_error`, `canvas_unreachable`…).

**`canvasLog`** — an in-memory ring buffer of 30 records (`at`, `method`, `path`, `mode`, `status`, `ms`, `items`, `error`). The Profile panel subscribes and draws it. It is never persisted or sent. It is the difference between claiming an integration and showing one.

## 4.4 `client.ts` — the mapping

`CanvasFaroClient.getCourseSnapshot()`:

1. Resolves the launch (`courseId`, `userId`).
2. Issues the four requests in parallel with `Promise.all`.
3. If the activity one fails with 401/403, not everything fails: it sets `integrationStatus.activityFallback = true` and returns `null` for that part. Any other error does propagate.
4. Walks the modules and their items to build two maps: `moduleOfAssignment` (from `content_id` to module id, only for `Assignment` or `Quiz` items) and `completedByModule`.
5. Filters the assignments down to those some module item points at. **An assignment with no module item is not on the route**: Canvas allows loose assignments, and putting them on the journey would invent structure the teacher did not create.
6. Maps each assignment: `submission` is kept only if `workflow_state !== 'unsubmitted'` and there is a `submitted_at`. That is: **done is what the submission says, not the due date**.
7. Maps activity to timestamped events; or, in the fallback, derives events from the student's own submission dates.
8. `estimated_minutes` comes from the injected estimate function: the fixture table in mock mode, `undefined` (→ 20 min default) in http mode, because fixture ids would match real ids by coincidence.
9. `profile` (measured rhythm) exists only in mock mode. Live, FARO is honest about not knowing the student's rhythm yet.

Three decisions a careless integrator would get backwards, named at the top of the file: module membership comes from the items, not the assignment; "done" comes from the submission, not the date; estimated minutes are FARO's and are stated as such.

## 4.5 `config.ts` — mode and launch

```ts
canvasConfig = {
  mode:   VITE_CANVAS_MODE === 'http' ? 'http' : 'mock',
  apiUrl: VITE_FARO_API_URL ?? 'http://127.0.0.1:3000',
}
```

There is no token field and there cannot be one.

`resolveLaunch()` returns the `LaunchContext` (course, name, person, `verified`, `source`). In mock it is immediate (`source: 'fixture'`). In http it calls `GET /api/launch` once and caches it; `currentLaunch()` and `onLaunch()` let the Profile panel update when it arrives.

`verified` is `false` in both modes today. Only a signed LTI launch will set it to `true`, and the panel says so.

## 4.6 `status.ts` — behaviour flags

An observable object with `activityFallback`. It exists so a fallback does not pass silently as if it were the real thing: the Profile panel shows the note *"your account cannot read Canvas analytics, so activity is derived from the dates of your own submissions"*.

## 4.7 `fixtures.ts` — the demo course

A course in Spanish, *Gestión de Proyectos* (GP-101), 6 modules, 16 activities, in the exact shape Canvas sends. The scenario: an adult five weeks into a course, who stopped logging in `DAYS_INACTIVE = 5` days ago, with `DAYS_UNTIL_COURSE_ENDS = 12` days until the close. It is the exact moment FARO exists for.

With these fixtures the expected numbers are: 16 activities, 7 completed (44%), 9 remaining (4 h 35 min), 12 days, 5 without activity, module 3 started, module 5 locked, state FRICTION.

## 4.8 Switching modes

```bash
# .env.local in the root (git ignores it)
VITE_CANVAS_MODE=http
VITE_FARO_API_URL=http://127.0.0.1:3000
```

`npm run dev` or `npm run build`. No code file changes.
