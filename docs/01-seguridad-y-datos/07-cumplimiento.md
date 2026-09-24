# 7. Cumplimiento: LFPDPPP y políticas institucionales

> Este capítulo es orientación técnica para preparar la revisión legal de la institución. No sustituye la opinión del área jurídica ni del responsable de protección de datos de la universidad.

## 7.1 El marco aplicable en México

La **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)** fue publicada en el Diario Oficial de la Federación el 20 de marzo de 2025 y entró en vigor el 21 de marzo de 2025. Sustituye a la ley de 2010. La autoridad reguladora para el sector privado ya no es el INAI, disuelto, sino la **Secretaría Anticorrupción y Buen Gobierno**.

Tres puntos de la nueva ley que tocan directamente a FARO:

1. **Definición de dato personal.** Es toda información de una persona identificada *o identificable*, "cuando su identidad pueda determinarse directa o indirectamente a través de cualquier información". Un id numérico de Canvas es, por tanto, dato personal aunque no lleve nombre: es indirectamente identificable por la institución.
2. **Aviso de privacidad.** Debe identificar datos sensibles y distinguir las finalidades que requieren consentimiento expreso. Cuando los datos se recaban por medios electrónicos, debe ofrecerse un aviso simplificado que remita al completo.
3. **Consentimiento.** Puede ser expreso o tácito; es tácito cuando, puesto a disposición el aviso de privacidad, el titular no manifiesta lo contrario. Para datos sensibles sigue exigiéndose consentimiento expreso.

**Nota sobre el sujeto obligado.** Una universidad privada como Tecmilenio es un particular y le aplica la LFPDPPP. Una universidad pública se rige por la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados. Ambas comparten los principios; el análisis de este capítulo es válido para las dos, pero el instrumento y la autoridad cambian. **La institución debe confirmar cuál le aplica.**

## 7.2 Los principios, uno por uno

| Principio | Qué exige | Cómo lo cumple FARO | Marca |
|---|---|---|---|
| **Licitud** | Tratar datos conforme a la ley y sin engaño | FARO solo lee lo que el estudiante ya puede ver de sí mismo en Canvas; el registro de peticiones es visible en pantalla | [código] |
| **Consentimiento** | Contar con la voluntad del titular | Piloto: consentimiento expreso e informado de cada participante (plantilla en 7.4). Producción: aviso de privacidad integrado en el lanzamiento LTI | Política / [pendiente] |
| **Información** | Aviso de privacidad accesible | Pantalla *Perfil → Canvas* y pie del Mentor muestran qué se consulta, qué se envía y quién responde (Gemini o el mentor local); aviso formal por redactar con la institución | [código] / [pendiente] |
| **Calidad** | Datos exactos y actualizados | Canvas es la fuente de verdad; FARO no copia el expediente, lo lee en cada apertura | [código] |
| **Finalidad** | Usar los datos solo para lo informado | Cada ruta de Canvas tiene un propósito escrito junto a ella (`server/src/allowlist.ts`, campo `purpose`); no hay uso secundario | [código] |
| **Lealtad** | No obtener datos por medios engañosos | No hay rastreo fuera de las 6 rutas; no hay *dark patterns* para obtener el perfil (todo es opcional) | [código] |
| **Proporcionalidad** | Solo los datos necesarios | Capítulo 5: conteos de vistas descartados, nombre y avatar de `users/self` descartados, mentor con 11 campos revalidados en el backend e historial limitado a 8 turnos | [código] [prueba] |
| **Responsabilidad** | Velar por el cumplimiento y poder demostrarlo | Este libro; las 36 pruebas automáticas; la lista de verificación del capítulo 9 | [prueba] |

## 7.3 Datos sensibles

FARO **no trata datos sensibles** según la definición de la ley (origen étnico, salud, creencias, opiniones políticas, preferencia sexual, datos genéticos). Dos matices que la institución debe considerar:

- El estado *"pasó algo en mi vida"* (menos tiempo, abrumado, necesito una pausa) es autodeclarado, se usa solo para elegir una intervención y **no se persiste**. No es parte de los once campos del contexto. Si el estudiante lo elige en el registro de ánimo del mentor, esa elección queda como un turno de la conversación, y en modo `gemini` puede viajar entre los últimos 8 turnos de un mensaje abierto posterior. No es un dato de salud, pero el aviso de privacidad debe mencionarlo para no dejar dudas.
- La **frase de destino** es texto libre. Si un estudiante escribiera ahí un dato sensible, FARO lo guardaría localmente y lo incluiría en el contexto del mentor (y, en modo `gemini`, llegaría a Google). Mitigación: advertencia en pantalla **[pendiente]** y política de no almacenar conversaciones.
- Los **mensajes al mentor** también son texto libre. En modo `gemini` van a Google a través del backend. Si un estudiante menciona una crisis o querer hacerse daño, las reglas del mentor le piden responder con cuidado, dejar de hablar de estudio y animarlo a contactar de inmediato al servicio de apoyo estudiantil de la universidad o a servicios de emergencia. FARO no es un servicio de apoyo psicológico; la institución debe decidir qué canal nombrar.

