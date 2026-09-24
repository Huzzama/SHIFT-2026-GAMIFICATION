# FARO — Documentación técnica e implementación en Canvas

**Libro 3 de 3 · Para quien instala, desarrolla o despliega FARO**

Versión: septiembre 2026 · Reto SHIFT 2026 · Gamificación

---

## Qué cubre este libro

Cómo está construido FARO, módulo por módulo, y cómo se conecta a un Canvas real: primero a una cuenta gratuita de Instructure (lo que se puede hacer hoy, en una tarde), después a la instancia de una institución mediante LTI 1.3 (lo que requiere que la institución participe).

Los capítulos 1 a 5 describen el código. Los capítulos 6 y 7 son procedimientos paso a paso. El capítulo 8 dice cómo comprobar que todo funciona, y el 9 qué es real y qué está simulado.

## Índice

1. Arquitectura
2. Estructura del código y convenciones
3. La lógica de dominio (`src/lib/`)
4. La capa Canvas en la extensión (`src/data/canvas/`)
5. El backend (`server/`)
6. Implementación en Canvas, paso a paso: cuenta gratuita
7. Implementación en Canvas, paso a paso: institución con LTI 1.3
8. Verificación y pruebas
9. Qué es real y qué está simulado

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | **22.18 o superior** (o 24) | El backend corre TypeScript sin compilar (`node src/index.ts`) |
| npm | 9+ | Dependencias de la extensión |
| Chrome / Edge | actual | Cargar la extensión |
| Una cuenta de Canvas | Free-for-Teacher o institucional | Capítulos 6 y 7 |
| Una clave de la API de Gemini | Opcional; con estudiantes reales, de un proyecto con facturación activa | El mentor con IA (capítulo 6.9) |

## Los comandos, en una tabla

| Dónde | Comando | Qué hace |
|---|---|---|
| raíz | `npm install` | Instala las dependencias de la extensión (68 paquetes) |
| raíz | `npm run dev` | Servidor de desarrollo de Vite en `http://localhost:5173` |
| raíz | `npm run typecheck` | Verifica tipos; si no imprime nada tras el encabezado, pasó |
| raíz | `npm run build` | Compila la extensión a `dist/` |
| `server/` | `cp .env.example .env` | Crea la configuración del backend (luego se edita) |
| `server/` | `npm run dev` | Backend con recarga automática |
| `server/` | `npm start` | Backend |
| `server/` | `npm test` | 36 verificaciones contra un Canvas simulado y un Gemini simulado |
| `server/` | `npm install` | Solo si quieres `npm run typecheck` ahí (instala `typescript` y `@types/node`; el backend en sí no tiene dependencias) |
