# FARO — extension prototype

**Hard to quit. Easy to return.**
We don't gamify the course. We gamify persistence.

This prototype covers three parts of the product: **Purpose**, **Journey**, and the
**FARO Mentor**. It runs entirely on mock Canvas data, so it can be demoed with no
backend, no Canvas credentials and no API keys.

## Run it

```bash
npm install
npm run dev        # open the panel as a normal web page — fastest loop
npm run build      # produces dist/ as a Manifest V3 extension
```

Load as an extension: `chrome://extensions` → enable Developer mode →
**Load unpacked** → select `dist/`. Click the FARO icon to open the side panel.

## What is real and what is mocked

| Layer | Status |
|---|---|
| Purpose onboarding, Journey, Mentor UI | Real |
| Friction rules, momentum, next best action, recovery route | Real (prototype thresholds, configurable in `lib/friction.ts`) |
| Canvas data | **Mocked** — fixtures shaped like real Canvas API responses |
| AI mentor | **Local rule-based stand-in** behind the real service interface |
| Backend, PostgreSQL | Not built yet |

The mock scenario is deliberate: a working adult, 5 weeks into a 6-module course,
who stopped 5 days ago. That is the moment FARO exists for.

## Structure

```
src/
  data/     canvas.mock.ts, client.ts   ← swap MockFaroClient for HttpFaroClient
  lib/      friction.ts, journey.ts, mentorContext.ts
  services/ mentor.ts                   ← LocalMentorService | HttpMentorService
  state/    store.tsx, storage.ts
  views/    PurposeView, JourneyView, MentorView
```

Two seams matter, because they are where the real system plugs in:

- **`data/client.ts`** — the only place course data is fetched. Replacing
  `MockFaroClient` with an HTTP client pointed at the FARO backend changes
  nothing above it.
- **`lib/mentorContext.ts`** — the privacy boundary. If a field is not built
  there, the mentor never sees it. No names, no emails, no Canvas ids, no
  dropout classification.

## Product rules this code holds to

- No "Game Over". A student who has been away sees *"Your progress is still here"*,
  never a count of overdue work.
- Momentum is connection, not a streak. It decays gently and is floored — one
  missed day never wipes anything.
- One next action, not a list. Decision fatigue is part of the friction.
- The mentor guides; it refuses to produce graded work. Style changes the voice,
  never the rules.

## Not yet built

Home/Dashboard, Life Happened flow, Survival Kit, real Canvas integration,
the Fastify backend and PostgreSQL. See `.env.example` for the backend values —
none of them belong in the extension build.
