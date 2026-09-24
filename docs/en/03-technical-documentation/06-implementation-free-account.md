# 6. Canvas implementation, step by step: free account

This procedure connects FARO to a real Canvas in one afternoon, without asking an institution for anything. It uses **Canvas Free-for-Teacher** (`canvas.instructure.com`), which is a real Canvas instance with the same API.

You need two email addresses: one for the *teacher* account (which creates the course) and another for the *student* account (the one FARO accompanies).

## 6.1 Create the course (teacher account) — 15 minutes

1. Go to `https://canvas.instructure.com/register` and choose **Free for Teacher**. Complete the sign-up with the first email and confirm.
2. On the dashboard, **+ Course** (or *Start a new course*). Name it, for example *Gestión de Proyectos*, and **Create course**.
3. Create at least **two modules** (*Modules → + Module*). Inside each, **+** → *Assignment* → *Create Assignment*, with a name and points. Create 4 or 5 assignments in total. Optional: give one a past due date so FARO has something *overdue* to reopen.
4. **Publish** the course (the *Publish* button on the course home page) and **publish every module and assignment** (the cloud icon in green). An unpublished item does not appear for the student.
5. Note the **course id**: it is in the URL, `https://canvas.instructure.com/courses/1234567` → `1234567`.

## 6.2 Enrol the student — 5 minutes

Two ways:

- **Invitation:** *People → + People*, type the second email, role *Student*, **Next → Add Users**. The student receives an email and accepts.
- **Self-enrolment:** *Settings → Course Details → More Options → Let students self-enroll by sharing with them a secret URL*. Save. A link appears; the student opens it.

With the student account (second email), log in to Canvas, accept the invitation, and **submit at least two assignments** (even with a one-line text). That way FARO has real progress to show.

## 6.3 Generate the token (student account) — 2 minutes

Logged in as the **student**:

1. **Account** (top left) → **Settings**.
2. Scroll down to **Approved Integrations** → **+ New Access Token**.
3. *Purpose*: `FARO pilot`. *Expires*: set a date (30 days is reasonable). **Generate Token**.
4. **Copy the token now.** Canvas shows it in full only at this moment.

> Use the **student's** token, not the teacher's. A teacher's token has no `submission` of its own and no module `state`, and FARO would show a course with no progress. It also limits the blast radius of a leak to what that student sees about themselves (Book 1, chapter 4).

## 6.4 Configure and start the backend — 3 minutes

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```text
CANVAS_API_URL=https://canvas.instructure.com
CANVAS_ACCESS_TOKEN=<paste the student's token here>
FARO_COURSE_ID=1234567
```

Start it:

```bash
npm start
```

You should see:

```text
[faro-server] listening on http://127.0.0.1:3000
[faro-server] Canvas: canvas.instructure.com (read-only, token in memory only)
[faro-server] Mentor: not configured (the extension uses its local mentor)
```

Check from another terminal:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/api/launch
```

`/api/launch` must return your `courseId`, the course name and the student's numeric `userId`. If it returns `canvas_token_rejected`, the token was mis-copied or has expired.

**On Windows** use PowerShell: `Copy-Item .env.example .env` instead of `cp`, and `Invoke-WebRequest http://127.0.0.1:3000/health | Select-Object -Expand Content` instead of `curl` (or install curl).

## 6.5 Build the extension in live mode — 3 minutes

In the project **root** create `.env.local`:

```text
VITE_CANVAS_MODE=http
VITE_FARO_API_URL=http://127.0.0.1:3000
```

Option A, dev server (fastest to iterate):

```bash
npm run dev
```

Open `http://localhost:5173`. That origin is already in `FARO_ALLOWED_ORIGINS` by default.

Option B, extension loaded in Chrome:

```bash
npm run build
```

Chrome → `chrome://extensions` → *Developer mode* → *Load unpacked* → the `dist/` folder. Note the **extension id** Chrome assigns and add it to `server/.env`:

```text
FARO_ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://<id>
```

Restart the backend.

## 6.6 Verify — 2 minutes

