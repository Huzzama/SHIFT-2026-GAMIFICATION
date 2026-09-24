# 4. El token de Canvas: ciclo de vida

El token es el dato más sensible que FARO maneja. Este capítulo sigue su vida completa: dónde nace, dónde vive, por dónde viaja, dónde **no** está nunca, y cómo muere. La sección 4.8 aplica las mismas reglas al segundo secreto del backend: la clave de la API de Gemini.

## 4.1 Nacimiento

**Piloto (hoy):** lo genera la persona dueña de la cuenta de Canvas, en *Cuenta → Configuración → Integraciones aprobadas → Nuevo token de acceso*. Canvas lo muestra una sola vez. Dos detalles de Canvas que juegan a favor:

- Las instituciones pueden **exigir fecha de expiración** para tokens de estudiantes (Instructure documenta un valor por defecto de 30 días para estudiantes y 90 para docentes), y pueden desactivar por completo la generación manual de tokens.
- El token hereda exactamente los permisos del usuario que lo creó: un token de estudiante no puede ver más que ese estudiante.

**Producción:** lo emite Canvas mediante OAuth2 a partir de una clave de desarrollador registrada por la institución, con *scopes* limitados y expiración de una hora. **[pendiente]**

## 4.2 Residencia

El token vive en **dos lugares y solo dos**:

1. `server/.env`, un archivo en la máquina que corre el backend. Está en `.gitignore` **[código]** y el repositorio incluye `server/.env.example` con el campo vacío para que nadie tenga que adivinar el formato.
2. La memoria del proceso del backend, en el objeto `Env`, desde el arranque hasta el apagado.

## 4.3 Viaje

Sale del backend en una única dirección: hacia Canvas, en la cabecera `Authorization`, por HTTPS, y solo para rutas de la lista blanca. Antes de seguir un enlace de paginación (`Link: rel="next"`), el backend verifica que la URL siga apuntando al host configurado de Canvas; un enlace que apuntara a otro dominio se rechaza, porque seguirlo enviaría el token fuera.

**[código]** `server/src/canvas.ts`, comprobación `url.startsWith(env.canvasApiUrl + '/')`.

## 4.4 Dónde no está nunca

| Lugar | Por qué no | Verificación |
|---|---|---|
| La extensión | `CanvasConfig` no tiene campo para un token. No existe la variable. | `src/data/canvas/config.ts` |
| El build de Vite | Vite solo expone variables `VITE_*`; el token no lleva ese prefijo y no está en `.env` de la raíz. | `.env.example` de la raíz lo dice explícitamente |
| Los logs del backend | El logger recibe método, ruta sin query, estado, duración e id. Nunca cabeceras. | **[prueba]** "the token was sent to Canvas on every call, and only there" |
| Las respuestas del backend | `describe(env)` es la única representación de la configuración que sale, y contiene `tokenPresent: true/false`, no el token. | **[prueba]** "health names the Canvas host and never the token" |
| Los mensajes de error | `CanvasError` guarda estado y ruta, nunca el cuerpo de la respuesta de Canvas. | `server/src/canvas.ts` |
| El repositorio git | `.gitignore` excluye `.env` en cualquier carpeta. | `.gitignore` |
| El servicio de IA | El contexto del mentor no tiene ningún campo de credencial, y la llamada a Gemini solo lleva la clave de Gemini. | `src/lib/mentorContext.ts`, `server/src/mentor.ts` |

## 4.5 Rotación

Cambiar el token es editar `server/.env` y reiniciar el backend. No hay caché del token en ningún otro lugar que sobreviva al reinicio. Recomendación para el piloto: tokens con expiración de 30 días, rotados al vencer.

## 4.6 Revocación

- **Desde Canvas:** la persona dueña del token lo elimina en *Integraciones aprobadas*. Desde ese instante el backend recibe `401` y lo reporta como `canvas_token_rejected` sin intentar nada más. **[prueba]** "a wrong token is reported as rejected, not as a generic failure".
- **Desde el backend:** borrar el valor en `.env` y reiniciar. El backend se niega a arrancar con media configuración de Canvas (URL sin token o token sin URL) y se niega a arrancar si no tiene nada que servir (ni Canvas ni mentor). Si solo queda la clave de Gemini, arranca en modo "solo mentor" y las rutas de Canvas responden `503 canvas_not_configured`; `/health` lo muestra con `canvas: null`. Así no existe un estado "arrancó sin credencial y nadie se dio cuenta". **[prueba]** "config: half a Canvas setup is refused, mentor-only is accepted".
- **Producción (OAuth2):** `DELETE /login/oauth2/token` revoca el token del estudiante en Canvas. **[pendiente]**

## 4.7 Si el token se filtrara

Escenario: alguien obtiene acceso a `server/.env`.

1. **Alcance del daño:** lectura de lo que ese usuario de Canvas puede leer. No escritura: el token de un estudiante no puede alterar su expediente, y el de un docente tampoco a través de FARO, aunque sí directamente contra Canvas. Por eso el piloto usa **tokens de cuentas de estudiante**, nunca de docente ni de administrador.
2. **Contención:** revocar el token en Canvas (un clic). Generar uno nuevo. Reiniciar el backend.
3. **Detección:** Canvas registra el uso de cada token; un patrón de uso desde una IP desconocida es visible para la institución.
4. **Prevención estructural:** el camino LTI + OAuth2 elimina el archivo `.env` con token de larga vida y lo sustituye por tokens de una hora emitidos por estudiante.

## 4.8 El segundo secreto: la clave de Gemini

Si la institución activa el mentor con IA, el backend guarda un segundo secreto: `GEMINI_API_KEY`. Sigue exactamente las reglas del token de Canvas.

- **Nacimiento:** se crea en Google AI Studio, en un proyecto de Google Cloud **con facturación activa** (capítulo 7 explica por qué el nivel gratuito no sirve con estudiantes reales).
- **Residencia:** `server/.env` y la memoria del proceso del backend. Nunca en la extensión: el `.env.example` de la raíz lo dice explícitamente, y `HttpMentorService` no tiene dónde guardarla. Es opcional: vacía, el mentor con IA está apagado y la extensión usa su mentor local.
- **Viaje:** sale solo hacia Google, en la cabecera `x-goog-api-key` de la llamada a `models/{modelo}:generateContent`, **nunca en la URL** (las URLs quedan en logs de proxies). **[prueba]** "mentor: the key goes in a header, never in the URL".
- **Dónde no está nunca:** en los logs ni en las respuestas del backend. `describe(env)` muestra solo `mentor: {provider, model}`. Si Google rechaza la clave (401/403), el backend responde `502 mentor_key_rejected` sin repetir el cuerpo de error de Google. **[prueba]** "mentor: a rejected key and a safety block map to fallback codes", "mentor: the key and the conversation never appear in the log".
- **Rotación y revocación:** editar `server/.env` y reiniciar. Si la clave se expone, revocarla en Google AI Studio / Google Cloud y generar otra.
- **Alcance del daño si se filtra:** alguien podría hacer llamadas a Gemini a cargo del proyecto de la institución. No da acceso a Canvas ni a datos de estudiantes: FARO no guarda conversaciones. `FARO_MENTOR_PER_MINUTE` (20 por omisión) limita por cliente cuántas llamadas al modelo acepta el backend, para contener el costo.
