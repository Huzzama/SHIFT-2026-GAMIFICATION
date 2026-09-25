# FARO — Technical documentation and Canvas implementation

**Book 3 of 3 · For whoever installs, develops or deploys FARO**

Version: September 2026 · SHIFT 2026 Challenge · Gamification

---

## What this book covers

How FARO is built, module by module, and how it connects to a real Canvas: first to a free Instructure account (what can be done today, in an afternoon), then to an institution's instance through LTI 1.3 (what requires the institution to take part).

Chapters 1 to 5 describe the code. Chapters 6 and 7 are step-by-step procedures. Chapter 8 says how to check everything works, and chapter 9 what is real and what is simulated.

## Contents

1. Architecture
2. Code structure and conventions
3. Domain logic (`src/lib/`)
4. The Canvas layer in the extension (`src/data/canvas/`)
5. The backend (`server/`)
6. Canvas implementation, step by step: free account
7. Canvas implementation, step by step: institution with LTI 1.3
8. Verification and tests
9. What is real and what is simulated

## Requirements

| Tool | Version | For |
|---|---|---|
| Node.js | **22.18 or later** (or 24) | The backend runs TypeScript without compiling (`node src/index.ts`) |
| npm | 9+ | Extension dependencies |
| Chrome / Edge | current | Loading the extension |
| A Canvas account | Free-for-Teacher or institutional | Chapters 6 and 7 |
| A Gemini API key | Optional; with real students, from a project with active billing | The AI mentor (chapter 6.9) |

## The commands, in one table

| Where | Command | What it does |
|---|---|---|
| root | `npm install` | Installs the extension's dependencies (68 packages) |
| root | `npm run dev` | Vite dev server at `http://localhost:5173` |
| root | `npm run server` | The backend with auto-reload, from the root (= `npm --prefix server run dev`) |
| root | `npm run typecheck` | Checks types; if it prints nothing after the header, it passed |
| root | `npm run build` | Builds the extension into `dist/` |
| `server/` | `cp .env.example .env` | Creates the backend configuration (then edit it) |
| `server/` | `npm run dev` | Backend with auto-reload |
| `server/` | `npm start` | Backend |
| `server/` | `npm test` | 38 checks against a fake Canvas and a fake Gemini |
| `server/` | `npm install` | Only if you want `npm run typecheck` there (installs `typescript` and `@types/node`; the backend itself has no dependencies) |