1. Open FARO. Complete the purpose (three questions).
2. **Home** must show your real course name and a progress that matches the student's submissions.
3. **Profile → Canvas**: the badge says **Live**, *Course 1234567 · Gestión de Proyectos* appears, and the note says which backend the calls go through. Open the log: four calls with status `200`.
4. In the backend terminal, four log lines with `status: 200` and **no query strings or token**.

If the `/analytics/.../activity` path shows `401` in the log and the panel shows the note about analytics: that is the expected behaviour for a student account in Free-for-Teacher. FARO uses your submission dates as activity. It is not an error.

## 6.7 Break it on purpose (optional, recommended)

- Revoke the token in Canvas (*Approved Integrations → delete*). Restart the backend: `canvas_token_rejected`. FARO shows the error with *Retry*, not an empty course.
- Ask for a forbidden path: `curl http://127.0.0.1:3000/canvas/api/v1/courses/1234567/enrollments` → `403 path_not_allowed`, and **no new line** in the Canvas log: it never reached the network.
- Change `FARO_ALLOWED_ORIGINS` to exclude `localhost:5173` and reload the dev server: `403 origin_not_allowed`.

## 6.8 Common problems

| Symptom | Likely cause | Fix |
|---|---|---|
| `CANVAS_API_URL must use https://` | You used `http://` | Fix the URL |
| `canvas_token_rejected` | Token mis-copied, expired or revoked | Generate a new one |
| `no_active_course` | The student did not accept the invitation or the course is unpublished | Accept the invitation / publish the course |
| Home shows 0% with assignments present | The assignments are in no module, or the token is the teacher's | Add the assignments to modules; use the student token |
| FARO does not load and the console says `CORS` | The extension's origin is not in `FARO_ALLOWED_ORIGINS` | Add `chrome-extension://<id>` and restart |
| `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` | Node older than 22.18 | Update Node |
| Modules appear with no state (all `unlocked`) | Teacher token | Use the student token |
| `Nothing to serve: …` at start-up | `server/.env` has neither Canvas nor `GEMINI_API_KEY` | Configure at least one |
| Every Mentor reply carries the note "Gemini could not answer…" | Backend down, no key (`503`), key rejected (`502 mentor_key_rejected`) or a model name that does not exist (`502 mentor_upstream`) | Check `/health` (`mentor` must not be `null`), the key and `GEMINI_MODEL` |
| The Mentor footer says "Local mentor" although you configured Gemini | The extension was built without `VITE_MENTOR_MODE=gemini` | Add it to `.env.local` and restart `npm run dev` (or rebuild) |

## 6.9 Turning on the Gemini mentor (optional) — 3 minutes

The mentor works without this (local mentor). For Gemini to answer:

1. Create a key in Google AI Studio. **With real students, only from a Google Cloud project with active billing**; the free tier is only for testing with made-up data (Book 1, chapter 7.8).
2. Add it to `server/.env` (never to the root `.env.local`):

```text
GEMINI_API_KEY=<your key>
GEMINI_MODEL=gemini-3.5-flash
```

   Model names change: check the current one at `ai.google.dev/gemini-api/docs/models`.

3. Start the backend (`npm run dev` or `npm start` inside `server/`). The mentor line must say `Mentor: Gemini <model> (key in memory only)`. Canvas is optional: with only the key, the backend starts mentor-only and the Canvas routes answer `503 canvas_not_configured`.
4. At the root, add to `.env.local`:

```text
VITE_MENTOR_MODE=gemini
VITE_FARO_API_URL=http://127.0.0.1:3000
```

5. Restart `npm run dev` (Vite reads the variables at start-up).
6. Check: the Mentor footer says *"Answers by Gemini, through FARO's server…"*, and when you type an open message the reply arrives with the violet ring on the avatar and **without** the note *"Gemini could not answer…"*. Stop the backend and type again: the local mentor must answer, with the note.

This is the step the team must do with its own key: in development, the path was only verified against a fake Gemini (chapter 8.2b).
