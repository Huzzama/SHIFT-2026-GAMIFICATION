# 6. Threat model and controls

A threat model answers three questions: what we want to protect, from whom, and what we have done about it. This table is the answer, threat by threat. The *Test* column names the automated check in `server/test/e2e.ts` when one exists.

## 6.1 Assets

1. **The Canvas token** — grants read access to its owner's record.
2. **The student's academic data** — progress, submissions, dates.
3. **The student's identity** — who the person behind a FARO session is.
4. **The integrity of the record** — nothing FARO does can alter Canvas.
5. **The student's trust** — that FARO does not turn into surveillance.
6. **The Gemini key** — when the AI mentor is on, it allows model calls billed to the institution's project.

## 6.2 Threats and controls

| # | Threat | Asset | Control | State | Test |
|---|---|---|---|---|---|
| T1 | An attacker extracts the credential from the extension's code (extensions are public code) | Token | There is no credential in the extension. `CanvasConfig` has no field for it. | [code] | — |
| T2 | A modified extension uses the backend to read any Canvas path | Data | Allow list of 6 paths in the backend; local `403` with no Canvas call | [code] | "a path outside the allow list is refused locally" |
| T3 | A modified extension tries to write to Canvas through the backend | Integrity | `GET` only; `405` for other methods; no write scopes | [code] | "a write is refused even on an allowed path" |
| T4 | Parameter tampering to widen Canvas's response (`all_dates`, `include[]=user`) | Data | Parameters and values validated; the rest refused | [code] | "an unknown query parameter is refused" |
| T5 | Encoded *path traversal* (`..%2F`) to escape the pattern | Data | Decoding before comparison; `..` and `//` refused | [code] | "path traversal is refused" |
| T6 | A malicious web page in the same browser calls the backend | Data | CORS with an origin list; unknown origin → `403` with no data | [code] | "a browser origin outside the list gets 403" |
| T7 | A request loop exhausts the Canvas quota and exposes the token to suspension | Token | Per-client rate limit, `429` | [code] | "rate limit trips after the configured burst" |
| T8 | The token appears in logs, errors or responses | Token | Logger without headers or query; errors without the Canvas body; `describe()` without the token | [code] | "health names the Canvas host and never the token", "log lines carry no query strings" |
| T9 | A tampered pagination `Link` redirects the token to another domain | Token | The backend verifies each page stays on the configured Canvas host | [code] | — |
| T10 | Network eavesdropping between backend and Canvas | Token, data | Mandatory HTTPS; the backend does not start with `http://` outside localhost | [code] | — |
| T11 | Impersonation: someone claims to be another student | Identity | Pilot: the backend infers identity from the token, not from the extension. Production: JWT signed by Canvas (LTI 1.3) | [code] / [pending] | "launch resolves the token owner" |
| T12 | Intermediate caches keep academic data | Data | `Cache-Control: no-store` on every response | [code] | "responses carry no-store and nosniff" |
| T13 | A compromised third-party package reads the token from the backend's memory | Token | Zero dependencies in the backend | [code] | — |
| T14 | The AI service receives personal data | Identity, trust | Eleven-field context built in a single function; no name, email, ids, grades. The backend rebuilds it (`sanitizeMentorRequest`) and drops any extra field; history capped at 8 turns | [code] | "mentor: extra fields in the context never reach Gemini", "mentor: history is trimmed to the last 8 turns" |
| T15 | FARO becomes a surveillance tool (who studies how much) | Trust | Aggregate presence in the data model; no ranking or followers; view counts discarded | [code] | — |
| T16 | A dropout-risk classification is exposed to the student | Trust | Friction states are internal; the interface uses supportive language; no risk score exists | [code] | — |
| T17 | An instructor or admin token in the pilot widens the blast radius of a leak | Token, data | Policy: the pilot uses **student-account tokens only** | Policy | — |
| T18 | The backend starts without a credential and serves empty data as if real | Trust | Refuses to start with half a Canvas configuration or with nothing to serve; in mentor-only mode the Canvas routes answer `503 canvas_not_configured`; with an invalid token answers `canvas_token_rejected` | [code] | "a wrong token is reported as rejected", "mentor-only server: Canvas routes say canvas_not_configured", "config: half a Canvas setup is refused, mentor-only is accepted" |
| T19 | A student account cannot read analytics and FARO invents activity | Trust | `401`/`403` is passed to the client; FARO uses submission dates and **says so on screen** | [code] | "Canvas 401 on analytics is passed through" |
| T20 | Theft of the `server/.env` file | Token, Gemini key | Scope limited to reading one student; one-click revocation in Canvas; key revocation in Google; the OAuth2 path removes the token from the file | Policy / [pending] | — |
| T21 | The Gemini key leaks through the URL, logs, a response or an error | Gemini key | Only in the `x-goog-api-key` header; never in the URL; `describe()` shows only provider and model; Google's error body is never echoed or logged | [code] | "mentor: the key goes in a header, never in the URL", "mentor: a rejected key and a safety block map to fallback codes", "mentor: the key and the conversation never appear in the log" |
| T22 | Mentor conversations end up in the backend logs | Identity, trust | The logger only receives method, path, status, duration and id; never bodies. Not the message, not the reply, not the context | [code] | "mentor: the key and the conversation never appear in the log" |
| T23 | A client triggers model calls in a loop and runs up cost | Gemini key | Per-client cap on model calls (`FARO_MENTOR_PER_MINUTE`, 20) on top of the global limit; 32 KB maximum body | [code] | "mentor: per-client cap answers 429 before calling the model", "mentor: a non-JSON body gets 415 and a huge body 413" |
| T24 | The mentor does the student's graded work | Trust, academic integrity | "Do my homework" requests are answered by the backend without calling the model; the system prompt forbids producing graded work | [code] | "mentor: "do my homework" is refused before any model call" |
| T25 | Google uses the conversations to improve its products, or human reviewers read them | Identity, trust | Policy: only keys from a project with active billing (paid services); never the free tier with real students (chapter 7) | Policy | — |

## 6.3 What this model does not cover yet

- **Authentication of the extension to the backend in production.** Today the backend trusts the origin (CORS) and listens only on `127.0.0.1`. In an institutional deployment, the session issued after the LTI launch is what authorises each call. **[pending]**
- **Encryption at rest** of the future database. **[pending]**
- **Access auditing** by the institution: who queried what and when. The backend logs path and status per request; persistence and a pseudonymous id are missing. **[pending]**
- **External security review.** This document is a self-assessment; an institutional pilot must include a review by the university's security team.
