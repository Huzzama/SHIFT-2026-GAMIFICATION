# 9. Qué es real y qué está simulado

Esta lista existe para que nadie —ni el jurado, ni una institución, ni el equipo dentro de seis meses— crea que el prototipo hace algo que no hace.

## Real y funcionando

| Componente | Estado |
|---|---|
| Backend con token, lista blanca, paginación, CORS, límite de tasa, logs sin datos sensibles | Implementado; 36 verificaciones automáticas en total |
| Mentor con Gemini: `POST /api/mentor`, contexto revalidado, historial de 8 turnos, respuesta de guardarraíl sin modelo, códigos de respaldo, clave y conversación fuera de los logs, modo solo mentor | Implementado; verificado contra un Gemini simulado (16 de las 36 verificaciones) y de punta a punta en el navegador contra ese simulado, incluido el respaldo al mentor local. **No se ha ejercitado contra la API real de Google** desde el entorno de desarrollo (la política de red lo bloqueó); el equipo lo valida con su clave. Los nombres de modelo cambian: verificar `GEMINI_MODEL` |
| Mentor local y momentos estructurados (registro de ánimo, Enfoque, Volver, Enséñame con el banco del demo, plan de fin de semana, puntos a TecmiRewards) | Implementados; calculados en la extensión con datos reales, nunca por un modelo |
| ¿Cuánto tiempo tienes?, tarjeta *Tu plan*, semana de ritmo en Progreso | Implementados (`timeSession.ts`, `rhythm.ts`) |
| Extensión en modo `http` contra el backend, sin credenciales ni permiso hacia `instructure.com` | Implementado; capa de datos verificada end-to-end |
| Mapeo de Canvas a FARO (módulos por ítems, hecho por entrega, huérfanas excluidas) | Implementado y verificado con respuestas paginadas |
| Respaldo de actividad por entregas cuando Canvas niega analíticas, con aviso en pantalla | Implementado y verificado |
| Estado de error con reintento cuando el backend no responde | Implementado |
| Motor de fricción, ruta, siguiente mejor acción, planificador, puntos, logros, orden del feed, ruteo del SOS, contrato del mentor | Implementados como funciones puras; umbrales configurables |
| i18n es/en verificado por el compilador | Implementado |
| Tarjetas de reconexión | Flujo y reglas implementados; el banco de preguntas está escrito a mano para el curso del demo |
| Impacto (antes Recompensas) | Reglas implementadas (pista semestral, niveles, un canje por semestre, camino a la siguiente meta); **montos, cursos anteriores (16 actividades y 6 módulos cada uno) y canje simulados**. Integración de prototipo con TecmiRewards: FARO cuenta puntos y no emite nada; no encontramos una API pública de TecmiRewards, así que la integración debe validarse con Tecmilenio |
| Registro de peticiones en vivo en Perfil | Implementado |

## Listo para ejecutar, pendiente de credenciales

| Componente | Qué falta |
|---|---|
| Conexión a Canvas Free-for-Teacher | Un token de estudiante y el id del curso (capítulo 6, 30 minutos) |
| Mentor con la API real de Gemini | Una clave de un proyecto con facturación activa y `VITE_MENTOR_MODE=gemini` (capítulo 6.9) |

## Simulado, y etiquetado como tal

| Componente | Qué falta |
|---|---|
| Datos del curso en modo mock | Vienen de `fixtures.ts`. La insignia dice *Simulado*. |
| Lanzamiento | `verified: false` en ambos modos. En vivo, curso y persona se deducen del token; el panel lo dice. |
| Cuenta institucional (SSO) | No existe. La pantalla lo etiqueta como simulado. |
| Comunidad | Compañeros, publicaciones, salas y misión son datos de ejemplo. Las salas corren con reloj acelerado para la demo. |
| Perfil de estudio (ritmo medido) | Solo en mock (35 min/sesión, 4 días/semana). En vivo, ausente y declarado. |
| `estimated_minutes` | No existe en Canvas. Tabla propia en mock; 20 min por defecto en vivo. |
| Lecciones de Enséñame sin Gemini | Salen del banco de preguntas escrito a mano para el curso del demo; otros cursos no tienen lecciones locales. |

## Diseñado, con la especificación en el código, no implementado

| Componente | Dónde está la especificación |
|---|---|
| LTI 1.3: `/lti/login`, `/lti/launch`, `/.well-known/jwks.json` | `server/src/routes/lti.ts`; capítulo 7 |
| OAuth2 por estudiante | Capítulo 7.3; scopes en `endpoints.ts` |
| PostgreSQL y sincronización entre dispositivos | Instrucciones del proyecto; capítulo 7.4 |
| Advertencia en la frase de destino | Libro 1, capítulo 5.2 |

## La regla de honestidad

Ninguna cifra de validación de este proyecto está inventada. Donde no hay medición, los documentos dicen *a medir*. Los umbrales de fricción son reglas de prototipo, configurables, y no se presentan como validadas científicamente. Lo que se afirma como implementado tiene código y, cuando es verificable, una prueba que se puede ejecutar.
