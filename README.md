# FARO — extension prototype

**Focus. Advance. Reward. Own.**
Hard to quit. Easy to return. We don't gamify the course — we gamify persistence.

A Canvas LMS companion for adult learners, built as a Manifest V3 side panel.
It runs in two modes: **mock** (fixtures answer the real Canvas API paths, no
backend needed — the default) and **http** (a small backend in `server/` holds
the Canvas token and forwards only allow-listed, read-only paths).

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
npm test                        # 20 checks against a fake Canvas with real pagination
```

Then in the project root create `.env.local` with `VITE_CANVAS_MODE=http` and
run `npm run dev` or `npm run build`. The extension never sees the token; see
`docs/03-documentacion-tecnica/06-implementacion-cuenta-gratuita.md` for the
step-by-step against a free Instructure account.

## Documentation

Three books in `docs/`, in Spanish and English (Markdown + PDF): security &
data handling, user guide, technical documentation & Canvas implementation.
See `docs/README.md`.

## Screens

| Tab | Answers | Key pieces |
|---|---|---|
| **Inicio / Home** | Where am I, what do I do next? | Hero, one Next Best Action, Focus·Advance·Reward·Own pillars, course card, achievements / momentum / rhythm / mentor stats, effort banner |
| **Ruta / Journey** | Where am I going? | Route with checkpoints, missed stops that stay open, "Recalculating your route…", 3-session way back |
| **FARO** *(raised, centre of the bar)* | Help me | Mentor chat, 5 voices, suggestion chips, graded-work guardrail |
| **Comunidad / Community** | Who is with me? | Aggregate presence, SOS routing, study rooms, cooperative mission, feed ranked by usefulness |
| **Recompensas / Rewards** | What does persisting get me? | Semester balance, track to the $200 MXN reward with $50/$100 tiers, simulated catalog and one-per-semester redemption, full breakdown |
| **Progreso / Progress** | What have I built? | Course + module progress, five resilience achievements, sessions log |
| Recovery *(contextual)* | Life happened | Review Cards (3 questions to reconnect), feasibility, six life states → sized interventions, three paces, new route, Today's one thing |
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
| Rewards | Real rules (`lib/rewards.ts`); **amounts, previous courses of the semester and redemption are simulated** and labelled on screen |
| Canvas data | Two modes: **mock** fixtures (default) or **live** through the backend (`VITE_CANVAS_MODE=http`) |
| Backend | Real: `server/`, zero-dependency Node, holds the Canvas token, allow-listed read-only proxy, 20 e2e checks |
| AI mentor | **Local rule-based stand-in** (bilingual) behind the real service interface |
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
| Violet `#7a4fb5` | Reward → resilience achievements (nowhere else) |
| Orange `#d97a2f` | Momentum (nowhere else) |

Where the brand sheet showed a streak, points and a community tab, the code
originally showed momentum, resilience achievements and the mentor in those
slots. A later, larger spec asked for a real (if still mocked) points economy
and a softer streak, so both now exist too — as **Learning Rhythm** (never
punitive: a missed day just stops counting, it never resets to zero or shows
as a loss) and **FARO Points** (a `pointsConfig` object, not a hard-coded
rate — see `lib/points.ts`), shown *alongside* momentum and achievements, not
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
              points (FARO Points config + mock balance), rhythm (Learning Rhythm)
  services/   mentor.ts                     ← LocalMentorService | HttpMentorService
  state/      store.tsx (lang + t live here), theme.tsx (light/dark/system), storage.ts
  components/ Wordmark, Icon, Cards, HeroArt, MomentumBadge, LangToggle, ThemeToggle
  views/      Dashboard, Journey, Mentor, Rewards, Progress, Recovery, Purpose
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

A real LLM behind the mentor, LTI 1.3 launch and OAuth2 per student,
PostgreSQL and cross-device sync, a real reward provider, named skins, and the
Survival Kit as its own surface. See `server/.env.example` for the backend
values — none of them belong in the extension build.
