# 9. Pre-pilot checklist

Tick every item before connecting FARO to a Canvas with real students. Items marked ⚙ are verified by the technical team; items marked ⚖ by the institution.

## A. Before starting the backend

- [ ] ⚙ `server/.env` exists, is **not** in git (`git status` does not list it) and `CANVAS_API_URL` begins with `https://`.
- [ ] ⚙ The token belongs to a pilot **student account**, not an instructor or administrator.
- [ ] ⚙ The token has an **expiry date** (recommended: 30 days).
- [ ] ⚙ `FARO_HOST=127.0.0.1` unless TLS sits in front.
- [ ] ⚙ `FARO_ALLOWED_ORIGINS` contains only the real origins (the loaded extension's id, the dev server if applicable).
- [ ] ⚙ `npm test` in `server/` passes all 20 checks.
- [ ] ⚙ `curl http://127.0.0.1:3000/health` answers with the Canvas host and does **not** contain the token.

## B. Before loading the extension

- [ ] ⚙ It was built with `VITE_CANVAS_MODE=http` and `VITE_FARO_API_URL` pointing at the backend.
- [ ] ⚙ `public/manifest.json` does **not** contain `instructure.com` in `host_permissions`.
- [ ] ⚙ In *Profile → Canvas* the badge says *Live* and the log shows status `200` on all four paths.
- [ ] ⚙ If the note "your account cannot read analytics" appears, it was decided with the institution whether to enable the permission or accept the submission-based fallback.

## C. With the institution

- [ ] ⚖ Which law applies has been confirmed (LFPDPPP for a private institution; Ley General for a public one).
- [ ] ⚖ A privacy notice exists (simplified + full), reviewed by legal, mentioning: the six Canvas paths, the data FARO creates, the "life happened" state, the future remote mentor, and retention.
- [ ] ⚖ Every participant signed the pilot consent (chapter 7.4).
- [ ] ⚖ It was agreed how ARCO rights are exercised during the pilot and who responds.
- [ ] ⚖ It was agreed which pilot metrics are delivered and in what form (aggregated, with pseudonymous ids).
- [ ] ⚖ The institution's security team reviewed this book and the `server/` code.
- [ ] ⚖ The pilot end date and the procedure for revoking tokens and deleting data at the end were defined.

## D. When the pilot ends

- [ ] ⚙ All pilot tokens revoked in Canvas.
- [ ] ⚙ `server/.env` deleted from the backend machine.
- [ ] ⚙ Participants told how to delete local state (*Progress → Reset* or uninstall).
- [ ] ⚖ Metrics delivered; raw data destroyed or handed to the institution as agreed.

## E. To move to production (outside the pilot's scope)

- [ ] Registration of FARO as an account-level LTI 1.3 tool in Canvas, with exactly the scopes in `requiredScopes` and without `score` or `lineitem`.
- [ ] Implementation of `/lti/login`, `/lti/launch` and `/.well-known/jwks.json` per the specification in `server/src/routes/lti.ts`.
- [ ] OAuth2 per student; removal of the shared token.
- [ ] PostgreSQL with encryption at rest; automatic retention policy.
- [ ] Remote mentor behind the backend, with a data contract that forbids training.
- [ ] External security review.
