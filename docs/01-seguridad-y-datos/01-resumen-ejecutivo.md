# 1. Resumen ejecutivo

## Qué es FARO, en términos de datos

FARO es un acompañante de persistencia para estudiantes adultos que estudian en línea. Lee de Canvas la estructura del curso y el avance del estudiante, detecta cuándo alguien se está desconectando y le ofrece una ruta de regreso. No enseña el curso, no califica, no sustituye a Canvas.

Desde el punto de vista de la institución, FARO es **un lector de solo lectura** de una parte pequeña y bien definida de Canvas, con una capa opcional de inteligencia artificial (Google Gemini, a través del backend) que recibe un contexto mínimo y sin identidad.

## Las tres piezas y quién habla con quién

```text
┌──────────────┐  HTTPS + token     ┌──────────────┐  HTTP local     ┌──────────────┐
│  Canvas LMS  │ ◄───────────────── │ FARO Backend │ ◄────────────── │  Extensión   │
│ (institución)│  solo GET          │  (server/)   │  sin credencial │ (navegador)  │
│              │  6 rutas           │ guarda token │  solo rutas     │  sin token   │
└──────────────┘                    └──────┬───────┘  permitidas     └──────────────┘
                                           │
                                           │ opcional: 11 campos + mensaje
                                           │ + últimos 8 turnos, sin identidad
                                           ▼
                                    ┌──────────────┐
                                    │ Google Gemini│
                                    │ (mentor)     │
                                    └──────────────┘
```

- **Canvas** sigue siendo la fuente de verdad académica. FARO no escribe ahí.
- **El backend** es el único proceso que conoce la credencial de Canvas y, si el mentor con IA está activo, la clave de la API de Gemini. Es un servidor Node.js sin dependencias de terceros (`server/`), lo que reduce a cero el riesgo de cadena de suministro en el proceso que sostiene los secretos.
- **La extensión** es solo interfaz. No tiene token, no tiene permiso de red hacia Canvas, y solo puede pedir al backend rutas que el backend ya decidió permitir.
- **El mentor** es local por omisión: responde en el dispositivo, sin modelo de IA. Si la institución lo activa (`VITE_MENTOR_MODE=gemini` y `GEMINI_API_KEY` en el backend), las conversaciones abiertas van a Gemini **a través del backend, nunca directo desde el navegador**, con un contexto de once campos (ninguno identifica a la persona), el mensaje del estudiante y los últimos 8 turnos de la conversación. Si Gemini no responde, contesta el mentor local.

## Postura de seguridad en una frase

> Reducir lo que FARO *puede* hacer hasta que coincida con lo que FARO *necesita* hacer, y hacer que esa reducción sea verificable por un administrador sin confiar en nosotros.

## Estado actual, con honestidad

| Componente | Estado |
|---|---|
| Backend con token, lista blanca, CORS restringido, límite de tasa, sin fuga de token en logs | **Implementado y probado** (36 verificaciones automáticas en total) |
| Extensión sin credenciales, modo `http` contra el backend | **Implementado** |
| Contrato de datos del mentor (11 campos), revalidado en el backend | **Implementado** |
| Mentor con Gemini (`POST /api/mentor`): clave solo en el servidor, conversación fuera de los logs, respaldo al mentor local | **Implementado y probado contra un Gemini simulado**; no se ha ejercitado contra la API real de Google desde el entorno de desarrollo; el equipo lo valida con su propia clave |
| Pruebas contra un Canvas real (cuenta gratuita de Instructure) | **Listo para ejecutar**; requiere un token del piloto |
| Lanzamiento LTI 1.3 firmado (OIDC + JWT) | **Diseñado y documentado**, rutas presentes que responden 501; requiere que la institución registre la herramienta |
| Token por estudiante vía OAuth2 (en vez de un token compartido) | **Diseñado**; depende del registro LTI |
| Base de datos PostgreSQL con cifrado en reposo | **Pendiente**; hoy el estado de FARO vive en el navegador del estudiante |
| Revisión de privacidad con la institución | **Pendiente**; este libro es el insumo |
