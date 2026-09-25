# 5. Minimización y retención de datos

El principio rector de FARO en materia de datos es simple: **no recoger un dato porque es técnicamente posible, sino porque una función concreta lo necesita**. Este capítulo muestra cómo se aplica en cada capa, y qué pasa con los datos con el tiempo.

## 5.1 Minimización en la capa de Canvas

Canvas devuelve mucho más de lo que FARO usa. La capa de integración descarta lo que no necesita **en el momento de leerlo**, no después.

| Lo que Canvas envía | Lo que FARO conserva | Lo que se descarta |
|---|---|---|
| Objeto de curso (decenas de campos) | id, nombre, código, fechas de inicio y fin | Todo lo demás: configuración, permisos, imagen, etc. |
| Módulos con ítems | id, nombre, posición, estado, conteo de ítems, `content_id` de cada ítem y si está completado | Títulos de páginas, URLs externas, archivos |
| Actividades con entrega | id, nombre, fecha límite, puntos posibles, y de la entrega: fecha, estado, puntaje | Descripción de la actividad, rúbrica, adjuntos, comentarios del docente |
| Actividad del estudiante | **Solo marcas de tiempo.** El número de vistas por hora se elimina. | Conteos de vistas, URLs visitadas |
| `users/self` | El id numérico | Nombre, avatar, correo, zona horaria |

**[código]** `src/data/canvas/raw.ts` declara solo los campos leídos; `src/data/canvas/client.ts` hace el mapeo; `server/src/routes/launch.ts` conserva únicamente `self.data.id`.

**Por qué importa el caso de la actividad:** "cuántas páginas vio a las 3 de la tarde" es un dato de vigilancia. "Cuándo fue la última vez que entró" es el único dato que el motor de fricción necesita. FARO conserva el segundo y destruye el primero.

## 5.2 Minimización en el mentor de IA

El contexto que recibe el modelo se construye en una sola función y contiene exactamente estos once campos:

```json
{
  "course": "Gestión de Proyectos",
  "progress": 44,
  "next_activity": "Caso de estudio: alcance",
  "estimated_time": 25,
  "student_goal": "career_growth",
  "destination": "Liderar mis propios proyectos",
  "available_time": 20,
  "momentum": 62,
  "friction_state": "FRICTION",
  "style": "encouraging",
  "language": "es"
}
```

No hay nombre, correo, id de Canvas, calificaciones, foto, historial de otras conversaciones ni clasificación de riesgo de abandono. El estado de fricción es una de cinco etiquetas de intervención (`FLOWING`, `FRICTION`, `POSSIBLE_OVERWHELM`, `DISCONNECTION`, `RECOVERY`), no un puntaje.

La única información de origen humano es la **frase de destino**, que el estudiante escribe libremente al iniciar. Se le muestra el ejemplo *"Liderar mis propios proyectos en vez de solo ejecutarlos"* para orientar hacia una meta, no hacia datos personales. En producción, esta frase debe pasar por una advertencia explícita: *"no incluyas datos que te identifiquen"*. **[pendiente]**

**[código]** `src/lib/mentorContext.ts`, `src/types/index.ts` (interfaz `MentorContext`).

**Cuando el mentor usa Gemini** (el backend tiene `GEMINI_API_KEY` y la extensión no se construyó con `VITE_MENTOR_MODE=local`), lo que sale hacia Google, siempre a través del backend y nunca directo desde el navegador, es: estos once campos, el mensaje del estudiante y los últimos 8 turnos de la conversación actual (rol y texto, nada más). El backend no confía en que la extensión haya hecho bien su parte: `sanitizeMentorRequest` reconstruye la petición con solo los once campos, comprueba los valores enumerados, recorta longitudes y descarta cualquier campo extra **[prueba]** "mentor: extra fields in the context never reach Gemini", "mentor: history is trimmed to the last 8 turns".

Lo estructurado nunca pasa por el modelo: el registro de ánimo ("Noté que algo cambió…"), las sesiones de Enfoque, el plan de fin de semana y las respuestas sobre puntos se calculan en la extensión con datos reales y no se envían al modelo. Sus líneas sí quedan en la conversación, así que pueden viajar como parte de los últimos 8 turnos si después el estudiante escribe un mensaje abierto. Una petición de "haz mi trabajo calificado" la contesta el propio backend sin llamar al modelo **[prueba]** "mentor: "do my homework" is refused before any model call".

