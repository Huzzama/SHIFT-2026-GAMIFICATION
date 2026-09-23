/**
 * Reconnection questions for the demo course (Gestión de Proyectos).
 *
 * Where these come from in production: a Canvas student token cannot read a
 * quiz's questions, and a reconnection card must never be confused with a
 * graded quiz anyway. So the bank is FARO's own - written by the instructor
 * per module, or generated from the module's published pages by the mentor
 * backend and reviewed by the instructor. The prototype ships a small
 * hand-written bank, keyed by the same module ids as the Canvas fixtures.
 *
 * Every question is about *recognising* an idea the student already met, not
 * about solving a new problem: the point is to break the inertia of
 * returning, not to test them.
 */
import { COURSE_ID } from './canvas/fixtures'
import type { ReviewQuestion } from '@/types'

/**
 * The course this bank belongs to. A live Canvas course has other ids, so
 * the store only offers these cards when the ids match - no questions about
 * project management in someone's statistics course.
 */
export const REVIEW_BANK_COURSE_ID = COURSE_ID

export const reviewBank: ReviewQuestion[] = [
  /* -------------------------------------------- Módulo 1 · Fundamentos */
  {
    id: 'm1-q1',
    moduleId: 1,
    prompt: {
      es: '¿Qué distingue a un proyecto de una operación continua?',
      en: 'What sets a project apart from ongoing operations?',
    },
    options: [
      { es: 'Tiene un inicio y un fin definidos y produce un resultado único', en: 'It has a defined start and end and produces a unique result' },
      { es: 'Siempre tiene un presupuesto mayor', en: 'It always has a larger budget' },
      { es: 'Lo dirige un área distinta de la empresa', en: 'A different department runs it' },
    ],
    correct: 0,
    explain: {
      es: 'Un proyecto es temporal y crea algo único. Una operación se repite sin fecha de cierre.',
      en: 'A project is temporary and creates something unique. Operations repeat with no closing date.',
    },
  },
  {
    id: 'm1-q2',
    moduleId: 1,
    prompt: {
      es: 'Las tres restricciones clásicas de un proyecto son…',
      en: 'The three classic constraints of a project are…',
    },
    options: [
      { es: 'Equipo, oficina y herramientas', en: 'Team, office and tools' },
      { es: 'Alcance, tiempo y costo', en: 'Scope, time and cost' },
      { es: 'Cliente, proveedor y patrocinador', en: 'Client, supplier and sponsor' },
    ],
    correct: 1,
    explain: {
      es: 'Alcance, tiempo y costo: si mueves una, las otras dos se ajustan. Es el llamado triángulo del proyecto.',
      en: 'Scope, time and cost: move one and the other two adjust. It is the so-called project triangle.',
    },
  },

  /* ----------------------------------------------- Módulo 2 · Alcance */
  {
    id: 'm2-q1',
    moduleId: 2,
    prompt: {
      es: '¿Para qué sirve definir el alcance de un proyecto?',
      en: 'What is defining a project\'s scope for?',
    },
    options: [
      { es: 'Para decidir quién trabaja en el equipo', en: 'To decide who is on the team' },
      { es: 'Para calcular los impuestos del proyecto', en: 'To calculate the project\'s taxes' },
      { es: 'Para dejar claro qué incluye el proyecto y qué no', en: 'To make clear what the project includes and what it does not' },
    ],
    correct: 2,
    explain: {
      es: 'El alcance marca la frontera: lo que se entrega y lo que queda fuera. Sin él, el proyecto crece sin control.',
      en: 'Scope draws the boundary: what is delivered and what is left out. Without it, the project grows unchecked.',
    },
  },
  {
    id: 'm2-q2',
    moduleId: 2,
    prompt: {
      es: 'En una EDT (estructura de desglose del trabajo), el trabajo se divide…',
      en: 'In a WBS (work breakdown structure), the work is broken down…',
    },
    options: [
      { es: 'En entregables cada vez más pequeños y manejables', en: 'Into smaller and smaller, manageable deliverables' },
      { es: 'Por orden alfabético de las tareas', en: 'In alphabetical order of the tasks' },
      { es: 'Según el salario de cada persona', en: 'By each person\'s salary' },
    ],
    correct: 0,
    explain: {
      es: 'La EDT parte el proyecto en piezas cada vez más pequeñas hasta que cada una se puede estimar y asignar.',
      en: 'The WBS breaks the project into ever-smaller pieces until each one can be estimated and assigned.',
    },
  },
  {
    id: 'm2-q3',
    moduleId: 2,
    prompt: {
      es: 'Un cliente pide una función nueva a mitad del proyecto sin ajustar tiempo ni costo. Eso se conoce como…',
      en: 'A client asks for a new feature mid-project without adjusting time or cost. That is known as…',
    },
    options: [
      { es: 'Ruta crítica', en: 'Critical path' },
      { es: 'Corrupción del alcance (scope creep)', en: 'Scope creep' },
      { es: 'Cierre anticipado', en: 'Early closure' },
    ],
    correct: 1,
    explain: {
      es: 'El scope creep es el alcance que crece sin ajustar lo demás. Por eso se documenta el alcance al inicio.',
      en: 'Scope creep is scope that grows without adjusting anything else. That is why scope is documented up front.',
    },
  },

  /* -------------------------------------------- Módulo 3 · Cronograma */
  {
    id: 'm3-q2',
    moduleId: 3,
    prompt: {
      es: 'Al estimar la duración de una tarea, ¿qué ayuda más a que la estimación sea realista?',
      en: 'When estimating a task\'s duration, what helps most to keep it realistic?',
    },
    options: [
      { es: 'Basarse en datos de tareas parecidas y en quien la va a hacer', en: 'Basing it on similar past tasks and on who will do it' },
      { es: 'Poner siempre el tiempo más corto posible', en: 'Always using the shortest possible time' },
      { es: 'Dejar la estimación para el final del proyecto', en: 'Leaving the estimate for the end of the project' },
    ],
    correct: 0,
    explain: {
      es: 'Las estimaciones mejoran con historia y con la opinión de quien hará el trabajo. El optimismo no es un método.',
      en: 'Estimates improve with history and with input from whoever does the work. Optimism is not a method.',
    },
  },
  {
    id: 'm3-q3',
    moduleId: 3,
    prompt: {
      es: 'Si la tarea B no puede empezar hasta que termine la tarea A, entre ellas hay…',
      en: 'If task B cannot start until task A finishes, between them there is…',
    },
    options: [
      { es: 'Una holgura', en: 'Slack' },
      { es: 'Una dependencia fin-inicio', en: 'A finish-to-start dependency' },
      { es: 'Un hito de cierre', en: 'A closing milestone' },
    ],
    correct: 1,
    explain: {
      es: 'Fin-inicio es la dependencia más común: B espera a que A termine. Así se arma el cronograma.',
      en: 'Finish-to-start is the most common dependency: B waits for A to finish. That is how a schedule is built.',
    },
  },

  {
    id: 'm3-q1',
    moduleId: 3,
    prompt: {
      es: 'La ruta crítica de un proyecto es…',
      en: 'A project\'s critical path is…',
    },
    options: [
      { es: 'La secuencia de tareas más cara', en: 'The most expensive sequence of tasks' },
      { es: 'La lista de tareas con más riesgo', en: 'The list of riskiest tasks' },
      { es: 'La secuencia más larga de tareas dependientes: define la duración mínima', en: 'The longest chain of dependent tasks: it sets the minimum duration' },
    ],
    correct: 2,
    explain: {
      es: 'Si una tarea de la ruta crítica se retrasa, todo el proyecto se retrasa. Por eso se vigila primero.',
      en: 'If a task on the critical path slips, the whole project slips. That is why it is watched first.',
    },
  },

  /* ------------------------------------------------ Módulo 4 · Riesgos */
  {
    id: 'm4-q1',
    moduleId: 4,
    prompt: {
      es: 'Un riesgo de proyecto es…',
      en: 'A project risk is…',
    },
    options: [
      { es: 'Un problema que ya ocurrió', en: 'A problem that has already happened' },
      { es: 'Un evento incierto que, si ocurre, afecta al proyecto', en: 'An uncertain event that, if it happens, affects the project' },
      { es: 'Cualquier tarea difícil', en: 'Any hard task' },
    ],
    correct: 1,
    explain: {
      es: 'El riesgo es incierto; cuando ocurre se convierte en un problema. Se gestiona antes, no después.',
      en: 'A risk is uncertain; once it happens it becomes an issue. It is managed before, not after.',
    },
  },
  {
    id: 'm4-q2',
    moduleId: 4,
    prompt: {
      es: 'En un registro de riesgos, cada riesgo se evalúa normalmente por…',
      en: 'In a risk register, each risk is usually rated by…',
    },
    options: [
      { es: 'Su probabilidad y su impacto', en: 'Its probability and its impact' },
      { es: 'Quién lo detectó', en: 'Who spotted it' },
      { es: 'El orden en que apareció', en: 'The order it appeared in' },
    ],
    correct: 0,
    explain: {
      es: 'Probabilidad por impacto da la prioridad: primero se atiende lo probable y grave.',
      en: 'Probability times impact gives the priority: the likely and severe comes first.',
    },
  },

  /* --------------------------------------------- Módulo 5 · Interesados */
  {
    id: 'm5-q1',
    moduleId: 5,
    prompt: {
      es: 'Un interesado (stakeholder) es…',
      en: 'A stakeholder is…',
    },
    options: [
      { es: 'Solo quien paga el proyecto', en: 'Only whoever pays for the project' },
      { es: 'Cualquier persona o grupo que afecta o es afectado por el proyecto', en: 'Anyone who affects or is affected by the project' },
      { es: 'El líder del equipo', en: 'The team lead' },
    ],
    correct: 1,
    explain: {
      es: 'Los interesados van más allá del cliente: usuarios, equipo, otras áreas. Olvidar a uno es un riesgo.',
      en: 'Stakeholders go beyond the client: users, team, other areas. Forgetting one is a risk.',
    },
  },

  /* ------------------------------------------------- Módulo 6 · Cierre */
  {
    id: 'm6-q1',
    moduleId: 6,
    prompt: {
      es: '¿Para qué sirven las lecciones aprendidas al cerrar un proyecto?',
      en: 'What are lessons learned for when closing a project?',
    },
    options: [
      { es: 'Para asignar culpas', en: 'To assign blame' },
      { es: 'Para cumplir un requisito sin uso', en: 'To tick a useless box' },
      { es: 'Para que el siguiente proyecto repita lo que funcionó y evite lo que no', en: 'So the next project repeats what worked and avoids what did not' },
    ],
    correct: 2,
    explain: {
      es: 'Las lecciones aprendidas convierten la experiencia de un proyecto en ventaja para el siguiente.',
      en: 'Lessons learned turn one project\'s experience into an advantage for the next.',
    },
  },
]
