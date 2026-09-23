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
| **Información** | Aviso de privacidad accesible | Pantalla *Perfil → Canvas* y pie del Mentor muestran qué se consulta y qué se envía; aviso formal por redactar con la institución | [código] / [pendiente] |
| **Calidad** | Datos exactos y actualizados | Canvas es la fuente de verdad; FARO no copia el expediente, lo lee en cada apertura | [código] |
| **Finalidad** | Usar los datos solo para lo informado | Cada ruta de Canvas tiene un propósito escrito junto a ella (`server/src/allowlist.ts`, campo `purpose`); no hay uso secundario | [código] |
| **Lealtad** | No obtener datos por medios engañosos | No hay rastreo fuera de las 6 rutas; no hay *dark patterns* para obtener el perfil (todo es opcional) | [código] |
| **Proporcionalidad** | Solo los datos necesarios | Capítulo 5: conteos de vistas descartados, nombre y avatar de `users/self` descartados, mentor con 11 campos | [código] |
| **Responsabilidad** | Velar por el cumplimiento y poder demostrarlo | Este libro; las 20 pruebas automáticas; la lista de verificación del capítulo 9 | [prueba] |

## 7.3 Datos sensibles

FARO **no trata datos sensibles** según la definición de la ley (origen étnico, salud, creencias, opiniones políticas, preferencia sexual, datos genéticos). Dos matices que la institución debe considerar:

- El estado *"pasó algo en mi vida"* (menos tiempo, abrumado, necesito una pausa) es autodeclarado, se usa solo para elegir una intervención, **no se persiste ni sale del navegador**. No es un dato de salud, pero el aviso de privacidad debe mencionarlo para no dejar dudas.
- La **frase de destino** es texto libre. Si un estudiante escribiera ahí un dato sensible, FARO lo guardaría localmente y lo incluiría en el contexto del mentor. Mitigación: advertencia en pantalla **[pendiente]** y política de no almacenar conversaciones.

## 7.4 Consentimiento para el piloto

Para un piloto con cinco a treinta estudiantes, se recomienda consentimiento expreso por escrito. Elementos mínimos que debe contener:

1. Quién es el responsable (la institución) y quién el encargado (el equipo de FARO).
2. Qué datos se leen de Canvas (las seis rutas, en lenguaje llano).
3. Qué datos crea FARO (propósito, sesiones, preferencias, perfil opcional).
4. Que FARO no modifica nada en Canvas.
5. Que el mentor de IA, cuando se active, recibirá un contexto sin nombre ni correo.
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
- **Al proveedor del modelo de IA [pendiente]:** será una transferencia de los 11 campos del contexto más el mensaje del estudiante. Debe constar en el aviso de privacidad, y el contrato con el proveedor debe prohibir el uso de esos datos para entrenamiento. Hasta entonces, el mentor es local y no hay transferencia.
- **Entre dispositivos del estudiante [pendiente]:** cuando exista el backend con base de datos, el estado de FARO se sincronizará a través de él. Es tratamiento por el encargado, no transferencia a tercero.

## 7.7 Políticas institucionales de Canvas

Independientemente de la ley, la institución controla en Canvas:

- Si los estudiantes pueden generar tokens de acceso y con qué expiración.
- Qué *scopes* concede a la clave de desarrollador de FARO (recomendación: exactamente los de `requiredScopes`).
- Si la herramienta LTI se instala a nivel de cuenta, subcuenta o curso.
- Si los estudiantes pueden ver sus propias analíticas (afecta si FARO usa el endpoint de actividad o el respaldo por entregas).

Ninguna de estas decisiones requiere cambios en FARO; el backend respeta lo que Canvas permita y reporta lo que no.
