/**
 * Canvas fixtures — the bytes a real Canvas would send.
 *
 * This replaces the old `data/canvas.mock.ts`, and the difference is the
 * point. That file held data already shaped the way FARO wanted it, which
 * quietly hid the hardest part of any LMS integration: the mapping. These
 * payloads are shaped the way *Canvas* sends them — modules carrying their
 * items, assignments carrying a nested submission, activity as page views
 * bucketed by hour — so `client.ts` has to do the real translation work, and
 * pointing it at an institutional Canvas changes the transport and nothing
 * else.
 *
 * The scenario is unchanged: a working adult, five weeks into a six-module
 * course, who stopped five days ago, with twelve days left before the
 * evaluation period closes and four modules still open (3 to 6): nine
 * activities, 270 minutes, four and a half hours of work. That is the exact
 * moment FARO exists for. Progress → "Try the scenario" replays it.
 *
 * Course content is in Spanish because the pilot institution teaches in
 * Spanish. FARO translates its own interface, never Canvas content.
 */
import type {
  RawAssignment,
  RawCourse,
  RawModule,
  RawModuleItem,
  RawSubmission,
  RawUserActivity,
} from './raw'
import type { StudyProfile } from '@/types'

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * DAY).toISOString()
const daysAhead = (d: number) => new Date(now + d * DAY).toISOString()

export const COURSE_ID = 4021
export const STUDENT_ID = 77120

/**
 * Days until the evaluation period closes.
 *
 * The single number that makes Recovery's feasibility check mean something.
 * With a whole semester left, "can I still finish?" is trivially yes and not
 * worth asking. Twelve days is the pressure the product is designed for.
 */
const DAYS_UNTIL_COURSE_ENDS = 12

/** Days since the student last touched the course. Drives the friction engine. */
const DAYS_INACTIVE = 5

/* ---------------------------------------------------------------- course */

export const rawCourse: RawCourse = {
  id: COURSE_ID,
  name: 'Gestión de Proyectos',
  course_code: 'GP-101',
  start_at: daysAgo(35),
  end_at: daysAhead(DAYS_UNTIL_COURSE_ENDS),
  workflow_state: 'available',
}

/* ----------------------------------------------------------- assignments */

interface Spec {
  moduleId: number
  name: string
  /** Negative = already past due. */
  dueOffsetDays: number
  minutes: number
  done: boolean
}

const specs: Spec[] = [
  { moduleId: 1, name: 'Bienvenida y mapa del curso', dueOffsetDays: -30, minutes: 10, done: true },
  { moduleId: 1, name: 'Qué es realmente un proyecto', dueOffsetDays: -28, minutes: 15, done: true },
  { moduleId: 1, name: 'Quiz del módulo 1', dueOffsetDays: -25, minutes: 20, done: true },

  { moduleId: 2, name: 'Definir el alcance', dueOffsetDays: -21, minutes: 25, done: true },
  { moduleId: 2, name: 'Estructura de desglose del trabajo (EDT)', dueOffsetDays: -18, minutes: 30, done: true },
  { moduleId: 2, name: 'Quiz del módulo 2', dueOffsetDays: -15, minutes: 20, done: true },

  { moduleId: 3, name: 'Lectura: estimar duraciones', dueOffsetDays: -9, minutes: 15, done: true },
  { moduleId: 3, name: 'Construir un cronograma de proyecto', dueOffsetDays: -4, minutes: 45, done: false },
  { moduleId: 3, name: 'Quiz del módulo 3', dueOffsetDays: -1, minutes: 20, done: false },

  { moduleId: 4, name: 'Lectura: identificar riesgos', dueOffsetDays: 2, minutes: 15, done: false },
  { moduleId: 4, name: 'Ejercicio: registro de riesgos', dueOffsetDays: 4, minutes: 40, done: false },
  { moduleId: 4, name: 'Quiz del módulo 4', dueOffsetDays: 5, minutes: 20, done: false },

  { moduleId: 5, name: 'Mapa de interesados', dueOffsetDays: 7, minutes: 30, done: false },
  { moduleId: 5, name: 'Quiz del módulo 5', dueOffsetDays: 8, minutes: 20, done: false },

  { moduleId: 6, name: 'Informe de cierre del proyecto', dueOffsetDays: 11, minutes: 60, done: false },
  { moduleId: 6, name: 'Reflexión final', dueOffsetDays: 12, minutes: 20, done: false },
]

const assignmentId = (i: number) => 100 + i

const submissionFor = (id: number, spec: Spec): RawSubmission => ({
  id: 9000 + id,
  assignment_id: id,
  user_id: STUDENT_ID,
  submitted_at: daysAgo(Math.max(1, -spec.dueOffsetDays - 1)),
  score: 88,
  grade: '88',
  workflow_state: 'graded',
  attempt: 1,
  late: false,
  missing: false,
})

