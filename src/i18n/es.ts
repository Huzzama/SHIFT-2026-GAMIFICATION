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
    tagline: 'Focus. Advance. Reward. Own.',
    promise: 'Difícil de abandonar. Fácil de volver.',
    noGameOver: 'Sin Game Over. Recalcula tu ruta.',
    loading: 'Ubicando tu posición…',
    nav: { home: 'Inicio', journey: 'Ruta', mentor: 'FARO', rewards: 'Recompensas', progress: 'Progreso' },
    back: { recovery: 'Recuperación', purpose: 'Tu propósito' },
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
    voice: {
      openers: {
        direct: () => '',
        encouraging: (low: boolean) => (low ? 'Volviste, y esa es la parte difícil. ' : 'Bien — te estás moviendo. '),
        detailed: () => '',
        friendly: () => 'Hola. ',
        challenge: () => 'Bien, vamos a apretar un poco. ',
      } as Record<MentorStyle, Opener>,
      closers: {
        direct: '',
        encouraging: ' Estás más cerca de lo que se siente.',
        detailed: '',
        friendly: ' Aquí estoy si se complica.',
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
        `No estás empezando de cero: vas en ${progress}% y eso no caduca. Hoy no vamos a ponernos al corriente con todo. Hoy es un paso pequeño: ${next ?? 'un repaso corto'}, unos ${mins} minutos. Después recalculamos el resto de la ruta.`,
      behindSuggest: ['Muéstrame la ruta de recuperación', 'Empezar la misión de regreso', 'Tengo menos tiempo que antes'],
      noTime: (next: string | null) =>
        `Diez minutos bastan para seguir dentro del curso. Abre ${next ?? 'el módulo actual'}, lee o haz solo la primera parte, y para. Hoy la meta no es terminar: es no romper el hilo.`,
      noTimeSuggest: ['Empezar una sesión de 10 minutos', '¿Qué puedo saltarme?', 'Planea mi semana'],
      explain: (course: string) =>
        `Dime la pieza exacta que no te está quedando clara — un término, un paso o una pregunta que fallaste — y te la explico con un ejemplo de ${course}. No te daré la respuesta de un trabajo calificado, pero me aseguraré de que puedas llegar tú.`,
      explainSuggest: ['Dame un ejemplo', 'Explícalo simple', 'Hazme preguntas'],
      unmotivated: (dest: string, next: string | null) =>
        `Eso está permitido, y no es señal de que debas parar.${dest ? ` Dijiste que este curso es tu camino hacia: ${dest}.` : ''} No necesitas sentirte motivado para hacer diez minutos. Elige lo más pequeño — ${next ?? 'un repaso corto'} — y deja que el impulso llegue después de la acción, no antes.`,
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
    body: 'Ganas puntos por lo que realmente haces: completar un paso, terminar un módulo, sostener tu ritmo, y por volver después de una pausa. Nada se cobra por adelantado y nada se pierde si te detienes.',
    balance: 'Balance actual',
    breakdown: {
      title: 'De dónde vienen',
      activities: (n: number) => `Pasos completados (${n})`,
      modules: (n: number) => `Módulos terminados (${n})`,
      rhythm: 'Bonos por ritmo sostenido',
      comeback: 'Bono por volver',
    },
    comingSoon: {
      title: 'El catálogo de recompensas llega después',
      body: 'Por ahora tus puntos se acumulan de verdad, a partir de acciones reales. Canjearlos es la siguiente fase — todavía no hay nada que gastar.',
    },
  },

  /* ------------------------------------------------------ achievements */
  achievements: {
    the_comeback: { title: 'El regreso', description: 'Volviste después de un tramo difícil.', hint: 'Se gana al volver y completar un paso después de tiempo fuera.' },
    back_on_track: { title: 'De vuelta en ruta', description: 'Reconstruiste un ritmo de aprendizaje en vez de empezar de cero.', hint: 'Se gana al completar dos pasos y recuperar tu impulso.' },
    weathered_the_storm: { title: 'Capeaste la tormenta', description: 'Seguiste avanzando en una semana en la que el trabajo se había acumulado.', hint: 'Se gana al completar un paso con más de un pendiente abierto.' },
    smart_session: { title: 'Sesión inteligente', description: 'Terminaste un paso dentro del tiempo que realmente tenías.', hint: 'Se gana al completar un paso que cabía en tu tiempo disponible.' },
    finisher: { title: 'Finalista', description: 'Completaste el curso.', hint: 'Se gana al final de la ruta.' },
  },
}

export type Dict = typeof es
