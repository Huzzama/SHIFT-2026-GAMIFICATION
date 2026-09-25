# 5. El backend (`server/`)

Un proceso Node.js, sin dependencias, que guarda el token de Canvas y la clave de Gemini, y sirve la API de FARO. Corre TypeScript directamente (`node src/index.ts`, Node 22.18+). Canvas y el mentor son opcionales por separado, pero al menos uno debe estar configurado.

## 5.1 Configuración (`env.ts`)

Se lee una vez al arrancar, de `process.env` con respaldo en `server/.env`. El proceso **se niega a arrancar**:

- con media configuración de Canvas (`CANVAS_API_URL` sin `CANVAS_ACCESS_TOKEN`, o al revés);
- sin nada que servir (ni Canvas ni `GEMINI_API_KEY`);
- con `CANVAS_API_URL` o `GEMINI_API_BASE` sin `https://` (salvo localhost).

Con solo `GEMINI_API_KEY`, arranca en modo **solo mentor**: `/api/launch` y `/canvas/*` responden `503 canvas_not_configured`, y la extensión se queda en modo `mock` para Canvas.

| Variable | Por defecto | Qué es |
|---|---|---|
| `CANVAS_API_URL` | vacío (opcional, en pareja con el token) | `https://canvas.instructure.com` o `https://<institución>.instructure.com` |
| `CANVAS_ACCESS_TOKEN` | vacío (opcional, en pareja con la URL) | Token de la cuenta de estudiante |
| `FARO_COURSE_ID` | vacío | Curso a abrir; si falta, la primera inscripción activa |
| `FARO_HOST` | `127.0.0.1` | Interfaz de escucha |
| `FARO_PORT` | `3000` | Puerto |
| `FARO_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Orígenes de navegador permitidos, separados por coma |
| `FARO_STRICT_ORIGINS` | vacío (`false`) | `true` = aceptar solo `FARO_ALLOWED_ORIGINS`, también en *loopback* (ver 5.4) |
| `FARO_RATE_LIMIT_PER_MINUTE` | `120` | Peticiones por minuto por cliente |
| `FARO_CANVAS_TIMEOUT_MS` | `10000` | Tiempo máximo de una llamada a Canvas |
| `FARO_LOG_LEVEL` | `info` | `info` o `debug` |
| `GEMINI_API_KEY` | vacío (opcional) | Clave de la API de Gemini. Vacía = mentor apagado; la extensión usa su mentor local |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Código del modelo. Los nombres cambian: verificar en `ai.google.dev/gemini-api/docs/models` |
| `GEMINI_TIMEOUT_MS` | `20000` | Tiempo máximo de una llamada a Gemini |
| `FARO_MENTOR_PER_MINUTE` | `20` | Llamadas al modelo por minuto por cliente (control de costo), además del límite global |
| `GEMINI_API_BASE` | `https://generativelanguage.googleapis.com` | Solo para pruebas: apuntar a un Gemini simulado |

`describe(env)` es la única representación de la configuración que puede imprimirse o devolverse: host de Canvas (o `null`), puerto, orígenes, `tokenPresent` y `mentor: { provider: 'gemini', model }` (o `null`). Nunca el token ni la clave.

## 5.2 Lista blanca (`allowlist.ts`)

Seis patrones, cada uno con su `purpose` escrito al lado. `allow(pathname, search)`:

1. Decodifica la ruta (`%2e%2e` no escapa).
2. Rechaza `..` y `//`.
3. Busca un patrón que coincida; si no, `path_not_allowed`.
4. Reconstruye la query solo con claves permitidas (`include[]`, `per_page`, `enrollment_state`, `page`) y valores validados (`include[]` solo `items` o `submission`; `enrollment_state` solo `active`).
5. Devuelve la ruta exacta que se enviará a Canvas.

Este archivo **debe coincidir** con `src/data/canvas/endpoints.ts` de la extensión. Si se añade una ruta en uno, se añade en el otro, y se documenta su propósito.

## 5.3 La llamada a Canvas (`canvas.ts`)

`canvasGet(env, path)` es la única función que construye una petición hacia Canvas:

- `GET`, `Authorization: Bearer`, `Accept: application/json`, `User-Agent: FARO/0.1 (read-only)`.
- `AbortController` con el timeout configurado.
- `redirect: 'manual'`: una redirección no se sigue (podría llevar el token a otro host).
- Sigue `Link: rel="next"` hasta el final y concatena los arreglos; máximo 50 páginas.
- Antes de cada página, verifica que la URL siga en `env.canvasApiUrl`.
- Errores como `CanvasError { status, path, kind: 'http' | 'timeout' | 'network' }`. Sin cuerpo de respuesta.

## 5.4 La capa HTTP (`http.ts`)

`HttpApp` sobre `node:http`:

