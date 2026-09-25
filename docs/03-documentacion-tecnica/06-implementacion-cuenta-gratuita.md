# 6. Implementación en Canvas, paso a paso: cuenta gratuita

Este procedimiento conecta FARO a un Canvas real en una tarde, sin pedir nada a una institución. Usa **Canvas Free-for-Teacher** (`canvas.instructure.com`), que es una instancia real de Canvas con la misma API.

Necesitas dos direcciones de correo: una para la cuenta *docente* (que crea el curso) y otra para la cuenta *estudiante* (la que FARO acompaña).

## 6.1 Crear el curso (cuenta docente) — 15 minutos

1. Entra a `https://canvas.instructure.com/register` y elige **Free for Teacher**. Completa el registro con el primer correo y confirma.
2. En el tablero, **+ Course** (o *Start a new course*). Ponle nombre, por ejemplo *Gestión de Proyectos*, y **Create course**.
3. Crea al menos **dos módulos** (*Modules → + Module*). Dentro de cada uno, **+** → *Assignment* → *Create Assignment*, con nombre y puntos. Crea 4 o 5 actividades en total. Opcional: a alguna ponle fecha límite pasada para que FARO tenga algo *vencido* que reabrir.
4. **Publica** el curso (botón *Publish* en la página de inicio del curso) y **publica cada módulo y actividad** (el icono de nube en verde). Un ítem sin publicar no aparece para el estudiante.
5. Anota el **id del curso**: está en la URL, `https://canvas.instructure.com/courses/1234567` → `1234567`.

## 6.2 Inscribir al estudiante — 5 minutos

Dos caminos:

- **Invitación:** *People → + People*, escribe el segundo correo, rol *Student*, **Next → Add Users**. El estudiante recibe un correo y acepta.
- **Autoinscripción:** *Settings → Course Details → More Options → Let students self-enroll by sharing with them a secret URL*. Guarda. Aparece un enlace; el estudiante lo abre.

Con la cuenta estudiante (segundo correo), entra a Canvas, acepta la invitación, y **entrega al menos dos actividades** (aunque sea con un texto de una línea). Así FARO tiene progreso real que mostrar.

## 6.3 Generar el token (cuenta estudiante) — 2 minutos

Con la sesión del **estudiante**:

1. **Account** (arriba a la izquierda) → **Settings**.
2. Baja hasta **Approved Integrations** → **+ New Access Token**.
3. *Purpose*: `FARO piloto`. *Expires*: pon una fecha (30 días es razonable). **Generate Token**.
4. **Copia el token ahora.** Canvas lo muestra completo solo en este momento.

> Usa el token del **estudiante**, no del docente. Un token de docente no tiene `submission` propia ni `state` de módulo, y FARO mostraría un curso sin progreso. Además, limita el alcance de una fuga a lo que ese estudiante ve de sí mismo (Libro 1, capítulo 4).

## 6.4 Configurar y arrancar el backend — 3 minutos

```bash
cd server
cp .env.example .env
```

Edita `server/.env`:

```text
CANVAS_API_URL=https://canvas.instructure.com
CANVAS_ACCESS_TOKEN=<pega aquí el token del estudiante>
FARO_COURSE_ID=1234567
```

Arranca:

```bash
npm start          # o, desde la raíz del proyecto: npm run server
```

Debes ver:

```text
[faro-server] listening on http://127.0.0.1:3000
[faro-server] Accepting the unpacked FARO extension (any chrome-extension:// origin, loopback only)
[faro-server] Canvas: canvas.instructure.com (read-only, token in memory only)
[faro-server] Mentor: not configured (the extension uses its local mentor)
```

Comprueba desde otra terminal:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/api/launch
```

`/api/launch` debe devolver tu `courseId`, el nombre del curso y el `userId` numérico del estudiante. Si devuelve `canvas_token_rejected`, el token está mal copiado o expiró.

**En Windows** usa PowerShell: `Copy-Item .env.example .env` en vez de `cp`, y `Invoke-WebRequest http://127.0.0.1:3000/health | Select-Object -Expand Content` en vez de `curl` (o instala curl).

## 6.5 Construir la extensión en modo real — 3 minutos

En la **raíz** del proyecto crea `.env.local`:

```text
VITE_CANVAS_MODE=http
VITE_FARO_API_URL=http://127.0.0.1:3000
```

Opción A, servidor de desarrollo (más rápido para iterar):

```bash
npm run dev
```

Abre `http://localhost:5173`. Ese origen ya está en `FARO_ALLOWED_ORIGINS` por defecto.

Opción B, extensión cargada en Chrome:

```bash
npm run build
```

Chrome → `chrome://extensions` → *Modo desarrollador* → *Cargar descomprimida* → carpeta `dist/`.

En desarrollo local no hace falta copiar el id de la extensión: mientras el backend escucha en *loopback* (`FARO_HOST=127.0.0.1`, el valor por defecto), acepta cualquier origen `chrome-extension://`, y al arrancar lo anuncia con *"Accepting the unpacked FARO extension (any chrome-extension:// origin, loopback only)"*. **Opcional** (y obligatorio fuera de la máquina de desarrollo): anota el **id de la extensión** que Chrome le asigna, añádelo a `server/.env` y activa el modo estricto:

```text
FARO_ALLOWED_ORIGINS=http://localhost:5173,chrome-extension://<id>
FARO_STRICT_ORIGINS=true
```

Reinicia el backend.

**Dos terminales desde la raíz:** `npm run server` arranca el backend (= `npm --prefix server run dev`, con recarga automática) y, en la otra, `npm run dev` (navegador) o `npm run build` y cargar `dist/` sin empaquetar (extensión).

