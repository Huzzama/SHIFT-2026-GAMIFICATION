# 6. FARO Mentor

La pestaña **FARO**. Un chat, pero no un chatbot genérico: solo sabe de tu curso y está construido para guiarte, no para hacerte el trabajo. Pregunta más de lo que dice, habla con calma y no te echa porras.

### Quién te responde

Al pie de la pantalla siempre dice cuál de los dos mentores te está respondiendo:

- **Mentor local** — *"Mentor local: sin modelo de IA, nada sale de tu dispositivo."* Es la opción por omisión. Responde en tu navegador, con reglas fijas.
- **Gemini** — *"Responde Gemini, a través del servidor de FARO. Ve tu progreso en el curso y tu meta — nunca quién eres."* Solo si tu institución lo activó. Los mensajes que escribe Gemini llevan un **anillo violeta** en el avatar de FARO.

Si Gemini no puede responder en ese momento, responde el mentor local y lo dice al final del mensaje: *"Gemini no pudo responder en este momento, así que respondió el mentor local."* Nunca te quedas sin respuesta.

### Cómo abre

**Si algo cambió** (tu ruta necesita atención o llevas 3 días o más sin actividad), FARO empieza por preguntarte, no por mostrarte pendientes:

> *"Noté que algo cambió. Tu último paso fue hace N días — está bien, tu progreso está guardado. ¿Lo vemos juntos? ¿Qué pasó?"*

Debajo, las seis opciones de *La vida pasó*. Cada una lleva a algo distinto:

| Eliges | FARO responde |
| --- | --- |
| **Tengo menos tiempo** | Una sesión de Enfoque de 10 minutos, con sus pasos. |
| **Estoy abrumado** | Una sola cosa: el paso más corto, con **Hoy no** a un toque. |
| **No entiendo el material** | Abre **Enséñame**. |
| **Perdí mi rutina** | **Volver**: las 3 tarjetas de repaso y un paso de 10 minutos o menos. |
| **Necesito una pausa** | *"Tómate tu tiempo. Tu progreso está guardado y nada caduca mientras descansas. Aquí voy a estar cuando quieras volver."* Y activa la pausa. |
| **Estoy listo para continuar** | Tu siguiente paso, con un botón para empezarlo. |

**Si vas al corriente**, abre citando tu destino y tu avance — *"Tu destino: “…”. Llevas N% del camino. ¿Qué necesitas hoy?"* — con los cuatro modos como botones.

Estos momentos (el registro de ánimo, los minutos, los pasos, los puntos) se calculan con tus datos reales, en tu dispositivo. **Nunca los inventa un modelo.**

### Los cuatro modos

Arriba, en una barra:

- **Enfoque** — pregunta cuánto tiempo tienes (**5 / 10 / 15 / 30 min**) y arma una sesión que cabe, con la misma regla que *¿Cuánto tiempo tienes?* en Inicio: repaso primero si vuelves, luego los pasos en orden de ruta.
- **Volver** — sin pendientes acumulados: las tres preguntas de repaso de un módulo (unos 3 minutos) y un paso de 10 minutos o menos. Si hoy no hay tarjetas, solo el paso.
- **Enséñame** — explica un tema y comprueba que quedó (ver abajo).
- **Planear mi fin de semana** — pregunta cuánto tiempo tienes el **sábado** y luego el **domingo** (*Ese día no*, 30, 45, 60 o 90 min) y propone un plan más pequeño que tu tiempo, a propósito. **Guardar este plan** lo deja en Inicio, en la tarjeta *Tu plan*; **Cambiarlo** vuelve a preguntar.

### Enséñame

El ciclo es siempre el mismo: **explicación breve → una pregunta → tu respuesta → FARO se adapta.**

**Sin Gemini**, las lecciones salen del banco de repaso del curso de demostración, por módulo (primero los módulos en los que ya trabajaste). Eliges un tema y FARO:

