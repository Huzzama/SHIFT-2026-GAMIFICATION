# 4. La capa Canvas en la extensión (`src/data/canvas/`)

Siete archivos. Es la única parte de la extensión que sabe que Canvas existe.

## 4.1 `endpoints.ts` — el audit surface

Las rutas que FARO usa, construidas desde una función cada una:

```text
course(id)             GET /api/v1/courses/:id
modules(id)            GET /api/v1/courses/:id/modules?include[]=items&per_page=100
assignments(id)        GET /api/v1/courses/:id/assignments?include[]=submission&per_page=100
userActivity(id, uid)  GET /api/v1/courses/:id/analytics/users/:uid/activity
activeCourses()        GET /api/v1/courses?enrollment_state=active&per_page=100
self()                 GET /api/v1/users/self          (solo el backend, al resolver el lanzamiento)
```

Y dos listas para el administrador de Canvas: `requiredScopes` en el formato `url:GET|/api/v1/...` de la clave de desarrollador, y `ltiScopes` con lo que FARO pide (`contextmembership.readonly`, `result.readonly`) y lo que rechaza (`score`, `lineitem`).

`PER_PAGE = 100` es el máximo de Canvas: menos viajes, mismos datos.

## 4.2 `raw.ts` — la forma de Canvas

Tipos en `snake_case` que declaran **solo los campos que FARO lee**. Canvas envía muchos más; se ignoran en vez de modelarse, así una versión nueva de Canvas que añada campos no rompe esta capa. Cuando este archivo y la documentación de Canvas discrepen, la diferencia debe ser visible: por eso no se traduce al estilo del código.

Campos importantes:

- `RawModule.items` — presente cuando se pidió `include[]=items`. Cada ítem tiene `content_id` (el id de la actividad a la que apunta) y `completion_requirement.completed` (si *este* estudiante la cumplió).
- `RawModule.state` — `locked | unlocked | started | completed`. **Solo aparece si quien llama es estudiante del curso.** Un docente no lo ve.
- `RawAssignment.submission` — presente con `include[]=submission`. Un `workflow_state: 'unsubmitted'` es un stub que significa *no hecho*.
- `RawUserActivity.page_views` — un objeto cuyas claves son fechas ISO redondeadas a la hora y cuyos valores son conteos. FARO conserva las claves y descarta los valores.

## 4.3 `transport.ts` — cómo se hace la petición

Una interfaz, dos implementaciones:

```ts
interface CanvasTransport {
  readonly mode: 'mock' | 'http'
  get<T>(path: string): Promise<T>
}
```

**`MockCanvasTransport`** — busca la ruta en una lista de patrones (`fixtureRoutes` en `client.ts`), espera 140 ms simulados y devuelve el fixture. Una ruta sin patrón produce **404 en el registro**, igual que una ruta equivocada contra un Canvas real. Un error de tipeo en `endpoints.ts` se ve, no se esconde.

**`BackendCanvasTransport`** — hace `fetch(`${apiUrl}/canvas${path}`)` sin ninguna cabecera de autorización. El backend pagina; aquí un solo viaje es la respuesta completa. Un estado no-2xx lanza `CanvasHttpError` con el código y el `error` del cuerpo JSON del backend (`path_not_allowed`, `canvas_error`, `canvas_unreachable`…).

**`canvasLog`** — un buffer circular de 30 registros en memoria (`at`, `method`, `path`, `mode`, `status`, `ms`, `items`, `error`). El panel de Perfil se suscribe y lo dibuja. Nunca se persiste ni se envía. Es la diferencia entre afirmar una integración y mostrarla.

## 4.4 `client.ts` — el mapeo

`CanvasFaroClient.getCourseSnapshot()`:

1. Resuelve el lanzamiento (`courseId`, `userId`).
2. Emite las cuatro peticiones en paralelo con `Promise.all`.
3. Si la de actividad falla con 401/403, no falla todo: marca `integrationStatus.activityFallback = true` y devuelve `null` para esa parte. Cualquier otro error sí se propaga.
4. Recorre los módulos y sus ítems para construir dos mapas: `moduleOfAssignment` (de `content_id` al id de módulo, solo para ítems de tipo `Assignment` o `Quiz`) y `completedByModule`.
5. Filtra las actividades a las que algún ítem de módulo apunta. **Una actividad sin ítem de módulo no está en la ruta**: Canvas permite actividades sueltas, y ponerlas en el recorrido inventaría estructura que el docente no creó.
6. Mapea cada actividad: `submission` se conserva solo si `workflow_state !== 'unsubmitted'` y hay `submitted_at`. Es decir: **hecho es lo que la entrega dice, no la fecha límite**.
7. Mapea la actividad a eventos con marca de tiempo; o, en el respaldo, deriva eventos de las fechas de entrega del propio estudiante.
8. `estimated_minutes` sale de la función de estimación inyectada: la tabla de fixtures en modo mock, `undefined` (→ 20 min por defecto) en modo http, porque los ids de fixtures coincidirían con ids reales por casualidad.
9. `profile` (ritmo medido) solo existe en modo mock. En vivo, FARO es honesto sobre no conocer el ritmo del estudiante todavía.

Tres decisiones que un integrador descuidado haría al revés, nombradas en el encabezado del archivo: la pertenencia a módulo viene de los ítems, no de la actividad; "hecho" viene de la entrega, no de la fecha; los minutos estimados son de FARO y se dicen como tales.

## 4.5 `config.ts` — modo y lanzamiento

```ts
canvasConfig = {
  mode:   VITE_CANVAS_MODE === 'http' ? 'http' : 'mock',
  apiUrl: VITE_FARO_API_URL ?? 'http://127.0.0.1:3000',
}
```

No hay campo para un token y no puede haberlo.

`resolveLaunch()` devuelve el `LaunchContext` (curso, nombre, persona, `verified`, `source`). En mock es inmediato (`source: 'fixture'`). En http llama una vez a `GET /api/launch` y lo cachea; `currentLaunch()` y `onLaunch()` permiten que el panel de Perfil se actualice cuando llega.

`verified` es `false` en ambos modos hoy. Solo un lanzamiento LTI firmado lo pondrá en `true`, y el panel lo dice.

## 4.6 `status.ts` — flags de comportamiento

Un objeto observable con `activityFallback`. Existe para que un respaldo no pase en silencio como si fuera el dato real: el panel de Perfil muestra la nota *"tu cuenta no puede leer las analíticas de Canvas, así que la actividad se calcula con las fechas de tus propias entregas"*.

## 4.7 `fixtures.ts` — el curso de demostración

Un curso en español, *Gestión de Proyectos* (GP-101), 6 módulos, 16 actividades, con la forma exacta que Canvas envía. El escenario: un adulto cinco semanas dentro de un curso, que dejó de entrar hace `DAYS_INACTIVE = 5` días, con `DAYS_UNTIL_COURSE_ENDS = 12` días para el cierre. Es el momento exacto para el que FARO existe.

Con estos fixtures los números esperados son: 16 actividades, 7 completadas (44 %), 9 restantes (4 h 35 min), 12 días, 5 sin actividad, módulo 3 iniciado, módulo 5 bloqueado, estado FRICTION.

## 4.8 Cambiar de modo

```bash
# .env.local en la raíz (git lo ignora)
VITE_CANVAS_MODE=http
VITE_FARO_API_URL=http://127.0.0.1:3000
```

`npm run dev` o `npm run build`. Ningún archivo de código cambia.
