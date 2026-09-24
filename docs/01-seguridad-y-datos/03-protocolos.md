# 3. Protocolos: por qué son seguros

FARO no inventa ningún mecanismo de seguridad. Usa los mismos estándares que Canvas exige a cualquier integración y los aplica de la forma más restrictiva que el producto permite. Este capítulo explica cada uno: qué problema resuelve, cómo lo usa FARO y qué garantiza.

## 3.1 TLS (HTTPS) — el canal

**Problema que resuelve:** que nadie en la red (Wi-Fi de una cafetería, un proveedor de internet, un proxy institucional mal configurado) pueda leer o alterar lo que viaja entre FARO y Canvas.

**Cómo lo usa FARO:** el backend se niega a arrancar si `CANVAS_API_URL` no empieza con `https://`. La única excepción es `localhost`, y existe solo para las pruebas automáticas contra el Canvas simulado.

**[código]** `server/src/env.ts`, función `loadEnv`.

**Garantía:** el token de Canvas solo viaja cifrado. Canvas, por su parte, solo acepta la API por HTTPS.

## 3.2 Token portador (Bearer) — la credencial de la API

**Problema que resuelve:** demostrar a Canvas quién hace la petición sin enviar una contraseña.

**Cómo lo usa FARO:** el backend añade `Authorization: Bearer <token>` a cada petición hacia Canvas, que es el método que Instructure recomienda ("If possible, using the HTTP Authorization header is recommended"). El token nunca va en la URL, nunca en el cuerpo, nunca en un log.

**[código]** `server/src/canvas.ts`, función `canvasGet`. **[prueba]** "the token was sent to Canvas on every call, and only there" y "log lines carry no query strings".

**Garantía:** Instructure describe los tokens como "password equivalent". FARO los trata exactamente así: viven en un solo proceso, en memoria, y se leen de un archivo que git ignora. El capítulo 4 detalla su ciclo de vida.

**Limitación del piloto, declarada:** un token personal generado a mano es lo que Instructure indica para pruebas ("For testing your application before you've implemented OAuth, the simplest option is to generate an access token on your user's profile page"). Para múltiples usuarios, la propia documentación es tajante: "Applications in use by multiple users MUST use OAuth to obtain tokens". FARO cumple eso con el camino LTI + OAuth2 de la sección 3.4. **[pendiente]**

## 3.3 Lista blanca de rutas — el alcance

**Problema que resuelve:** que un token con más permisos de los necesarios (un token personal de estudiante puede leer todo lo que el estudiante ve en Canvas) se use solo para lo que FARO necesita.

**Cómo lo usa FARO:** el backend compara cada ruta pedida contra seis expresiones regulares. Solo `GET`. Solo los parámetros `include[]`, `per_page`, `enrollment_state` y `page`, con valores validados. Cualquier otra cosa se rechaza con `403` **antes de tocar la red**. La ruta se decodifica antes de compararla, así que `%2e%2e` no puede escapar del patrón.

**[código]** `server/src/allowlist.ts`. **[prueba]** "a path outside the allow list is refused locally (no Canvas call)", "an unknown query parameter is refused", "path traversal is refused", "a write is refused even on an allowed path".

**Garantía:** aunque la extensión fuera modificada por alguien, no puede convertir el backend en un proxy general hacia Canvas. Y aunque el token del piloto pudiera leer la lista de compañeros, FARO **no puede pedirla**.

## 3.4 LTI 1.3 + OpenID Connect + JWT — el lanzamiento institucional

Este es el camino de producción. Está diseñado y documentado en el código; las rutas existen y responden `501` hasta que la institución registre la herramienta. **[pendiente]**

**Problema que resuelve:** saber con certeza *qué curso* y *qué persona* están abriendo FARO, sin pedirle a nadie que se identifique y sin que FARO tenga que confiar en lo que la extensión dice.

**Cómo funciona (IMS Security Framework 1.0):**

1. Canvas inicia un *login* OpenID Connect hacia `GET /lti/login`. FARO guarda un `state` y un `nonce` de vida corta y redirige al endpoint de autorización de Canvas.
2. Canvas responde con `POST /lti/launch` y un `id_token`: un JWT **firmado por Canvas** con RS256.
3. FARO descarga las claves públicas de Canvas (JWKS), verifica la firma, el emisor (`iss`), la audiencia (`aud` = el `client_id` de FARO), la expiración y que el `nonce` sea el emitido y no se haya usado.
4. De las *claims* verificadas, FARO lee exactamente dos cosas: el curso (`https://purl.imsglobal.org/spec/lti/claim/context`) y la persona (`sub`).
5. FARO emite su propia sesión (cookie `HttpOnly`, `Secure`, `SameSite=None` porque corre dentro de un iframe de Canvas) ligada a ese curso y esa persona.

