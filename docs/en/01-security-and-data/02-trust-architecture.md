# 2. Trust architecture: where every piece of data lives

The question that matters most in a security review is not "which protocol do you use?" but "where is each piece of data and who can reach it?". This is the complete answer.

## 2.1 Trust zones

FARO has four zones. Each piece of data lives in exactly one, and crosses a boundary only for a documented reason.

| Zone | What it holds | Who has access | Trust |
|---|---|---|---|
| **Z1 · Canvas** | The whole academic record | The institution | Highest. FARO neither controls nor alters it. |
| **Z2 · FARO backend** | The Canvas token (in memory), the configuration, a short-lived cache of the launch | The backend operator | High. It is the only process with a credential. |
| **Z3 · The student's browser** | Purpose, preferences, sessions recorded by FARO, optional profile, a snapshot of the course while the tab is open | The student | Medium. It is their own device. |
| **Z4 · AI service** | Eleven context fields per conversation | The model provider | Controlled by a data contract. Never receives identity. |

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
| "Life happened" state | Choose the intervention | Memory | No |
| Mentor style, language, theme | Preferences | `chrome.storage.local` | Style and language are part of the mentor context |
| Name, photo (downsized), bio | Optional profile in Community | `chrome.storage.local` | Not to the mentor. In production, to other students in the course if the student enables it. |
| Conversation with the mentor | The current session | Memory | Not today: the mentor is local. In production, each message will go to the model with the eleven-field context, through the backend |

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
 Z3 Browser ──► Z2 ──► Z4 AI     [pending] 11 fields + the message; NEVER name, email, photo, ids, grades
```

What is not in the diagram does not happen either: the extension does not talk to Canvas (no `host_permissions` for `instructure.com` **[code]** `public/manifest.json`), and today **no data leaves towards an AI service**: the prototype's mentor is local and deterministic (`LocalMentorService`), with no API key. The `HttpMentorService` → `POST /api/mentor` path already exists in the extension for when the backend takes on the model call (chapter 5).

## 2.4 Why the backend has no dependencies

The process that holds the institutional credential uses only Node.js built-in modules (`node:http`, `node:crypto`, `node:fs`). There is no `node_modules` in production. This is not aesthetic minimalism: every third-party package running inside the token process is code the institution did not write and that could, in a compromised update, read the token from memory. Zero packages is zero surface of that kind.

**[code]** `server/package.json` (`"dependencies": {}`).
