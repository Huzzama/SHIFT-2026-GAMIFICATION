# 2. Estructura del código y convenciones

## 2.1 El árbol

```text
faro/
├── public/
│   ├── manifest.json        Manifest V3: side panel, storage; host_permissions solo localhost
│   └── background.js        service worker mínimo: abre el panel lateral
├── src/
│   ├── App.tsx              enrutado entre vistas, barra inferior, estados de carga y error
│   ├── main.tsx             punto de entrada
│   ├── types/index.ts       TODOS los tipos del dominio, en un solo archivo
│   ├── data/
│   │   ├── client.ts        CourseSnapshot + faroClient: la costura
│   │   ├── canvas/          la capa Canvas (capítulo 4)
│   │   │   ├── endpoints.ts   las 6 rutas, los scopes, el audit surface
│   │   │   ├── raw.ts         tipos tal como Canvas los devuelve (snake_case)
│   │   │   ├── transport.ts   MockCanvasTransport · BackendCanvasTransport · canvasLog
│   │   │   ├── client.ts      CanvasFaroClient: el mapeo real
│   │   │   ├── config.ts      modo, URL del backend, resolución del lanzamiento
│   │   │   ├── status.ts      flags de comportamiento (respaldo de actividad)
│   │   │   └── fixtures.ts    el curso de demostración, con la forma exacta de Canvas
│   │   └── community.mock.ts
│   ├── lib/                 lógica pura, sin React ni fetch (capítulo 3)
│   ├── services/mentor.ts   LocalMentorService (hoy) · HttpMentorService (backend)
│   ├── state/
│   │   ├── store.tsx        el estado de la app y sus derivaciones
│   │   ├── storage.ts       chrome.storage.local con respaldo a localStorage
│   │   ├── community.tsx    estado de Comunidad
│   │   └── theme.tsx        claro/oscuro
│   ├── views/               una vista por pantalla
│   ├── components/          piezas reutilizables (CanvasPanel, Cards, FeedPost…)
│   ├── i18n/                es.ts (fuente de verdad) · en.ts (tipado contra es) · index.ts
│   └── styles/              tokens.css · global.css · views.css (CSS plano)
├── server/                  el backend (capítulo 5)
│   ├── src/
│   │   ├── index.ts         arranque
│   │   ├── app.ts           ensambla rutas
│   │   ├── env.ts           configuración y .env
│   │   ├── allowlist.ts     las 6 rutas permitidas
│   │   ├── canvas.ts        la única función que habla con Canvas
│   │   ├── http.ts          router, CORS, rate limit, logging
│   │   └── routes/          health · launch · canvas · lti
│   ├── test/
│   │   ├── fake-canvas.ts   un Canvas de mentira con paginación real
│   │   └── e2e.ts           20 verificaciones
│   ├── .env.example
│   └── package.json         "dependencies": {}
├── docs/                    los tres libros
├── .env.example             VITE_CANVAS_MODE, VITE_FARO_API_URL
└── package.json             react, react-dom; vite, typescript
```

## 2.2 Las tres costuras que importan

**`lib/` no importa React.** Si un archivo de `lib/` necesita `useState`, la lógica está en el lugar equivocado. La prueba: `src/lib/` se compila con `tsc` sin `@types/react`.

**`types/index.ts` separa Canvas de FARO.** Los tipos `Canvas*` son espejo de la API. Los demás son nuestros. Un campo que Canvas no tiene (`estimated_minutes`) lleva un comentario que lo dice.

**`i18n/es.ts` es la fuente de verdad.** `en.ts` está declarado como `const en: Dict` contra el tipo del español. Una clave añadida en un idioma y no en el otro **rompe el build**. Es intencional.

## 2.3 Convenciones

| Convención | Regla | Por qué |
|---|---|---|
| Umbrales | Constantes con nombre en un objeto exportado (`frictionRules`, `pointsConfig`, `feasibilityRules`) | Se ajustan en un solo lugar y se pueden mostrar en documentación |
| Copys | Siempre desde `t.*` (el diccionario activo), nunca literales en vistas | Dos idiomas, y el compilador vigila |
| Componentes | Pequeños; un `.tsx` de más de ~300 líneas probablemente contiene lógica de `lib/` | Legibilidad |
| URLs | Ninguna URL de API escrita a mano fuera de `data/` y `server/` | Un solo lugar que cambiar |
| Comentarios | Explican *por qué*, no *qué*. Cada decisión de diseño no obvia lleva su razón junto al código | Quien llega después entiende sin preguntar |
| Estilos | CSS plano con tokens en `tokens.css`; sin frameworks | Bundle pequeño; la extensión debe sentirse inmediata |
| Sintaxis TS en `server/` | Solo sintaxis borrable (`erasableSyntaxOnly`): sin `enum`, sin parámetros de constructor con modificadores | Node ejecuta el TypeScript directamente sin compilar |
| Imports en `server/` | Con extensión `.ts` explícita | Requisito de Node para ejecutar TS |

## 2.4 Alias

`@/` apunta a `src/` (configurado en `vite.config.ts` y `tsconfig.json`). Es un alias relativo a la raíz de Vite, por lo que funciona igual en Windows y macOS sin helpers de rutas.

## 2.5 Qué NO hay, a propósito

- No hay Next.js, Electron, Redux ni Tailwind. Instrucciones del proyecto: la extensión debe ser ligera.
- No hay ORM ni base de datos todavía.
- No hay framework HTTP en el backend (Fastify estaba previsto; se sustituyó por `node:http` para que el proceso que sostiene el token no ejecute código de terceros; las rutas tienen la forma `(req) => reply`, que se porta a Fastify sin cambios si el proyecto lo decide).
- No hay dependencia de pruebas. Las pruebas del backend usan `node:assert` y se ejecutan con `node`.
