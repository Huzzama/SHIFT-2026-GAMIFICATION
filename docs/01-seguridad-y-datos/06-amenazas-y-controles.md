# 6. Modelo de amenazas y controles

Un modelo de amenazas responde tres preguntas: qué queremos proteger, de quién, y qué hemos hecho al respecto. Esta tabla es la respuesta, amenaza por amenaza. La columna *Prueba* nombra la verificación automática en `server/test/e2e.ts` cuando existe.

## 6.1 Activos

1. **El token de Canvas** — da acceso de lectura al expediente del dueño.
2. **Los datos académicos del estudiante** — avance, entregas, fechas.
3. **La identidad del estudiante** — quién es la persona detrás de una sesión de FARO.
4. **La integridad del expediente** — que nada de lo que FARO hace pueda alterar Canvas.
5. **La confianza del estudiante** — que FARO no se convierta en vigilancia.
6. **La clave de Gemini** — si el mentor con IA está activo, permite hacer llamadas al modelo a cargo del proyecto de la institución.

## 6.2 Amenazas y controles

| # | Amenaza | Activo | Control | Estado | Prueba |
|---|---|---|---|---|---|
| T1 | Un atacante extrae la credencial del código de la extensión (las extensiones son código público) | Token | No hay credencial en la extensión. `CanvasConfig` no tiene campo para ella. | [código] | — |
| T2 | Una extensión modificada usa el backend para leer cualquier ruta de Canvas | Datos | Lista blanca de 6 rutas en el backend; `403` local sin llamada a Canvas | [código] | "a path outside the allow list is refused locally" |
| T3 | Una extensión modificada intenta escribir en Canvas a través del backend | Integridad | Solo `GET`; `405` para otros métodos; sin scopes de escritura | [código] | "a write is refused even on an allowed path" |
| T4 | Manipulación de parámetros para ampliar la respuesta de Canvas (`all_dates`, `include[]=user`) | Datos | Parámetros y valores validados; el resto se rechaza | [código] | "an unknown query parameter is refused" |
| T5 | *Path traversal* codificado (`..%2F`) para salir del patrón | Datos | Decodificación antes de comparar; `..` y `//` rechazados | [código] | "path traversal is refused" |
| T6 | Una página web maliciosa en el mismo navegador llama al backend | Datos | CORS con lista de orígenes; origen desconocido → `403` sin datos | [código] | "a browser origin outside the list gets 403" |
| T7 | Bucle de peticiones agota la cuota de Canvas y expone el token a suspensión | Token | Límite de tasa por cliente, `429` | [código] | "rate limit trips after the configured burst" |
| T8 | El token aparece en logs, errores o respuestas | Token | Logger sin cabeceras ni query; errores sin cuerpo de Canvas; `describe()` sin token | [código] | "health names the Canvas host and never the token", "log lines carry no query strings" |
| T9 | Un `Link` de paginación manipulado redirige el token a otro dominio | Token | El backend verifica que cada página siga en el host de Canvas configurado | [código] | — |
| T10 | Escucha de red entre backend y Canvas | Token, datos | HTTPS obligatorio; el backend no arranca con `http://` fuera de localhost | [código] | — |
| T11 | Suplantación: alguien afirma ser otro estudiante | Identidad | Piloto: el backend deduce la identidad del token, no de la extensión. Producción: JWT firmado por Canvas (LTI 1.3) | [código] / [pendiente] | "launch resolves the token owner" |
| T12 | Cachés intermedios conservan datos académicos | Datos | `Cache-Control: no-store` en toda respuesta | [código] | "responses carry no-store and nosniff" |
| T13 | Un paquete de terceros comprometido lee el token de la memoria del backend | Token | Cero dependencias en el backend | [código] | — |
| T14 | El servicio de IA recibe datos personales | Identidad, confianza | Contexto de 11 campos construido en una sola función; sin nombre, correo, ids, calificaciones. El backend lo reconstruye (`sanitizeMentorRequest`) y descarta cualquier campo extra; historial limitado a 8 turnos | [código] | "mentor: extra fields in the context never reach Gemini", "mentor: history is trimmed to the last 8 turns" |
| T15 | FARO se convierte en herramienta de vigilancia (quién estudia cuánto) | Confianza | Presencia agregada en el modelo de datos; sin ranking ni seguidores; conteos de vistas descartados | [código] | — |
| T16 | Se expone al estudiante una clasificación de riesgo de abandono | Confianza | Los estados de fricción son internos; la interfaz usa lenguaje de apoyo; no existe puntaje de riesgo | [código] | — |
| T17 | Un token de docente o administrador en el piloto amplía el alcance de una fuga | Token, datos | Política: el piloto usa **únicamente tokens de cuentas de estudiante** | Política | — |
| T18 | El backend arranca sin credencial y sirve datos vacíos como si fueran reales | Confianza | Se niega a arrancar con media configuración de Canvas o sin nada que servir; en modo "solo mentor", las rutas de Canvas responden `503 canvas_not_configured`; con token inválido responde `canvas_token_rejected` | [código] | "a wrong token is reported as rejected", "mentor-only server: Canvas routes say canvas_not_configured", "config: half a Canvas setup is refused, mentor-only is accepted" |
| T19 | Una cuenta de estudiante no puede leer analíticas y FARO inventa actividad | Confianza | `401`/`403` se pasa al cliente; FARO usa fechas de entregas y **lo dice en pantalla** | [código] | "Canvas 401 on analytics is passed through" |
| T20 | Robo del archivo `server/.env` | Token, clave de Gemini | Alcance limitado a lectura de un estudiante; revocación de un clic en Canvas; revocación de la clave en Google; el camino OAuth2 elimina el token del archivo | Política / [pendiente] | — |
| T21 | La clave de Gemini se filtra por la URL, los logs, una respuesta o un error | Clave de Gemini | Solo en la cabecera `x-goog-api-key`; nunca en la URL; `describe()` muestra solo proveedor y modelo; el cuerpo de error de Google nunca se repite ni se registra | [código] | "mentor: the key goes in a header, never in the URL", "mentor: a rejected key and a safety block map to fallback codes", "mentor: the key and the conversation never appear in the log" |
| T22 | Las conversaciones con el mentor quedan en los logs del backend | Identidad, confianza | El logger solo recibe método, ruta, estado, duración e id; nunca cuerpos. Ni mensaje, ni respuesta, ni contexto | [código] | "mentor: the key and the conversation never appear in the log" |
| T23 | Un cliente dispara llamadas al modelo en bucle y genera costo | Clave de Gemini | Límite por cliente de llamadas al modelo (`FARO_MENTOR_PER_MINUTE`, 20) además del límite global; cuerpo máximo de 32 KB | [código] | "mentor: per-client cap answers 429 before calling the model", "mentor: a non-JSON body gets 415 and a huge body 413" |
| T24 | El mentor hace el trabajo calificado del estudiante | Confianza, integridad académica | Las peticiones de "haz mi tarea" se responden en el backend sin llamar al modelo; el prompt de sistema prohíbe producir trabajo calificado | [código] | "mentor: "do my homework" is refused before any model call" |
| T25 | Google usa las conversaciones para mejorar sus productos o las leen revisores humanos | Identidad, confianza | Política: solo claves de un proyecto con facturación activa (servicios de pago); nunca el nivel gratuito con estudiantes reales (capítulo 7) | Política | — |

## 6.3 Lo que este modelo no cubre todavía

- **Autenticación de la extensión ante el backend en producción.** Hoy el backend confía en el origen (CORS) y en escuchar solo en `127.0.0.1`. En un despliegue institucional, la sesión emitida tras el lanzamiento LTI es lo que autoriza cada llamada. **[pendiente]**
- **Cifrado en reposo** de la futura base de datos. **[pendiente]**
- **Auditoría de accesos** por parte de la institución: quién consultó qué y cuándo. El backend registra ruta y estado por petición; falta la persistencia y el id pseudónimo. **[pendiente]**
- **Revisión de seguridad externa.** Este documento es autoevaluación; un piloto institucional debe incluir una revisión por el área de seguridad de la universidad.