## 7.4 Consentimiento para el piloto

Para un piloto con cinco a treinta estudiantes, se recomienda consentimiento expreso por escrito. Elementos mínimos que debe contener:

1. Quién es el responsable (la institución) y quién el encargado (el equipo de FARO).
2. Qué datos se leen de Canvas (las seis rutas, en lenguaje llano).
3. Qué datos crea FARO (propósito, sesiones, preferencias, perfil opcional).
4. Que FARO no modifica nada en Canvas.
5. Si la institución activa Gemini: que el mentor puede responder con un modelo de Google; que recibe, a través del backend de FARO, un contexto sin nombre ni correo, el mensaje del estudiante y los últimos 8 turnos de la conversación; que FARO no guarda las conversaciones; y que la pantalla del mentor siempre dice quién responde. Que solo participan personas mayores de 18 años.
6. Cuánto tiempo se conservan los datos y cómo pedir su borrado (*Progreso → Restablecer*, y revocación del token).
7. Que la participación es voluntaria y retirarse no afecta la calificación.
8. Cómo ejercer derechos ARCO ante la institución.

## 7.5 Derechos ARCO

| Derecho | Cómo se ejerce en FARO hoy | En producción |
|---|---|---|
| **Acceso** | *Perfil* muestra todo lo que FARO guarda del estudiante; *Perfil → Canvas* muestra todo lo que lee | Exportación desde el backend |
| **Rectificación** | Los datos académicos se corrigen en Canvas (fuente de verdad); los de FARO, en Perfil | Igual |
| **Cancelación** | *Progreso → Restablecer* borra el estado local; desinstalar la extensión lo elimina todo | Borrado en base de datos por solicitud |
| **Oposición** | No instalar la extensión; retirar el consentimiento del piloto | Desactivar la herramienta LTI para ese estudiante |

## 7.6 Transferencias

- **A Canvas (Instructure):** FARO no transfiere nada a Canvas; solo lee. La relación de la institución con Instructure ya está cubierta por su contrato existente.
- **Al proveedor del modelo de IA (Google, API de Gemini):** solo si la institución activa `VITE_MENTOR_MODE=gemini` y pone `GEMINI_API_KEY` en el backend. Es una transferencia de los 11 campos del contexto, el mensaje del estudiante y los últimos 8 turnos de la conversación actual; nunca nombre, correo, ids de Canvas, calificaciones ni foto. Debe constar en el aviso de privacidad. Las condiciones de uso de esos datos dependen del tipo de clave (sección 7.8). Con el modo por omisión (`local`) no hay transferencia.
- **Entre dispositivos del estudiante [pendiente]:** cuando exista el backend con base de datos, el estado de FARO se sincronizará a través de él. Es tratamiento por el encargado, no transferencia a tercero.

## 7.7 Políticas institucionales de Canvas

Independientemente de la ley, la institución controla en Canvas:

- Si los estudiantes pueden generar tokens de acceso y con qué expiración.
- Qué *scopes* concede a la clave de desarrollador de FARO (recomendación: exactamente los de `requiredScopes`).
- Si la herramienta LTI se instala a nivel de cuenta, subcuenta o curso.
- Si los estudiantes pueden ver sus propias analíticas (afecta si FARO usa el endpoint de actividad o el respaldo por entregas).

Ninguna de estas decisiones requiere cambios en FARO; el backend respeta lo que Canvas permita y reporta lo que no.

## 7.8 Términos de la API de Gemini

Fuente: *Gemini API Additional Terms of Service*, `ai.google.dev/gemini-api/terms`. La institución debe revisar la versión vigente antes del piloto; lo que sigue es lo que FARO asume.

| | Servicios de pago (proyecto de Google Cloud con facturación activa) | Servicios gratuitos (sin facturación) |
|---|---|---|
| ¿Google usa los *prompts* y respuestas para mejorar sus productos? | **No** | **Sí** |
| ¿Qué hace Google con ellos? | Los registra por tiempo limitado, solo para detectar abuso y por requisitos legales | Los usa para mejorar productos; **revisores humanos pueden leerlos** |
| Advertencia de los términos | — | **No enviar información personal** |

**Regla de FARO:** con estudiantes reales, solo una clave de un proyecto con **facturación activa**. **Nunca** el nivel gratuito. El nivel gratuito sirve para que el equipo pruebe con datos inventados, nada más.

**Edad.** Los términos exigen que los usuarios de la API de Gemini sean mayores de 18 años. El piloto es con estudiantes adultos, mayores de 18; la institución debe confirmarlo al reclutar.

**Lo que FARO añade por su cuenta**, independiente de los términos de Google: la clave solo vive en el backend; el backend no guarda ni registra las conversaciones; el contexto se filtra dos veces (extensión y backend); y si Gemini falla, responde el mentor local, así que el servicio no depende de Google para seguir funcionando.
