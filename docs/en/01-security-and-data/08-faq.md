# 8. Frequently asked questions for the university

The questions an IT department, a data-protection officer or an academic director asks before connecting a tool to Canvas, with short answers and the reference to check them.

## Access and scope

**Can FARO modify grades, submissions or due dates?**
No. Every call to Canvas is a read (`GET`). The backend refuses any other method before contacting Canvas, and the LTI scopes that would allow writing to the gradebook (`score`, `lineitem`) are explicitly refused. Check `server/src/allowlist.ts` and the developer key screen in Canvas.

**What exactly does FARO see in Canvas?**
Six paths: the course, its modules with items, the assignments with the student's own submission, the student's own activity (timestamps), the student's list of active courses, and their numeric id. Nothing else. The list is a thirty-line file: `server/src/allowlist.ts`.

**Does FARO see other students' data?**
No. It does not call the enrollments endpoint or the course users endpoint. In production, the "how many are studying" count will come from LTI's NRPS service in aggregate mode, with no names.

**Can FARO see the contents of a submission or an exam?**
No. It reads the submission's date, state and score, not its contents. The fields that are read are declared in `src/data/canvas/raw.ts`; whatever is not there is ignored.

**Can a student use FARO to see someone else's course?**
No. In the pilot, the backend infers identity from the token, not from what the extension claims. In production, identity is signed by Canvas (LTI 1.3) and FARO accepts no other.

## Credentials

**Where is the Canvas token?**
In `server/.env`, on the machine running the backend, and in that process's memory. Nowhere else. The extension has no field for a token and no network permission for `instructure.com`.

**Is the token in the source code or on GitHub?**
No. `.env` is in `.gitignore`. The repository contains `server/.env.example` with the field empty.

**Where is the Gemini key?**
Like the token: in `server/.env` and in the backend's memory, and only if the institution turns on the AI mentor. Never in the extension. It travels to Google only in the `x-goog-api-key` header, never in the URL, and does not appear in logs or responses. If it is exposed, revoke it in Google and generate another. Chapter 4.8.

**What if the token leaks?**
Revoke it in Canvas with one click, generate another, restart the backend. The blast radius is reading what that student sees about themselves. That is why the pilot uses only student-account tokens, never instructor or administrator ones. Chapter 4.

**Does every student need to generate a token?**
In the pilot, yes, one per participant (or a test-account token). That is the practice Instructure indicates for testing. For a real deployment, FARO uses OAuth2 with a developer key and Canvas issues tokens automatically, valid for one hour.

## Artificial intelligence

**Which model does FARO use?**
By default, none: the mentor is local and deterministic, and nothing leaves the device. Optionally, Google Gemini (`GEMINI_MODEL`, by default `gemini-3.5-flash`; model names change and must be checked at `ai.google.dev/gemini-api/docs/models`). It is turned on with `VITE_MENTOR_MODE=gemini` in the extension and `GEMINI_API_KEY` on the backend. The mentor screen always says which of the two answers.

**What does the AI model receive?**
Only in `gemini` mode, and always through the backend: eleven fields (course name, progress percentage, next activity and its duration, declared goal, destination sentence, available minutes, momentum, friction state, style and language), the student's message and the last 8 turns of the current conversation. The context is built in `src/lib/mentorContext.ts` and the backend filters it again in `server/src/mentor.ts`. It does not receive name, email, Canvas ids, grades, photo or earlier conversations.

**Can the model do the student's homework?**
No. There is a filter for "do my exam"-type requests that answers with a refusal and offers to break the task down, explain the concept or review the reasoning; in `gemini` mode the backend answers those requests without calling the model. On top of that, the system prompt's rules forbid producing graded work. The filter is the same across the five communication styles.

**Does data go to an AI provider today?**
Only if `gemini` mode is turned on. With the default configuration (`VITE_MENTOR_MODE=local`), no: the mentor is local and deterministic. Before turning it on with real students, an updated privacy notice is needed (chapter 7).

**Does Gemini train on student data?**
Not if the key belongs to a Google Cloud project with active billing (the Gemini API's Paid Services): then Google does not use prompts or responses to improve its products, and only logs them for a limited time for abuse detection and legal requirements. On the free tier it does use them to improve products, human reviewers may read them, and the terms say not to submit personal information; that is why **the free tier is never used with real students**. Source: `ai.google.dev/gemini-api/terms`. Chapter 7.8.

**What if Gemini is down?**
The local mentor answers, and the student sees it: the reply carries the note *"Gemini could not answer just now, so the local mentor did"*. The backend returns clear codes for each failure (`503 mentor_not_configured`, `502 mentor_key_rejected`, `502 mentor_upstream`, `502 mentor_blocked`, `504 mentor_timeout`, `429 mentor_rate_limited`) and the extension falls back to the local mentor on any of them. The student always gets a reply; their progress does not depend on Google.

**Does FARO store mentor conversations?**
No. They live in the extension's memory for the session. The backend neither stores nor logs them: not the message, not the reply, not the context.

## Surveillance and wellbeing

**Does FARO compute a student's "dropout risk"?**
It computes internal friction states (five labels based on days without activity and pending work) to decide which intervention to offer. It **never** shows a risk score to the student and shares it with nobody. The interface says "your route needs attention", not "risk: 87%".

**Can an instructor see who studies how much?**
That screen does not exist, and Community's data model only admits aggregate counts, not people. If the institution wanted pilot metrics, the proposal is to deliver them aggregated and with pseudonymous ids.

**Does FARO send notifications or reminders?**
No. There are no push notifications, emails or reminders. FARO waits for the student to open the panel. The "safe harbour" (planned pause) explicitly has no countdown.

**Is FARO a video game?**
No. It uses mechanics (route, checkpoints, achievements) without lives, levels or leaderboards. The five achievements and five recognitions require having persisted; none is earned by clicking.

## Operations

**Where does the backend run?**
In the pilot, on a team or institution machine, listening on `127.0.0.1`. In production, on institutional infrastructure or an approved provider, behind TLS, with the LTI launch as authentication.

**What dependencies does it have?**
The backend, none. Only Node.js. The extension, two: `react` and `react-dom`.

**How do I know the guarantees in this book are true?**
Run `npm test` inside `server/`: thirty-six automated checks against a fake Canvas with real pagination and a fake Gemini. And open *Profile → Canvas* in FARO: the live request log shows every call.

**What is missing for production?**
LTI 1.3 registration by the institution, OAuth2 per student, a database with encryption at rest, validating the Gemini mentor against the real API with a paid institutional key, a formal privacy notice and an external security review. Chapter 9 has the full list.

**Does FARO replace Canvas?**
No. Canvas remains the academic source of truth. FARO reads from Canvas and adds a companionship layer. *We don't replace Canvas: we make it adaptive.*
