# 8. Preguntas frecuentes para la universidad

Las preguntas que un área de TI, un responsable de datos o un directivo académico hacen antes de conectar una herramienta a Canvas, con respuestas cortas y la referencia para comprobarlas.

## Acceso y alcance

**¿FARO puede modificar calificaciones, entregas o fechas?**
No. Todas las llamadas a Canvas son de lectura (`GET`). El backend rechaza cualquier otro método antes de contactar a Canvas, y los permisos LTI que permitirían escribir en el libro de calificaciones (`score`, `lineitem`) se rechazan explícitamente. Se comprueba en `server/src/allowlist.ts` y en la pantalla de la clave de desarrollador de Canvas.

**¿Qué ve exactamente FARO de Canvas?**
Seis rutas: el curso, sus módulos con ítems, las actividades con la entrega del propio estudiante, la actividad (marcas de tiempo) del propio estudiante, la lista de cursos activos del estudiante y su id numérico. Nada más. La lista está en un archivo de treinta líneas: `server/src/allowlist.ts`.

**¿Ve FARO los datos de otros estudiantes?**
No. No llama al endpoint de inscripciones ni al de usuarios del curso. En producción, el conteo de "cuántos están estudiando" vendrá del servicio NRPS de LTI en modo agregado, sin nombres.

**¿Puede FARO ver el contenido de una entrega o de un examen?**
No. Lee fecha, estado y puntaje de la entrega, no su contenido. Los campos que se leen están declarados en `src/data/canvas/raw.ts`; lo que no está ahí, se ignora.

**¿Un estudiante puede usar FARO para ver el curso de otro?**
No. En el piloto, el backend deduce la identidad del token, no de lo que la extensión afirma. En producción, la identidad la firma Canvas (LTI 1.3) y FARO no acepta otra.

## Credenciales

**¿Dónde está el token de Canvas?**
En `server/.env`, en la máquina que corre el backend, y en la memoria de ese proceso. En ningún otro lugar. La extensión no tiene ningún campo para un token y no tiene permiso de red hacia `instructure.com`.

**¿El token está en el código fuente o en GitHub?**
No. `.env` está en `.gitignore`. El repositorio contiene `server/.env.example` con el campo vacío.

**¿Dónde está la clave de Gemini?**
Igual que el token: en `server/.env` y en la memoria del backend, y solo si se quiere el mentor con IA. Nunca en la extensión. Viaja a Google solo en la cabecera `x-goog-api-key`, nunca en la URL, y no aparece en logs ni respuestas. Si se expone, se revoca en Google y se genera otra. Capítulo 4.8.

**¿Qué pasa si el token se filtra?**
Se revoca en Canvas en un clic, se genera otro, se reinicia el backend. El alcance del daño es lectura de lo que ese estudiante ve de sí mismo. Por eso el piloto usa solo tokens de cuentas de estudiante, nunca de docente ni de administrador. Capítulo 4.

**¿Cada estudiante necesita generar un token?**
En el piloto, sí, uno por participante (o un token de una cuenta de prueba). Es la práctica que Instructure indica para pruebas. Para un despliegue real, FARO usa OAuth2 con clave de desarrollador y los tokens los emite Canvas automáticamente, con una hora de vida.

## Inteligencia artificial

**¿Qué modelo usa FARO?**
Google Gemini (`GEMINI_MODEL`, por omisión `gemini-3.5-flash`; los nombres de modelo cambian y deben verificarse en `ai.google.dev/gemini-api/docs/models`), pero solo si el backend tiene `GEMINI_API_KEY`. Si no, ninguno: responde el mentor local, determinista, y nada sale del dispositivo. `VITE_MENTOR_MODE` tiene tres valores: `auto` (por omisión: la extensión pregunta a `GET /health` del backend, con 2 s de espera y resultado guardado 30 s, sin datos del estudiante, y usa Gemini si el servidor lo tiene), `local` (nunca sale del dispositivo, ni siquiera esa consulta) y `gemini` (siempre lo intenta). La pantalla del mentor siempre dice cuál de los dos responde, según esa comprobación en vivo.

**¿Qué recibe el modelo de IA?**
Solo cuando responde Gemini, y siempre a través del backend: once campos (nombre del curso, porcentaje de avance, siguiente actividad y su duración, meta declarada, frase de destino, minutos disponibles, impulso, estado de fricción, estilo e idioma), el mensaje del estudiante y los últimos 8 turnos de la conversación actual. El contexto se arma en `src/lib/mentorContext.ts` y el backend lo vuelve a filtrar en `server/src/mentor.ts`. No recibe nombre, correo, ids de Canvas, calificaciones, foto ni conversaciones anteriores.

