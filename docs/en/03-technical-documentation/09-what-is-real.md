# 9. What is real and what is simulated

This list exists so that nobody — not the jury, not an institution, not the team six months from now — believes the prototype does something it does not.

## Real and working

| Component | State |
|---|---|
| Backend with token, allow list, pagination, CORS, rate limit, logs without sensitive data | Implemented; 38 automated checks in total |
| Gemini mentor: `POST /api/mentor`, re-checked context, 8-turn history, guardrail answer without the model, fallback codes, key and conversation kept out of logs, mentor-only mode | Implemented; verified against a fake Gemini (17 of the 38 checks) and end to end in the browser against that fake, including fallback to the local mentor and auto-detection (`VITE_MENTOR_MODE=auto`: with the backend, Gemini answers; with the backend stopped, the local mentor). **Not exercised against Google's real API** from the development environment (the network policy blocked it); the team validates it with its own key. Model names change: check `GEMINI_MODEL` |
| Local mentor and structured moments (check-in, Focus, Way back, Teach me with the demo bank, weekend plan, points towards TecmiRewards) | Implemented; computed in the extension from real data, never by a model |
| How much time do you have?, the *Your plan* card, the rhythm week in Progress | Implemented (`timeSession.ts`, `rhythm.ts`) |
| Extension in `http` mode against the backend, with no credentials and no permission for `instructure.com` | Implemented; data layer verified end-to-end |
| Canvas-to-FARO mapping (modules from items, done from submission, orphans excluded) | Implemented and verified with paginated responses |
| Activity fallback from submissions when Canvas denies analytics, with an on-screen note | Implemented and verified |
| Error state with retry when the backend does not answer | Implemented |
| Friction engine, journey, next best action, planner, points, achievements, feed ranking, SOS routing, mentor contract | Implemented as pure functions; configurable thresholds |
| es/en i18n verified by the compiler | Implemented |
| Review cards | Flow and rules implemented; the question bank is hand-written for the demo course |
| Impact (formerly Rewards) | Rules implemented (semester track, tiers, one redemption per semester, path to the next milestone); **amounts, previous courses (16 activities and 6 modules each) and redemption simulated**. Prototype integration with TecmiRewards: FARO counts points and issues nothing; we found no public TecmiRewards API, so the integration must be validated with Tecmilenio |
| Live request log in Profile | Implemented |

## Ready to run, pending credentials

| Component | What is missing |
|---|---|
| Connection to Canvas Free-for-Teacher | A student token and the course id (chapter 6, 30 minutes) |
| Mentor with Gemini's real API | A key from a project with active billing in `server/.env`; in the default mode (`auto`) the extension detects it by itself (chapter 6.9) |

## Simulated, and labelled as such

| Component | What is missing |
|---|---|
| Course data in mock mode | Comes from `fixtures.ts`. The badge says *Simulated*. |
| Launch | `verified: false` in both modes. Live, course and person are inferred from the token; the panel says so. |
| Institutional account (SSO) | Does not exist. The screen labels it as simulated. |
| Community | Classmates, posts, rooms and mission are sample data. Rooms run on an accelerated clock for the demo. |
| Study profile (measured rhythm) | Mock only (35 min/session, 4 days/week). Live, absent and declared. |
| `estimated_minutes` | Does not exist in Canvas. Own table in mock; 20 min default live. |
| Teach me lessons without Gemini | They come from the question bank hand-written for the demo course; other courses have no local lessons. |

## Designed, with the specification in the code, not implemented

| Component | Where the specification is |
|---|---|
| LTI 1.3: `/lti/login`, `/lti/launch`, `/.well-known/jwks.json` | `server/src/routes/lti.ts`; chapter 7 |
| OAuth2 per student | Chapter 7.3; scopes in `endpoints.ts` |
| PostgreSQL and cross-device sync | Project instructions; chapter 7.4 |
| Warning on the destination sentence | Book 1, chapter 5.2 |

## The honesty rule

No validation figure in this project is invented. Where there is no measurement, the documents say *to be measured*. The friction thresholds are prototype rules, configurable, and are not presented as scientifically validated. What is claimed as implemented has code and, when verifiable, a test that can be run.
