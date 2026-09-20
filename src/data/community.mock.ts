/**
 * Mock community data.
 *
 * Centralised here so no component invents a number of its own, and shaped
 * the way a real Community Service would return it: posts, rooms, one
 * cooperative mission, and aggregate presence.
 *
 * Post text is in Spanish because the course is. FARO translates its own
 * interface, never the content students and Canvas produce.
 *
 * The mix is deliberate. Most of this feed is *not* achievements - it is
 * questions, a stuck classmate, something someone finally understood. A feed
 * of nothing but wins is how a community starts making people feel worse.
 */
import type {
  CommunityAuthor,
  CommunityMission,
  CommunityPost,
  CoursePresence,
  StudyRoom,
} from '@/types'

const MIN = 60 * 1000
const HOUR = 60 * MIN
const now = Date.now()
const ago = (ms: number) => new Date(now - ms).toISOString()

export const mockAuthors: CommunityAuthor[] = [
  { id: 'u1', name: 'Andrea', initials: 'A', tone: 'violet' },
  { id: 'u2', name: 'Carlos', initials: 'C', tone: 'forest' },
  { id: 'u3', name: 'Daniela', initials: 'D', tone: 'orange' },
  { id: 'u4', name: 'Miguel', initials: 'M', tone: 'teal' },
  { id: 'u5', name: 'Lucía', initials: 'L', tone: 'mint' },
  { id: 'me', name: 'Tú', initials: 'T', tone: 'teal' },
]

const noReactions = { like: 0, applause: 0, useful: 0, motivating: 0, support: 0 }

