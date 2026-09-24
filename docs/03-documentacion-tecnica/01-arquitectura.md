# 1. Arquitectura

## 1.1 Las piezas

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Canvas LMS                                     fuente de verdad académica│
│  cursos · módulos · actividades · entregas · actividad del estudiante     │
└───────────────────────────────▲──────────────────────────────────────────┘
                                │ HTTPS · Authorization: Bearer · solo GET
                                │ 6 rutas permitidas · paginación por Link
┌───────────────────────────────┴──────────────────────────────────────────┐
│  FARO Backend  (server/, Node.js sin dependencias)                        │
│                                                                          │
│   env.ts ─── allowlist.ts ─── canvas.ts ─── http.ts ─── routes/          │
│   token       6 patrones       paginación    CORS        /health         │
│   config      + query          timeout       rate limit  /api/launch     │
│                                              logging     /canvas/*       │
│   mentor.ts ─ filtro de 11 campos · prompt · Gemini ───── /api/mentor     │
│                                                          /lti/* (501)    │
└───────────────────────────────▲──────────────────────────────────────────┘
                                │ HTTP · sin credencial · JSON ya paginado
                                │ CORS por origen · Cache-Control: no-store
┌───────────────────────────────┴──────────────────────────────────────────┐
│  Extensión  (src/, React + Vite, Manifest V3 side panel)                  │
│                                                                          │
│   data/canvas/      →  data/client.ts   →   lib/*          →   views/    │
│   transport (mock   →  CourseSnapshot   →   friction       →   Home      │
│    o backend)          (la costura)         journey            Journey   │
│   client (mapeo)                            recoveryPlanner    Recovery  │
│   config (modo)                             points, community  Mentor…   │
│                                                                          │
│   state/store.tsx   chrome.storage.local (propósito, sesiones, perfil)    │
│   services/mentor   LocalMentorService · HybridMentorService (Gemini vía │
│                     backend + respaldo local) según VITE_MENTOR_MODE     │
└──────────────────────────────────────────────────────────────────────────┘
```

Y, solo si el mentor con IA está activo:

```text
 FARO Backend ──► Google Gemini       POST /v1beta/models/{modelo}:generateContent
                                      clave solo en la cabecera x-goog-api-key
                                      11 campos + mensaje + últimos 8 turnos; sin identidad
```

## 1.2 Los cuatro principios que la forma sigue

**1. Canvas es la fuente de verdad; FARO nunca la copia ni la altera.**
Cada apertura de FARO relee el curso. No hay base de datos de calificaciones en FARO, ni la habrá: lo que FARO persiste es lo que FARO crea (propósito, sesiones, preferencias).

**2. La credencial vive en un solo proceso.**
El backend existe por esta razón. Una extensión es código público; un token dentro de ella es un token publicado. El backend guarda el token, decide qué rutas acepta y devuelve JSON. La extensión no sabe qué token hay ni cómo se llama la cabecera. La misma regla vale para la clave de Gemini: vive en el backend, y la extensión solo conoce `POST /api/mentor`.

**3. La costura es un tipo, no una clase.**
`CourseSnapshot` (`src/data/client.ts`) es la única forma en que los datos del curso entran al resto de la aplicación. Todo lo que está por encima (`lib/`, `views/`) trabaja sobre ese tipo y no sabe si vino de fixtures o de una institución. Por eso cambiar de modo es una variable de entorno y no una reescritura.

**4. La lógica no sabe que existe React.**
`src/lib/` son funciones puras: entran datos, sale una decisión. Se pueden probar sin montar la interfaz, y se podrán mover al backend sin cambiarlas cuando el motor de fricción deba correr en el servidor.

## 1.3 Los dos modos

| | `mock` | `http` |
|---|---|---|
| Se elige con | `VITE_CANVAS_MODE=mock` (por defecto) | `VITE_CANVAS_MODE=http` |
| Quién responde las rutas de Canvas | `MockCanvasTransport` con `fixtures.ts` | `BackendCanvasTransport` → backend → Canvas |
| Lanzamiento (curso + persona) | Fijo: curso 4021, estudiante 77120 | `GET /api/launch` al backend |
| Perfil de estudio (ritmo medido) | Fixture: 35 min/sesión, 4 días/semana | Ausente; Recuperación lo dice |
| Estimación de minutos por actividad | Tabla de fixtures | 20 min por defecto en todas |
| Necesita backend | No | Sí |

Lo que **no** cambia entre modos: `client.ts` (el mapeo), `lib/` (todas las reglas), `views/` (todas las pantallas), `i18n/`. Es el mismo código contra un transporte distinto.

El mentor tiene su propio interruptor, independiente del de Canvas:

| | `local` | `gemini` |
|---|---|---|
| Se elige con | `VITE_MENTOR_MODE=local` (por defecto) | `VITE_MENTOR_MODE=gemini` |
| Quién responde la conversación abierta | `LocalMentorService`, en el dispositivo | `HybridMentorService`: `HttpMentorService` → `POST /api/mentor` → Gemini; si falla, `LocalMentorService` |
| Qué sale del dispositivo | Nada | Contexto de 11 campos, el mensaje y los últimos 8 turnos, al backend |
| Necesita backend | No | Sí, con `GEMINI_API_KEY` (Canvas puede no estar configurado) |

En ambos modos, los momentos estructurados del mentor (registro de ánimo, Enfoque, Volver, plan de fin de semana, puntos, Enséñame local) se calculan en la extensión con `lib/`; nunca los decide un modelo.

## 1.4 El flujo de una apertura

1. `main.tsx` monta `App` dentro de `StoreProvider`.
2. `store.tsx` lee `chrome.storage.local` (propósito, sesiones, preferencias, perfil, plan guardado `weekPlan`).
3. `store.tsx` llama `faroClient.getCourseSnapshot()`.
4. `CanvasFaroClient` resuelve el lanzamiento (`resolveLaunch`), emite las cuatro peticiones en paralelo y mapea las respuestas a `CourseSnapshot`.
5. `store.tsx` deriva todo lo demás con `lib/`: fricción, ruta, siguiente mejor acción, plan de recuperación, puntos, logros y la semana de ritmo (`week`).
6. `App.tsx` muestra Propósito si no hay destino; si no, la pestaña activa.
7. Si el paso 3 falla, `App.tsx` muestra el error con un botón *Reintentar*. Nunca se inventa un curso.

## 1.5 Lo que el backend hace y lo que no

**Hace:** guardar el token y la clave de Gemini, validar rutas, hablar con Canvas, paginar, limitar tasa, restringir orígenes, registrar sin datos personales, resolver el lanzamiento en el piloto, y responder `POST /api/mentor` llamando a Gemini con un contexto revalidado (capítulo 5). Canvas y el mentor son opcionales por separado: el backend puede correr solo como mentor.

**No hace todavía [pendiente]:** persistir estado de FARO (PostgreSQL), correr el motor de fricción, guardar conversaciones (a propósito: no se guardan), verificar lanzamientos LTI (las rutas responden 501 con la especificación en comentarios).

La regla para mover algo al backend: cuando necesite datos de más de un dispositivo, cuando necesite una credencial, o cuando deba ser auditable por la institución. Hasta entonces, se queda en la extensión.