## 6.6 Verificar — 2 minutos

1. Abre FARO. Completa el propósito (tres preguntas).
2. **Inicio** debe mostrar el nombre real de tu curso y un progreso que coincida con las entregas del estudiante.
3. **Perfil → Canvas**: la insignia dice **En vivo**, aparece *Curso 1234567 · Gestión de Proyectos*, y la nota dice por qué backend pasan las llamadas. Abre el registro: cuatro llamadas con estado `200`.
4. En la terminal del backend, cuatro líneas de log con `status: 200` y **sin query strings ni token**.

Si en el registro la ruta `/analytics/.../activity` aparece con `401` y el panel muestra la nota sobre analíticas: es el comportamiento esperado para una cuenta de estudiante en Free-for-Teacher. FARO usa las fechas de tus entregas como actividad. No es un error.

## 6.7 Romperlo a propósito (opcional, recomendado)

- Revoca el token en Canvas (*Approved Integrations → eliminar*). Reinicia el backend: `canvas_token_rejected`. FARO muestra el error con *Reintentar*, no un curso vacío.
- Pide una ruta prohibida: `curl http://127.0.0.1:3000/canvas/api/v1/courses/1234567/enrollments` → `403 path_not_allowed`, y **ninguna línea nueva** en el log de Canvas: no llegó a la red.
- Cambia `FARO_ALLOWED_ORIGINS` para excluir `localhost:5173` y recarga el dev server: `403 origin_not_allowed`.

## 6.8 Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `CANVAS_API_URL must use https://` | Pusiste `http://` | Corrige la URL |
| `canvas_token_rejected` | Token mal copiado, expirado o revocado | Genera uno nuevo |
| `no_active_course` | El estudiante no aceptó la invitación o el curso no está publicado | Acepta la invitación / publica el curso |
| Inicio muestra 0 % con actividades | Las actividades no están en ningún módulo, o el token es del docente | Añade las actividades a módulos; usa token de estudiante |
| FARO no carga y la consola dice `CORS` | El origen no está en `FARO_ALLOWED_ORIGINS` y no se aceptan orígenes de extensión: `FARO_STRICT_ORIGINS=true`, o el backend escucha fuera de *loopback* (p. ej. `0.0.0.0`) | Añade `chrome-extension://<id>` a `FARO_ALLOWED_ORIGINS` y reinicia |
| `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` | Node anterior a 22.18 | Actualiza Node |
| Módulos aparecen sin estado (`unlocked` todos) | Token de docente | Usa token de estudiante |
| `Nothing to serve: …` al arrancar | `server/.env` sin Canvas ni `GEMINI_API_KEY` | Configura al menos uno |
| Cada respuesta del Mentor trae la nota "Gemini no pudo responder…" | Clave rechazada (`502 mentor_key_rejected`), nombre de modelo inexistente (`502 mentor_upstream`) o, con `VITE_MENTOR_MODE=gemini`, backend apagado o sin clave (`503`) | Revisa `/health` (`mentor` no debe ser `null`), la clave y `GEMINI_MODEL` |
| El pie del Mentor dice "Mentor local" aunque configuraste Gemini | El servidor no está en marcha, no tiene `GEMINI_API_KEY`, o la extensión se construyó con `VITE_MENTOR_MODE=local` | Arranca el servidor con la clave (`/health` debe mostrar `mentor`), quita `VITE_MENTOR_MODE=local` y vuelve a abrir el Mentor |

## 6.9 Activar el mentor con Gemini (opcional) — 3 minutos

El mentor funciona sin esto (mentor local). Para que responda Gemini:

1. Crea una clave en Google AI Studio. **Con estudiantes reales, solo de un proyecto de Google Cloud con facturación activa**; el nivel gratuito sirve únicamente para probar con datos inventados (Libro 1, capítulo 7.8).
2. Añádela a `server/.env` (nunca a `.env.local` de la raíz):

```text
GEMINI_API_KEY=<tu clave>
GEMINI_MODEL=gemini-3.5-flash
```

   Los nombres de modelo cambian: verifica el vigente en `ai.google.dev/gemini-api/docs/models`.

3. Arranca el backend (`npm run server` desde la raíz, o `npm run dev` / `npm start` dentro de `server/`). La línea del mentor debe decir `Mentor: Gemini <modelo> (key in memory only)`. Canvas es opcional: con solo la clave, el backend arranca como mentor y las rutas de Canvas responden `503 canvas_not_configured`.
4. Abre FARO (`npm run dev` o la extensión cargada). No hace falta reconstruir ni crear `.env.local`: con el modo por omisión (`VITE_MENTOR_MODE=auto`), cada vez que se abre el Mentor la extensión pregunta `GET /health` al backend en `VITE_FARO_API_URL` (por defecto `http://127.0.0.1:3000`) y, si el servidor informa un mentor, usa Gemini. `VITE_MENTOR_MODE=gemini` fuerza el intento siempre; `local` lo impide.
5. Verifica: el pie del Mentor dice *"Responde Gemini, a través del servidor de FARO…"*, y al escribir un mensaje abierto la respuesta llega con el anillo violeta en el avatar y **sin** la nota *"Gemini no pudo responder…"*.
6. Detén el backend y vuelve a abrir el Mentor: el pie debe decir *"Mentor local…"* y debe responder el mentor local.

Este es el paso que el equipo debe hacer con su propia clave: en desarrollo, el camino solo se verificó contra un Gemini simulado (capítulo 8.2b).
