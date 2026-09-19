/**
 * Domain types for FARO.
 *
 * Two layers are kept apart on purpose:
 *  - `canvas.*` types mirror what Canvas LMS returns. Canvas stays the source
 *    of truth for academic data.
 *  - FARO types are ours: purpose, journey, momentum, mentor.
 */

/* ------------------------------------------------------------------ Canvas */

export interface CanvasCourse {
  id: number
  name: string
  course_code: string
  start_at: string | null
  end_at: string | null
}

export interface CanvasModule {
  id: number
  course_id: number
  name: string
  position: number
  state: 'locked' | 'unlocked' | 'started' | 'completed'
  items_count: number
  completed_items_count: number
}

export interface CanvasAssignment {
  id: number
  course_id: number
  module_id: number
  name: string
  due_at: string | null
  points_possible: number
  /** Minutes. Not a Canvas field - FARO estimates it; see `data/canvas.mock.ts`. */
  estimated_minutes: number
  submission: CanvasSubmission | null
}

export interface CanvasSubmission {
  id: number
  assignment_id: number
  submitted_at: string | null
  score: number | null
  workflow_state: 'unsubmitted' | 'submitted' | 'graded'
}

/** One page view / submission / access event, used to detect friction. */
export interface CanvasActivityEvent {
  course_id: number
  at: string
  kind: 'page_view' | 'submission' | 'module_item_view'
}

/* -------------------------------------------------------------------- FARO */

/** UI language. Also part of the mentor context: the model answers in it. */
export type Lang = 'es' | 'en'

export type PurposeGoal =
  | 'career_growth'
  | 'better_income'
  | 'career_change'
  | 'promotion'
  | 'finish_degree'
  | 'personal_achievement'
  | 'personal_development'
  | 'other'

export interface Purpose {
  goal: PurposeGoal
  /** The student's own words: what finishing this course would let them do. */
  destination: string
  /** Minutes the student realistically has on a normal day. */
  weekdayMinutes: number
  createdAt: string
}

export type MilestoneStatus =
  | 'completed'
  | 'current'
  | 'upcoming'
  | 'locked'
  | 'missed'

export interface JourneyMilestone {
  id: string
  title: string
  subtitle?: string
  status: MilestoneStatus
  /** True for module boundaries - the "you made it this far" points. */
  checkpoint: boolean
  estimatedMinutes: number
  dueAt: string | null
  moduleId: number
  assignmentId?: number
}

export interface Journey {
  courseId: number
  courseName: string
  milestones: JourneyMilestone[]
  progressPercent: number
  /** Index in `milestones` of where the student stands right now. */
  currentIndex: number
  recalculated: boolean
}

export type FrictionState =
  | 'FLOWING'
  | 'FRICTION'
  | 'POSSIBLE_OVERWHELM'
  | 'DISCONNECTION'
  | 'RECOVERY'

export interface FrictionSignal {
  state: FrictionState
  daysSinceActivity: number
  pendingCount: number
  /** 0-100. Connection to learning, not a punitive streak. */
  momentum: number
  /** Student-facing, supportive. Never a risk score. */
  headline: string
}

export interface NextBestAction {
  milestoneId: string
  title: string
  reason: string
  estimatedMinutes: number
}

export interface RecoveryStep {
  when: 'today' | 'tomorrow' | 'next_session'
  title: string
  estimatedMinutes: number
  kind: 'comeback_mission' | 'review' | 'continue'
}

/**
 * One completed step, recorded by FARO itself.
 *
 * This is FARO's own record of a study session, not a Canvas submission. It is
 * what lets momentum, the journey and the achievements respond immediately
 * instead of waiting for Canvas to sync.
 */
export interface StudySession {
  id: string
  milestoneId: string
  assignmentId: number
  title: string
  minutes: number
  at: string
  /** Overdue items open at the moment this session started. */
  pendingAtStart: number
  /** True when the step fitted the time the student said they had. */
  fitAvailableTime: boolean
}

/** What life did, in the student's words. Drives the intervention, nothing else. */
export type LifeState =
  | 'less_time'
  | 'overwhelmed'
  | 'dont_understand'
  | 'lost_routine'
  | 'need_break'
  | 'ready'

