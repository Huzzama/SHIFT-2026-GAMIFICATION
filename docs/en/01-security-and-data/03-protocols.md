# 3. Protocols: why they are secure

FARO invents no security mechanism. It uses the same standards Canvas requires of any integration and applies them in the most restrictive way the product allows. This chapter explains each one: the problem it solves, how FARO uses it, and what it guarantees.

## 3.1 TLS (HTTPS) — the channel

**Problem it solves:** nobody on the network (a café Wi-Fi, an ISP, a badly configured institutional proxy) can read or alter what travels between FARO and Canvas.

**How FARO uses it:** the backend refuses to start if `CANVAS_API_URL` does not begin with `https://`. The only exception is `localhost`, and it exists solely for the automated tests against the fake Canvas.

**[code]** `server/src/env.ts`, `loadEnv`.

**Guarantee:** the Canvas token only travels encrypted. Canvas, for its part, only accepts the API over HTTPS.

## 3.2 Bearer token — the API credential

**Problem it solves:** proving to Canvas who is making the request without sending a password.

**How FARO uses it:** the backend adds `Authorization: Bearer <token>` to every request to Canvas, which is the method Instructure recommends ("If possible, using the HTTP Authorization header is recommended"). The token never goes in the URL, never in the body, never in a log.

**[code]** `server/src/canvas.ts`, `canvasGet`. **[test]** "the token was sent to Canvas on every call, and only there" and "log lines carry no query strings".

**Guarantee:** Instructure describes tokens as "password equivalent". FARO treats them exactly that way: they live in a single process, in memory, and are read from a file that git ignores. Chapter 4 details their life cycle.

**Pilot limitation, stated:** a manually generated personal token is what Instructure indicates for testing ("For testing your application before you've implemented OAuth, the simplest option is to generate an access token on your user's profile page"). For multiple users, their documentation is blunt: "Applications in use by multiple users MUST use OAuth to obtain tokens". FARO meets that with the LTI + OAuth2 path in section 3.4. **[pending]**

## 3.3 Path allow list — the scope

**Problem it solves:** a token with more permissions than needed (a student's personal token can read everything the student sees in Canvas) is used only for what FARO needs.

**How FARO uses it:** the backend compares every requested path against six regular expressions. `GET` only. Only the parameters `include[]`, `per_page`, `enrollment_state` and `page`, with validated values. Anything else is refused with `403` **before touching the network**. The path is decoded before comparison, so `%2e%2e` cannot escape the pattern.

**[code]** `server/src/allowlist.ts`. **[test]** "a path outside the allow list is refused locally (no Canvas call)", "an unknown query parameter is refused", "path traversal is refused", "a write is refused even on an allowed path".

**Guarantee:** even if the extension were modified by someone, it cannot turn the backend into a general proxy to Canvas. And even though the pilot token could read the list of classmates, FARO **cannot ask for it**.

## 3.4 LTI 1.3 + OpenID Connect + JWT — the institutional launch

This is the production path. It is designed and documented in the code; the routes exist and answer `501` until the institution registers the tool. **[pending]**

**Problem it solves:** knowing with certainty *which course* and *which person* are opening FARO, without asking anyone to identify themselves and without FARO having to trust what the extension says.

**How it works (IMS Security Framework 1.0):**

1. Canvas initiates an OpenID Connect *login* towards `GET /lti/login`. FARO stores a short-lived `state` and `nonce` and redirects to Canvas's authorisation endpoint.
2. Canvas answers with `POST /lti/launch` and an `id_token`: a JWT **signed by Canvas** with RS256.
3. FARO downloads Canvas's public keys (JWKS), verifies the signature, the issuer (`iss`), the audience (`aud` = FARO's `client_id`), the expiry, and that the `nonce` is the one issued and has not been used.
4. From the verified claims, FARO reads exactly two things: the course (`https://purl.imsglobal.org/spec/lti/claim/context`) and the person (`sub`).
5. FARO issues its own session (an `HttpOnly`, `Secure`, `SameSite=None` cookie, because it runs inside a Canvas iframe) bound to that course and that person.

**[code]** `server/src/routes/lti.ts` (full specification in the comments).

**Guarantee:** the student's identity is asserted cryptographically by Canvas, not by the extension. FARO cannot be tricked into showing someone else's course because it accepts no identity claim that is not signed by the institution.

**LTI scopes:** FARO requests `contextmembership.readonly` (NRPS, for aggregate presence counts) and `result.readonly` (AGS, read-only results). It **refuses** `score` and `lineitem`, the two scopes that would allow writing to the gradebook. An administrator can verify this on the developer key screen without reading a line of code.

**[code]** `src/data/canvas/endpoints.ts`, `ltiScopes`.

## 3.5 OAuth2 with a developer key — the per-student token

**[pending]** Once the tool is registered, each student obtains their own access token through Canvas's OAuth2 flow, with scopes limited to the six paths (in the `url:GET|/api/v1/...` form Canvas uses on the developer key). Tokens from this flow expire in one hour and are renewed with a *refresh token*, both stored only in the backend. They are revoked with `DELETE /login/oauth2/token`.

**Guarantee:** the pilot's shared token disappears. Each student sees exactly what Canvas lets them see, and revoking FARO's access for one person is a single-token operation.

**[code]** the scopes are already written in `src/data/canvas/endpoints.ts`, `requiredScopes`.

## 3.6 CORS — who may call the backend from a browser

**Problem it solves:** any web page open in the same browser using the FARO backend as if it were the extension.

**How FARO uses it:** the backend keeps a list of allowed origins (`FARO_ALLOWED_ORIGINS`). An origin outside the list receives `403` with no data and no CORS headers. The advertised methods are only `GET, OPTIONS`.

**[code]** `server/src/http.ts`, `corsHeaders`. **[test]** "a browser origin outside the list gets 403 and no data", "CORS preflight succeeds for an allowed origin".

## 3.7 Rate limit — protection against loops

**Problem it solves:** an extension with a bug that retries in a loop could send thousands of requests to Canvas with the institutional token, and Canvas could suspend that token.

**How FARO uses it:** a per-client counter over a one-minute window (`FARO_RATE_LIMIT_PER_MINUTE`, 120 by default). Beyond it, `429` with `Retry-After`.

**[code]** `server/src/http.ts`, `RateLimiter`. **[test]** "rate limit trips after the configured burst".

## 3.8 Response headers

Every backend response carries `Cache-Control: no-store` (no academic data stays in intermediate caches), `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`.

**[code]** `server/src/http.ts`, `send`. **[test]** "responses carry no-store and nosniff".

## 3.9 Summary: which protocol protects what

| Threat | Protocol / control | State |
|---|---|---|
| Eavesdropping on the network | Mandatory TLS | [code] |
| Credential theft from the browser | The browser has no credential | [code] [test] |
| Token used beyond what is needed | Allow list of 6 paths, GET only | [code] [test] |
| Student impersonation | LTI 1.3 with a JWT signed by Canvas | [pending] |
| Token shared between people | OAuth2 per student | [pending] |
| Malicious page using the backend | CORS with an origin list | [code] [test] |
| Request loop | Rate limit | [code] [test] |
| Writing to the academic record | No write scopes; `score`/`lineitem` refused | [code] |
