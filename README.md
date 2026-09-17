# FARO — extension prototype

**Focus. Advance. Reward. Own.**
Hard to quit. Easy to return. We don't gamify the course — we gamify persistence.

A Canvas LMS companion for adult learners, built as a Manifest V3 side panel. It
runs entirely on mock Canvas data, so it can be demoed with no backend, no Canvas
credentials and no API keys.

## Run it

```bash
npm install
npm run dev        # open in a browser tab — at ≥900px you get the sidebar layout
npm run build      # produces dist/ as a Manifest V3 extension
```

Load as an extension: `chrome://extensions` → enable Developer mode →
**Load unpacked** → select `dist/`. Click the FARO icon to open the side panel.

## Screens

| Tab | Answers | Key pieces |
|---|---|---|
| **Inicio / Home** | Where am I, what do I do next? | Hero, one Next Best Action, Focus·Advance·Reward·Own pillars, course card, achievements / momentum / rhythm / mentor stats, effort banner |
| **Ruta / Journey** | Where am I going? | Route with checkpoints, missed stops that stay open, "Recalculating your route…", 3-session way back |
| **FARO** | Help me | Mentor chat, 5 voices, suggestion chips, graded-work guardrail |
| **Recompensas / Rewards** | What have I earned? | FARO Points balance and where it came from — config-driven, no catalog yet |
| **Progreso / Progress** | What have I built? | Course + module progress, five resilience achievements, sessions log |
| Recovery *(contextual)* | Life happened | Six life states → sized interventions, Comeback Mission, Safe Harbor pause |
| Purpose *(onboarding)* | Why am I here? | Goal, destination in your own words, real available time |

The UI is bilingual (**ES / EN** toggle in the header) and themeable
(**Light / Dark / System**, next to it). Course content comes from Canvas and
is never translated by FARO — only FARO's own interface is.

## What is real and what is mocked

| Layer | Status |
|---|---|
| All seven screens, i18n, responsive shell, light/dark/system theming | Real |
| Friction rules, momentum, next best action, recovery route, achievements | Real (prototype thresholds, configurable in `lib/friction.ts`) |
| Learning Rhythm (consecutive active days) | Real, derived from FARO's own sessions — see `lib/rhythm.ts` |
| FARO Points | Real config layer + real mock balance from actual completed actions — see `lib/points.ts`. No catalog, no redemption yet |
| Canvas data | **Mocked** — fixtures shaped like real Canvas API responses |
| AI mentor | **Local rule-based stand-in** (bilingual) behind the real service interface |
| Backend, PostgreSQL | Not built yet |

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
  data/       canvas.mock.ts, client.ts     ← swap MockFaroClient for HttpFaroClient
  lib/        friction, journey, lifeHappened, achievements, sessions, mentorContext,
              points (FARO Points config + mock balance), rhythm (Learning Rhythm)
  services/   mentor.ts                     ← LocalMentorService | HttpMentorService
  state/      store.tsx (lang + t live here), theme.tsx (light/dark/system), storage.ts
  components/ Wordmark, Icon, Cards, HeroArt, MomentumBadge, LangToggle, ThemeToggle
  views/      Dashboard, Journey, Mentor, Rewards, Progress, Recovery, Purpose
  styles/     tokens.css (fixed palette + adaptive theme tokens), global.css (shell), views.css
```

Two seams matter, because they are where the real system plugs in:

- **`data/client.ts`** — the only place course data is fetched. Replacing
  `MockFaroClient` with an HTTP client pointed at the FARO backend changes
  nothing above it.
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

The Rewards catalog and redemption flow (the balance and its breakdown are real;
spending it is not), Review Cards reconnection flow, named skins, a reworked
onboarding, a Profile page, Survival Kit as its own surface, real Canvas
integration, the Fastify backend and PostgreSQL. See `.env.example` for the
backend values — none of them belong in the extension build.
