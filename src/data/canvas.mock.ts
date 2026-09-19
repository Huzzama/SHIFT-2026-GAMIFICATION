/**
 * Mock Canvas data.
 *
 * Shapes mirror the real Canvas LMS API responses so that swapping this file
 * for a real client (see `data/client.ts`) changes nothing above this layer.
 * Nothing here claims to be a real Canvas capability - fields Canvas does not
 * provide (estimated_minutes) are marked in `types/index.ts`.
 *
 * The scenario: a working adult, 5 weeks into a 6-module course, who stopped
 * 5 days ago. That is the exact moment FARO is built for.
 *
 * Course content is in Spanish because the pilot institution teaches in
 * Spanish. FARO never translates Canvas content - only its own interface.
 */
import type {
  CanvasActivityEvent,
  CanvasAssignment,
  CanvasCourse,
  CanvasModule,
  StudyProfile,
} from '@/types'

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * DAY).toISOString()
const daysAhead = (d: number) => new Date(now + d * DAY).toISOString()

/**
 * Days until the evaluation period closes.
 *
 * This is the single number that makes Recovery's feasibility check mean
 * something. With a whole semester left, "can I still finish?" is trivially
 * yes and the question is not worth asking. Twelve days is the pressure the
 * product is designed for: tight enough to be real, wide enough to recover.
 */
const DAYS_UNTIL_COURSE_ENDS = 12

export const mockCourse: CanvasCourse = {
  id: 4021,
  name: 'Gestión de Proyectos',
  course_code: 'GP-101',
  start_at: daysAgo(35),
  end_at: daysAhead(DAYS_UNTIL_COURSE_ENDS),
}

/**
 * The student's measured rhythm.
 *
 * Recovery plans around this rather than assuming everyone can give the same
 * hour a day. Centralised here, per the prototype's mock-data rule - no
 * component invents a number of its own.
 */
export const mockStudyProfile: StudyProfile = {
  averageSessionMinutes: 35,
  daysPerWeek: 4,
}

export const mockModules: CanvasModule[] = [
  { id: 1, course_id: 4021, name: 'Fundamentos', position: 1, state: 'completed', items_count: 3, completed_items_count: 3 },
  { id: 2, course_id: 4021, name: 'Alcance y planeación', position: 2, state: 'completed', items_count: 3, completed_items_count: 3 },
  { id: 3, course_id: 4021, name: 'Cronograma y costos', position: 3, state: 'started', items_count: 3, completed_items_count: 1 },
  { id: 4, course_id: 4021, name: 'Riesgos', position: 4, state: 'unlocked', items_count: 3, completed_items_count: 0 },
  { id: 5, course_id: 4021, name: 'Interesados', position: 5, state: 'locked', items_count: 2, completed_items_count: 0 },
  { id: 6, course_id: 4021, name: 'Cierre del proyecto', position: 6, state: 'locked', items_count: 2, completed_items_count: 0 },
]

let assignmentId = 100

const submissionFor = (id: number, daysAfterDue: number) => ({
  id,
  assignment_id: id,
  submitted_at: daysAgo(daysAfterDue),
  score: 88,
  workflow_state: 'graded' as const,
})

const make = (
  module_id: number,
  name: string,
  /** Negative = already past due, positive = still ahead. */
  dueOffsetDays: number,
  estimated_minutes: number,
  done: boolean,
): CanvasAssignment => {
  const id = assignmentId++
  return {
    id,
    course_id: 4021,
    module_id,
    name,
    due_at: dueOffsetDays <= 0 ? daysAgo(-dueOffsetDays) : daysAhead(dueOffsetDays),
    points_possible: 100,
    estimated_minutes,
    submission: done ? submissionFor(id, Math.max(1, -dueOffsetDays - 1)) : null,
  }
}

export const mockAssignments: CanvasAssignment[] = [
  make(1, 'Bienvenida y mapa del curso', -30, 10, true),
  make(1, 'Qué es realmente un proyecto', -28, 15, true),
  make(1, 'Quiz del módulo 1', -25, 20, true),

  make(2, 'Definir el alcance', -21, 25, true),
  make(2, 'Estructura de desglose del trabajo (EDT)', -18, 30, true),
  make(2, 'Quiz del módulo 2', -15, 20, true),

  make(3, 'Lectura: estimar duraciones', -9, 15, true),
  make(3, 'Construir un cronograma de proyecto', -4, 45, false),
  make(3, 'Quiz del módulo 3', -1, 20, false),

  make(4, 'Lectura: identificar riesgos', 2, 15, false),
  make(4, 'Ejercicio: registro de riesgos', 4, 40, false),
  make(4, 'Quiz del módulo 4', 5, 20, false),

  make(5, 'Mapa de interesados', 7, 30, false),
  make(5, 'Quiz del módulo 5', 8, 20, false),

  make(6, 'Informe de cierre del proyecto', 11, 60, false),
  make(6, 'Reflexión final', 12, 25, false),
]

/** Activity stops 5 days ago: the disconnection FARO should catch. */
export const mockActivity: CanvasActivityEvent[] = [
  { course_id: 4021, at: daysAgo(5), kind: 'page_view' },
  { course_id: 4021, at: daysAgo(5), kind: 'module_item_view' },
  { course_id: 4021, at: daysAgo(9), kind: 'submission' },
  { course_id: 4021, at: daysAgo(10), kind: 'page_view' },
  { course_id: 4021, at: daysAgo(15), kind: 'submission' },
]
