# 8. Verification and tests

## 8.1 What is verified automatically

`cd server && npm test` starts a fake Canvas with real pagination and the backend on top, and runs these 20 checks:

```text
ok  health names the Canvas host and never the token
ok  launch resolves the token owner and the first active course
ok  course proxy returns the Canvas object
ok  modules are paginated by Canvas and merged by the backend
ok  assignments carry submissions across three pages
ok  activity is forwarded for the token owner
ok  a path outside the allow list is refused locally (no Canvas call)
ok  a write is refused even on an allowed path
ok  an unknown query parameter is refused
ok  path traversal is refused
ok  a browser origin outside the list gets 403 and no data
ok  CORS preflight succeeds for an allowed origin
ok  responses carry no-store and nosniff
ok  Canvas 404 is passed through as 404
ok  the token was sent to Canvas on every call, and only there
ok  log lines carry no query strings
ok  rate limit trips after the configured burst
ok  Canvas 401 on analytics is passed through so the client can fall back
ok  a wrong token is reported as rejected, not as a generic failure
ok  .env parser handles comments, quotes and CRLF

20 checks passed
```

It uses no test framework: `node:assert` and a ten-line `check(name, fn)`. The process exits non-zero on the first failure, so it works as a CI step.

## 8.2 What was verified of the extension's mapping

In addition, the `src/data/canvas/` layer was compiled and run in Node against the same fake Canvas and the real backend, in the four scenarios that matter:

| Scenario | Expected and obtained result |
|---|---|
| **Mock** | 16 activities, 7 completed, 4 fixture calls, launch `fixture`, study profile present |
| **Http through the backend** | Course GP-101, 3 modules (the third `locked`), 5 assignments (orphan 999 excluded), 3 with a submission, correct `module_id`, `course_id` from the live course, 20 min default, 3 activity events ordered newest first, **no** study profile, `activityFallback = false`, 4 calls with 200 |
| **Analytics forbidden (401)** | `activityFallback = true`, activity derived from 3 submissions, the analytics path with 401 in the log, no call to `/enrollments` |
| **Backend down** | `getCourseSnapshot()` rejects; it never returns an empty course |

This script is not in the repository because it depends on compiling the extension without Vite; the scenarios are described here so they can be reproduced.

## 8.3 Manual verification in the interface

With the fixtures (mock mode), the app must show exactly:

| Data | Value |
|---|---|
| Total activities | 16 |
| Completed | 7 |
| Progress | 44% |
| Remaining | 9 activities, 4 h 35 min |
| Days until the close | 12 |
| Days without activity | 5 |
| Friction state | FRICTION |
| Module 3 | started |
| Module 5 | locked |

And in **Profile → Canvas**: *Simulated* badge, four GET paths, two refused scopes, a log with four `200` entries (~140 ms).

## 8.4 Break it on purpose

Three experiments with the fixtures, each with a result that must change:

1. **`DAYS_INACTIVE` from 5 to 9** → DISCONNECTION state, Home changes tone, Recovery offers a comeback mission. None of this is written in the views: it comes from the `disconnectionDays: 7` threshold.
2. **`DAYS_UNTIL_COURSE_ENDS` from 12 to 3** → *not realistic* verdict with all three strategies marked infeasible and work in overflow.
3. **A typo in a path in `endpoints.ts`** → 404 in the panel's log. The mock does not resolve by coincidence.

## 8.5 Typecheck

- Root: `npm run typecheck`. Requires a prior `npm install` (React, Vite). If it prints nothing after the two header lines, it passed.
- `server/`: `npm install && npm run typecheck`. Installs only `typescript` and `@types/node` as dev dependencies; the running backend still has no dependencies.

`en.ts` typed against `es.ts` makes a missing key in one language a compile error, not a blank text in the demo.

## 8.6 What is not tested yet

- The React interface against a real backend in a browser (the tests above cover the data layer, not the render). Covered by the procedure in chapter 6.
- The LTI routes (they answer 501 by design).
- Behaviour with large courses (more than 100 modules or assignments, i.e. more than one page of real Canvas). Pagination is tested with the fake Canvas; it is worth repeating against Free-for-Teacher with `per_page=2` forced in a test.
