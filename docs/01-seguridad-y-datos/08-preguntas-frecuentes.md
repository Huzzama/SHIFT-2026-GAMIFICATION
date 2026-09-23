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

**¿Qué pasa si el token se filtra?**
Se revoca en Canvas en un clic, se genera otro, se reinicia el backend. El alcance del daño es lectura de lo que ese estudiante ve de sí mismo. Por eso el piloto usa solo tokens de cuentas de estudiante, nunca de docente ni de administrador. Capítulo 4.

**¿Cada estudiante necesita generar un token?**
En el piloto, sí, uno por participante (o un token de una cuenta de prueba). Es la práctica que Instructure indica para pruebas. Para un despliegue real, FARO usa OAuth2 con clave de desarrollador y los tokens los emite Canvas automáticamente, con una hora de vida.

## Inteligencia artificial

**¿Qué recibe el modelo de IA?**
Once campos: nombre del curso, porcentaje de avance, siguiente actividad y su duración, meta declarada, frase de destino, minutos disponibles, impulso, estado de fricción, estilo e idioma. Está en `src/lib/mentorContext.ts`. No recibe nombre, correo, ids, calificaciones ni historial.

**¿El modelo puede hacer la tarea del estudiante?**
No. Hay un filtro de peticiones del tipo "hazme el examen" que responde con una negativa y ofrece dividir la tarea, explicar el concepto o revisar el razonamiento. El filtro es igual en los cinco estilos de comunicación.

**¿Hoy los datos van a un proveedor de IA?**
No. El mentor del prototipo es local y determinista. La llamada al modelo se activará desde el backend cuando exista contrato con el proveedor y aviso de privacidad actualizado.

**¿Se usan los datos para entrenar modelos?**
No, y el contrato con el proveedor deberá prohibirlo explícitamente antes de activar el mentor remoto.

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
Ejecutando `npm test` dentro de `server/`: veinte verificaciones automáticas contra un Canvas simulado con paginación real. Y abriendo *Perfil → Canvas* en FARO: el registro de peticiones en vivo muestra cada llamada.

**¿Qué falta para producción?**
Registro LTI 1.3 por la institución, OAuth2 por estudiante, base de datos con cifrado en reposo, mentor remoto con contrato de datos, aviso de privacidad formal y revisión de seguridad externa. Capítulo 9 tiene la lista completa.

**¿FARO reemplaza a Canvas?**
No. Canvas sigue siendo la fuente de verdad académica. FARO lee de Canvas y añade una capa de acompañamiento. *No reemplazamos Canvas: lo hacemos adaptativo.*