**[código]** `server/src/mentor.ts`.

## 5.3 Minimización en Comunidad

Comunidad es la parte de FARO con más tentación de recoger datos sociales, y por eso tiene las reglas más estrictas, escritas en los tipos:

- **No existe campo de seguidores ni de ranking.** No es que estén ocultos: no están en el modelo de datos, así que ninguna función puede calcularlos.
- **La presencia es agregada.** "23 estudiantes estudiando ahora" es un conteo. "Andrea lleva 37 minutos" nunca aparece, y el tipo `CoursePresence` solo admite números.
- **Los compañeros no tienen foto.** Solo iniciales y un color decorativo. Únicamente el propio estudiante puede añadir una imagen a su avatar, reducida en su navegador antes de guardarse.
- **Las reacciones se muestran por separado**, nunca sumadas en un marcador.

**[código]** `src/types/index.ts`, comentarios de `CommunityAuthor` y `CoursePresence`.

## 5.4 Retención

| Dato | Dónde | Cuánto dura | Cómo se borra |
|---|---|---|---|
| Instantáneo del curso (de Canvas) | Memoria del navegador | Mientras FARO está abierto | Al cerrar la pestaña o el panel |
| Registro de peticiones a Canvas | Memoria del navegador, 30 entradas | Mientras FARO está abierto | Automático; nunca se persiste ni se envía |
| Propósito, preferencias, sesiones, perfil, plan aceptado en el mentor (`weekPlan`) | `chrome.storage.local` | Hasta que el estudiante lo borre | Botón *Restablecer* en Progreso, o desinstalar la extensión; el plan también con *Quitar plan* en Inicio |
| Conversación con el mentor | Memoria de la extensión | La sesión | Al cerrar FARO o con *Restablecer*. El backend no la guarda ni la registra |
| Lo enviado a Gemini (cuando responde Gemini) | Google | Según los términos de la API de Gemini (capítulo 7) | Con clave de pago, Google lo registra por tiempo limitado solo para detectar abuso y por requisitos legales |
| Token de Canvas | `server/.env` + memoria del backend | Hasta rotación o revocación | Editar `.env` y reiniciar; revocar en Canvas |
| Clave de Gemini | `server/.env` + memoria del backend | Hasta rotación o revocación | Editar `.env` y reiniciar; revocar en Google |
| Caché del lanzamiento (id de curso, id de usuario) | Memoria del backend | Hasta reiniciar el proceso | Reiniciar |
| Logs del backend | Salida estándar | Los define el operador | Los define el operador; no contienen datos personales, query strings, cuerpos de petición ni nada de la conversación con el mentor |

**Producción [pendiente]:** cuando exista PostgreSQL, se propone:

- Sesiones de estudio, propósito y preferencias: mientras la inscripción esté activa, más 90 días para permitir "regresar" a un curso pausado; después, borrado automático.
- Conversaciones con el mentor: no se almacenan más allá de la sesión, salvo consentimiento explícito para mejorar el producto, en cuyo caso se anonimizan.
- Eventos de fricción e intervenciones: agregados para métricas del piloto, con el id del estudiante sustituido por un id pseudónimo que solo la institución puede resolver.

## 5.5 Lo que el estudiante puede ver y controlar

- **Perfil → Canvas** muestra en vivo cada llamada que FARO hace, con su ruta, estado y latencia. La transparencia no es un documento: es una pantalla.
- **Perfil → Canvas** muestra los permisos LTI que FARO rechaza.
- **FARO Mentor** dice, al pie, qué ve el mentor y quién responde: *"Responde Gemini, a través del servidor de FARO…"* o *"Mentor local: sin modelo de IA, nada sale de tu dispositivo."* Los mensajes escritos por Gemini llevan un anillo violeta en el avatar de FARO.
- **Progreso → Restablecer** borra todo el estado local de FARO.
- Nada del perfil es obligatorio. FARO funciona completo sin nombre ni foto.