- **Router** por método y expresión regular. Ruta desconocida → `404`; ruta conocida con método incorrecto → `405`.
- **CORS**: si hay `Origin` y no está en la lista → `403 origin_not_allowed`, sin cabeceras CORS. Preflight `OPTIONS` → `204` con `GET, POST, OPTIONS`. Cuando el servidor escucha en *loopback* (`FARO_HOST` = `127.0.0.1`, `localhost` o `::1`, el valor por defecto), también acepta cualquier origen `chrome-extension://<32 letras a–p>` (`allowExtensionOrigins`), para que la extensión cargada sin empaquetar funcione sin copiar su id. Se apaga con `FARO_STRICT_ORIGINS=true`, y solo cuando el servidor escucha en otra interfaz (p. ej. `0.0.0.0`). En producción: el id exacto en `FARO_ALLOWED_ORIGINS` y `FARO_STRICT_ORIGINS=true`.
- **Cuerpo de un POST**: solo `application/json` (si no, `415 json_required`), como máximo 32 KB (`MAX_BODY_BYTES`; si no, `413 body_too_large`), JSON válido (si no, `400 invalid_json`). El cuerpo nunca se registra ni se repite en un error.
- **Rate limit**: ventana fija por dirección remota; al exceder → `429` con `Retry-After: 60`. Un barrido cada minuto descarta ventanas viejas.
- **Cabeceras** en toda respuesta: `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-FARO-Request: <id>`.
- **Log**: una línea JSON por petición con `id`, `method`, `path` (sin query), `status`, `ms`. Nunca cabeceras, cuerpos ni query strings: un mensaje al mentor son las palabras del estudiante. Los errores internos se registran con su mensaje y el cliente recibe `500 internal`, nunca el detalle.

Los handlers tienen la forma `(req: Req) => Reply | Promise<Reply>`, con `json(status, body, headers?)` como ayudante. Esa forma se porta a Fastify sin cambios.

## 5.5 Rutas (`routes/`)

| Ruta | Handler | Respuesta |
|---|---|---|
| `GET /health` | `app.ts` | `{ ok, service, uptimeSeconds, canvas: { host, mode: 'live', readOnly: true } \| null, mentor: { provider, model } \| null, allowedEndpoints: [{ name, purpose }] }` |
| `GET /api/launch` | `launch.ts` | `{ courseId, courseName, userId, verified: false, source: 'config' \| 'enrollment' }`. Resuelve `users/self` (conserva solo el id) y el curso de `FARO_COURSE_ID` o la primera inscripción activa. Cachea en memoria. Token inválido → `502 canvas_token_rejected`. Sin Canvas configurado → `503 canvas_not_configured`. |
| `GET /canvas/api/v1/...` | `canvas.ts` | Lista blanca → `canvasGet` → JSON completo. Cabeceras `X-FARO-Canvas-Pages` y `X-FARO-Canvas-Endpoint`. Errores: `403` (no permitido), `401/403/404` (pasan de Canvas), `502 canvas_unreachable`, `504 canvas_timeout`; sin Canvas configurado, `503 canvas_not_configured`. |
| `POST /api/mentor` | `mentor.ts` | `{ text, suggestions, source: 'gemini' \| 'guardrail', model }`. Ver 5.6. |
| `GET /lti/login`, `POST /lti/launch`, `GET /.well-known/jwks.json` | `lti.ts` | `501 lti_not_configured` con el paso que falta. La especificación completa del flujo está en los comentarios del archivo. |

## 5.6 El mentor (`mentor.ts`, `routes/mentor.ts`)

`POST /api/mentor` responde la conversación abierta del Mentor con Google Gemini. Tres cosas viven en `mentor.ts` y en ningún otro lugar.

**1. `sanitizeMentorRequest` — la segunda frontera de privacidad.** La petición es `{ message, context, history?, mode? }`. Se reconstruye desde cero:

- `context`: solo los once campos de `MentorContext` (`course`, `progress`, `next_activity`, `estimated_time`, `student_goal`, `destination`, `available_time`, `momentum`, `friction_state`, `style`, `language`). Los enumerados se comprueban contra su lista, los números se acotan, los textos se recortan (`LIMITS`); cualquier campo extra se descarta.
- `history`: los últimos 8 turnos (`LIMITS.historyTurns`), solo `role` (`student` o `faro`) y `text`.
- `mode`: `chat`, `teach`, `focus`, `recovery` o `planning` (por defecto `chat`).
- Un campo inválido → `400 invalid_request`.

**2. `systemPrompt(context, mode)` — las reglas son el producto.** Reglas que no cambian con la voz ni el modo: guiar y nunca producir trabajo calificado; nunca etiquetar al estudiante (sin "en riesgo", sin conteos de vencidos); como máximo 90 palabras, texto plano, a lo sumo una pregunta; preguntar más que decir; calma, sin porras; con motivación baja, citar el destino que el estudiante escribió; usar solo los datos del contexto; fechas, prórrogas y calificaciones son de la institución; ante una crisis, cuidado, dejar el tema de estudio y remitir al apoyo estudiantil de la universidad o a servicios de emergencia. Cada modo añade su texto; por ejemplo, TEACH MODE: explicar en tres oraciones como máximo con un ejemplo cotidiano, hacer exactamente una pregunta de comprobación, y luego evaluar y adaptar. Se pide la respuesta como JSON `{ text, suggestions (≤ 3) }`; una respuesta en prosa también se acepta (`parseReply`).