export type InterventionKind =
  | 'shrink_session'
  | 'single_action'
  | 'mentor'
  | 'comeback_mission'
  | 'pause'
  | 'continue'

export interface Intervention {
  kind: InterventionKind
  headline: string
  body: string
  /** Suggested session length for this state, in minutes. */
  minutes: number
  cta: string
}

export type AchievementId =
  | 'the_comeback'
  | 'back_on_track'
  | 'weathered_the_storm'
  | 'smart_session'
  | 'finisher'

/**
 * Resilience, not badge spam. Every one of these is earned by persisting
 * through something, never by clicking around.
 */
export interface Achievement {
  id: AchievementId
  title: string
  description: string
  earned: boolean
  earnedAt: string | null
  /** Shown while unearned: what it would take. Never a scold. */
  hint: string
}

/* ---------------------------------------------------- recovery planner */

/**
 * How this student actually studies, as opposed to how a syllabus assumed.
 *
 * Mocked today. In production this is computed by the backend from Canvas
 * activity plus FARO's own sessions - never asked for in a form.
 */
export interface StudyProfile {
  /** Typical length of one real study session, in minutes. */
  averageSessionMinutes: number
  /** Days per week the student historically studied. */
  daysPerWeek: number
}

/** The objective situation, measured - never editorialised. */
export interface RemainingWork {
  activities: number
  minutes: number
  modules: number
  /** Calendar days until the course closes. */
  daysLeft: number
  deadline: string | null
}

export type FeasibilityState = 'comfortable' | 'tight' | 'not_realistic' | 'unknown'

/**
 * The honest answer to "can I still finish?".
 *
 * `not_realistic` exists on purpose. FARO does not promise an outcome it
 * cannot support - trust is worth more than a motivating lie.
 */
export interface FeasibilityCheck {
  state: FeasibilityState
  /** Minutes per day needed to finish everything by the deadline. */
  requiredDailyMinutes: number
  /** What this student sustains: what they told us, or their measured rhythm. */
  capacityMinutes: number
  /** required ÷ capacity. 1.0 = exactly at their limit. */
  load: number
}

export type StrategyId = 'comfortable' | 'balanced' | 'intensive'

export interface RouteStrategy {
  id: StrategyId
  dailyMinutes: number
  /** Days this pace needs. */
  days: number
  /** Slack days before the deadline. Negative means it does not fit. */
  buffer: number
  feasible: boolean
  /** Marked only when there is an objective reason, never as "the best one". */
  suggested: boolean
}

export interface PlanItem {
  milestoneId: string
  title: string
  moduleName: string | null
  minutes: number
  checkpoint: boolean
}

export interface PlanDay {
  index: number
  dateISO: string
  minutes: number
  items: PlanItem[]
  /** True when this day closes a module. */
  checkpoint: boolean
  checkpointLabel: string | null
}

export interface RecoveryPlan {
  days: PlanDay[]
  dailyMinutes: number
  strategy: StrategyId
  /** Work that does not fit before the deadline. Surfaced, never dropped silently. */
  overflow: PlanItem[]
  finishesInDays: number
}

/** What the student says they can give per day. `varies` is the honest one. */
export type DailyTimeChoice = 15 | 30 | 45 | 60 | 'varies'

export type MentorStyle =
  | 'direct'
  | 'encouraging'
  | 'detailed'
  | 'friendly'
  | 'challenge'

export interface MentorMessage {
  id: string
  role: 'student' | 'faro'
  text: string
  at: string
  /** Optional one-tap follow-ups offered with a FARO message. */
  suggestions?: string[]
}

/**
 * The ONLY thing the mentor service is allowed to see about the student.
 * Assembled by `lib/mentorContext.ts`; no names, no emails, no raw history.
 */
export interface MentorContext {
  course: string
  progress: number
  next_activity: string | null
  estimated_time: number | null
  student_goal: PurposeGoal
  destination: string
  available_time: number
  momentum: number
  friction_state: FrictionState
  style: MentorStyle
  language: Lang
}
