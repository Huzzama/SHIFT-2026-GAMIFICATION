# 9. Lista de verificación antes de un piloto

Marcar cada punto antes de conectar FARO a un Canvas con estudiantes reales. Los puntos con ⚙ los verifica el equipo técnico; los puntos con ⚖ los verifica la institución.

## A. Antes de arrancar el backend

- [ ] ⚙ `server/.env` existe, **no** está en git (`git status` no lo lista) y `CANVAS_API_URL` empieza con `https://`.
- [ ] ⚙ El token pertenece a una **cuenta de estudiante** del piloto, no a un docente ni administrador.
- [ ] ⚙ El token tiene **fecha de expiración** (recomendado: 30 días).
- [ ] ⚙ `FARO_HOST=127.0.0.1` salvo que haya TLS por delante.
- [ ] ⚙ `FARO_ALLOWED_ORIGINS` contiene solo los orígenes reales (el id de la extensión cargada, el servidor de desarrollo si aplica).
- [ ] ⚙ Si se usará el mentor con Gemini: `GEMINI_API_KEY` es de un proyecto de Google Cloud **con facturación activa** (servicios de pago), **nunca** del nivel gratuito (capítulo 7.8).
- [ ] ⚙ `GEMINI_MODEL` se verificó contra `ai.google.dev/gemini-api/docs/models` (por omisión `gemini-3.5-flash`; los nombres de modelo cambian).
- [ ] ⚙ `FARO_MENTOR_PER_MINUTE` tiene un valor acordado (por omisión 20 llamadas al modelo por cliente y minuto).
- [ ] ⚙ `npm test` en `server/` pasa las 36 verificaciones.
- [ ] ⚙ `curl http://127.0.0.1:3000/health` responde con el host de Canvas y `mentor: {provider, model}` (o `null` si no hay clave), y **no** contiene el token ni la clave.
- [ ] ⚙ El mentor con Gemini se probó contra la API real con la clave del piloto: una respuesta llega con el anillo violeta y **sin** la nota "Gemini no pudo responder…". (En desarrollo solo se verificó contra un Gemini simulado.)

## B. Antes de cargar la extensión

- [ ] ⚙ Se construyó con `VITE_CANVAS_MODE=http` y `VITE_FARO_API_URL` apuntando al backend.
- [ ] ⚙ `VITE_MENTOR_MODE` es `gemini` solo si la institución aprobó el mentor con IA; si no, `local`. El pie de FARO Mentor dice lo correcto (*"Responde Gemini, a través del servidor de FARO…"* o *"Mentor local: sin modelo de IA…"*).
- [ ] ⚙ Ni `.env` ni `.env.local` de la raíz contienen una clave de Gemini.
- [ ] ⚙ `public/manifest.json` **no** contiene `instructure.com` en `host_permissions`.
- [ ] ⚙ En *Perfil → Canvas* la insignia dice *En vivo* y el registro muestra estado `200` en las cuatro rutas.
- [ ] ⚙ Si aparece la nota "tu cuenta no puede leer las analíticas", se decidió con la institución si se habilita el permiso o se acepta el respaldo por entregas.

## C. Con la institución

- [ ] ⚖ Se confirmó qué ley aplica (LFPDPPP para institución privada; Ley General para pública).
- [ ] ⚖ Existe un aviso de privacidad (simplificado + completo) revisado por jurídico, que menciona: las seis rutas de Canvas, los datos que FARO crea, el estado "pasó algo en mi vida", el mentor con Gemini si se activa (qué se envía a Google, capítulo 7.6) y la retención.
- [ ] ⚖ Cada participante firmó el consentimiento del piloto (capítulo 7.4) y es mayor de 18 años (requisito de los términos de la API de Gemini).
- [ ] ⚖ Se acordó cómo se ejercen los derechos ARCO durante el piloto y quién responde.
- [ ] ⚖ Se acordó qué métricas del piloto se entregan y en qué forma (agregadas, con ids pseudónimos).
- [ ] ⚖ El área de seguridad de la institución revisó este libro y el código de `server/`.
- [ ] ⚖ Se definió la fecha de fin del piloto y el procedimiento de revocación de tokens y borrado de datos al terminar.

## D. Al terminar el piloto

- [ ] ⚙ Todos los tokens del piloto revocados en Canvas.
- [ ] ⚙ La clave de Gemini del piloto revocada o rotada en Google.
- [ ] ⚙ `server/.env` borrado de la máquina del backend.
- [ ] ⚙ Participantes informados de cómo borrar el estado local (*Progreso → Restablecer* o desinstalar).
- [ ] ⚖ Métricas entregadas; datos crudos destruidos o entregados a la institución según lo acordado.

## E. Para pasar a producción (fuera del alcance del piloto)

- [ ] Registro de FARO como herramienta LTI 1.3 a nivel de cuenta en Canvas, con los scopes exactos de `requiredScopes` y sin `score` ni `lineitem`.
- [ ] Implementación de `/lti/login`, `/lti/launch` y `/.well-known/jwks.json` según la especificación en `server/src/routes/lti.ts`.
- [ ] OAuth2 por estudiante; eliminación del token compartido.
- [ ] PostgreSQL con cifrado en reposo; política de retención automática.
- [ ] Revisión jurídica de los términos vigentes de la API de Gemini (o del proveedor que se elija) y del contrato de la institución con Google.
- [ ] Revisión de seguridad externa.