**3. `callGemini` — una sola llamada.** `POST {GEMINI_API_BASE}/v1beta/models/{GEMINI_MODEL}:generateContent` con la clave **solo en la cabecera `x-goog-api-key`**, nunca en la URL; `AbortSignal.timeout(GEMINI_TIMEOUT_MS)`; las partes de "pensamiento" del modelo se descartan. El cuerpo de error de Gemini nunca se lee hacia un mensaje ni un log.

**El orden en la ruta:** sin clave → `503`; petición inválida → `400`; petición de "haz mi trabajo calificado" → respuesta fija del servidor, `source: 'guardrail'`, **sin llamar al modelo** (sin costo, siempre igual); tope por cliente → `429`; después, Gemini.

**Códigos con los que la extensión cae al mentor local:**

| Código | Cuándo |
|---|---|
| `503 mentor_not_configured` | No hay `GEMINI_API_KEY` |
| `502 mentor_key_rejected` | Google rechazó la clave (401/403) |
| `502 mentor_upstream` | Cualquier otro error de Gemini |
| `502 mentor_blocked` | El filtro de seguridad del modelo detuvo la respuesta |
| `504 mentor_timeout` | Gemini no respondió a tiempo |
| `429 mentor_rate_limited` | Se superó `FARO_MENTOR_PER_MINUTE` para ese cliente |
| `400 invalid_request` | El cuerpo no pasó la lista permitida |

Más los de la capa HTTP: `413 body_too_large`, `415 json_required`.

**Registro:** nada de la conversación se registra (ni mensaje, ni respuesta, ni contexto), y la clave nunca aparece en logs ni respuestas. La línea de log es la misma de cualquier ruta.

## 5.7 Arranque (`index.ts`)

```text
[faro-server] listening on http://127.0.0.1:3000
[faro-server] Accepting the unpacked FARO extension (any chrome-extension:// origin, loopback only)
[faro-server] Canvas: canvas.instructure.com (read-only, token in memory only)
[faro-server] Mentor: Gemini gemini-3.5-flash (key in memory only)
```

La segunda línea aparece solo cuando se aceptan orígenes de extensión (*loopback* sin `FARO_STRICT_ORIGINS=true`). Si falta Canvas o el mentor, su línea dice `not configured`. Con una configuración inválida:

```text
[faro-server] Nothing to serve: set CANVAS_API_URL + CANVAS_ACCESS_TOKEN, GEMINI_API_KEY, or both
[faro-server] Copy server/.env.example to server/.env and fill it in.
```

`SIGINT` / `SIGTERM` cierran el servidor limpiamente.

## 5.8 Pruebas (`test/`)

`fake-canvas.ts` es un Canvas de mentira que exige el Bearer, pagina con `Link` (2 filas por página para forzar varias páginas), y puede responder `401` en analíticas como hace Canvas con un estudiante sin permiso.

`fake-gemini.ts` es un Gemini de mentira: exige la clave en la cabecera como Google, guarda cada cuerpo y URL recibidos para comprobar qué habría salido hacia Google, y responde lo que la prueba elija (JSON, prosa, bloqueo de seguridad, un estado HTTP o una demora).

`e2e.ts` levanta el backend sobre esos simulados y ejecuta 38 verificaciones: 21 de Canvas, CORS (incluido que un origen de extensión se rechaza si no están habilitados), logs y `.env`, y 17 del mentor (incluida la llamada desde la extensión sin empaquetar en *loopback*), del modo solo mentor y de las reglas de configuración (*loopback* por defecto, `FARO_STRICT_ORIGINS` y el caso `0.0.0.0`). Se corre con `npm test` y termina con código distinto de cero al primer fallo. Lo que verifica es, literalmente, lo que el Libro 1 afirma.

## 5.9 Añadir una ruta de Canvas (procedimiento)

1. Justificarla: qué pantalla la necesita y qué dato mínimo lee.
2. Añadir la función en `src/data/canvas/endpoints.ts` y el scope en `requiredScopes`.
3. Añadir el patrón y su `purpose` en `server/src/allowlist.ts`.
4. Declarar solo los campos leídos en `src/data/canvas/raw.ts`.
5. Añadir el fixture en `fixtures.ts` y la ruta en `fixtureRoutes` (`client.ts`).
6. Añadir la ruta al `fake-canvas.ts` y una verificación en `e2e.ts`.
7. Actualizar el Libro 1 (capítulo 2, inventario de datos) y este capítulo.

Si el paso 1 no tiene una respuesta clara, la ruta no se añade.