1. Te lo explica en corto y te hace una pregunta con opciones.
2. **Si aciertas:** otra pregunta un poco distinta, o, si ya no hay más, te propone aplicarlo a tu siguiente paso.
3. **Si fallas:** repite la idea clave y te pregunta otra vez, **sin la opción que ya probaste**. No hay forma de perder, y no hay puntos en juego.

Para otros cursos todavía no hay lecciones cortas; FARO te lo dice y te pide el término o el paso exacto que no te queda.

**Con Gemini**, escribes el tema con tus palabras (o tocas uno sugerido) y Gemini sigue el mismo ciclo: lo explica en tres oraciones como máximo, con un ejemplo cotidiano, te hace exactamente una pregunta, evalúa tu respuesta y se adapta.

### Preguntas sobre tus puntos

Si preguntas por puntos, recompensas o TecmiRewards, la respuesta sale de las reglas de Impacto, no de un modelo:

> *"Te faltan X puntos para tu siguiente meta de TecmiRewards ($200 MXN). Si quieres, te muestro una forma realista de llegar."*

Si tocas **Muéstrame una forma realista**:

> *"Terminar los siguientes N pasos (con eso cierras M módulos) te lleva ahí — unos K minutos en total, en los días que tú elijas. Sin prisa."*

Solo cuenta puntos garantizados (actividades y módulos), nunca bonos que podrías no ganar. Nunca te dice "estudia ahora".

### Escribir libremente

También puedes escribir lo que quieras. Con el mentor local, entiende preguntas sobre: qué hacer ahora, ir atrasado, tener poco tiempo, no entender algo, no tener ganas, y planear. Cuando no tienes ganas, te recuerda tu propio destino: *"Cuando definiste tu destino escribiste: “…”. Hagamos solo diez minutos…"*. Con Gemini, la conversación es abierta, bajo las mismas reglas.

Debajo de muchas respuestas hay **chips de seguimiento**: tocándolos envías esa pregunta sin escribirla.

### La voz

Un menú pequeño, **Voz**: **Directo**, **Alentador**, **Detallado**, **Cercano**, **Rétame**.

Cambia cómo te habla, nunca lo que puede hacer. "Rétame" no te va a dar respuestas que "Alentador" niega; solo suena distinto. Las reglas académicas y de seguridad son las mismas en las cinco voces.

### Qué sabe de ti — exactamente

Esta es la lista completa del contexto, y está construida en un solo archivo del código:

- El nombre del curso
- Tu porcentaje de avance
- Cuál es tu siguiente actividad y cuánto dura
- Tu meta y la frase de tu destino
- Los minutos que dijiste tener
- Tu impulso y tu estado interno de fricción
- La voz y el idioma que elegiste

**Con Gemini**, además de ese contexto viajan tu mensaje y los últimos 8 turnos de esta conversación, siempre a través del servidor de FARO, nunca directo desde tu navegador. El servidor vuelve a filtrar el contexto y no guarda la conversación.

**Lo que nunca recibe:** tu nombre, tu correo, tu foto, tu biografía, tus identificadores de Canvas, tus calificaciones, tus conversaciones de otras sesiones. Si un dato no está construido en ese archivo, el mentor jamás lo ve. No es una política escrita: es la única forma en que puede recibir datos.

La conversación vive solo en la memoria de FARO mientras lo usas.

### Qué no va a hacer

Si le pides que resuelva un trabajo calificado, se niega — y te ofrece dividirlo en pasos, explicarte el concepto o revisar tu razonamiento. Esa negativa es igual en las cinco voces, y con Gemini la da el servidor sin siquiera consultar al modelo.

Tampoco te pone etiquetas ("en riesgo", "vas atrasado"), no cuenta tus pendientes vencidos y no promete prórrogas ni calificaciones: eso es de tu institución.

Al pie de la pantalla está la nota que lo dice sin letras chicas.
