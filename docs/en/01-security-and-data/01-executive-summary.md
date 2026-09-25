# 1. Executive summary

## What FARO is, in terms of data

FARO is a persistence companion for adult learners studying online. It reads the course structure and the student's progress from Canvas, detects when someone is drifting away, and offers them a route back. It does not teach the course, it does not grade, it does not replace Canvas.

From the institution's point of view, FARO is **a read-only reader** of a small, well-defined slice of Canvas, with an optional artificial-intelligence layer (Google Gemini, through the backend) that receives a minimal context with no identity.

## The three pieces and who talks to whom

```text
┌──────────────┐  HTTPS + token     ┌──────────────┐  local HTTP     ┌──────────────┐
│  Canvas LMS  │ ◄───────────────── │ FARO Backend │ ◄────────────── │  Extension   │
│ (institution)│  GET only          │  (server/)   │  no credential  │  (browser)   │
│              │  6 paths           │ holds token  │  allowed paths  │  no token    │
└──────────────┘                    └──────┬───────┘  only           └──────────────┘
                                           │
                                           │ optional: 11 fields + message
                                           │ + last 8 turns, no identity
                                           ▼
                                    ┌──────────────┐
                                    │ Google Gemini│
                                    │   (mentor)   │
                                    └──────────────┘
```

- **Canvas** remains the academic source of truth. FARO does not write to it.
- **The backend** is the only process that knows the Canvas credential and, when the AI mentor is on, the Gemini API key. It is a Node.js server with no third-party dependencies (`server/`), which reduces supply-chain risk in the process that holds the secrets to zero.
- **The extension** is interface only. It has no token, no network permission towards Canvas, and can only ask the backend for paths the backend has already decided to allow.
- **The mentor** answers with Gemini only if the backend has `GEMINI_API_KEY`; otherwise the local mentor answers, on the device, with no AI model. In the default mode (`VITE_MENTOR_MODE=auto`), the extension asks the backend (`GET /health`, with no student data) whether it has a mentor configured. An institution that does not approve the AI mentor builds with `VITE_MENTOR_MODE=local` or gives the server no key. When Gemini answers, open conversation goes **through the backend, never directly from the browser**, with an eleven-field context (none of which identifies the person), the student's message and the last 8 turns of the conversation. If Gemini does not answer, the local mentor does.

## The security posture, in one sentence

> Reduce what FARO *can* do until it matches what FARO *needs* to do, and make that reduction verifiable by an administrator without trusting us.

## Current state, honestly

| Component | State |
|---|---|
| Backend with token, allow list, restricted CORS, rate limit, no token leakage in logs | **Implemented and tested** (38 automated checks in total) |
| Extension with no credentials, `http` mode against the backend | **Implemented** |
| Mentor data contract (11 fields), re-checked on the backend | **Implemented** |
| Mentor with Gemini (`POST /api/mentor`): key only on the server, conversation kept out of logs, fallback to the local mentor | **Implemented and tested against a fake Gemini**; not exercised against Google's real API from the development environment; the team validates it with its own key |
| Tests against a real Canvas (free Instructure account) | **Ready to run**; needs a pilot token |
| Signed LTI 1.3 launch (OIDC + JWT) | **Designed and documented**, routes present and answering 501; needs the institution to register the tool |
| Per-student token via OAuth2 (instead of one shared token) | **Designed**; depends on the LTI registration |
| PostgreSQL database with encryption at rest | **Pending**; today FARO's state lives in the student's browser |
| Privacy review with the institution | **Pending**; this book is the input |