/** An unsubmitted submission: Canvas sends this stub, not an absent field. */
const emptySubmission = (id: number): RawSubmission => ({
  id: 9000 + id,
  assignment_id: id,
  user_id: STUDENT_ID,
  submitted_at: null,
  score: null,
  grade: null,
  workflow_state: 'unsubmitted',
  attempt: null,
  late: false,
  missing: false,
})

export const rawAssignments: RawAssignment[] = specs.map((s, i) => {
  const id = assignmentId(i)
  const isQuiz = s.name.toLowerCase().startsWith('quiz')
  return {
    id,
    course_id: COURSE_ID,
    name: s.name,
    due_at: s.dueOffsetDays <= 0 ? daysAgo(-s.dueOffsetDays) : daysAhead(s.dueOffsetDays),
    unlock_at: null,
    lock_at: null,
    points_possible: 100,
    submission_types: [isQuiz ? 'online_quiz' : 'online_upload'],
    published: true,
    submission: s.done ? submissionFor(id, s) : emptySubmission(id),
  }
})

/* --------------------------------------------------------------- modules */

const MODULE_NAMES: Record<number, string> = {
  1: 'Fundamentos',
  2: 'Alcance y planeación',
  3: 'Cronograma y costos',
  4: 'Riesgos',
  5: 'Interesados',
  6: 'Cierre del proyecto',
}

const moduleState = (id: number): RawModule['state'] => {
  const mine = specs.filter((s) => s.moduleId === id)
  if (mine.every((s) => s.done)) return 'completed'
  if (mine.some((s) => s.done)) return 'started'
  return id <= 4 ? 'unlocked' : 'locked'
}

export const rawModules: RawModule[] = Object.keys(MODULE_NAMES)
  .map(Number)
  .map((moduleId) => {
    const items: RawModuleItem[] = specs
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.moduleId === moduleId)
      .map(({ s, i }, position) => ({
        id: 500 + i,
        module_id: moduleId,
        position: position + 1,
        title: s.name,
        type: (s.name.toLowerCase().startsWith('quiz') ? 'Quiz' : 'Assignment') as RawModuleItem['type'],
        content_id: assignmentId(i),
        completion_requirement: {
          type: 'must_submit' as const,
          completed: s.done,
        },
        published: true,
      }))

    return {
      id: moduleId,
      name: MODULE_NAMES[moduleId],
      position: moduleId,
      unlock_at: null,
      require_sequential_progress: false,
      prerequisite_module_ids: moduleId > 1 ? [moduleId - 1] : [],
      items_count: items.length,
      state: moduleState(moduleId),
      completed_at: moduleState(moduleId) === 'completed' ? daysAgo(15) : null,
      items,
    }
  })

/* -------------------------------------------------------------- activity */

/**
 * Page views bucketed by hour and participations as timestamps — the exact
 * shape of the Canvas analytics response. Activity stops five days ago: the
 * disconnection FARO is built to catch.
 */
export const rawActivity: RawUserActivity = {
  page_views: {
    [new Date(now - DAYS_INACTIVE * DAY).toISOString()]: 7,
    [new Date(now - DAYS_INACTIVE * DAY - 2 * HOUR).toISOString()]: 3,
    [new Date(now - 9 * DAY).toISOString()]: 11,
    [new Date(now - 10 * DAY).toISOString()]: 4,
    [new Date(now - 15 * DAY).toISOString()]: 9,
  },
  participations: [
    { created_at: daysAgo(9), url: `/courses/${COURSE_ID}/assignments/106` },
    { created_at: daysAgo(15), url: `/courses/${COURSE_ID}/assignments/105` },
  ],
}

/* ---------------------------------------------------------- FARO's own */

/**
 * Two things Canvas does not have, kept here and clearly labelled.
 *
 * `estimatedMinutes` is the one FARO cannot do without: every plan it makes
 * is sized in minutes, and Canvas has no field for how long an activity
 * takes. In production the instructional designer sets it when building the
 * course, stored in FARO's own database against the Canvas assignment id.
 * Inventing it silently inside the mapper would be the kind of fabricated
 * capability this project refuses.
 */
export const estimatedMinutes: Record<number, number> = Object.fromEntries(
  specs.map((s, i) => [assignmentId(i), s.minutes]),
)

/** The student's measured rhythm. Computed by the FARO backend, not by Canvas. */
export const studyProfile: StudyProfile = {
  averageSessionMinutes: 35,
  daysPerWeek: 4,
}
