# 2. Trust architecture: where every piece of data lives

The question that matters most in a security review is not "which protocol do you use?" but "where is each piece of data and who can reach it?". This is the complete answer.

## 2.1 Trust zones

FARO has four zones. Each piece of data lives in exactly one, and crosses a boundary only for a documented reason.

| Zone | What it holds | Who has access | Trust |
|---|---|---|---|
| **Z1 · Canvas** | The whole academic record | The institution | Highest. FARO neither controls nor alters it. |
| **Z2 · FARO backend** | The Canvas token and, when the AI mentor is on, the Gemini key (both in memory), the configuration, a short-lived cache of the launch | The backend operator | High. It is the only process with credentials. It stores no conversations. |
| **Z3 · The student's browser** | Purpose, preferences, sessions recorded by FARO, optional profile, a snapshot of the course while the tab is open | The student | Medium. It is their own device. |
| **Z4 · AI service (Google Gemini)** | For each open message to the mentor: eleven context fields, the message and the last 8 turns of the conversation | Google, under the Gemini API terms (chapter 7) | Live only when the backend has `GEMINI_API_KEY` and the extension was not built with `VITE_MENTOR_MODE=local`. Reached only through the backend. Never receives identity. |

## 2.2 Data inventory

Each row answers: what it is, where it comes from, where it is stored, who sees it, how long it lasts.

### Data that comes from Canvas (Z1 → Z2 → Z3)

| Data | Canvas path | Stored in | Retention |
|---|---|---|---|
| Course name, code and end date | `GET /api/v1/courses/:id` | Browser memory while FARO is open | Discarded on close |
| Modules, their items and the student's completion state | `GET /api/v1/courses/:id/modules?include[]=items` | Same | Same |
| Assignments with the student's submission (date, state, score) | `GET /api/v1/courses/:id/assignments?include[]=submission` | Same | Same |
| Page views per hour and participations | `GET /api/v1/courses/:id/analytics/users/:uid/activity` | Same. **Only the timestamps are kept**; the view counts are discarded in the mapping. | Same |
| The student's active courses | `GET /api/v1/courses?enrollment_state=active` | Backend, only to pick the course when none is configured | One process |
| Numeric id of the token owner | `GET /api/v1/users/self` | Backend, cached. **Name and avatar in that response are discarded.** | One process |

**[code]** `src/data/canvas/endpoints.ts`, `src/data/canvas/client.ts` (`mapActivity`), `server/src/routes/launch.ts`.

### Data FARO creates (Z3)

| Data | Why it exists | Stored in | Leaves the browser |
|---|---|---|---|
| Purpose (goal + destination sentence + minutes/day) | Personalise the route and the mentor | `chrome.storage.local` | Goal, sentence and minutes are part of the mentor context. Nothing else. |
| Study sessions recorded by FARO | Momentum, achievements, points | `chrome.storage.local` | No |
| Finished review-card sets (date, question ids, first-try count) | Points and one offer per day | `chrome.storage.local` | No. Individual answers are not stored. |
| Reward redemption (tier, date) | One redemption per semester | `chrome.storage.local` | Not in the prototype (simulated). In production, to the institution so it can deliver the reward. |
| "Life happened" state | Choose the intervention | Memory | No |
| Plan accepted in the mentor (days, minutes, step ids and titles) | Show it on Home | `chrome.storage.local` (key `weekPlan`) | No. Computed locally; never goes through the model. |
| Mentor style, language, theme | Preferences | `chrome.storage.local` | Style and language are part of the mentor context |
| Name, photo (downsized), bio | Optional profile in Community | `chrome.storage.local` | Not to the mentor. In production, to other students in the course if the student enables it. |
| Conversation with the mentor | The current session | The extension's memory only; the backend does not store it | With the local mentor, no. When Gemini answers, each open message goes to Gemini through the backend, with the eleven-field context and the last 8 turns of the current conversation. The check-in, the plan, points and lessons without Gemini are resolved locally and are not sent to the model when they happen; their lines stay in the conversation, so they can be among the 8 turns that accompany a later open message. |

**[code]** `src/state/storage.ts`, `src/state/store.tsx`, `src/types/index.ts` (comments on `Profile`).

### Data that is never collected

This list matters as much as the ones above. FARO does **not** ask for, read or store:

- Canvas or institutional passwords.
- The student's email address.
- A list of classmates by name (the enrollments endpoint is not called; **[test]** the `/enrollments` path is refused).
- Submission contents (texts, files, exam answers).
- Other students' grades.
- Location, the student's IP address (the backend keeps only the client address for rate limiting, in memory, never persisted).
- Browsing history beyond the listed Canvas paths.

## 2.3 The boundaries and what crosses them

```text
 Z1 Canvas ──► Z2 Backend        backend's token; full response of the 6 paths
 Z2 Backend ──► Z3 Browser       Canvas JSON, already paginated; NEVER the token; NEVER Canvas headers
 Z3 Browser ──► Z2 Backend       the requested path (no credential); the backend checks it against the allow list
 Z3 Browser ──► Z2 ──► Z4 AI     [when enabled] 11 fields + the message + last 8 turns; NEVER name, email, photo, ids, grades
 Z2 Backend ──► Z4 AI            the Gemini key, only in the x-goog-api-key header, never in the URL
```

What is not in the diagram does not happen either: the extension does not talk to Canvas (no `host_permissions` for `instructure.com` **[code]** `public/manifest.json`), and the extension does not talk to Google either: when Gemini answers, `HttpMentorService` calls `POST /api/mentor` on the backend, and it is the backend that calls Gemini with the key only it holds **[code]** `src/services/mentor.ts`, `server/src/mentor.ts`. The backend rebuilds the request from scratch (`sanitizeMentorRequest`): only the eleven fields, with bounded values; any extra field is dropped **[test]** a name, an email, an id and a grade added to the context never reach Gemini. In the default mode (`VITE_MENTOR_MODE=auto`), the extension first asks the backend `GET /health` (2 s timeout, result cached for 30 s, no student data at all) and only uses Gemini if the server reports a configured mentor **[code]** `probeGemini`, `AutoMentorService`. With `VITE_MENTOR_MODE=local`, or if the server has no `GEMINI_API_KEY` or does not answer, **no data leaves towards an AI service**: `LocalMentorService` answers on the device, with no API key. In `local` mode not even that `/health` check is made for the mentor.

## 2.4 Why the backend has no dependencies

The process that holds the institutional credential (and the Gemini key) uses only Node.js built-in modules (`node:http`, `node:crypto`, `node:fs`). There is no `node_modules` in production. This is not aesthetic minimalism: every third-party package running inside the token process is code the institution did not write and that could, in a compromised update, read the token from memory. The Gemini call is also a native `fetch`, with no Google SDK. Zero packages is zero surface of that kind.

**[code]** `server/package.json` (`"dependencies": {}`).
