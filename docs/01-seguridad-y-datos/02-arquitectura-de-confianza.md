# 2. Arquitectura de confianza: dónde vive cada dato

La pregunta que más importa en una revisión de seguridad no es "¿qué protocolo usan?" sino "¿dónde está cada dato y quién puede llegar a él?". Esta es la respuesta completa.

## 2.1 Zonas de confianza

FARO tiene cuatro zonas. Cada dato vive en exactamente una, y cruza una frontera solo por una razón documentada.

| Zona | Qué contiene | Quién tiene acceso | Confianza |
|---|---|---|---|
| **Z1 · Canvas** | Todo el expediente académico | La institución | Máxima. FARO no la controla ni la altera. |
| **Z2 · Backend FARO** | El token de Canvas y, si el mentor con IA está activo, la clave de Gemini (ambos en memoria), la configuración, un caché breve del lanzamiento | El operador del backend | Alta. Es el único proceso con credenciales. No guarda conversaciones. |
| **Z3 · Navegador del estudiante** | Propósito, preferencias, sesiones registradas por FARO, perfil opcional, un instantáneo del curso mientras la pestaña está abierta | El estudiante | Media. Es su propio dispositivo. |
| **Z4 · Servicio de IA (Google Gemini)** | Por cada mensaje abierto al mentor: once campos de contexto, el mensaje y los últimos 8 turnos de la conversación | Google, bajo los términos de la API de Gemini (capítulo 7) | Activa solo si se habilita (`VITE_MENTOR_MODE=gemini` + `GEMINI_API_KEY`). Se llega solo a través del backend. Nunca recibe identidad. |

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
| Plan aceptado en el mentor (días, minutos, ids y títulos de los pasos) | Mostrarlo en Inicio | `chrome.storage.local` (clave `weekPlan`) | No. Se calcula localmente; nunca pasa por el modelo. |
| Estilo del mentor, idioma, tema | Preferencias | `chrome.storage.local` | Estilo e idioma forman parte del contexto del mentor |
| Nombre, foto (reducida), bio | Perfil opcional en Comunidad | `chrome.storage.local` | No al mentor. En producción, a otros estudiantes del curso si el estudiante lo activa. |
| Conversación con el mentor | La sesión actual | Solo memoria de la extensión; el backend no la guarda | En modo `local`, no. En modo `gemini`, cada mensaje abierto va a Gemini a través del backend, con el contexto de once campos y los últimos 8 turnos de la conversación actual. El registro de ánimo, el plan, los puntos y las lecciones sin Gemini se resuelven localmente y no se envían al modelo cuando ocurren; sus líneas quedan en la conversación, así que pueden estar entre los 8 turnos que acompañan un mensaje abierto posterior. |

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
 Z3 Navegador ──► Z2 ──► Z4 IA   [si se activa] 11 campos + el mensaje + últimos 8 turnos; NUNCA nombre, correo, foto, ids, calificaciones
 Z2 Backend ──► Z4 IA            la clave de Gemini, solo en la cabecera x-goog-api-key, nunca en la URL
```

Lo que no aparece en el diagrama tampoco ocurre: la extensión no habla con Canvas (no tiene `host_permissions` para `instructure.com` **[código]** `public/manifest.json`), y la extensión tampoco habla con Google: en modo `gemini`, `HttpMentorService` llama a `POST /api/mentor` en el backend, y es el backend el que llama a Gemini con la clave que solo él tiene **[código]** `src/services/mentor.ts`, `server/src/mentor.ts`. El backend reconstruye la petición desde cero (`sanitizeMentorRequest`): solo los once campos, con valores acotados; cualquier campo extra se descarta **[prueba]** un nombre, un correo, un id y una calificación añadidos al contexto nunca llegan a Gemini. Con el modo por omisión (`VITE_MENTOR_MODE=local`), **ningún dato sale hacia un servicio de IA**: responde `LocalMentorService`, en el dispositivo, sin clave de API.

## 2.4 Por qué el backend no tiene dependencias

El proceso que sostiene la credencial institucional (y la clave de Gemini) usa únicamente módulos nativos de Node.js (`node:http`, `node:crypto`, `node:fs`). No hay `node_modules` en producción. Esto no es minimalismo estético: cada paquete de terceros que corre dentro del proceso del token es código que la institución no escribió y que podría, en una actualización comprometida, leer el token de la memoria. La llamada a Gemini también es un `fetch` nativo, sin el SDK de Google. Cero paquetes es cero superficie de ese tipo.

**[código]** `server/package.json` (`"dependencies": {}`).
