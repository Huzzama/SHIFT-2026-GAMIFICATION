# 8. Verificación y pruebas

## 8.1 Lo que se verifica automáticamente

`cd server && npm test` levanta un Canvas simulado con paginación real, un Gemini simulado (`server/test/fake-gemini.ts`) y el backend encima, y ejecuta estas 36 verificaciones:

```text
ok  health names the Canvas host and never the token
ok  launch resolves the token owner and the first active course
ok  course proxy returns the Canvas object
ok  modules are paginated by Canvas and merged by the backend
ok  assignments carry submissions across three pages
ok  activity is forwarded for the token owner
ok  a path outside the allow list is refused locally (no Canvas call)
ok  a write is refused even on an allowed path
ok  an unknown query parameter is refused
ok  path traversal is refused
ok  a browser origin outside the list gets 403 and no data
ok  CORS preflight succeeds for an allowed origin
ok  responses carry no-store and nosniff
ok  Canvas 404 is passed through as 404
ok  the token was sent to Canvas on every call, and only there
ok  log lines carry no query strings
ok  rate limit trips after the configured burst
ok  Canvas 401 on analytics is passed through so the client can fall back
ok  a wrong token is reported as rejected, not as a generic failure
ok  .env parser handles comments, quotes and CRLF
ok  mentor: answers with Gemini and returns text + suggestions
ok  mentor: the key goes in a header, never in the URL
ok  mentor: extra fields in the context never reach Gemini
ok  mentor: teach mode reaches the system prompt; thought parts are dropped
ok  mentor: history is trimmed to the last 8 turns
ok  mentor: "do my homework" is refused before any model call
ok  mentor: a bad context is rejected with 400
ok  mentor: a non-JSON body gets 415 and a huge body 413
ok  mentor: prose instead of JSON still becomes a reply
ok  mentor: a rejected key and a safety block map to fallback codes
ok  mentor: a slow model times out with 504
ok  mentor: per-client cap answers 429 before calling the model
ok  mentor: the key and the conversation never appear in the log
ok  mentor: without a key the route answers 503 so the extension falls back
ok  mentor-only server: Canvas routes say canvas_not_configured
ok  config: half a Canvas setup is refused, mentor-only is accepted

36 checks passed
```

Las 16 últimas cubren el mentor: que la respuesta de Gemini se convierte en `{ text, suggestions }`; que la clave va solo en la cabecera; que los campos extra del contexto nunca llegan a Gemini; que el modo Enséñame llega al prompt; que el historial se recorta a 8 turnos; que "haz mi tarea" se responde sin llamar al modelo; los `400`, `413` y `415`; que una respuesta en prosa se acepta; que una clave rechazada da `mentor_key_rejected` sin repetir el cuerpo de Google; el bloqueo de seguridad; el `504`; el `429` por cliente; que ni la clave ni la conversación aparecen en el log; el `503` sin clave; el `canvas_not_configured` y `/health` de un servidor solo mentor; y las reglas de configuración.

No usa ningún framework de pruebas: `node:assert` y un `check(nombre, fn)` de diez líneas. El proceso termina con código distinto de cero al primer fallo, así que sirve como paso de CI.

## 8.2 Lo que se verificó del mapeo de la extensión

Además de lo anterior, la capa `src/data/canvas/` se compiló y ejecutó en Node contra el mismo Canvas simulado y el backend real, en los cuatro escenarios que importan:

| Escenario | Resultado esperado y obtenido |
|---|---|
| **Mock** | 16 actividades, 7 completadas, 4 llamadas a fixtures, lanzamiento `fixture`, perfil de estudio presente |
| **Http a través del backend** | Curso GP-101, 3 módulos (el tercero `locked`), 5 actividades (la huérfana 999 excluida), 3 con entrega, `module_id` correcto, `course_id` del curso vivo, 20 min por defecto, 3 eventos de actividad ordenados del más reciente, **sin** perfil de estudio, `activityFallback = false`, 4 llamadas con 200 |
| **Analíticas prohibidas (401)** | `activityFallback = true`, actividad derivada de 3 entregas, la ruta de analíticas con 401 en el registro, ninguna llamada a `/enrollments` |
| **Backend caído** | `getCourseSnapshot()` rechaza; nunca devuelve un curso vacío |

Este script no está en el repositorio porque depende de compilar la extensión sin Vite; los escenarios sí están descritos aquí para reproducirlos.

## 8.2b El mentor con Gemini, de punta a punta

El camino completo (extensión con `VITE_MENTOR_MODE=gemini` → `POST /api/mentor` → Gemini) se verificó en el navegador **contra el Gemini simulado**, incluido el respaldo: con el simulado caído, la extensión respondió con el mentor local y la nota *"Gemini no pudo responder en este momento, así que respondió el mentor local"*.

**No se ha ejercitado contra la API real de Google** desde el entorno de desarrollo: la política de red lo bloqueó. El equipo lo valida con su propia clave (capítulo 6 y README). Los nombres de modelo cambian: verificar `GEMINI_MODEL` en `ai.google.dev/gemini-api/docs/models` antes de probar.

## 8.3 Verificación manual en la interfaz

Con los fixtures (modo mock), la app debe mostrar exactamente:

| Dato | Valor |
|---|---|
| Actividades totales | 16 |
| Completadas | 7 |
| Progreso | 44 % |
| Restantes | 9 actividades, 4 h 35 min |
| Días hasta el cierre | 12 |
| Días sin actividad | 5 |
| Estado de fricción | FRICTION |
| Módulo 3 | iniciado |
| Módulo 5 | bloqueado |

Y en **Perfil → Canvas**: insignia *Simulado*, cuatro rutas GET, dos permisos rechazados, registro con cuatro entradas `200` (~140 ms).

## 8.4 Romperlo a propósito

Tres experimentos con los fixtures, cada uno con un resultado que debe cambiar:

1. **`DAYS_INACTIVE` de 5 a 9** → estado DISCONNECTION, Inicio cambia de tono, Recuperación ofrece misión de regreso. Nada de esto está escrito en las vistas: sale del umbral `disconnectionDays: 7`.
2. **`DAYS_UNTIL_COURSE_ENDS` de 12 a 3** → veredicto *no es realista* con las tres estrategias marcadas como no factibles y trabajo en desbordamiento.
3. **Una ruta con error de tipeo en `endpoints.ts`** → 404 en el registro del panel. El mock no resuelve por coincidencia.

## 8.5 Typecheck

- Raíz: `npm run typecheck`. Requiere `npm install` previo (React, Vite). Si no imprime nada tras las dos líneas del encabezado, pasó.
- `server/`: `npm install && npm run typecheck`. Instala solo `typescript` y `@types/node` como dependencias de desarrollo; el backend en ejecución sigue sin dependencias.

`en.ts` tipado contra `es.ts` hace que una clave faltante en un idioma sea un error de compilación, no un texto en blanco en la demo.

## 8.6 Qué no está probado todavía

- La interfaz React contra un backend real en un navegador (las pruebas anteriores cubren la capa de datos, no el render). Se cubre con el procedimiento del capítulo 6.
- Las rutas LTI (responden 501 por diseño).
- El mentor contra la API real de Gemini (ver 8.2b).
- La lógica nueva de `lib/` (`timeSession`, `rewardPath`, `teach`, `rhythm`) no tiene pruebas automáticas propias.
- Comportamiento con cursos grandes (más de 100 módulos o actividades, es decir, más de una página de Canvas real). La paginación está probada con el Canvas simulado; conviene repetirla contra Free-for-Teacher con `per_page=2` forzado en una prueba.
