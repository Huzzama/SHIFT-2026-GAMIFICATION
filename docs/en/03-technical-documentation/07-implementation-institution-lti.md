# 7. Canvas implementation, step by step: institution with LTI 1.3

This is the real deployment path. A browser extension cannot be installed institutionally; an LTI tool can. That is why the plan is **LTI 1.3 first, the extension as an optional layer** for those who prefer it.

What follows has two parts: what the institution does (register the tool) and what the FARO team does (implement three routes that answer 501 today). Neither is done yet; both are specified.

## 7.1 What FARO asks of the institution

A Canvas administrator creates a **Developer Key → LTI Key** with these values:

| Field | Value |
|---|---|
| Method | Manual Entry |
| Title | FARO |
| Redirect URIs | `https://<faro>/lti/launch` |
| Target Link URI | `https://<faro>/lti/launch` |
| OpenID Connect Initiation Url | `https://<faro>/lti/login` |
| JWK Method | Public JWK URL: `https://<faro>/.well-known/jwks.json` |
| LTI Advantage Services | ✅ `contextmembership.readonly` (NRPS) · ✅ `result.readonly` (AGS) · ❌ `score` · ❌ `lineitem` |
| Placements | Course Navigation |
| Privacy Level | **Anonymous** or **Public** as the institution decides (see 7.4) |

And a **Developer Key → API Key** with exactly the scopes from `src/data/canvas/endpoints.ts` (`requiredScopes`), with *Enforce Scopes* enabled:

```text
url:GET|/api/v1/courses/:id
url:GET|/api/v1/courses/:course_id/modules
url:GET|/api/v1/courses/:course_id/assignments
url:GET|/api/v1/courses/:course_id/analytics/users/:student_id/activity
url:GET|/api/v1/courses
url:GET|/api/v1/users/self
```

The administrator hands FARO: `client_id`, `deployment_id`, the instance URL and Canvas's JWKS URL (`https://<institution>.instructure.com/api/lti/security/jwks`).

## 7.2 What FARO implements (the three routes)

All with `node:crypto`, no dependencies. The specification is in `server/src/routes/lti.ts`.

**`GET /lti/login`** — third-party OIDC initiation.
Receives `iss`, `login_hint`, `target_link_uri`, `client_id`, `lti_message_hint`. Generates a random `state` and `nonce`, stores them with a short expiry (memory or database), and redirects (302) to `https://<institution>.instructure.com/api/lti/authorize_redirect` with `scope=openid`, `response_type=id_token`, `response_mode=form_post`, `prompt=none`, `redirect_uri`, `client_id`, `login_hint`, `state`, `nonce`, `lti_message_hint`.

**`POST /lti/launch`** — `id_token` verification.
1. Compares `state` with the stored one; consumes it.
2. Decodes the JWT; takes `kid` from the header; obtains the public key from Canvas's JWKS (cached); verifies the RS256 signature with `crypto.verify`.
3. Verifies `iss` (the instance), `aud` (the `client_id`), `exp`, `iat`, and that `nonce` is the issued, unused one.
4. Reads `https://purl.imsglobal.org/spec/lti/claim/context` → `id` (course) and `sub` (person). Optionally the NRPS and AGS endpoints from their respective claims.
5. Creates a FARO session (`HttpOnly; Secure; SameSite=None` cookie) bound to (course, person, instance).
6. Redirects to the FARO interface.

**`GET /.well-known/jwks.json`** — FARO's public key.
FARO generates an RSA key pair on deployment (stored as a secret), publishes the public one here, and signs with the private one the `client_assertion` (RFC 7523) it sends to `https://<institution>.instructure.com/login/oauth2/token` with `grant_type=client_credentials` to obtain LTI service tokens (NRPS/AGS).

## 7.3 Per-student API token (OAuth2)

For the six REST paths, with the API Key:

1. After the launch, if there is no token for that person, FARO redirects to `https://<institution>.instructure.com/login/oauth2/auth?client_id=...&response_type=code&redirect_uri=https://<faro>/oauth/callback&scope=<the six scopes>&state=...`.
2. Canvas asks the student for consent (once) and returns a `code`.
3. FARO exchanges it at `POST /login/oauth2/token` for an `access_token` (1 hour) and a `refresh_token`.
4. Both are stored **only in the backend**, encrypted at rest, bound to the person.
5. On expiry, FARO renews with the `refresh_token`. On consent withdrawal, `DELETE /login/oauth2/token`.

With this, `CANVAS_ACCESS_TOKEN` disappears from `.env`: the backend goes from one shared token to one token per person.

## 7.4 What changes in the backend

| Today (pilot) | Production |
|---|---|
| `GET /api/launch` infers course and person from the `.env` token | Reads them from the session created by `/lti/launch`; `verified: true` |
| One token for everything | One OAuth2 token per person, stored encrypted |
| Authorisation by origin (CORS) and localhost | Authorisation by session (cookie) + CORS |
| FARO state in the browser | PostgreSQL: purpose, sessions, preferences, tokens |
| Local mentor | `POST /api/mentor` in the backend, with the 11-field context and the provider contract |

`allowlist.ts`, `canvas.ts` and the `/canvas/*` routes **do not change**: the allow list and pagination are the same with any token.

**Privacy Level of the LTI Key.** *Anonymous* sends no name or email in the launch; FARO does not need them, so it is the option consistent with Book 1. *Public* would send them; FARO would ignore them, but better not to receive them.

## 7.5 Suggested order of work

1. Deploy the backend behind TLS (own domain, valid certificate). Without this, Canvas does not accept the tool.
2. Generate FARO's key pair; publish `/.well-known/jwks.json`.
3. Implement `/lti/login` and `/lti/launch` against a test course in the institution's instance (or in Free-for-Teacher, which also admits LTI Keys from the teacher account).
4. Implement the OAuth2 flow from 7.3.
5. Replace the launch with the session in `/api/launch`.
6. Add PostgreSQL and move FARO's state.
7. Register the tool at account level; pilot with one course.

## 7.6 The extension in this scenario

It keeps existing as an option: whoever prefers the side panel over the Canvas iframe installs it, and the extension calls the same backend with the same session (the cookie travels if `FARO_ALLOWED_ORIGINS` includes the extension id and the cookie is `SameSite=None`). The extension code does not change; only where `VITE_FARO_API_URL` points changes.
