# 1. Resumen ejecutivo

## Qué es FARO, en términos de datos

FARO es un acompañante de persistencia para estudiantes adultos que estudian en línea. Lee de Canvas la estructura del curso y el avance del estudiante, detecta cuándo alguien se está desconectando y le ofrece una ruta de regreso. No enseña el curso, no califica, no sustituye a Canvas.

Desde el punto de vista de la institución, FARO es **un lector de solo lectura** de una parte pequeña y bien definida de Canvas, con una capa de inteligencia artificial que recibe un contexto mínimo y anonimizado.

## Las tres piezas y quién habla con quién

```text
┌──────────────┐  HTTPS + token     ┌──────────────┐  HTTP local     ┌──────────────┐
│  Canvas LMS  │ ◄───────────────── │ FARO Backend │ ◄────────────── │  Extensión   │
│ (institución)│  solo GET          │  (server/)   │  sin credencial │ (navegador)  │
│              │  6 rutas           │ guarda token │  solo rutas     │  sin token   │
└──────────────┘                    └──────┬───────┘  permitidas     └──────────────┘
                                           │
                                           │ [pendiente] 11 campos, sin identidad
                                           ▼
                                    ┌──────────────┐
                                    │ Mentor de IA │
                                    └──────────────┘
```

- **Canvas** sigue siendo la fuente de verdad académica. FARO no escribe ahí.
- **El backend** es el único proceso que conoce la credencial de Canvas. Es un servidor Node.js sin dependencias de terceros (`server/`), lo que reduce a cero el riesgo de cadena de suministro en el proceso que sostiene el token.
- **La extensión** es solo interfaz. No tiene token, no tiene permiso de red hacia Canvas, y solo puede pedir al backend rutas que el backend ya decidió permitir.
- **El mentor de IA** recibe un contexto construido a mano con once campos, ninguno de los cuales identifica a la persona.

## Postura de seguridad en una frase

> Reducir lo que FARO *puede* hacer hasta que coincida con lo que FARO *necesita* hacer, y hacer que esa reducción sea verificable por un administrador sin confiar en nosotros.

## Estado actual, con honestidad

| Componente | Estado |
|---|---|
| Backend con token, lista blanca, CORS restringido, límite de tasa, sin fuga de token en logs | **Implementado y probado** (20 verificaciones automáticas) |
| Extensión sin credenciales, modo `http` contra el backend | **Implementado** |
| Contrato de datos del mentor (11 campos) | **Implementado** |
| Pruebas contra un Canvas real (cuenta gratuita de Instructure) | **Listo para ejecutar**; requiere un token del piloto |
| Lanzamiento LTI 1.3 firmado (OIDC + JWT) | **Diseñado y documentado**, rutas presentes que responden 501; requiere que la institución registre la herramienta |
| Token por estudiante vía OAuth2 (en vez de un token compartido) | **Diseñado**; depende del registro LTI |
| Base de datos PostgreSQL con cifrado en reposo | **Pendiente**; hoy el estado de FARO vive en el navegador del estudiante |
| Revisión de privacidad con la institución | **Pendiente**; este libro es el insumo |
