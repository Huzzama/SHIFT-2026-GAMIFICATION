# FARO — Seguridad, protocolos y manejo de datos

**Libro 1 de 3 · Para la institución, el área de TI y el jurado**

Versión: septiembre 2026 · Reto SHIFT 2026 · Gamificación

---

## Para qué sirve este libro

Una universidad que conecta una herramienta a su Canvas está prestando algo valioso: el acceso a datos académicos de sus estudiantes. Este libro explica, sin adornos, qué hace FARO con ese acceso, qué protocolos usa, por qué esos protocolos son seguros y qué garantías se pueden **verificar** en lugar de creer.

Cada afirmación de este libro tiene una de estas tres marcas:

- **[código]** — está escrito en el código del repositorio y se cita el archivo.
- **[prueba]** — existe una prueba automática que lo verifica (`server/test/e2e.ts`).
- **[pendiente]** — es el diseño para producción y todavía no está implementado.

Si algo no tiene marca, es contexto.

## Índice

1. Resumen ejecutivo
2. Arquitectura de confianza: dónde vive cada dato
3. Protocolos: por qué son seguros
4. El token de Canvas: ciclo de vida
5. Minimización y retención de datos
6. Modelo de amenazas y controles
7. Cumplimiento: LFPDPPP y políticas institucionales
8. Preguntas frecuentes para la universidad
9. Lista de verificación antes de un piloto

## Las cinco garantías, en una página

| Garantía | Cómo se cumple | Marca |
|---|---|---|
| **FARO solo lee.** No puede modificar calificaciones, entregas, fechas ni contenido. | Todas las llamadas son `GET`. El backend rechaza cualquier otro método antes de tocar la red. Los permisos LTI de escritura (`score`, `lineitem`) se rechazan explícitamente. | [código] [prueba] |
| **La credencial nunca está en el navegador.** | El token vive en `server/.env` y en la memoria del backend. La extensión no tiene ningún campo donde ponerlo y no tiene permiso de red hacia `instructure.com`. | [código] [prueba] |
| **Solo seis rutas de Canvas, y nada más.** | Una lista blanca en el backend (`server/src/allowlist.ts`) espejada en la extensión. Una ruta fuera de la lista se rechaza localmente, sin llamada a Canvas. | [código] [prueba] |
| **El mentor de IA ve once campos y ningún dato personal.** | El contexto se construye en un solo archivo (`src/lib/mentorContext.ts`) que no tiene acceso al nombre, correo, foto ni calificaciones. | [código] |
| **Nunca se muestra un puntaje de riesgo al estudiante.** | Los estados de fricción existen solo para decidir la intervención; la interfaz usa lenguaje de apoyo. | [código] |
