# 1. Executive summary

## What FARO is, in terms of data

FARO is a persistence companion for adult learners studying online. It reads the course structure and the student's progress from Canvas, detects when someone is drifting away, and offers them a route back. It does not teach the course, it does not grade, it does not replace Canvas.

From the institution's point of view, FARO is **a read-only reader** of a small, well-defined slice of Canvas, with an artificial-intelligence layer that receives a minimal, anonymised context.

## The three pieces and who talks to whom

```text
┌──────────────┐  HTTPS + token     ┌──────────────┐  local HTTP     ┌──────────────┐
│  Canvas LMS  │ ◄───────────────── │ FARO Backend │ ◄────────────── │  Extension   │
│ (institution)│  GET only          │  (server/)   │  no credential  │  (browser)   │
│              │  6 paths           │ holds token  │  allowed paths  │  no token    │
└──────────────┘                    └──────┬───────┘  only           └──────────────┘
                                           │
                                           │ [pending] 11 fields, no identity
                                           ▼
                                    ┌──────────────┐
                                    │  AI mentor   │
                                    └──────────────┘
```

- **Canvas** remains the academic source of truth. FARO does not write to it.
- **The backend** is the only process that knows the Canvas credential. It is a Node.js server with no third-party dependencies (`server/`), which reduces supply-chain risk in the token-holding process to zero.
- **The extension** is interface only. It has no token, no network permission towards Canvas, and can only ask the backend for paths the backend has already decided to allow.
- **The AI mentor** receives a hand-built context of eleven fields, none of which identifies the person.

## The security posture, in one sentence

> Reduce what FARO *can* do until it matches what FARO *needs* to do, and make that reduction verifiable by an administrator without trusting us.

## Current state, honestly

| Component | State |
|---|---|
| Backend with token, allow list, restricted CORS, rate limit, no token leakage in logs | **Implemented and tested** (20 automated checks) |
| Extension with no credentials, `http` mode against the backend | **Implemented** |
| Mentor data contract (11 fields) | **Implemented** |
| Tests against a real Canvas (free Instructure account) | **Ready to run**; needs a pilot token |
| Signed LTI 1.3 launch (OIDC + JWT) | **Designed and documented**, routes present and answering 501; needs the institution to register the tool |
| Per-student token via OAuth2 (instead of one shared token) | **Designed**; depends on the LTI registration |
| PostgreSQL database with encryption at rest | **Pending**; today FARO's state lives in the student's browser |
| Privacy review with the institution | **Pending**; this book is the input |
