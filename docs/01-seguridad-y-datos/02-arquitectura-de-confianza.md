# 2. Arquitectura de confianza: dónde vive cada dato

La pregunta que más importa en una revisión de seguridad no es "¿qué protocolo usan?" sino "¿dónde está cada dato y quién puede llegar a él?". Esta es la respuesta completa.

## 2.1 Zonas de confianza

FARO tiene cuatro zonas. Cada dato vive en exactamente una, y cruza una frontera solo por una razón documentada.

| Zona | Qué contiene | Quién tiene acceso | Confianza |
|---|---|---|---|
| **Z1 · Canvas** | Todo el expediente académico | La institución | Máxima. FARO no la controla ni la altera. |
| **Z2 · Backend FARO** | El token de Canvas (en memoria), la configuración, un caché breve del lanzamiento | El operador del backend | Alta. Es el único proceso con credencial. |
| **Z3 · Navegador del estudiante** | Propósito, preferencias, sesiones registradas por FARO, perfil opcional, un instantáneo del curso mientras la pestaña está abierta | El estudiante | Media. Es su propio dispositivo. |
| **Z4 · Servicio de IA** | Once campos de contexto por conversación | El proveedor del modelo | Controlada por contrato de datos. Nunca recibe identidad. |

## 2.2 Inventario de datos

Cada fila responde: qué es, de dónde sale, dónde se guarda, quién lo ve, cuánto dura.

### Datos que vienen de Canvas (Z1 → Z2 → Z3)

| Dato | Ruta de Canvas | Se guarda en | Retención |
|---|---|---|---|
| Nombre, código y fecha de cierre del curso | `GET /api/v1/courses/:id` | Memoria del navegador mientras FARO está abierto | Se descarta al cerrar |
| Módulos, sus ítems y el estado de completitud del estudiante | `GET /api/v1/courses/:id/modules?include[]=items` | Igual | Igual |
| Actividades con la entrega del estudiante (fecha, estado, puntaje) | `GET /api/v1/courses/:id/assignments?include[]=submission` | Igual | Igual |
| Vistas de página por hora y participaciones | `GET /api/v1/courses/:id/analytics/users/:uid/activity` | Igual. **Solo se conservan las marcas de tiempo**; el conteo de vistas se descarta en el mapeo. | Igual |
| Cursos activos del estudiante | `GET /api/v1/courses?enrollment_state=active` | Backend, solo para elegir el curso cuando no está configurado | Un proceso |
| Id numérico del dueño del token | `GET /api/v1/users/self` | Backend, en caché. **Nombre y avatar de esa respuesta se descartan.** | Un proceso |

**[código]** `src/data/canvas/endpoints.ts`, `src/data/canvas/client.ts` (función `mapActivity`), `server/src/routes/launch.ts`.

### Datos que FARO crea (Z3)

| Dato | Por qué existe | Se guarda en | Sale del navegador |
|---|---|---|---|
| Propósito (meta + frase de destino + minutos/día) | Personalizar la ruta y el mentor | `chrome.storage.local` | Meta, frase y minutos forman parte del contexto del mentor. Nada más. |
| Sesiones de estudio registradas por FARO | Impulso, logros, puntos | `chrome.storage.local` | No |
| Tarjetas de reconexión terminadas (fecha, ids de preguntas, aciertos a la primera) | Puntos y una oferta por día | `chrome.storage.local` | No. Las respuestas individuales no se guardan. |
| Canje de recompensa (nivel, fecha) | Un canje por semestre | `chrome.storage.local` | No en el prototipo (simulado). En producción, a la institución para entregar la recompensa. |
| Estado "pasó algo en mi vida" | Elegir la intervención | Memoria | No |
| Estilo del mentor, idioma, tema | Preferencias | `chrome.storage.local` | Estilo e idioma forman parte del contexto del mentor |
| Nombre, foto (reducida), bio | Perfil opcional en Comunidad | `chrome.storage.local` | No al mentor. En producción, a otros estudiantes del curso si el estudiante lo activa. |
| Conversación con el mentor | La sesión actual | Memoria | Hoy no: el mentor es local. En producción, cada mensaje irá al modelo con el contexto de once campos, a través del backend |

**[código]** `src/state/storage.ts`, `src/state/store.tsx`, `src/types/index.ts` (comentarios de `Profile`).

### Datos que nunca se recogen

Esta lista es tan importante como las anteriores. FARO **no** pide, lee ni almacena:

- Contraseñas de Canvas ni de la institución.
- Correo electrónico del estudiante.
- Lista de compañeros con nombre (no se llama al endpoint de inscripciones; **[prueba]** la ruta `/enrollments` se rechaza).
- Contenido de las entregas (textos, archivos, respuestas de exámenes).
- Calificaciones de otros estudiantes.
- Ubicación, dirección IP del estudiante (el backend registra solo la del cliente para el límite de tasa, en memoria, sin persistir).
- Historial de navegación fuera de las rutas de Canvas listadas.

## 2.3 Las fronteras y qué las cruza

```text
 Z1 Canvas ──► Z2 Backend        token del backend; respuesta completa de las 6 rutas
 Z2 Backend ──► Z3 Navegador     JSON de Canvas ya paginado; NUNCA el token; NUNCA cabeceras de Canvas
 Z3 Navegador ──► Z2 Backend     la ruta pedida (sin credencial); el backend la valida contra la lista blanca
 Z3 Navegador ──► Z2 ──► Z4 IA   [pendiente] 11 campos + el mensaje; NUNCA nombre, correo, foto, ids, calificaciones
```

Lo que no aparece en el diagrama tampoco ocurre: la extensión no habla con Canvas (no tiene `host_permissions` para `instructure.com` **[código]** `public/manifest.json`), y hoy **ningún dato sale hacia un servicio de IA**: el mentor del prototipo es local y determinista (`LocalMentorService`), sin clave de API. La ruta `HttpMentorService` → `POST /api/mentor` ya existe en la extensión para cuando el backend incorpore la llamada al modelo (capítulo 5).

## 2.4 Por qué el backend no tiene dependencias

El proceso que sostiene la credencial institucional usa únicamente módulos nativos de Node.js (`node:http`, `node:crypto`, `node:fs`). No hay `node_modules` en producción. Esto no es minimalismo estético: cada paquete de terceros que corre dentro del proceso del token es código que la institución no escribió y que podría, en una actualización comprometida, leer el token de la memoria. Cero paquetes es cero superficie de ese tipo.

**[código]** `server/package.json` (`"dependencies": {}`).