**¿El modelo puede hacer la tarea del estudiante?**
No. Hay un filtro de peticiones del tipo "hazme el examen" que responde con una negativa y ofrece dividir la tarea, explicar el concepto o revisar el razonamiento; cuando Gemini está activo, el backend contesta esas peticiones sin llamar al modelo. Además, las reglas del prompt de sistema prohíben producir trabajo calificado. El filtro es igual en los cinco estilos de comunicación.

**¿Hoy los datos van a un proveedor de IA?**
Solo si el backend tiene `GEMINI_API_KEY` y la extensión no se construyó con `VITE_MENTOR_MODE=local`. Sin clave, o con `local`, no: el mentor es local y determinista. Una institución que no apruebe el mentor con IA construye con `VITE_MENTOR_MODE=local` o no le da clave al servidor. Antes de usarlo con estudiantes reales hace falta el aviso de privacidad actualizado (capítulo 7).

**¿Gemini entrena con los datos de los estudiantes?**
No, si la clave es de un proyecto de Google Cloud con facturación activa (servicios de pago de la API de Gemini): en ese caso Google no usa los *prompts* ni las respuestas para mejorar sus productos, y solo los registra por tiempo limitado para detectar abuso y por requisitos legales. En el nivel gratuito sí los usa para mejorar productos, revisores humanos pueden leerlos y los términos piden no enviar información personal; por eso **nunca se usa el nivel gratuito con estudiantes reales**. Fuente: `ai.google.dev/gemini-api/terms`. Capítulo 7.8.

**¿Qué pasa si Gemini no responde?**
Responde el mentor local, y el estudiante lo ve. Si el servidor está apagado o no tiene clave, el pie del mentor dice *"Mentor local…"* desde que se abre. Si el servidor tenía Gemini pero una respuesta falla, esa respuesta lleva la nota *"Gemini no pudo responder en este momento, así que respondió el mentor local"*. El backend devuelve códigos claros para cada falla (`503 mentor_not_configured`, `502 mentor_key_rejected`, `502 mentor_upstream`, `502 mentor_blocked`, `504 mentor_timeout`, `429 mentor_rate_limited`) y la extensión cae al mentor local con cualquiera de ellos. El estudiante siempre recibe respuesta; su progreso no depende de Google.

**¿FARO guarda las conversaciones con el mentor?**
No. Viven en la memoria de la extensión durante la sesión. El backend no las guarda ni las registra: ni el mensaje, ni la respuesta, ni el contexto.

## Vigilancia y bienestar

**¿FARO calcula un "riesgo de abandono" del estudiante?**
Calcula estados de fricción internos (cinco etiquetas basadas en días sin actividad y trabajo pendiente) para decidir qué intervención ofrecer. **Nunca** muestra un puntaje de riesgo al estudiante y no lo comparte con nadie. La interfaz dice "tu ruta necesita atención", no "riesgo: 87%".

**¿Puede un docente ver quién estudia cuánto?**
No existe esa pantalla, y el modelo de datos de Comunidad solo admite conteos agregados, no personas. Si la institución quisiera métricas del piloto, se propone entregarlas agregadas y con ids pseudónimos.

**¿FARO envía notificaciones o recordatorios?**
No. No hay notificaciones push, correos ni recordatorios. FARO espera a que el estudiante abra el panel. El "puerto seguro" (pausa planeada) explícitamente no tiene cuenta regresiva.

**¿Es FARO un videojuego?**
No. Usa mecánicas (ruta, puntos de control, logros) sin vidas, niveles ni tablas de posiciones. Los cinco logros y cinco reconocimientos exigen haber persistido; ninguno se gana haciendo clic.

## Operación

**¿Dónde corre el backend?**
En el piloto, en una máquina del equipo o de la institución, escuchando en `127.0.0.1`. En producción, en infraestructura de la institución o en un proveedor aprobado, detrás de TLS, con el lanzamiento LTI como autenticación.

**¿Qué dependencias tiene?**
El backend, ninguna. Solo Node.js. La extensión, dos: `react` y `react-dom`.

**¿Cómo sé que las garantías de este libro son ciertas?**
Ejecutando `npm test` dentro de `server/`: treinta y ocho verificaciones automáticas contra un Canvas simulado con paginación real y un Gemini simulado. Y abriendo *Perfil → Canvas* en FARO: el registro de peticiones en vivo muestra cada llamada.

**¿Qué falta para producción?**
Registro LTI 1.3 por la institución, OAuth2 por estudiante, base de datos con cifrado en reposo, validar el mentor con Gemini contra la API real con una clave de pago de la institución, aviso de privacidad formal y revisión de seguridad externa. Capítulo 9 tiene la lista completa.

**¿FARO reemplaza a Canvas?**
No. Canvas sigue siendo la fuente de verdad académica. FARO lee de Canvas y añade una capa de acompañamiento. *No reemplazamos Canvas: lo hacemos adaptativo.*
