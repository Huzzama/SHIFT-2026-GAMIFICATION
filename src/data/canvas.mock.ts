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
 */
import type {
  CanvasActivityEvent,
  CanvasAssignment,
  CanvasCourse,
  CanvasModule,
} from '@/types'

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * DAY).toISOString()
const daysAhead = (d: number) => new Date(now + d * DAY).toISOString()

export const mockCourse: CanvasCourse = {
  id: 4021,
  name: 'Project Management Essentials',
  course_code: 'PM-101',
  start_at: daysAgo(35),
  end_at: daysAhead(28),
}

export const mockModules: CanvasModule[] = [
  { id: 1, course_id: 4021, name: 'Foundations', position: 1, state: 'completed', items_count: 3, completed_items_count: 3 },
  { id: 2, course_id: 4021, name: 'Scope & Planning', position: 2, state: 'completed', items_count: 3, completed_items_count: 3 },
  { id: 3, course_id: 4021, name: 'Schedule & Cost', position: 3, state: 'started', items_count: 3, completed_items_count: 1 },
  { id: 4, course_id: 4021, name: 'Risk', position: 4, state: 'unlocked', items_count: 3, completed_items_count: 0 },
  { id: 5, course_id: 4021, name: 'Stakeholders', position: 5, state: 'locked', items_count: 2, completed_items_count: 0 },
  { id: 6, course_id: 4021, name: 'Closing the Project', position: 6, state: 'locked', items_count: 2, completed_items_count: 0 },
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
  make(1, 'Welcome & course map', -30, 10, true),
  make(1, 'What a project really is', -28, 15, true),
  make(1, 'Module 1 quiz', -25, 20, true),

  make(2, 'Defining scope', -21, 25, true),
  make(2, 'Work breakdown structure', -18, 30, true),
  make(2, 'Module 2 quiz', -15, 20, true),

  make(3, 'Reading: estimating duration', -9, 15, true),
  make(3, 'Build a project schedule', -4, 45, false),
  make(3, 'Module 3 quiz', -1, 20, false),

  make(4, 'Reading: identifying risk', 3, 15, false),
  make(4, 'Risk register exercise', 6, 40, false),
  make(4, 'Module 4 quiz', 8, 20, false),

  make(5, 'Stakeholder mapping', 14, 30, false),
  make(5, 'Module 5 quiz', 16, 20, false),

  make(6, 'Project closure report', 24, 60, false),
  make(6, 'Final reflection', 27, 25, false),
]

/** Activity stops 5 days ago: the disconnection FARO should catch. */
export const mockActivity: CanvasActivityEvent[] = [
  { course_id: 4021, at: daysAgo(5), kind: 'page_view' },
  { course_id: 4021, at: daysAgo(5), kind: 'module_item_view' },
  { course_id: 4021, at: daysAgo(9), kind: 'submission' },
  { course_id: 4021, at: daysAgo(10), kind: 'page_view' },
  { course_id: 4021, at: daysAgo(15), kind: 'submission' },
]
