# FARO — extension prototype

**Focus. Advance. Reward. Own.**
Hard to quit. Easy to return. We don't gamify the course — we gamify persistence.

A Canvas LMS companion for adult learners, built as a Manifest V3 side panel.
It runs in two modes: **mock** (fixtures answer the real Canvas API paths, no
backend needed — the default) and **http** (a small backend in `server/` holds
the Canvas token and forwards only allow-listed, read-only paths). The mentor
has its own switch: **local** (rule-based, on the device, nothing leaves it —
the default) or **gemini** (Google Gemini through the same backend, which holds
the API key; the local mentor answers whenever Gemini cannot).

## Run it (mock mode)

```bash
npm install
npm run dev        # open in a browser tab — at ≥900px you get the sidebar layout
npm run build      # produces dist/ as a Manifest V3 extension
```

Load as an extension: `chrome://extensions` → enable Developer mode →
**Load unpacked** → select `dist/`. Click the FARO icon to open the side panel.

## Run it against a real Canvas (http mode)

```bash
cd server
cp .env.example .env            # fill CANVAS_API_URL, CANVAS_ACCESS_TOKEN, FARO_COURSE_ID
npm start                       # Node 22.18+; no dependencies to install
npm test                        # 36 checks against a fake Canvas and a fake Gemini
```

Then in the project root create `.env.local` with `VITE_CANVAS_MODE=http` and
run `npm run dev` or `npm run build`. The extension never sees the token; see
`docs/03-documentacion-tecnica/06-implementacion-cuenta-gratuita.md` for the
step-by-step against a free Instructure account.

## Turn on the Gemini mentor (optional)

