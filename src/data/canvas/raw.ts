/**
 * Canvas API response shapes, as Canvas actually returns them.
 *
 * These are deliberately separate from FARO's own types in `types/index.ts`.
 * The types in there are what FARO decided to model; these are what a vendor
 * decided to send. Conflating the two is how an integration quietly becomes
 * impossible to replace — one field rename at Instructure and the friction
 * engine stops compiling.
 *
 * Only the fields FARO reads are declared. Canvas sends many more; the extra
 * ones are ignored rather than modelled, so a Canvas release that adds fields
 * cannot break this layer.
 *
 * Naming follows Canvas (snake_case), not our code style, on purpose: when
 * this file and the API docs disagree, the difference should be visible.
 */

export interface RawCourse {
  id: number
  name: string
  course_code: string
  start_at: string | null
  /** Course end. Null when the term governs the end date instead. */
  end_at: string | null
  workflow_state: 'unpublished' | 'available' | 'completed' | 'deleted'
}

/** What "done" means for one item, per the teacher's module setup. */
export interface RawCompletionRequirement {
  type: 'must_view' | 'must_submit' | 'must_contribute' | 'must_mark_done' | 'min_score'
  min_score?: number
  /** Present only when the caller is a student: whether *they* satisfied it. */
  completed?: boolean
}

export interface RawModuleItem {
  id: number
  module_id: number
  position: number
  title: string
  type: 'Assignment' | 'Quiz' | 'Page' | 'Discussion' | 'File' | 'ExternalUrl' | 'SubHeader' | 'ExternalTool'
  /** The id of the thing the item points at — an assignment id when type is Assignment or Quiz. */
  content_id?: number
  completion_requirement?: RawCompletionRequirement
  published?: boolean
}

export interface RawModule {
  id: number
  name: string
  position: number
  unlock_at: string | null
  require_sequential_progress: boolean
  prerequisite_module_ids: number[]
  items_count: number
  /** Student-specific. Absent when the caller is a teacher or admin. */
  state?: 'locked' | 'unlocked' | 'started' | 'completed'
  /** Student-specific, and only once the module is complete. */
  completed_at?: string | null
  /** Present when the request asked for `include[]=items`. */
  items?: RawModuleItem[]
}

export interface RawSubmission {
  id: number
  assignment_id: number
  user_id: number
  submitted_at: string | null
  score: number | null
  grade: string | null
  workflow_state: 'unsubmitted' | 'submitted' | 'graded' | 'pending_review'
  attempt: number | null
  late: boolean
  missing: boolean
}

export interface RawAssignment {
  id: number
  course_id: number
  name: string
  due_at: string | null
  unlock_at: string | null
  lock_at: string | null
  points_possible: number | null
  submission_types: string[]
  published: boolean
  /** Present when the request asked for `include[]=submission`. */
  submission?: RawSubmission
}

/**
 * Per-student activity in a course.
 *
 * `page_views` is an object keyed by an hour-resolution timestamp, not a
 * list — Canvas buckets views by hour. `participations` is a list of
 * individual events with their own timestamps.
 *
 * The hour resolution is exactly why FARO's friction thresholds are days.
 */
export interface RawUserActivity {
  page_views: Record<string, number>
  participations: { created_at: string; url: string }[]
}
