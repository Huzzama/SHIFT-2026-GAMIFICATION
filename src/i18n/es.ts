/**
 * Spanish copy — the source of truth for the dictionary shape.
 *
 * Every other language is typed against this file, so a missing key fails the
 * build instead of showing up as an empty label in the demo.
 */
import type { MentorStyle } from '@/types'

type Opener = (momentumIsLow: boolean) => string

export const es = {
  /* ------------------------------------------------------------- shell */
  shell: {
    pointsToast: (n: number) => `+${n} puntos`,
    tagline: 'Focus. Advance. Reward. Own.',
    promise: 'Difícil de abandonar. Fácil de volver.',
    noGameOver: 'Sin Game Over. Recalcula tu ruta.',
    loading: 'Ubicando tu posición…',
    loadError: 'No pude conectar con el backend de FARO. Revisa que el servidor esté corriendo y vuelve a intentar.',
    retry: 'Reintentar',
    nav: { home: 'Inicio', journey: 'Ruta', mentor: 'FARO', community: 'Comunidad', rewards: 'Impacto', progress: 'Progreso' },
    back: { recovery: 'Recuperación', purpose: 'Tu propósito', profile: 'Perfil' },
    momentum: 'impulso',
    momentumTitle: 'Tu conexión con el curso',
    language: 'Idioma',
    theme: { light: 'Claro', dark: 'Oscuro', system: 'Automático' },
    themeTitle: 'Apariencia',
  },

  /* ---------------------------------------------------------- pillars */
  pillars: {
    focus: { title: 'Focus', body: 'Define tu destino y el tiempo real que tienes.' },
    advance: { title: 'Advance', body: 'Un solo paso siguiente. Nunca la lista completa.' },
    reward: { title: 'Reward', body: 'Logros por persistir, no por hacer clic.' },
    own: { title: 'Own', body: 'Habla con FARO y toma el control de tu semana.' },
  },

  /* ------------------------------------------------------------- home */
  home: {
    greeting: { morning: 'Buenos días', afternoon: 'Buenas tardes', evening: 'Buenas noches' },
    heroSub: 'Cada paso cuenta. Aquí tienes tu progreso de hoy.',
    yourRoute: 'Tu ruta académica',
    ofRoute: 'de la ruta',
    myCourses: 'Mis cursos',
    courseProgress: 'Progreso del curso',
    momentumCard: { label: 'Impulso actual', strong: 'Impulso fuerte', building: 'Recuperando impulso', low: 'Tu progreso está a salvo' },
    rhythmCard: {
      label: 'Ritmo de aprendizaje',
      active: (n: number) => `${n} ${n === 1 ? 'día seguido' : 'días seguidos'}`,
      waiting: 'Tu ritmo te espera',
      week: (n: number) => `${n}/7`,
      weekSub: 'días activos esta semana',
    },
    timePicker: {
      title: '¿Cuánto tiempo tienes?',
      option: (m: number) => `${m} min`,
      open: '30+ min',
      session: (m: number) => `Tu sesión de ${m} minutos`,
      review: '3 preguntas de repaso',
      partial: (m: number) => `los primeros ${m} min`,
      start: 'Empezar',
      empty: 'Nada de tu ruta te necesita ahora mismo.',
    },
    weekPlan: {
      eyebrow: 'Tu plan',
      clear: 'Quitar plan',
      done: 'hecho',
    },
    horizon: { eyebrow: 'Tu horizonte', empty: 'Define tu destino' },
    trail: {
      title: (i: number, n: number) => `Módulo ${i} de ${n}`,
      finished: 'Ruta completa',
      destination: 'Destino',
    },
    stats: {
      momentum: 'Impulso',
      route: 'Ruta',
      rhythm: (n: number) => `ritmo: ${n}/7 días`,
      modules: (d: number, n: number) => `${d} de ${n} módulos`,
    },
    says: {
      fits: (m: number) => `Tienes ${m} minutos hoy. Hagamos lo único que te mueve hacia adelante.`,
      longer: (n: number, m: number) => `Tu siguiente paso toma unos ${n} minutos. Con tus ${m} puedes empezarlo y pausar sin perder nada.`,
      returning: (m: number) => `Solo necesitas ${m} minutos para que tu ruta vuelva a moverse.`,
      done: 'Llegaste al destino. Lo que construiste aquí sigue contando.',
    },
    support: {
      sos: 'SOS',
      sosSub: 'Estoy atorado',
      room: 'Sala de estudio',
      roomSub: (n: number) => `${n} estudiando ahora`,
    },
    achievementsCard: { label: 'Tienes', earned: (n: number) => `${n} ${n === 1 ? 'logro' : 'logros'}`, sub: 'de resiliencia' },
    mentorCard: { label: 'FARO Mentor', title: 'Pregúntale a FARO', sub: 'Guía, no respuestas hechas' },
    welcomeBack: { title: 'Bienvenido de vuelta.', body: 'Tu progreso sigue aquí. Busquemos una forma de volver que se ajuste a tu semana — sin ponerte al corriente.', cta: 'Recalcular mi ruta' },
    attention: { body: 'Si algo se interpuso esta semana, cuéntaselo a FARO y el plan cambia.', cta: 'La vida pasó' },
    nba: {
      eyebrow: 'Siguiente mejor paso',
      meta: (min: number, have: number) => `Unos ${min} minutos · nos dijiste que tienes ${have}.`,
      start: 'Empezar este paso',
      ask: 'Preguntar a FARO',
      minutes: (m: number) => `${m} min`,
      empty: 'No hay nada esperándote ahora. Llegaste al final de la ruta.',
    },
    visit: {
      eyebrow: 'Esta visita',
      none: 'Nada completado aún — con un paso basta.',
      some: (n: number) => `${n} ${n === 1 ? 'paso completado' : 'pasos completados'}. Así vuelve el impulso.`,
      seeRoute: 'Ver la ruta',
      lifeHappened: 'La vida pasó',
    },
    effort: { title: 'Tu esfuerzo te acerca', body: 'Sigue avanzando: el futuro que quieres también se construye en lo digital.', bodyWithDest: (d: string) => `Sigue avanzando. Cada sesión te acerca a: ${d}` },
    harbor: {
      label: 'Puerto seguro',
      title: 'Estás en una pausa planeada.',
      body: 'Tu progreso está exactamente donde lo dejaste. Nada caduca dentro de FARO y no hay racha que perder. Vuelve cuando estés listo y la ruta te estará esperando.',
      cta: 'Estoy listo para continuar',
    },
  },

  /* ---------------------------------------------------------- journey */
  journey: {
    loading: 'Cargando tu ruta…',
    recalc: { title: 'Recalculando tu ruta…', body: 'Nada se perdió: la ruta de abajo se reordena alrededor de donde realmente estás.' },
    eyebrow: 'Tu ruta',
    headingToward: 'Rumbo a:',
    wayBack: { eyebrow: 'Tu camino de vuelta', body: 'No necesitas ponerte al corriente con todo. Tres sesiones cortas.' },
    theRoute: 'El recorrido',
    when: { today: 'Hoy', tomorrow: 'Mañana', next_session: 'Siguiente sesión' },
    stop: { done: 'Completado', locked: 'Se abre después', here: 'Estás aquí', checkpoint: 'punto de control', min: 'min' },
    due: {
      today: 'vence hoy',
      in: (d: number) => `vence en ${d} ${d === 1 ? 'día' : 'días'}`,
      ago: (d: number) => `venció hace ${d} ${d === 1 ? 'día' : 'días'}`,
    },
    nbaReason: {
      missed: 'Este paso reabre la ruta. Todo lo que sigue se vuelve más fácil.',
      fits: 'Cabe en el tiempo que tienes hoy y mantiene tu ruta en movimiento.',
      shortest: 'Es el paso más corto disponible: empiézalo y pausa cuando lo necesites.',
    },
    reconnect: 'Reconectar:',
    map: {
      eyebrow: 'Tu travesía',
      start: 'Inicio',
      destination: 'Destino',
      here: 'Estás aquí',
      harbor: 'Puerto seguro',
      recalculating: 'Recalculando tu ruta…',
      recalculated: 'Ruta recalculada',
      module: (n: number, name: string) => `M${n} · ${name}`,
      legend: 'La ruta puede cambiar. El destino no.',
    },
  },

  /* ----------------------------------------------------------- mentor */
  mentor: {
    preparing: 'Preparando tu contexto…',
    styles: { direct: 'Directo', encouraging: 'Alentador', detailed: 'Detallado', friendly: 'Cercano', challenge: 'Rétame' },
    thinking: 'FARO está pensando…',
    placeholder: 'Pregúntale a FARO sobre este curso…',
    send: 'Enviar',
    note: 'FARO guía tu aprendizaje. No hará trabajo calificado por ti, y solo ve tu progreso en el curso y la meta que definiste — nunca tus datos personales.',
    openAway: (p: number, c: string) => `Bienvenido de vuelta. Tu progreso sigue aquí: ${p}% de ${c}, exactamente donde lo dejaste. Hoy no vamos a ponernos al corriente con todo. ¿Quieres una forma de volver en diez minutos?`,
    openFlow: (h: string, p: number, c: string) => `${h} Vas en ${p}% de ${c}. ¿Qué necesitas?`,
    openAwaySuggest: ['Dame una misión de 10 minutos', 'Voy atrasado', 'Planea mi semana'],
    openFlowSuggest: ['¿Qué hago ahora?', 'Explícame algo', 'Planea mi semana'],
    error: 'No pude conectar con mi lado de las cosas. Tu progreso está a salvo — inténtalo en un momento.',
    refusal: 'No voy a escribir trabajo calificado por ti: eso es tuyo, y es la parte que realmente te enseña. Lo que sí puedo hacer es dividirlo en pasos, revisar tu razonamiento o explicar la parte donde te atoraste. ¿Por dónde empezamos?',
    refusalSuggest: ['Divídelo en pasos', 'Explícame el concepto', 'Revisa mi razonamiento'],
    modes: { focus: 'Enfoque', recovery: 'Volver', teach: 'Enséñame', planning: 'Planear mi fin de semana' },
    modeAsk: {
      focus: 'Solo tengo unos minutos',
      recovery: 'Voy atrasado',
      teach: 'No entiendo algo',
      planning: 'Tengo algo de tiempo este fin de semana',
    },
    styleLabel: 'Voz',
    source: {
      gemini: 'Responde Gemini, a través del servidor de FARO. Ve tu progreso en el curso y tu meta — nunca quién eres.',
      local: 'Mentor local: sin modelo de IA, nada sale de tu dispositivo.',
      fallback: 'Gemini no pudo responder en este momento, así que respondió el mentor local.',
    },
    noticed: (days: number) =>
      `Noté que algo cambió. Tu último paso fue hace ${days} ${days === 1 ? 'día' : 'días'} — está bien, tu progreso está guardado. ¿Lo vemos juntos? ¿Qué pasó?`,
    openDest: (dest: string, p: number) =>
      dest ? `Tu destino: “${dest}”. Llevas ${p}% del camino. ¿Qué necesitas hoy?` : `Llevas ${p}% del camino. ¿Qué necesitas hoy?`,
    life: {
      less_time: (task: string, min: number) => `Entonces lo hacemos pequeño. ${min} minutos, una sola cosa: ${task}.`,
      overwhelmed: (task: string, min: number) => `Hagámoslo una sola cosa. Solo esto: ${task}, unos ${min} minutos. Todo lo demás puede esperar.`,
      need_break: 'Tómate tu tiempo. Tu progreso está guardado y nada caduca mientras descansas. Aquí voy a estar cuando quieras volver.',
      ready: (task: string, min: number) => `Bien. Siguiente paso: ${task}, unos ${min} minutos.`,
      nothing: 'Nada te está esperando ahora. Descansar también cuenta.',
    },
    choice: {
      start: (title: string) => `Empezar: ${title}`,
      notToday: 'Hoy no',
      ready: 'Estoy listo para seguir',
      reviewCards: 'Hacer las 3 preguntas',
      skipToStep: 'Ir directo al paso',
      anotherTopic: 'Otro tema',
      keepPlan: 'Guardar este plan',
      changePlan: 'Cambiarlo',
      showPath: 'Muéstrame una forma realista',
      openImpact: 'Ver mi impacto',
      notNow: 'Ahora no',
      minutes: (m: number) => `${m} min`,
      open: '30+ min',
      none: 'Ese día no',
    },
    started: (title: string) => `Registrado: “${title}”. Tómate tu tiempo.`,
    focus: {
      ask: '¿Cuánto tiempo tienes?',
      reply: (mins: number, lines: string) => `${mins} minutos. Una cosa a la vez:\n${lines}`,
      empty: 'Nada de tu ruta cabe en eso ahora mismo — y nada te está esperando.',
      review: (m: number) => `3 preguntas de repaso — ${m} min`,
      step: (title: string, m: number) => `${title} — ${m} min`,
      partial: (title: string, m: number) => `${title} — los primeros ${m} min`,
    },
    wayBack: {
      withCards: (module: string, task: string, min: number) =>
        `Hoy nada de pendientes acumulados. Tres preguntas rápidas de ${module} para reconectar (unos 3 minutos), y luego un paso de ${min} minutos: ${task}.`,
      noCards: (task: string, min: number) => `Hoy nada de pendientes acumulados. Un paso pequeño para reconectar: ${task}, unos ${min} minutos. Tu progreso está guardado.`,
    },
    teach: {
      ask: '¿Qué tema? Te lo explico breve y luego te hago una pregunta para asegurarnos de que quedó.',
      askOpen: '¿Qué tema? Escríbelo con tus palabras o elige uno. Te lo explico breve y luego te hago una pregunta.',
      intro: (topic: string, explain: string, prompt: string) => `${topic}, en corto: ${explain}\n\nAhora tú: ${prompt}`,
      rightNext: (prompt: string) => `Exacto. Una más, un poco distinta: ${prompt}`,
      rightDone: (next: string | null) => `Exacto — quedó.${next ? ` ¿Lo aplicamos? Tu siguiente paso es ${next}.` : ''}`,
      wrong: (explain: string) => `No exactamente. Vuelve a la idea clave: ${explain} ¿Lo intentas otra vez?`,
      none: 'Todavía no tengo lecciones cortas para este curso. Dime el término o el paso exacto que no te queda y te lo explico.',
      topicMessage: (topic: string) => `Enséñame: ${topic}`,
    },
    planner: {
      askSat: '¿Cuánto tiempo tienes el sábado?',
      askSun: '¿Y el domingo?',
      sat: 'Sábado',
      sun: 'Domingo',
      day: (label: string, mins: number, items: string) => `${label} · ${mins} min → ${items}`,
      rest: 'descanso',
      proposal: (lines: string) => `Este plan cabe, y te deja aire:\n${lines}\n¿Lo guardamos?`,
      saved: 'Guardado. Lo verás en Inicio.',
      nothing: 'Tu ruta está libre, así que no hay nada que planear. Disfruta el fin de semana.',
    },
    rewards: {
      gap: (pts: string, tier: string) =>
        `Te faltan ${pts} puntos para tu siguiente meta de TecmiRewards (${tier}). Si quieres, te muestro una forma realista de llegar.`,
      reached: (tier: string) => `Ya desbloqueaste ${tier} en TecmiRewards este semestre. Tú decides cuándo canjearlo.`,
      redeemed: 'Ya canjeaste la recompensa de este semestre. Tus puntos siguen mostrando el esfuerzo que pusiste.',
      path: (steps: number, mins: number, modules: number) =>
        `Terminar ${steps === 1 ? 'el siguiente paso' : `los siguientes ${steps} pasos`}${modules ? ` (con eso cierras ${modules} ${modules === 1 ? 'módulo' : 'módulos'})` : ''} te lleva ahí — unos ${mins} minutos en total, en los días que tú elijas. Sin prisa.`,
      short: 'Terminar este curso te lleva casi todo el camino; los puntos de ritmo y de regreso pueden cubrir el resto.',
    },
    voice: {
      openers: {
        direct: () => '',
        encouraging: () => '',
        detailed: () => '',
        friendly: () => 'Hola. ',
        challenge: () => 'Bien, vamos a apretar un poco. ',
      } as Record<MentorStyle, Opener>,
      closers: {
        direct: '',
        encouraging: '',
        detailed: '',
        friendly: '',
        challenge: ' ¿Lo terminas antes de cerrar esta pestaña?',
      },
    },
    replies: {
      next: (next: string | null, mins: number) =>
        next
          ? `Haz una sola cosa: ${next}. Unos ${mins} minutos. Nada más de la lista importa hasta que eso esté listo.`
          : 'Estás libre por ahora: nada te espera. Descansar también cuenta.',
      nextSuggest: ['Solo tengo 10 minutos', 'Ayúdame a concentrarme', '¿Por qué este paso?'],
      behind: (progress: number, next: string | null, mins: number) =>
        `No estás empezando de cero: vas en ${progress}% y eso no caduca. Tu destino no cambió; solo buscamos un paso más pequeño. Hoy: ${next ?? 'un repaso corto'}, unos ${mins} minutos. Después recalculamos el resto de la ruta.`,
      behindSuggest: ['Muéstrame la ruta de recuperación', 'Empezar la misión de regreso', 'Tengo menos tiempo que antes'],
      noTime: (next: string | null) =>
        `Diez minutos bastan para seguir dentro del curso. Abre ${next ?? 'el módulo actual'}, lee o haz solo la primera parte, y para. Hoy la meta no es terminar: es no romper el hilo.`,
      noTimeSuggest: ['Empezar una sesión de 10 minutos', '¿Qué puedo saltarme?', 'Planea mi semana'],
      explain: (course: string) =>
        `Dime la pieza exacta que no te está quedando clara — un término, un paso o una pregunta que fallaste — y te la explico con un ejemplo de ${course}. No te daré la respuesta de un trabajo calificado, pero me aseguraré de que puedas llegar tú.`,
      explainSuggest: ['Dame un ejemplo', 'Explícalo simple', 'Hazme preguntas'],
      unmotivated: (dest: string, next: string | null) =>
        `Lo entiendo. No necesitas avanzar una hora hoy.${dest ? ` Cuando definiste tu destino escribiste: “${dest}”.` : ''} Hagamos solo diez minutos: ${next ?? 'un repaso corto'}. Las ganas suelen llegar después de empezar, no antes.`,
      unmotivatedSuggest: ['Dame una misión de 10 minutos', 'Necesito una pausa', 'Recuérdame por qué empecé'],
      plan: (available: number, next: string | null) =>
        `Con unos ${available} minutos en un día normal: dos sesiones cortas esta semana valen más que una larga que nunca agendas. Sesión uno: ${next ?? 'el paso actual'}. Sesión dos: repasa lo que hiciste durante diez minutos. Ese es todo el plan — lo bastante pequeño para que la vida no lo rompa.`,
      planSuggest: ['Ver mi ruta', 'Hazlo más pequeño', '¿Y si me pierdo un día?'],
      other: (course: string) =>
        `Estoy aquí para ${course}. Puedo señalarte el siguiente paso, explicar algo que no te cuadra, ayudarte a planear una semana corta o construir un camino de vuelta si estuviste fuera.`,
      otherSuggest: ['¿Qué hago ahora?', 'Voy atrasado', 'Explícame algo'],
    },
  },

  /* --------------------------------------------------------- progress */
  progress: {
    loading: 'Cargando…',
    course: 'Progreso del curso',
    ofRoute: 'de la ruta',
    modulesDone: 'módulos listos',
    momentum: 'impulso',
    modules: 'Módulos',
    resilience: { eyebrow: 'Resiliencia', of: (a: number, b: number) => `${a} de ${b}`, body: 'No son por terminar a tiempo. Son por continuar cuando habría sido más fácil parar.' },
    community: {
      eyebrow: 'Reconocimientos de comunidad',
      of: (a: number, b: number) => `${a} de ${b}`,
      body: 'Por ayudar a compañeros, no por ser popular. Se ganan igual que las de resiliencia: con lo que realmente hiciste.',
      viewProfile: 'Ver tu perfil',
    },
    demo: {
      eyebrow: 'Demostración',
      body: 'Para presentar FARO o probarlo desde cero. Nada de esto toca Canvas.',
      scenario: 'Probar el escenario de regreso',
      scenarioHint: '5 días sin entrar · quedan 12 días · 4.5 h y 4 módulos por terminar el bloque. Se abre Recuperación.',
      scenarioOn: 'Escenario de demostración cargado: el curso viene de datos de ejemplo, no de tu Canvas.',
      reset: 'Reiniciar todo',
      resetHint: 'Borra tu destino, tus sesiones, puntos y preferencias, y vuelve a empezar desde la bienvenida.',
      confirm: '¿Seguro? Esto no se puede deshacer.',
      confirmYes: 'Sí, reiniciar',
      cancel: 'Cancelar',
    },
    week: {
      eyebrow: 'Tu ritmo',
      count: (n: number) => `${n} ${n === 1 ? 'día activo' : 'días activos'} esta semana`,
      body: 'Consistencia flexible, no perfección. Un día libre no rompe nada.',
      days: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
      dayNames: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      active: 'estudiaste',
      rest: 'sin estudio',
      upcoming: 'por venir',
    },
    sessions: { eyebrow: 'Sesiones de estudio en FARO', none: 'Nada registrado aún. FARO cuenta las sesiones que haces desde aquí, así que esto se llena conforme avanzas — empezando con un paso.', count: 'sesiones', time: 'tiempo invertido' },
    destination: { label: 'Tu destino', body: 'Cada sesión de arriba es un paso hacia esto, incluidas las que vinieron después de una pausa. Toca para cambiar tu rumbo.' },
    fullRoute: 'Ver la ruta completa',
  },

  /* --------------------------------------------------------- recovery */
  recovery: {
    loading: 'Cargando…',
    eyebrow: 'La vida pasó',
    body: 'Nada de lo que hiciste se perdió, y no hay nada que recuperar antes de volver a empezar. Cuéntale a FARO qué se interpuso y el plan cambia para ajustarse.',
    sizedTo: (m: number) => `Sesiones ajustadas a ${m} minutos a partir de ahora.`,
    mission: {
      flag: 'Misión de regreso disponible',
      body: (m: number) => `No necesitas ponerte al corriente hoy. Dedica unos ${m} minutos a reconectar con tu curso. Esa es toda la misión.`,
      start: 'Empezar la misión',
      doneFlag: 'Misión completada',
      doneTitle: 'Rompiste la inercia.',
      doneBody: (title: string, momentum: number) => `“${title}” está listo, tu impulso volvió a ${momentum}% y la ruta se recalculó alrededor de donde realmente estás.`,
      seeNext: 'Ver qué sigue',
    },
    wayBack: { eyebrow: 'Tu camino de vuelta', body: (m: number) => `Tres sesiones cortas, ajustadas a los ${m} minutos que tienes. No un pendiente.` },
    note: 'FARO cambia lo que te pide, nunca lo que tu curso requiere. Fechas, calificaciones y prórrogas siguen siendo de tu institución.',

    /* El flujo de recuperación: detectar → tranquilizar → evaluar → recalcular
       → personalizar → actuar. Nunca mostrar todo lo pendiente antes de
       mostrar cómo se puede terminar. */
    plan: {
      analyzing: 'Revisando tu progreso…',
      recalculating: 'Recalculando tu ruta…',
      recalcCard: {
        title: 'Recalculando tu ruta…',
        done: 'Tu ruta nueva está lista',
        meta: (d: number, m: number, min: number) => `${d} ${d === 1 ? 'día' : 'días'} · ${m} ${m === 1 ? 'módulo' : 'módulos'} · ${min} min al día`,
        keep: 'El destino no cambió. Solo cambió el camino.',
      },
      resilience: {
        eyebrow: 'Resiliencia',
        of: (a: number, b: number) => `${a} de ${b}`,
        body: 'Se ganan volviendo y siguiendo, no siendo perfecto.',
      },
      welcome: {
        title: 'Bienvenido de vuelta',
        sub: 'Tu progreso sigue aquí. FARO recalculó tu ruta.',
        away: (d: number) => `Estuviste fuera ${d} ${d === 1 ? 'día' : 'días'}.`,
      },
      situation: {
        eyebrow: 'Tu situación actual',
        days: (d: number) => `${d} ${d === 1 ? 'día' : 'días'}`,
        daysLabel: 'para el cierre',
        workLabel: 'de trabajo restante',
        modules: (n: number) => `${n} ${n === 1 ? 'módulo' : 'módulos'}`,
        modulesLabel: 'por terminar',
      },
      feasibility: {
        eyebrow: 'Viabilidad',
        comfortable: {
          title: 'Sí puedes terminar',
          body: (min: number) => `Tu curso todavía cabe dentro del periodo de evaluación con unos ${min} min al día.`,
        },
        tight: {
          title: 'Puedes terminar subiendo un poco el ritmo',
          body: (min: number, cap: number) => `Terminar todo pide unos ${min} min al día, por encima de los ${cap} min que sueles sostener. Es alcanzable, pero apretado.`,
        },
        not_realistic: {
          title: 'Tu ruta original ya no es realista',
          body: (min: number) => `Completar todo lo que queda pediría unos ${min} min al día hasta el cierre. FARO no te va a decir que eso va a pasar solo.`,
        },
        unknown: {
          title: 'FARO necesita más información',
          body: 'Todavía no hay fecha de cierre ni historial suficiente para construir una ruta de recuperación confiable. No vamos a inventar los números.',
        },
        required: (m: number) => `${m} min/día necesarios`,
        yours: (m: number) => `${m} min/día que sostienes`,
        alternatives: {
          title: 'Lo que sí se puede hacer',
          mandatory: 'Priorizar solo las actividades obligatorias',
          impact: 'Concentrarte en lo que más pesa para cerrar el curso',
          mentor: 'Hablar con FARO Mentor sobre tus opciones',
          realistic: 'Construir un plan más corto y realista',
        },
      },
      whatHappened: {
        eyebrow: '¿Qué pasó?',
        body: 'Opcional. Sirve para ajustar el plan, no para juzgarte.',
      },
      time: {
        eyebrow: '¿Cuánto tiempo tienes?',
        body: 'FARO planea alrededor de esto. Sé honesto antes que ambicioso.',
        perDay: (m: number) => `${m} min/día`,
        hour: '1 hora/día',
        varies: 'Cambia cada día',
        flexible: {
          title: 'Ruta flexible',
          min: (m: number) => `Meta mínima: ${m} min`,
          rec: (m: number) => `Recomendado: ${m} min`,
          extra: 'Tiempo extra: opcional',
        },
      },
      strategies: {
        eyebrow: 'Opciones de ruta',
        comfortable: 'Cómoda',
        balanced: 'Equilibrada',
        intensive: 'Intensiva',
        body: (days: number, buffer: number) =>
          buffer > 0
            ? `Terminas en ${days} ${days === 1 ? 'día' : 'días'}, con ${buffer} de margen antes del cierre.`
            : `Terminas justo en el cierre, en ${days} ${days === 1 ? 'día' : 'días'}.`,
        notFeasible: (days: number) => `Necesitaría ${days} días: no alcanza antes del cierre.`,
        suggested: 'Sugerida para ti',
        suggestedWhy: (m: number) => `Es la más cercana a los ${m} min/día que ya sostienes.`,
      },
      route: {
        eyebrow: 'Tu nueva ruta',
        today: 'Hoy',
        tomorrow: 'Mañana',
        day: (n: number) => `Día ${n}`,
        checkpoint: (name: string) => `Punto de control · ${name}`,
        showAll: (n: number) => `Ver los ${n} días completos`,
        showLess: 'Ver menos',
        overflow: (n: number) =>
          `${n} ${n === 1 ? 'actividad queda' : 'actividades quedan'} fuera del periodo a este ritmo. FARO no las esconde: sube el tiempo diario o revísalas con el Mentor.`,
        updated: {
          title: 'Tu ruta se actualizó',
          body: (m: number) => `Tu plan ahora usa sesiones de ${m} minutos.`,
        },
      },
      why: {
        title: '¿Por qué FARO cambió tu ruta?',
        days: (d: number) => `${d} días restantes hasta el cierre`,
        rhythm: (m: number) => `Tu ritmo previo: ~${m} min/día`,
        pending: (n: number) => `${n} actividades todavía pendientes`,
        duration: 'Duración estimada de cada actividad',
        deadlines: 'Fechas límite del curso',
        note: 'Cálculo determinista, verificable con los datos de arriba. FARO no adivina estos números.',
      },
      oneThing: {
        eyebrow: 'Lo único de hoy',
        meta: (m: number) => `${m} minutos`,
        why: 'Es el paso más útil para tu nueva ruta.',
        longer: (m: number) => `Es más largo que tus sesiones de ${m} min. Empiézalo y pausa cuando lo necesites — avanzar cuenta, terminarlo hoy no es obligatorio.`,
        start: 'Empezar',
        none: 'No queda nada por programar. Llegaste al final de la ruta.',
      },
      done: {
        flag: 'Paso completado',
        title: 'Listo. Vuelves a estar en ruta.',
        body: (title: string, momentum: number) =>
          `“${title}” está hecho y tu impulso volvió a ${momentum}%. Inicio, Ruta y Progreso ya reflejan el plan nuevo.`,
        journey: 'Continuar en la Ruta',
        home: 'Volver al inicio',
      },
      recalcBtn: 'Recalcular ruta',
    },
    states: {
      less_time: 'Tengo menos tiempo',
      overwhelmed: 'Estoy abrumado',
      dont_understand: 'No entiendo el material',
      lost_routine: 'Perdí mi rutina',
      need_break: 'Necesito una pausa',
      ready: 'Estoy listo para continuar',
    },
    interventions: {
      less_time: { headline: 'Entonces hacemos las sesiones más cortas.', body: 'Diez minutos siguen moviendo la ruta. FARO ajustará cada siguiente paso al tiempo que realmente tienes, no al que un temario supuso.', cta: 'Usar sesiones de 10 minutos' },
      overwhelmed: { headline: 'Una cosa. No la lista.', body: 'Cuando todo parece vencer al mismo tiempo, el problema suele ser decidir, no hacer. FARO esconderá la pila y te mostrará un solo paso hasta que esto pase.', cta: 'Muéstrame un solo paso' },
      dont_understand: { headline: 'Desarmemos el concepto.', body: 'No entender algo es información, no fracaso. FARO puede explicarlo de otra forma, darte una pista o dividirlo en piezas más pequeñas.', cta: 'Pedirle a FARO que lo explique' },
      lost_routine: { headline: 'Las rutinas se reconstruyen, no se recuerdan.', body: 'No necesitas ponerte al corriente hoy. Una sesión corta rompe la inercia, y el ritmo viene después.', cta: 'Empezar una misión de regreso' },
      need_break: { headline: 'Entonces tómala, en serio.', body: 'Una pausa planeada no es lo mismo que desaparecer. Tu progreso se queda exactamente donde está, y FARO estará aquí con una ruta cuando vuelvas.', cta: 'Pausar en puerto seguro' },
      ready: { headline: 'Bien. Retomemos la ruta.', body: 'Tu progreso sigue aquí. FARO te señalará el único paso que reabre la ruta.', cta: 'Continuar la ruta' },
    },
  },

  /* -------------------------------------------------------- community */
  community: {
    presence: {
      studyingNow: (n: number) => `${n} estudiantes estudiando ahora`,
      students: (n: number) => `${n} estudiantes`,
      inRooms: (n: number) => `${n} en salas de estudio`,
      completedThisWeek: (n: number) => `${n} terminaron este módulo esta semana`,
      activities: (n: number) => `${n} actividades completadas esta semana`,
      rhythm: (n: number) => `Ritmo del curso: ${n} días seguidos`,
      note: 'Solo conteos. FARO nunca muestra quién está estudiando, por cuánto tiempo ni desde dónde — y eso también te protege a ti.',
    },
    course: { eyebrow: 'Tu curso esta semana' },
    sos: {
      button: 'Estoy atorado',
      title: '¿Qué tipo de atorado?',
      body: 'FARO no responde igual a todos los problemas. Dime cuál es el tuyo y te llevo al lugar correcto.',
      topic: { title: 'No entiendo el tema', body: 'FARO Mentor te lo explica, y puedes ver cómo lo entendieron otros.' },
      time: { title: 'No sé cómo organizar mi tiempo', body: 'FARO recalcula tu ruta alrededor del tiempo que sí tienes.' },
      people: { title: 'Quiero hablar con alguien', body: 'Tu comunidad del curso y las salas de estudio.' },
      cancel: 'Ahora no',
    },
    ask: {
      eyebrow: 'Pregúntale a la comunidad',
      context: (course: string, mod: string | null) => `Se compartirá en ${course}${mod ? ` · ${mod}` : ''}`,
      titlePlaceholder: 'Un título corto (opcional)',
      placeholder: 'Escribe tu pregunta…',
      post: 'Publicar',
      shared: (course: string) => `Se compartió con la comunidad de ${course}.`,
      kinds: { question: 'Pregunta', help: 'Estoy atorado', learning: 'Algo que aprendí', tip: 'Consejo' },
    },
    rooms: {
      eyebrow: 'Salas de estudio',
      body: 'Estudia acompañado sin tener que hablar con nadie.',
      quiet: 'Sala silenciosa',
      pomodoro: (f: number, b: number) => `${f} min enfoque · ${b} min descanso`,
      quietNote: 'No hace falta conversar.',
      participants: (n: number) => `${n} estudiando`,
      join: 'Entrar a la sala',
      create: 'Crear una sala',
      createTitle: '¿Cuánto tiempo quieres estudiar?',
      myRoom: 'Mi sala silenciosa',
      leave: 'Salir de la sala',
      inRoom: (n: number) => `Estás estudiando junto a ${n} personas`,
      remaining: 'restante',
      note: 'Nadie ve si fuiste productivo. Solo que estuviste acompañado.',
      prototypeClock: 'Prototipo: el temporizador corre acelerado para poder mostrar la sesión completa.',
      done: {
        title: 'Sesión completa',
        body: (n: number) => `Estudiaste junto a ${n} personas.`,
        points: (n: number) => `+${n} puntos FARO`,
        back: 'Volver a la comunidad',
      },
    },
    mission: {
      eyebrow: 'Misión de la comunidad',
      title: (n: number) => `Completar ${n} actividades entre todos esta semana`,
      progress: (a: number, b: number) => `${a} / ${b}`,
      contributors: (n: number) => `${n} estudiantes han aportado. Nadie compite: todo suma al mismo total.`,
      endsIn: (d: number) => `Termina en ${d} días`,
      yours: (n: number) => `Tú aportaste ${n}`,
      complete: { title: 'Meta de la comunidad completada', body: 'Todos los que participaron reciben un reconocimiento. Nadie quedó fuera por llegar tarde.' },
    },
    feed: {
      eyebrow: 'Qué está pasando',
      filters: { all: 'Todo', help: 'Piden ayuda', questions: 'Preguntas', learning: 'Aprendizajes' },
      kinds: {
        achievement: 'Logro',
        activity: 'Avance',
        question: 'Pregunta',
        tip: 'Consejo',
        learning: 'Aprendizaje',
        resource: 'Recurso',
        help: 'Pide ayuda',
        recognition: 'Regreso',
        milestone: 'Hito',
      },
      reactions: { like: 'Me gusta', applause: 'Lo lograste', useful: 'Me sirvió', motivating: 'Me motiva', support: 'Te apoyo' },
      peerAnswer: 'Respuesta de compañero',
      instructorAnswer: 'Respuesta del docente',
      mentorAnswer: 'Explicación de FARO',
      peerNote: 'Las respuestas de compañeros no son material oficial del curso. Muchas reacciones no las vuelven correctas.',
      answers: (n: number) => (n === 1 ? '1 respuesta' : `${n} respuestas`),
      noAnswers: 'Todavía sin respuestas',
      comment: 'Comentar',
      answerPlaceholder: 'Escribe tu respuesta…',
      answerCta: 'Responder',
      yourAnswer: 'Tu respuesta',
      helpful: (n: number) => `${n} lo marcaron útil`,
      markHelpful: 'Me sirvió',
      marked: 'Marcado',
      report: 'Reportar',
      reported: 'Gracias. Un moderador lo revisará.',
      youHelped: (n: number) => `Tu respuesta ayudó a ${n} estudiantes.`,
      ago: { now: 'ahora', min: (n: number) => `hace ${n} min`, hour: (n: number) => `hace ${n} h`, day: (n: number) => `hace ${n} d` },
    },
    recognition: {
      eyebrow: 'Tus aportes a la comunidad',
      of: (a: number, b: number) => `${a} de ${b}`,
      points: (n: number) => `${n} puntos FARO por contribuir`,
    },
    achievements: {
      helpful_peer: { title: 'Compañero útil', description: 'Varias personas marcaron tus respuestas como útiles.', hint: 'Se gana cuando tres personas marcan tu respuesta como útil.' },
      knowledge_sharer: { title: 'Comparte lo que sabe', description: 'Compartiste aprendizajes o recursos que le sirvieron a otros.', hint: 'Se gana al compartir dos aprendizajes, consejos o recursos.' },
      community_builder: { title: 'Construye comunidad', description: 'Respondiste a compañeros que estaban atorados.', hint: 'Se gana al responder a tres personas.' },
      study_companion: { title: 'Compañía de estudio', description: 'Completaste varias sesiones acompañado de otros.', hint: 'Se gana al completar dos sesiones en salas de estudio.' },
      community_comeback: { title: 'Regreso acompañado', description: 'Volviste después de una pausa y no lo hiciste en silencio.', hint: 'Se gana al volver tras una ausencia y participar en la comunidad.' },
    },
    empty: {
      feed: { title: 'Tu comunidad apenas está empezando.', body: 'Comparte algo que hayas entendido hoy. A alguien más le va a servir.', cta: 'Compartir un aprendizaje' },
      questions: { title: 'Todavía no hay preguntas.', body: 'Sé la primera persona en preguntar — normalmente alguien más tenía la misma duda.', cta: 'Preguntar a la comunidad' },
      rooms: { title: 'No hay salas activas ahora.', body: 'Empieza una sesión silenciosa y otros pueden unirse.', cta: 'Crear sala de estudio' },
    },
    homeCard: {
      label: 'Tu comunidad',
      studying: (n: number, course: string) => `${n} estudiantes están estudiando ${course} ahora`,
      cta: 'Entrar a una sala',
    },
    myProfile: {
      eyebrow: 'Tu perfil en la comunidad',
      body: 'Foto, biografía y tus insignias — visible para tus compañeros de curso.',
      cta: 'Ver mi perfil',
    },
    journeySignal: (n: number) => `${n} estudiantes están trabajando en este módulo esta semana.`,
    recoveryCta: {
      title: '¿Quieres reconectar con otros estudiantes?',
      body: 'Volver también es social. No tienes que hacerlo en silencio.',
      cta: 'Ver mi comunidad',
    },
    privacy: 'FARO comparte conteos, nunca personas. Tu progreso, tus calificaciones y tu historial de estudio siguen siendo tuyos.',
  },

  /* ---------------------------------------------------------- purpose */
  purpose: {
    step: (n: number) => `PASO ${n} DE 3`,
    goals: {
      career_growth: 'Crecer profesionalmente',
      better_income: 'Mejores ingresos',
      career_change: 'Cambiar de carrera',
      promotion: 'Un ascenso',
      finish_degree: 'Terminar mi carrera',
      personal_achievement: 'Logro personal',
      personal_development: 'Desarrollo personal',
      other: 'Otra cosa',
    },
    destination: { label: 'Tu destino', timeEyebrow: 'El tiempo que realmente tienes', timeBody: 'FARO planea alrededor de esto, no de una semana ideal.', change: 'Cambiar mi destino' },
    q1: { title: '¿Por qué estás estudiando?', body: 'Habrá una semana en la que no tengas ganas de abrir este curso. Esto es lo que FARO te recordará.' },
    q2: { title: '¿Qué te permitiría hacer terminarlo?', body: 'En tus palabras. Una línea basta.', placeholder: 'Liderar mis propios proyectos en vez de solo ejecutarlos.' },
    q3: { title: '¿Cuánto tiempo tienes de verdad en un día normal?', body: 'Sé honesto antes que ambicioso. Cada plan que FARO haga cabe aquí.' },
    continue: 'Continuar',
    back: 'Atrás',
    set: 'Fijar mi destino',
    min: 'min',
  },

  /* ---------------------------------------------------------- friction */
  friction: {
    FLOWING: 'Llevas un buen ritmo.',
    FRICTION: 'Tu ruta necesita un poco de atención.',
    POSSIBLE_OVERWHELM: 'Se acumuló bastante. Vamos un paso a la vez.',
    DISCONNECTION: 'Tu progreso sigue aquí, exactamente donde lo dejaste.',
    RECOVERY: 'Bienvenido de vuelta. Retomemos la ruta.',
  },

  /* --------------------------------------------------------- rewards */
  rewards: {
    eyebrow: 'Recompensas',
    title: 'Puntos FARO',
    body: 'Ganas puntos por lo que realmente haces: terminar actividades y módulos, sostener tu ritmo, volver después de una pausa, reconectar con tarjetas de repaso. Los puntos del semestre te acercan a una recompensa real.',
    balance: 'Tu esfuerzo',
    points: 'Puntos FARO este semestre',
    impact: {
      lead: 'Este semestre:',
      activities: (n: number) => `Completaste ${n} actividades`,
      modules: (n: number) => `Terminaste ${n} módulos`,
      comeback: 'Volviste después de una pausa',
      reviews: (n: number) => `Reconectaste con ${n} ${n === 1 ? 'juego' : 'juegos'} de tarjetas`,
      week: (n: number) => `Estudiaste ${n} ${n === 1 ? 'día' : 'días'} esta semana`,
    },
    thisWeek: (n: number) => `+${n.toLocaleString('es-MX')} esta semana`,
    simulated: 'Simulado',
    next: {
      eyebrow: 'Tu recompensa',
      reward: (mxn: number) => `$${mxn} MXN`,
      program: 'TecmiRewards',
      of: (a: number, b: number) => `${a.toLocaleString('es-MX')} / ${b.toLocaleString('es-MX')}`,
      percent: (p: number) => `${p}% desbloqueado`,
      toNext: (n: number) => `Te faltan ${n.toLocaleString('es-MX')} puntos`,
      finishCourse: (n: number, course: string) =>
        `Terminar ${course} vale al menos ${n.toLocaleString('es-MX')} puntos más.`,
      keep: 'Seguir avanzando',
      reachedEyebrow: 'Meta del semestre',
      reachedTitle: '¡Recompensa desbloqueada!',
      reachedBody: (mxn: number) => `Llegaste a la meta del semestre. Tu recompensa de $${mxn} MXN está lista para canjear.`,
    },
    catalog: {
      eyebrow: 'Recompensas del semestre',
      body: 'Una por semestre, hasta $200 MXN. Los niveles no se gastan: se desbloquean al acumular puntos, y tú decides cuándo canjear.',
      points: (n: number) => `${n.toLocaleString('es-MX')} pts`,
      redeem: 'Canjear',
      locked: (n: number) => `Faltan ${n.toLocaleString('es-MX')}`,
      unlocked: 'Desbloqueada',
      redeemed: 'Canjeada',
      closed: 'Cerrada este semestre',
      confirm: {
        title: (mxn: number) => `¿Canjear $${mxn} MXN ahora?`,
        body: (cap: number) =>
          `Canjear cierra tu recompensa de este semestre en este nivel. Si sigues acumulando, puedes llegar a $${cap} MXN.`,
        yes: 'Sí, canjear',
        no: 'Seguir acumulando',
      },
    },
    redeemedCard: {
      title: (mxn: number) => `$${mxn} MXN canjeados`,
      body: 'Simulado: en un piloto real, la institución entregaría la recompensa. Tus puntos siguen contando para tu progreso.',
    },
    breakdown: {
      title: 'De dónde vienen',
      thisCourse: (course: string) => `Este curso · ${course}`,
      previous: 'Cursos anteriores del semestre',
      activities: (n: number) => `Actividades completadas (${n})`,
      modules: (n: number) => `Módulos terminados (${n})`,
      rhythm: 'Bonos por ritmo sostenido',
      comeback: 'Bono por volver',
      reviews: (n: number) => `Tarjetas de reconexión (${n})`,
      community: 'Aportes a la comunidad',
    },
    disclaimer:
      'Integración de prototipo con TecmiRewards: FARO cuenta los puntos; la equivalencia, la elegibilidad, los límites y el canje dependen de las reglas y sistemas de Tecmilenio, y FARO no emite nada. Los montos, los cursos anteriores del semestre y el canje son simulados.',
  },

  /* ------------------------------------------------------ review cards */
  review: {
    offer: {
      eyebrow: 'Misión de regreso',
      title: 'Reconecta en 3 minutos',
      body: (module: string) =>
        `Tres tarjetas rápidas sobre lo que ya sabes de ${module}. No es un examen y no cuenta para tu calificación.`,
      points: (n: number) => `+${n} puntos al terminar`,
      start: 'Empezar',
      skip: 'Ahora no',
    },
    deck: {
      close: 'Cerrar',
      progress: (i: number, n: number) => `Pregunta ${i} de ${n}`,
      module: (name: string) => `Módulo · ${name}`,
      correct: '¡Eso es!',
      wrong: 'Casi. Aquí va la idea:',
      retry: 'Intenta otra vez',
      next: 'Siguiente',
      finish: 'Terminar',
      note: 'No cuenta para tu calificación. Nadie más ve tus respuestas.',
    },
    done: {
      flag: 'Repaso hecho',
      title: 'Volviste',
      body: (firstTry: number, n: number): string =>
        firstTry >= Math.ceil(n / 2)
          ? 'Recordaste más de lo que creías. Tu ruta está lista.'
          : 'Las repasaste todas, y eso es lo que cuenta hoy. Tu ruta está lista.',
      points: (n: number) => `+${n} puntos FARO`,
      cta: 'Continuar',
    },
    banner: (n: number) => `Reconectado hoy · +${n} puntos`,
  },

  /* ------------------------------------------------------ achievements */
  achievements: {
    the_comeback: { title: 'El regreso', description: 'Volviste después de un tramo difícil.', hint: 'Se gana al volver y completar un paso después de tiempo fuera.' },
    back_on_track: { title: 'De vuelta en ruta', description: 'Reconstruiste un ritmo de aprendizaje en vez de empezar de cero.', hint: 'Se gana al completar dos pasos y recuperar tu impulso.' },
    weathered_the_storm: { title: 'Capeaste la tormenta', description: 'Seguiste avanzando en una semana en la que el trabajo se había acumulado.', hint: 'Se gana al completar un paso con más de un pendiente abierto.' },
    smart_session: { title: 'Sesión inteligente', description: 'Terminaste un paso dentro del tiempo que realmente tenías.', hint: 'Se gana al completar un paso que cabía en tu tiempo disponible.' },
    finisher: { title: 'Finalista', description: 'Completaste el curso.', hint: 'Se gana al final de la ruta.' },
  },

  /* ----------------------------------------------------------- profile */
  /**
   * Public within Community: anyone can open it from a name or avatar. It
   * shows badges as a set, never a score, and it does not add a ranking that
   * Community deliberately does not have.
   */
  profile: {
    own: {
      eyebrow: 'Tu perfil',
      edit: 'Editar perfil',
      save: 'Guardar',
      cancel: 'Cancelar',
      nameLabel: 'Nombre',
      namePlaceholder: 'Tu nombre',
      bioLabel: 'Biografía',
      bioPlaceholder: 'Una línea sobre ti — qué estudias, por qué, o lo que quieras compartir.',
      bioCount: (n: number, max: number) => `${n}/${max}`,
      photoChange: 'Cambiar foto',
      photoRemove: 'Quitar foto',
      saved: 'Guardado.',
      visibilityNote: 'Cualquier compañero de tu curso puede ver este perfil al tocar tu nombre en Comunidad.',
    },
    institution: {
      title: 'Cuenta institucional',
      mockTag: 'Simulado',
      body: 'Prototipo: todavía no hay una conexión real con Tecmilenio. En producción esto usaría el inicio de sesión institucional real — FARO nunca te pediría tu contraseña.',
      linked: 'Vinculado (simulado) con tu cuenta Tecmilenio',
      notLinked: 'No vinculado',
      link: 'Vincular con Tecmilenio (simulado)',
      unlink: 'Desvincular',
    },
    badges: {
      resilience: { eyebrow: 'Resiliencia', of: (a: number, b: number) => `${a} de ${b}` },
      community: { eyebrow: 'Comunidad', of: (a: number, b: number) => `${a} de ${b}` },
      empty: 'Todavía no hay insignias. Aparecen solas conforme avanzas — nunca se pierden por una pausa.',
    },
    peer: {
      noBio: 'Todavía no escribió una biografía.',
      note: 'Aquí solo ves lo que esta persona decidió compartir. FARO no muestra rankings ni quién va adelante — esto no es eso.',
    },
    back: 'Volver a Comunidad',
    canvas: {
      title: 'Integración con Canvas',
      course: (id: number) => `Curso ${id} · Gestión de Proyectos`,
      modeMock: 'Simulado',
      modeLive: 'En vivo',
      bodyMock: 'Las rutas, las respuestas y la traducción de datos son las reales de la API de Canvas. Lo único simulado es el servidor: en vez de una institución, responden datos de prueba. Cambiar a un Canvas real es cambiar un valor en la configuración, no reescribir la app.',
      bodyLive: 'FARO está leyendo de tu Canvas institucional. Canvas sigue siendo la fuente de verdad de todo lo académico.',
      endpointsTitle: 'Lo que FARO consulta',
      readOnly: 'Cuatro llamadas, todas de lectura. FARO no tiene forma de modificar tu curso.',
      refusedTitle: 'Permisos que FARO NO pide',
      refusedNote: 'Sin estos permisos LTI, FARO no puede escribir calificaciones ni crear actividades. Tu administrador de Canvas puede verificarlo en la pantalla de la clave de desarrollador.',
      logTitle: (n: number) => `Registro de llamadas (${n})`,
      logEmpty: 'Todavía no hay llamadas en esta sesión.',
      courseLive: (id: number, name: string) => `Curso ${id} · ${name}`,
      courseResolving: 'Identificando tu curso…',
      backend: (host: string) => `Las llamadas pasan por el backend de FARO (${host}), que guarda el token institucional. La extensión no tiene credenciales.`,
      launchUnverified: 'Lanzamiento sin firma LTI: el curso y la persona se dedujeron del token, no de Canvas.',
      activityFallback: 'Tu cuenta no puede leer las analíticas de Canvas, así que la actividad se calcula con las fechas de tus propias entregas.',
      rows: (n: number) => `${n} filas ·`,
    },
  },
}

export type Dict = typeof es
