# 7. Implementación en Canvas, paso a paso: institución con LTI 1.3

Este es el camino de despliegue real. Una extensión de navegador no se puede instalar institucionalmente; una herramienta LTI sí. Por eso el plan es **LTI 1.3 primero, la extensión como capa opcional** para quien la prefiera.

Lo que sigue tiene dos partes: lo que hace la institución (registrar la herramienta) y lo que hace el equipo de FARO (implementar tres rutas que hoy responden 501). Ninguna de las dos está hecha todavía; ambas están especificadas.

## 7.1 Qué pide FARO a la institución

Un administrador de Canvas crea una **Developer Key → LTI Key** con estos valores:

| Campo | Valor |
|---|---|
| Method | Manual Entry |
| Title | FARO |
| Redirect URIs | `https://<faro>/lti/launch` |
| Target Link URI | `https://<faro>/lti/launch` |
| OpenID Connect Initiation Url | `https://<faro>/lti/login` |
| JWK Method | Public JWK URL: `https://<faro>/.well-known/jwks.json` |
| LTI Advantage Services | ✅ `contextmembership.readonly` (NRPS) · ✅ `result.readonly` (AGS) · ❌ `score` · ❌ `lineitem` |
| Placements | Course Navigation |
| Privacy Level | **Anonymous** o **Public** según decida la institución (ver 7.4) |

Y una **Developer Key → API Key** con los *scopes* exactos de `src/data/canvas/endpoints.ts` (`requiredScopes`), con *Enforce Scopes* activado:

```text
url:GET|/api/v1/courses/:id
url:GET|/api/v1/courses/:course_id/modules
url:GET|/api/v1/courses/:course_id/assignments
url:GET|/api/v1/courses/:course_id/analytics/users/:student_id/activity
url:GET|/api/v1/courses
url:GET|/api/v1/users/self
```

El administrador entrega a FARO: `client_id`, `deployment_id`, la URL de la instancia y la URL del JWKS de Canvas (`https://<institución>.instructure.com/api/lti/security/jwks`).

## 7.2 Qué implementa FARO (las tres rutas)

Todo con `node:crypto`, sin dependencias. La especificación está en `server/src/routes/lti.ts`.

**`GET /lti/login`** — inicio OIDC de terceros.
Recibe `iss`, `login_hint`, `target_link_uri`, `client_id`, `lti_message_hint`. Genera `state` y `nonce` aleatorios, los guarda con expiración corta (memoria o base de datos), y redirige (302) a `https://<institución>.instructure.com/api/lti/authorize_redirect` con `scope=openid`, `response_type=id_token`, `response_mode=form_post`, `prompt=none`, `redirect_uri`, `client_id`, `login_hint`, `state`, `nonce`, `lti_message_hint`.

**`POST /lti/launch`** — verificación del `id_token`.
1. Compara `state` con el guardado; lo consume.
2. Decodifica el JWT; toma `kid` de la cabecera; obtiene la clave pública del JWKS de Canvas (cacheado); verifica la firma RS256 con `crypto.verify`.
3. Verifica `iss` (la instancia), `aud` (el `client_id`), `exp`, `iat`, y que `nonce` sea el emitido y no usado.
4. Lee `https://purl.imsglobal.org/spec/lti/claim/context` → `id` (curso) y `sub` (persona). Opcionalmente los endpoints de NRPS y AGS de sus *claims* respectivos.
5. Crea una sesión de FARO (cookie `HttpOnly; Secure; SameSite=None`) ligada a (curso, persona, instancia).
6. Redirige a la interfaz de FARO.

**`GET /.well-known/jwks.json`** — la clave pública de FARO.
FARO genera un par RSA al desplegar (guardado como secreto), publica la pública aquí, y firma con la privada el `client_assertion` (RFC 7523) que envía a `https://<institución>.instructure.com/login/oauth2/token` con `grant_type=client_credentials` para obtener tokens de servicio LTI (NRPS/AGS).

## 7.3 Token de API por estudiante (OAuth2)

Para las seis rutas REST, con la API Key:

1. Tras el lanzamiento, si no hay token para esa persona, FARO redirige a `https://<institución>.instructure.com/login/oauth2/auth?client_id=...&response_type=code&redirect_uri=https://<faro>/oauth/callback&scope=<los seis scopes>&state=...`.
2. Canvas pide consentimiento al estudiante (una vez) y devuelve un `code`.
3. FARO lo canjea en `POST /login/oauth2/token` por `access_token` (1 hora) y `refresh_token`.
4. Ambos se guardan **solo en el backend**, cifrados en reposo, ligados a la persona.
5. Al expirar, FARO renueva con el `refresh_token`. Al retirar consentimiento, `DELETE /login/oauth2/token`.

Con esto desaparece `CANVAS_ACCESS_TOKEN` de `.env`: el backend pasa a tener un token por persona en vez de uno compartido.

## 7.4 Qué cambia en el backend

| Hoy (piloto) | Producción |
|---|---|
| `GET /api/launch` deduce curso y persona del token en `.env` | Los lee de la sesión creada por `/lti/launch`; `verified: true` |
| Un token para todo | Un token OAuth2 por persona, almacenado cifrado |
| Autorización por origen (CORS) y localhost | Autorización por sesión (cookie) + CORS |
| Estado de FARO en el navegador | PostgreSQL: propósito, sesiones, preferencias, tokens |
| Mentor local | `POST /api/mentor` en el backend, con el contexto de 11 campos y el contrato con el proveedor |

`allowlist.ts`, `canvas.ts` y las rutas `/canvas/*` **no cambian**: la lista blanca y la paginación son las mismas con cualquier token.

**Privacy Level de la LTI Key.** *Anonymous* no envía nombre ni correo en el lanzamiento; FARO no los necesita, así que es la opción coherente con el Libro 1. *Public* los enviaría; FARO los ignoraría, pero mejor no recibirlos.

## 7.5 Orden de trabajo sugerido

1. Desplegar el backend detrás de TLS (dominio propio, certificado válido). Sin esto, Canvas no acepta la herramienta.
2. Generar el par de claves de FARO; publicar `/.well-known/jwks.json`.
3. Implementar `/lti/login` y `/lti/launch` contra un curso de prueba en la instancia de la institución (o en Free-for-Teacher, que también admite LTI Keys desde la cuenta docente).
4. Implementar el flujo OAuth2 de 7.3.
5. Sustituir el lanzamiento por sesión en `/api/launch`.
6. Añadir PostgreSQL y mover el estado de FARO.
7. Registrar la herramienta a nivel de cuenta; piloto con un curso.

## 7.6 La extensión en este escenario

Sigue existiendo como opción: quien prefiera el panel lateral en vez del iframe de Canvas la instala, y la extensión llama al mismo backend con la misma sesión (la cookie viaja si `FARO_ALLOWED_ORIGINS` incluye el id de la extensión y la cookie es `SameSite=None`). El código de la extensión no cambia; cambia solo dónde apunta `VITE_FARO_API_URL`.