export const mockPosts: CommunityPost[] = [
  {
    id: 'p1',
    kind: 'help',
    authorId: 'u3',
    title: '¿Cómo saben qué actividades dependen de otras?',
    text: 'Llevo dos días atorada armando el cronograma. No entiendo cómo decidir qué tarea va antes de cuál cuando varias parecen poder hacerse al mismo tiempo.',
    courseName: 'Gestión de Proyectos',
    moduleName: 'Cronograma y costos',
    at: ago(40 * MIN),
    reactions: { ...noReactions, support: 7, useful: 1 },
    comments: [],
  },
  {
    id: 'p2',
    kind: 'question',
    authorId: 'u5',
    title: '¿La ruta crítica siempre es la más larga?',
    text: 'Leí que la ruta crítica es la secuencia más larga del proyecto, pero en el ejemplo del módulo 3 hay dos caminos que duran lo mismo. ¿Las dos son críticas?',
    courseName: 'Gestión de Proyectos',
    moduleName: 'Cronograma y costos',
    at: ago(3 * HOUR),
    reactions: { ...noReactions, useful: 4, like: 2 },
    comments: [
      {
        id: 'c1',
        authorId: 'u2',
        text: 'Sí, pueden ser varias. La ruta crítica es cualquier camino sin holgura: si una de sus tareas se retrasa un día, el proyecto entero se retrasa un día. Dos caminos empatados significan dos rutas críticas y el doble de riesgo.',
        at: ago(2 * HOUR),
        source: 'peer',
        helpful: 9,
      },
      {
        id: 'c2',
        authorId: 'u4',
        text: 'A mí me ayudó calcular la holgura de cada tarea en vez de buscar el camino más largo a ojo. Las que dan holgura cero son las críticas.',
        at: ago(90 * MIN),
        source: 'peer',
        helpful: 4,
      },
    ],
  },
  {
    id: 'p3',
    kind: 'achievement',
    authorId: 'u1',
    text: 'Terminé el módulo 3 después de una semana horrible en el trabajo. Pensé que ya no iba a alcanzar y sí alcancé.',
    courseName: 'Gestión de Proyectos',
    moduleName: 'Cronograma y costos',
    at: ago(5 * HOUR),
    reactions: { ...noReactions, applause: 12, motivating: 4, like: 3 },
    comments: [
      {
        id: 'c3',
        authorId: 'u3',
        text: 'Esto me sirvió leerlo hoy justamente. Gracias por contarlo.',
        at: ago(4 * HOUR),
        source: 'peer',
        helpful: 2,
      },
    ],
  },
  {
    id: 'p4',
    kind: 'learning',
    authorId: 'u2',
    title: 'Algo que por fin entendí',
    text: 'La EDT no es una lista de tareas: es una descomposición de entregables. En cuanto dejé de escribir verbos y empecé a escribir cosas que se entregan, todo el módulo 2 tuvo sentido.',
    courseName: 'Gestión de Proyectos',
    moduleName: 'Alcance y planeación',
    at: ago(8 * HOUR),
    reactions: { ...noReactions, useful: 11, like: 5 },
    comments: [],
  },
  {
    id: 'p5',
    kind: 'recognition',
    authorId: 'u4',
    text: 'volvió a su curso después de 8 días fuera.',
    courseName: 'Gestión de Proyectos',
    at: ago(11 * HOUR),
    reactions: { ...noReactions, support: 9, motivating: 6 },
    comments: [],
  },
  {
    id: 'p6',
    kind: 'tip',
    authorId: 'u5',
    title: 'Truco para los quizzes',
    text: 'Antes de contestar, escribo en una hoja las tres fórmulas del módulo. Me toma dos minutos y dejé de equivocarme por confundir holgura con duración.',
    courseName: 'Gestión de Proyectos',
    at: ago(20 * HOUR),
    reactions: { ...noReactions, useful: 8, like: 4 },
    comments: [],
  },
  {
    id: 'p7',
    kind: 'resource',
    authorId: 'u1',
    title: 'Plantilla de registro de riesgos',
    text: 'Armé una plantilla simple con las columnas que pide el ejercicio del módulo 4: riesgo, probabilidad, impacto, respuesta y responsable.',
    resourceLabel: 'Plantilla · hoja de cálculo',
    courseName: 'Gestión de Proyectos',
    moduleName: 'Riesgos',
    at: ago(26 * HOUR),
    reactions: { ...noReactions, useful: 15, like: 6 },
    comments: [],
  },
  {
    id: 'p8',
    kind: 'activity',
    authorId: 'u2',
    text: 'completó el quiz del módulo 3.',
    courseName: 'Gestión de Proyectos',
    moduleName: 'Cronograma y costos',
    at: ago(30 * HOUR),
    reactions: { ...noReactions, applause: 3 },
    comments: [],
  },
]

export const mockRooms: StudyRoom[] = [
  {
    id: 'r1',
    name: 'Sala cronogramas',
    courseName: 'Gestión de Proyectos',
    participants: 6,
    minutes: 25,
    mode: 'quiet',
    focusMinutes: 25,
    breakMinutes: 0,
  },
  {
    id: 'r2',
    name: 'Riesgos — sesión larga',
    courseName: 'Gestión de Proyectos',
    participants: 4,
    minutes: 50,
    mode: 'pomodoro',
    focusMinutes: 50,
    breakMinutes: 10,
  },
  {
    id: 'r3',
    name: 'Enfoque nocturno',
    courseName: 'Estudio general',
    participants: 12,
    minutes: 45,
    mode: 'quiet',
    focusMinutes: 45,
    breakMinutes: 0,
  },
]

export const mockMission: CommunityMission = {
  id: 'm1',
  target: 500,
  progress: 327,
  contributors: 64,
  endsInDays: 3,
}

export const mockPresence: CoursePresence = {
  courseName: 'Gestión de Proyectos',
  students: 248,
  studyingNow: 23,
  inRooms: 8,
  completedThisWeek: 42,
  activitiesThisWeek: 327,
  rhythmDays: 5,
}

/** Session lengths a student can start a room with. */
export const roomDurations = [15, 25, 30, 45, 60]
