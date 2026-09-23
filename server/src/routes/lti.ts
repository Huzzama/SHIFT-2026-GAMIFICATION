/**
 * LTI 1.3 - the institutional deployment path. Not yet configured.
 *
 * These routes exist so the shape of the real integration is in the code
 * rather than in a slide. They answer 501 with the step that is missing,
 * and the comments below are the specification a developer implements
 * against when the institution registers FARO as an LTI tool.
 *
 * The flow (IMS Security Framework 1.0, OIDC third-party initiated login):
 *
 *   1. Canvas -> GET /lti/login?iss&login_hint&target_link_uri&client_id
 *      FARO stores a `state` and `nonce` (server side, short-lived), and
 *      redirects the browser to Canvas's authorization endpoint
 *      (`https://<canvas>/api/lti/authorize_redirect`) with
 *      response_type=id_token, response_mode=form_post, prompt=none.
 *
 *   2. Canvas -> POST /lti/launch  (id_token, state)
 *      FARO verifies `state`, fetches Canvas's JWKS
 *      (`https://<canvas>/api/lti/security/jwks`), verifies the id_token
 *      signature (RS256), `iss`, `aud` (= client_id), `exp`, and that the
 *      `nonce` is the one issued in step 1 and has not been used.
 *
 *   3. From the verified claims FARO reads exactly two things:
 *        - the course:   https://purl.imsglobal.org/spec/lti/claim/context  -> id
 *        - the person:   sub
 *      and, if the institution granted them, the service endpoints for
 *      NRPS (contextmembership.readonly) and AGS results (result.readonly).
 *      The `score` and `lineitem` AGS scopes are never requested.
 *
 *   4. FARO issues its own short-lived session (HttpOnly cookie, SameSite=None
 *      because the tool runs in a Canvas iframe, Secure) bound to that
 *      course + person. Every later API call is authorised by that session,
 *      and Canvas data is fetched with a token obtained through the
 *      developer key's OAuth2 flow for that person - never a shared token.
 *
 *   5. GET /.well-known/jwks.json publishes FARO's public key so Canvas can
 *      verify the client_assertion FARO signs when it asks for a service
 *      token (client_credentials grant, RFC 7523).
 *
 * None of this needs a third-party package beyond `node:crypto`'s JWT
 * verification helpers (`crypto.verify` with the JWK imported via
 * `crypto.createPublicKey`). It does need an institution that has
 * registered the tool, which is why it is a 501 today and not a stub that
 * pretends.
 */
import { json, type Handler } from '../http.ts'

const notConfigured = (step: string): Handler => () =>
  json(501, {
    error: 'lti_not_configured',
    step,
    requires: 'An LTI 1.3 developer key registered by the institution (client_id, deployment_id, Canvas JWKS URL).',
  })

export const ltiLogin = notConfigured('oidc_login_initiation')
export const ltiLaunch = notConfigured('id_token_verification')
export const ltiJwks = notConfigured('tool_public_keys')
