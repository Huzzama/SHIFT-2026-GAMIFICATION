# 9. What is real and what is simulated

This list exists so that nobody — not the jury, not an institution, not the team six months from now — believes the prototype does something it does not.

## Real and working

| Component | State |
|---|---|
| Backend with token, allow list, pagination, CORS, rate limit, logs without sensitive data | Implemented; 20 automated checks |
| Extension in `http` mode against the backend, with no credentials and no permission for `instructure.com` | Implemented; data layer verified end-to-end |
| Canvas-to-FARO mapping (modules from items, done from submission, orphans excluded) | Implemented and verified with paginated responses |
| Activity fallback from submissions when Canvas denies analytics, with an on-screen note | Implemented and verified |
| Error state with retry when the backend does not answer | Implemented |
| Friction engine, journey, next best action, planner, points, achievements, feed ranking, SOS routing, mentor contract | Implemented as pure functions; configurable thresholds |
| es/en i18n verified by the compiler | Implemented |
| Live request log in Profile | Implemented |

## Ready to run, pending credentials

| Component | What is missing |
|---|---|
| Connection to Canvas Free-for-Teacher | A student token and the course id (chapter 6, 30 minutes) |

## Simulated, and labelled as such

| Component | What is missing |
|---|---|
| Course data in mock mode | Comes from `fixtures.ts`. The badge says *Simulated*. |
| Launch | `verified: false` in both modes. Live, course and person are inferred from the token; the panel says so. |
| Institutional account (SSO) | Does not exist. The screen labels it as simulated. |
| Community | Classmates, posts, rooms and mission are sample data. Rooms run on an accelerated clock for the demo. |
| Study profile (measured rhythm) | Mock only (35 min/session, 4 days/week). Live, absent and declared. |
| `estimated_minutes` | Does not exist in Canvas. Own table in mock; 20 min default live. |
| Mentor | Local and deterministic, no model. `HttpMentorService` exists in the extension; `POST /api/mentor` does not exist in the backend. |

## Designed, with the specification in the code, not implemented

| Component | Where the specification is |
|---|---|
| LTI 1.3: `/lti/login`, `/lti/launch`, `/.well-known/jwks.json` | `server/src/routes/lti.ts`; chapter 7 |
| OAuth2 per student | Chapter 7.3; scopes in `endpoints.ts` |
| PostgreSQL and cross-device sync | Project instructions; chapter 7.4 |
| Remote mentor behind the backend | `services/mentor.ts` (`HttpMentorService`); Book 1, chapter 5 |
| Warning on the destination sentence | Book 1, chapter 5.2 |

## The honesty rule

No validation figure in this project is invented. Where there is no measurement, the documents say *to be measured*. The friction thresholds are prototype rules, configurable, and are not presented as scientifically validated. What is claimed as implemented has code and, when verifiable, a test that can be run.