1. Put a key in `server/.env`: `GEMINI_API_KEY=<key>` (and, if needed,
   `GEMINI_MODEL`, default `gemini-3.5-flash` — model names change, check
   <https://ai.google.dev/gemini-api/docs/models>). Canvas is optional: with
   only the key the backend runs mentor-only.
2. Run `npm run dev` inside `server/`. The start-up line should read
   `Mentor: Gemini <model> (key in memory only)`.
3. In the project root, set `VITE_MENTOR_MODE=gemini` in `.env.local`.
4. Restart `npm run dev` at the root.

The key never goes in the extension or in `.env.local`. With real students,
use only a key from a Google Cloud project with **active billing** (the
Gemini API's Paid Services): on the free tier Google uses prompts to improve
its products and human reviewers may read them — see
<https://ai.google.dev/gemini-api/terms> and Book 1, chapter 7.8. Gemini API
users must be 18+.

This path is tested against a fake Gemini (backend checks and end to end in
the browser, including fallback to the local mentor). It has **not** been
exercised against Google's real API from the development environment — the
network policy blocked it — so validate it with your own key.

## Documentation

Three books in `docs/`, in Spanish and English (Markdown + PDF): security &
data handling, user guide, technical documentation & Canvas implementation.
See `docs/README.md`.

## Screens

| Tab | Answers | Key pieces |
|---|---|---|
| **Inicio / Home** | Where am I, what do I do next? | Hero, one Next Best Action, "How much time do you have?" (5 / 10 / 20 / 30+ min → a session in route order, review cards first when returning), "Your plan" card for a plan accepted in the mentor, Focus·Advance·Reward·Own pillars, course card, achievements / momentum / rhythm (N/7 active days this week) / mentor stats, effort banner |
| **Ruta / Journey** | Where am I going? | Route with checkpoints, missed stops that stay open, "Recalculating your route…", 3-session way back |
| **FARO** *(raised, centre of the bar)* | Help me | Mentor chat: a check-in when something changed ("I noticed something changed… What happened?") with the six Life Happened options; four modes (Focus, Way back, Teach me, Plan my weekend); points towards TecmiRewards from the real rules; a line that always says who answers (local mentor or Gemini, violet ring); 5 voices in a small dropdown; graded-work guardrail |
| **Comunidad / Community** | Who is with me? | Aggregate presence, SOS routing, study rooms, cooperative mission, feed ranked by usefulness |
| **Impacto / Impact** | What does persisting get me? | "Your effort": semester FARO Points and what you did this semester in plain lines; "Your reward: $200 MXN" with the TecmiRewards tag and $50/$100 tiers; simulated catalog and one-per-semester redemption; full breakdown; prototype-integration disclaimer |
| **Progreso / Progress** | What have I built? | Course + module progress, "Your rhythm" (Monday–Sunday active days — flexible consistency, not a streak), five resilience achievements, sessions log |
| Recovery *(contextual)* | Life happened | Review Cards (3 questions to reconnect, ending in "You're back"), feasibility, six life states → sized interventions, three paces, new route, Today's one thing |
| Purpose *(onboarding)* | Why am I here? | Goal, destination in your own words, real available time |

The UI is bilingual (**ES / EN** toggle in the header) and themeable
(**Light / Dark / System**, next to it). Course content comes from Canvas and
is never translated by FARO — only FARO's own interface is.

## What is real and what is mocked

| Layer | Status |
|---|---|
| All screens, i18n, responsive shell, light/dark/system theming | Real |
| Friction rules, momentum, next best action, recovery planner, achievements | Real (prototype thresholds, configurable in `lib/`) |
| Review Cards | Real flow and rules (`lib/reviewCards.ts`); the question bank is hand-written for the demo course (`data/reviewBank.ts`) |
| FARO Points | Real, from actual completed actions — see `lib/points.ts` |
| Impact (rewards) | Real rules (`lib/rewards.ts`, `lib/rewardPath.ts`); prototype integration with TecmiRewards — FARO counts points and issues nothing. **Amounts, previous courses of the semester and redemption are simulated** and labelled on screen. No public TecmiRewards API was found, so the integration must be validated with Tecmilenio |
| Canvas data | Two modes: **mock** fixtures (default) or **live** through the backend (`VITE_CANVAS_MODE=http`) |
| Backend | Real: `server/`, zero-dependency Node, holds the Canvas token and the Gemini key, allow-listed read-only proxy, `POST /api/mentor`, 36 e2e checks |
| Mentor, structured moments | Real, computed on the device from real data (`lib/timeSession.ts`, `lib/rewardPath.ts`, `lib/teach.ts`, `lib/rhythm.ts`) — never by a model. Local Teach me lessons exist only for the demo course's review bank |
| Mentor, open conversation | **local** (default): rule-based, bilingual, nothing leaves the device. **gemini** (`VITE_MENTOR_MODE=gemini`): Gemini through the backend with the 11-field context, the message and the last 8 turns; falls back to local. Tested against a fake Gemini only — **not yet against Google's real API** |
| LTI 1.3, OAuth2 per student, PostgreSQL | Designed and specified (`server/src/routes/lti.ts`, `docs/`), not built |

The mock scenario is deliberate: a working adult, 5 weeks into a 6-module course,
who stopped 5 days ago. That is the moment FARO exists for — so the demo opens in
Recovery.

## Design system

From the brand sheet *Focus. Advance. Reward. Own.* — tokens in `styles/tokens.css`.

| Colour | Meaning in FARO |
|---|---|
| Teal `#1b3b37` | Brand, sidebar, hero |
| Forest `#1f6b4a` | Progress, primary action |
| Mint `#5bcd8d` | Beacon / highlight, "start" actions |
| Violet `#7a4fb5` | Reward → resilience achievements; also the ring that marks a Gemini-written mentor reply |
| Orange `#d97a2f` | Momentum (nowhere else) |

Where the brand sheet showed a streak, points and a community tab, the code
originally showed momentum, resilience achievements and the mentor in those
slots. A later, larger spec asked for a real (if still mocked) points economy
and a softer streak, so both now exist too — as **Learning Rhythm** (never
punitive: what the student sees is how many days this week had any learning,
Monday to Sunday, and a day off is not a broken streak) and **FARO Points**
(a `pointsConfig` object, not a hard-coded rate — see `lib/points.ts`), shown *alongside* momentum and achievements, not
replacing them. Still no badge spam, and still nothing that punishes a
missed day.

### Theming

`state/theme.tsx` resolves Light / Dark / System into a single
`document.documentElement.dataset.theme`, which `styles/tokens.css` reads via
`:root[data-theme='dark']`. Only the plain page and its ordinary cards adapt
(`--bg`, `--surface`, `--border`, `--text-1..4`); brand chrome (sidebar, hero,
destination, mission) and tinted accent cards keep the fixed palette on
purpose, the same in both themes, matching the brand sheet. Named skins
(Classic/Midnight/Aurora/Explorer) can extend this later without touching a
single component — deferred for now, per this session's build-order choice.

## Structure

```
src/
  i18n/       es.ts (source of truth) · en.ts (typed against it) · index.ts
  data/       client.ts                     ← the seam: CourseSnapshot in, nothing else
              canvas/  endpoints · raw · transport · fixtures · client · config
                       real Canvas REST paths and mapping; mock vs http is one value
              community.mock.ts
  lib/        friction, journey, lifeHappened, achievements, sessions, mentorContext,
              points (FARO Points config + mock balance), rhythm (Learning Rhythm + week),
              timeSession (time → session, weekend plan), rewardPath (path to the next
              milestone), teach (local Teach me loop), rewards, reviewCards, recoveryPlanner
  services/   mentor.ts                     ← Local | Http | Hybrid (Gemini + local fallback)
  state/      store.tsx (lang + t live here), theme.tsx (light/dark/system), storage.ts
  components/ Wordmark, Icon, Cards, HeroArt, MomentumBadge, LangToggle, ThemeToggle
  views/      Dashboard, Journey, Mentor, Rewards (the Impact tab), Progress, Recovery, Purpose
  styles/     tokens.css (fixed palette + adaptive theme tokens), global.css (shell), views.css
```

Two seams matter, because they are where the real system plugs in:

- **`data/client.ts`** — the only place course data is fetched. Below it,
  `data/canvas/` speaks the actual Canvas REST API: the documented paths, the
  response shapes Canvas really sends, `Link`-header pagination, and the
  mapping from Canvas's model to FARO's. In the prototype a fixture transport
  answers those requests instead of an institution; setting
  `VITE_CANVAS_MODE=http` points the same code at a live Canvas through the
  backend in `server/`.
  Every call is a GET, and the Profile screen renders the live request log so
  the integration can be checked rather than taken on trust.
- **`lib/mentorContext.ts`** — the privacy boundary. If a field is not built
  there, the mentor never sees it. No names, no emails, no Canvas ids, no
  dropout classification. (Language *is* sent: the model should answer in it.)
  The backend re-applies the same allow list (`server/src/mentor.ts`) before
  anything reaches Gemini.

Adding copy: add the key to `i18n/es.ts`; TypeScript will refuse to build until
`en.ts` has it too.

## Product rules this code holds to

- No "Game Over". A student who has been away sees *"Your progress is still here"*,
  never a count of overdue work.
- Momentum is connection, not a streak. It decays gently and is floored — one
  missed day never wipes anything.
- One next action, not a list. Decision fatigue is part of the friction.
- The mentor guides; it refuses to produce graded work. Style and language change
  the voice, never the rules.

## Not yet built

Validation of the Gemini mentor against Google's real API, LTI 1.3 launch and OAuth2 per student,
PostgreSQL and cross-device sync, a real reward provider, named skins, and the
Survival Kit as its own surface. See `server/.env.example` for the backend
values — none of them belong in the extension build.
