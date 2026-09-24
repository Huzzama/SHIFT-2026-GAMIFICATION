# FARO — Security, protocols and data handling

**Book 1 of 3 · For the institution, the IT team and the jury**

Version: September 2026 · SHIFT 2026 Challenge · Gamification

---

## What this book is for

A university that connects a tool to its Canvas is lending something valuable: access to its students' academic data. This book explains, plainly, what FARO does with that access, which protocols it uses, why those protocols are secure, and which guarantees can be **verified** instead of believed.

Every claim in this book carries one of three marks:

- **[code]** — it is written in the repository and the file is cited.
- **[test]** — an automated test verifies it (`server/test/e2e.ts`).
- **[pending]** — it is the production design and is not implemented yet.

Anything without a mark is context.

## Contents

1. Executive summary
2. Trust architecture: where every piece of data lives
3. Protocols: why they are secure
4. The Canvas token: life cycle
5. Data minimisation and retention
6. Threat model and controls
7. Compliance: LFPDPPP and institutional policies
8. Frequently asked questions for the university
9. Pre-pilot checklist

## The five guarantees, on one page

| Guarantee | How it is met | Mark |
|---|---|---|
| **FARO only reads.** It cannot modify grades, submissions, due dates or content. | Every call to Canvas is a `GET`. The backend refuses any other method before touching the network. The LTI write scopes (`score`, `lineitem`) are explicitly refused. | [code] [test] |
| **The credentials are never in the browser.** | The Canvas token and the Gemini key live in `server/.env` and in the backend's memory. The extension has no field to hold them and no network permission for `instructure.com`. | [code] [test] |
| **Only six Canvas paths, and nothing else.** | An allow list in the backend (`server/src/allowlist.ts`) mirrored in the extension. A path outside the list is refused locally, with no call to Canvas. | [code] [test] |
| **The AI mentor sees eleven fields and no personal data.** | The mentor is local by default. If Gemini is enabled, it receives, through the backend, the eleven-field context, the message and the last 8 turns. The context is built in a single file (`src/lib/mentorContext.ts`) that has no access to name, email, photo or grades, and the backend filters it again (`server/src/mentor.ts`). | [code] [test] |
| **A risk score is never shown to the student.** | Friction states exist only to choose the intervention; the interface uses supportive language. | [code] |
