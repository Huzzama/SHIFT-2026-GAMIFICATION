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

**What if the token leaks?**
Revoke it in Canvas with one click, generate another, restart the backend. The blast radius is reading what that student sees about themselves. That is why the pilot uses only student-account tokens, never instructor or administrator ones. Chapter 4.

**Does every student need to generate a token?**
In the pilot, yes, one per participant (or a test-account token). That is the practice Instructure indicates for testing. For a real deployment, FARO uses OAuth2 with a developer key and Canvas issues tokens automatically, valid for one hour.

## Artificial intelligence

**What does the AI model receive?**
Eleven fields: course name, progress percentage, next activity and its duration, declared goal, destination sentence, available minutes, momentum, friction state, style and language. It is in `src/lib/mentorContext.ts`. It does not receive name, email, ids, grades or history.

**Can the model do the student's homework?**
No. There is a filter for "do my exam"-type requests that answers with a refusal and offers to break the task down, explain the concept or review the reasoning. The filter is the same across the five communication styles.

**Does data go to an AI provider today?**
No. The prototype's mentor is local and deterministic. The model call will be enabled from the backend once there is a contract with the provider and an updated privacy notice.

**Is the data used to train models?**
No, and the contract with the provider must explicitly forbid it before the remote mentor is enabled.

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
Run `npm test` inside `server/`: twenty automated checks against a fake Canvas with real pagination. And open *Profile → Canvas* in FARO: the live request log shows every call.

**What is missing for production?**
LTI 1.3 registration by the institution, OAuth2 per student, a database with encryption at rest, a remote mentor with a data contract, a formal privacy notice and an external security review. Chapter 9 has the full list.

**Does FARO replace Canvas?**
No. Canvas remains the academic source of truth. FARO reads from Canvas and adds a companionship layer. *We don't replace Canvas: we make it adaptive.*
