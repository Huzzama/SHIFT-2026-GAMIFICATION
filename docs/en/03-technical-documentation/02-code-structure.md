# 2. Code structure and conventions

## 2.1 The tree

```text
faro/
├── public/
│   ├── manifest.json        Manifest V3: side panel, storage; host_permissions localhost only
│   └── background.js        minimal service worker: opens the side panel
├── src/
│   ├── App.tsx              routing between views, bottom bar, loading and error states
│   ├── main.tsx             entry point
│   ├── types/index.ts       ALL domain types, in one file
│   ├── data/
│   │   ├── client.ts        CourseSnapshot + faroClient: the seam
│   │   ├── canvas/          the Canvas layer (chapter 4)
│   │   │   ├── endpoints.ts   the 6 paths, the scopes, the audit surface
│   │   │   ├── raw.ts         types as Canvas returns them (snake_case)
│   │   │   ├── transport.ts   MockCanvasTransport · BackendCanvasTransport · canvasLog
│   │   │   ├── client.ts      CanvasFaroClient: the real mapping
│   │   │   ├── config.ts      mode, backend URL, launch resolution
│   │   │   ├── status.ts      behaviour flags (activity fallback)
│   │   │   └── fixtures.ts    the demo course, in Canvas's exact shape
│   │   ├── community.mock.ts
│   │   ├── reviewBank.ts    question bank per module (review cards and local Teach me)
│   │   └── rewards.mock.ts  the semester's simulated previous courses
│   ├── lib/                 pure logic, no React and no fetch (chapter 3)
│   │   ├── timeSession.ts   buildTimeSession · planDays · openSteps · sessionRules
│   │   ├── rewardPath.ts    pathToPoints: the realistic path to the next milestone
│   │   ├── teach.ts         teachTopics · lessonQuestions · answerTeach
│   │   ├── rhythm.ts        learningRhythm · weekRhythm · activeDays
│   │   └── …                friction, journey, recoveryPlanner, points, rewards, mentorContext…
│   ├── services/mentor.ts   Local · Http · Hybrid · AutoMentorService, probeGemini
│   ├── state/
│   │   ├── store.tsx        the app state and its derivations
│   │   ├── storage.ts       chrome.storage.local with a localStorage fallback
│   │   ├── community.tsx    Community state
│   │   └── theme.tsx        light/dark
│   ├── views/               one view per screen
│   ├── components/          reusable pieces (CanvasPanel, Cards, FeedPost…)
│   ├── i18n/                es.ts (source of truth) · en.ts (typed against es) · index.ts
│   └── styles/              tokens.css · global.css · views.css (plain CSS)
├── server/                  the backend (chapter 5)
│   ├── src/
│   │   ├── index.ts         start-up
│   │   ├── app.ts           assembles routes
│   │   ├── env.ts           configuration and .env
│   │   ├── allowlist.ts     the 6 allowed paths
│   │   ├── canvas.ts        the only function that talks to Canvas
│   │   ├── http.ts          router, CORS, rate limit, logging, JSON body ≤ 32 KB
│   │   ├── mentor.ts        sanitizeMentorRequest · systemPrompt · callGemini
│   │   └── routes/          health · launch · canvas · mentor · lti
│   ├── test/
│   │   ├── fake-canvas.ts   a fake Canvas with real pagination
│   │   ├── fake-gemini.ts   a fake Gemini (replies, errors, slowness)
│   │   └── e2e.ts           38 checks
│   ├── .env.example
│   └── package.json         "dependencies": {}
├── docs/                    the three books
├── .env.example             VITE_CANVAS_MODE, VITE_FARO_API_URL, VITE_MENTOR_MODE
└── package.json             react, react-dom; vite, typescript; `server` script
```

## 2.2 The three seams that matter

**`lib/` does not import React.** If a file in `lib/` needs `useState`, the logic is in the wrong place. The proof: `src/lib/` compiles with `tsc` without `@types/react`.

**`types/index.ts` separates Canvas from FARO.** The `Canvas*` types mirror the API. The rest are ours. A field Canvas does not have (`estimated_minutes`) carries a comment saying so.

**`i18n/es.ts` is the source of truth.** `en.ts` is declared as `const en: Dict` against the Spanish type. A key added in one language and not the other **breaks the build**. That is intentional.

## 2.3 Conventions

| Convention | Rule | Why |
|---|---|---|
| Thresholds | Named constants in an exported object (`frictionRules`, `pointsConfig`, `feasibilityRules`, `sessionRules`) | Tuned in one place and can be shown in documentation |
| Copy | Always from `t.*` (the active dictionary), never literals in views | Two languages, and the compiler watches |
| Components | Small; a `.tsx` over ~300 lines probably contains `lib/` logic | Readability |
| URLs | No hand-written API URL outside `data/` and `server/` | One place to change |
| Comments | Explain *why*, not *what*. Every non-obvious design decision carries its reason next to the code | Whoever comes next understands without asking |
| Styles | Plain CSS with tokens in `tokens.css`; no frameworks | Small bundle; the extension must feel immediate |
| TS syntax in `server/` | Erasable syntax only (`erasableSyntaxOnly`): no `enum`, no constructor parameter properties | Node runs the TypeScript directly without compiling |
| Imports in `server/` | With an explicit `.ts` extension | Node requirement for running TS |

## 2.4 Alias

`@/` points to `src/` (configured in `vite.config.ts` and `tsconfig.json`). It is an alias relative to Vite's root, so it works identically on Windows and macOS without path helpers.

## 2.5 What is NOT there, on purpose

- No Next.js, Electron, Redux or Tailwind. Project instructions: the extension must be lightweight.
- No ORM or database yet.
- No HTTP framework in the backend (Fastify was planned; it was replaced by `node:http` so the token-holding process runs no third-party code; the routes have the shape `(req) => reply`, which ports to Fastify unchanged if the project decides to).
- No test dependency. The backend tests use `node:assert` and run with `node`.
- No Google SDK. The backend calls Gemini with native `fetch`.