**[código]** `server/src/routes/lti.ts` (especificación completa en los comentarios).

**Garantía:** la identidad del estudiante la afirma Canvas criptográficamente, no la extensión. FARO no puede ser engañado para mostrar el curso de otra persona porque no acepta ninguna afirmación de identidad que no venga firmada por la institución.

**Permisos LTI:** FARO solicita `contextmembership.readonly` (NRPS, para conteos de presencia agregada) y `result.readonly` (AGS, resultados de solo lectura). **Rechaza** `score` y `lineitem`, los dos permisos que permitirían escribir en el libro de calificaciones. Un administrador puede verificar esto en la pantalla de la clave de desarrollador sin leer una línea de código.

**[código]** `src/data/canvas/endpoints.ts`, constante `ltiScopes`.

## 3.5 OAuth2 con clave de desarrollador — el token por estudiante

**[pendiente]** Una vez registrada la herramienta, cada estudiante obtiene su propio token de acceso mediante el flujo OAuth2 de Canvas, con los *scopes* limitados a las seis rutas (en el formato `url:GET|/api/v1/...` que Canvas usa en la clave de desarrollador). Los tokens de este flujo expiran en una hora y se renuevan con un *refresh token*, ambos guardados solo en el backend. Se revocan con `DELETE /login/oauth2/token`.

**Garantía:** desaparece el token compartido del piloto. Cada estudiante ve exactamente lo que Canvas le deja ver a él, y revocar el acceso de FARO a una persona es una operación de un solo token.

**[código]** los *scopes* ya están escritos en `src/data/canvas/endpoints.ts`, constante `requiredScopes`.

## 3.6 CORS — quién puede llamar al backend desde un navegador

**Problema que resuelve:** que una página web cualquiera, abierta en el mismo navegador, use el backend de FARO como si fuera la extensión.

**Cómo lo usa FARO:** el backend mantiene una lista de orígenes permitidos (`FARO_ALLOWED_ORIGINS`). Un origen fuera de la lista recibe `403` sin datos ni cabeceras CORS. Los métodos anunciados son `GET, POST, OPTIONS`: `POST` existe para `POST /api/mentor` (y para el lanzamiento LTI, que hoy responde 501). Hacia Canvas el backend sigue enviando solo `GET`.

**[código]** `server/src/http.ts`, método `corsHeaders`. **[prueba]** "a browser origin outside the list gets 403 and no data", "CORS preflight succeeds for an allowed origin".

## 3.7 Límite de tasa — protección contra bucles

**Problema que resuelve:** una extensión con un error que reintenta en bucle podría enviar miles de peticiones a Canvas con el token institucional, y Canvas podría suspender ese token.

**Cómo lo usa FARO:** contador por cliente en ventana de un minuto (`FARO_RATE_LIMIT_PER_MINUTE`, 120 por defecto). Al superarlo, `429` con `Retry-After`. Las llamadas al modelo tienen además su propio tope por cliente (`FARO_MENTOR_PER_MINUTE`, 20 por defecto), que responde `429 mentor_rate_limited` antes de llamar a Gemini, para contener el costo.

**[código]** `server/src/http.ts`, clase `RateLimiter`; `server/src/routes/mentor.ts`. **[prueba]** "rate limit trips after the configured burst", "mentor: per-client cap answers 429 before calling the model".

## 3.8 Cabeceras de respuesta

Toda respuesta del backend lleva `Cache-Control: no-store` (ningún dato académico queda en cachés intermedios), `X-Content-Type-Options: nosniff` y `Referrer-Policy: no-referrer`.

**[código]** `server/src/http.ts`, función `send`. **[prueba]** "responses carry no-store and nosniff".

## 3.9 Resumen: qué protocolo protege qué

| Amenaza | Protocolo / control | Estado |
|---|---|---|
| Escucha en la red | TLS obligatorio | [código] |
| Robo de credencial desde el navegador | El navegador no tiene credencial | [código] [prueba] |
| Uso del token más allá de lo necesario | Lista blanca de 6 rutas, solo GET | [código] [prueba] |
| Suplantación de estudiante | LTI 1.3 con JWT firmado por Canvas | [pendiente] |
| Token compartido entre personas | OAuth2 por estudiante | [pendiente] |
| Página maliciosa usando el backend | CORS con lista de orígenes | [código] [prueba] |
| Bucle de peticiones | Límite de tasa | [código] [prueba] |
| Escritura en el expediente | Sin permisos de escritura; scopes `score`/`lineitem` rechazados | [código] |
