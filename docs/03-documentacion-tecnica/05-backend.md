# 5. El backend (`server/`)

Un proceso Node.js, sin dependencias, que guarda el token de Canvas y sirve la API de FARO. Corre TypeScript directamente (`node src/index.ts`, Node 22.18+).

## 5.1 Configuración (`env.ts`)

Se lee una vez al arrancar, de `process.env` con respaldo en `server/.env`. El proceso **se niega a arrancar** sin `CANVAS_API_URL` ni `CANVAS_ACCESS_TOKEN`, y sin `https://` (salvo localhost).

| Variable | Por defecto | Qué es |
|---|---|---|
| `CANVAS_API_URL` | — (obligatoria) | `https://canvas.instructure.com` o `https://<institución>.instructure.com` |
| `CANVAS_ACCESS_TOKEN` | — (obligatoria) | Token de la cuenta de estudiante |
| `FARO_COURSE_ID` | vacío | Curso a abrir; si falta, la primera inscripción activa |
| `FARO_HOST` | `127.0.0.1` | Interfaz de escucha |
| `FARO_PORT` | `3000` | Puerto |
| `FARO_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Orígenes de navegador permitidos, separados por coma |
| `FARO_RATE_LIMIT_PER_MINUTE` | `120` | Peticiones por minuto por cliente |
| `FARO_CANVAS_TIMEOUT_MS` | `10000` | Tiempo máximo de una llamada a Canvas |
| `FARO_LOG_LEVEL` | `info` | `info` o `debug` |

`describe(env)` es la única representación de la configuración que puede imprimirse o devolverse: host de Canvas, puerto, orígenes y `tokenPresent: true`. Nunca el token.

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
- **CORS**: si hay `Origin` y no está en la lista → `403 origin_not_allowed`, sin cabeceras CORS. Preflight `OPTIONS` → `204` con `GET, OPTIONS`.
- **Rate limit**: ventana fija por dirección remota; al exceder → `429` con `Retry-After: 60`. Un barrido cada minuto descarta ventanas viejas.
- **Cabeceras** en toda respuesta: `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-FARO-Request: <id>`.
- **Log**: una línea JSON por petición con `id`, `method`, `path` (sin query), `status`, `ms`. Los errores internos se registran con su mensaje y el cliente recibe `500 internal`, nunca el detalle.

Los handlers tienen la forma `(req: Req) => Reply | Promise<Reply>`, con `json(status, body, headers?)` como ayudante. Esa forma se porta a Fastify sin cambios.

## 5.5 Rutas (`routes/`)

| Ruta | Handler | Respuesta |
|---|---|---|
| `GET /health` | `app.ts` | `{ ok, service, uptimeSeconds, canvas: { host, mode: 'live', readOnly: true }, allowedEndpoints: [{ name, purpose }] }` |
| `GET /api/launch` | `launch.ts` | `{ courseId, courseName, userId, verified: false, source: 'config' \| 'enrollment' }`. Resuelve `users/self` (conserva solo el id) y el curso de `FARO_COURSE_ID` o la primera inscripción activa. Cachea en memoria. Token inválido → `502 canvas_token_rejected`. |
| `GET /canvas/api/v1/...` | `canvas.ts` | Lista blanca → `canvasGet` → JSON completo. Cabeceras `X-FARO-Canvas-Pages` y `X-FARO-Canvas-Endpoint`. Errores: `403` (no permitido), `401/403/404` (pasan de Canvas), `502 canvas_unreachable`, `504 canvas_timeout`. |
| `GET /lti/login`, `POST /lti/launch`, `GET /.well-known/jwks.json` | `lti.ts` | `501 lti_not_configured` con el paso que falta. La especificación completa del flujo está en los comentarios del archivo. |

## 5.6 Arranque (`index.ts`)

```text
[faro-server] listening on http://127.0.0.1:3000 -> Canvas canvas.instructure.com (read-only, token in memory only)
```

Sin `.env` válido:

```text
[faro-server] CANVAS_ACCESS_TOKEN is required
[faro-server] Copy server/.env.example to server/.env and fill it in.
```

`SIGINT` / `SIGTERM` cierran el servidor limpiamente.

## 5.7 Pruebas (`test/`)

`fake-canvas.ts` es un Canvas de mentira que exige el Bearer, pagina con `Link` (2 filas por página para forzar varias páginas), y puede responder `401` en analíticas como hace Canvas con un estudiante sin permiso.

`e2e.ts` levanta el backend sobre ese Canvas y ejecuta 20 verificaciones. Se corre con `npm test` y termina con código distinto de cero al primer fallo. Lo que verifica es, literalmente, lo que el Libro 1 afirma.

## 5.8 Añadir una ruta de Canvas (procedimiento)

1. Justificarla: qué pantalla la necesita y qué dato mínimo lee.
2. Añadir la función en `src/data/canvas/endpoints.ts` y el scope en `requiredScopes`.
3. Añadir el patrón y su `purpose` en `server/src/allowlist.ts`.
4. Declarar solo los campos leídos en `src/data/canvas/raw.ts`.
5. Añadir el fixture en `fixtures.ts` y la ruta en `fixtureRoutes` (`client.ts`).
6. Añadir la ruta al `fake-canvas.ts` y una verificación en `e2e.ts`.
7. Actualizar el Libro 1 (capítulo 2, inventario de datos) y este capítulo.

Si el paso 1 no tiene una respuesta clara, la ruta no se añade.
