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
  /** Minutes. Not a Canvas field - FARO estimates it; see `data/canvas/fixtures.ts`. */
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

/**
 * Who the student is, to the small extent FARO asks.
 *
 * This is the only place a photo or a bio lives - it is never asked for
 * anywhere else, and it is never required. Stored locally only (see
 * `state/storage.ts`); nothing here is sent to the mentor
 * (`lib/mentorContext.ts` does not read it) or to any other student except
 * as what they see if they open this student's public profile in Community.
 */
export interface Profile {
  /** Shown in Community once set. Empty until the student chooses one. */
  name: string
  /** A small square JPEG data URL, downsized client-side. Never a raw upload. */
  photoDataUrl: string | null
  /** One line, optional. Capped in the UI, not here. */
  bio: string
  /**
   * Mock only - there is no real Tecmilenio SSO in this prototype. Labelled as
   * simulated everywhere it appears; see `views/ProfileView.tsx`.
   */
  institutionLinked: boolean
  updatedAt: string | null
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

/* ------------------------------------------------------------- community */

/**
 * Community is a digital campus, not a social network.
 *
 * Two absences in these types are deliberate and load-bearing: there is no
 * follower count and no rank. Nothing here can be used to say who is ahead.
 */

export type PostKind =
  | 'achievement'
  | 'activity'
  | 'question'
  | 'tip'
  | 'learning'
  | 'resource'
  | 'help'
  | 'recognition'
  | 'milestone'

/**
 * Learning-oriented reactions. The vocabulary is the culture: every one of
 * these says "I saw your progress", "this helped me" or "I'm with you" -
 * none of them says "you are popular".
 */
export type ReactionKind = 'like' | 'applause' | 'useful' | 'motivating' | 'support'

export type Reactions = Record<ReactionKind, number>

/** Where an answer comes from. A peer answer is never dressed up as official. */
export type AnswerSource = 'peer' | 'instructor' | 'mentor'

export interface CommunityAuthor {
  id: string
  name: string
  initials: string
  /** Avatar tint only. Not a status, not a level. */
  tone: 'forest' | 'mint' | 'violet' | 'orange' | 'teal'
  /** One line, optional. Mock for peers; the student's own comes from `Profile`. */
  bio?: string
  /** Recognitions to show on a profile. Mock for peers; the student's own are evaluated live. */
  badges?: CommunityAchievementId[]
  /** Set only for the live student ('me'), from `Profile.photoDataUrl`. Peers stay initials-only. */
  photoDataUrl?: string | null
}

export interface CommunityComment {
  id: string
  authorId: string
  text: string
  at: string
  source: AnswerSource
  /** How many peers marked this answer useful. Never a ranking. */
  helpful: number
}

export interface CommunityPost {
  id: string
  kind: PostKind
  authorId: string
  text: string
  /** Optional heading for questions, tips and resources. */
  title?: string
  courseName?: string
  moduleName?: string
  at: string
  reactions: Reactions
  comments: CommunityComment[]
  /** For `resource` posts: what the link actually is. */
  resourceLabel?: string
}

export interface StudyRoom {
  id: string
  name: string
  courseName: string
  participants: number
  /** Total session length in minutes. */
  minutes: number
  mode: 'quiet' | 'pomodoro'
  focusMinutes: number
  breakMinutes: number
}

/** Cooperative, never competitive: one target the whole course moves toward. */
export interface CommunityMission {
  id: string
  target: number
  progress: number
  contributors: number
  endsInDays: number
}

/**
 * Aggregate presence only.
 *
 * Every field here is a count of people, never a named individual doing a
 * specific thing. "23 students are studying right now" is presence;
 * "Andrea has been studying 37 minutes" is surveillance.
 */
export interface CoursePresence {
  courseName: string
  students: number
  studyingNow: number
  inRooms: number
  /** Students who finished the current module this week. Social proof, not a rank. */
  completedThisWeek: number
  activitiesThisWeek: number
  /** Collective days in a row the course has been active. Never per-student. */
  rhythmDays: number
}

export type CommunityAchievementId =
  | 'community_builder'
  | 'knowledge_sharer'
  | 'helpful_peer'
  | 'study_companion'
  | 'community_comeback'

export interface CommunityAchievement {
  id: CommunityAchievementId
  title: string
  description: string
  hint: string
  earned: boolean
}

/** The three kinds of stuck, and the FARO system each one belongs to. */
export type SosNeed = 'topic' | 'time' | 'people'

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
  /** Optional one-tap follow-ups offered with a FARO message; tapping one sends it as the student's words. */
  suggestions?: string[]
  /** Optional one-tap actions that FARO handles itself (start a step, pick a life state, answer a check question). */
  choices?: MentorChoice[]
  /** Who wrote a FARO message: the model behind the backend, or the local mentor. Shown for transparency. */
  source?: 'gemini' | 'local'
}

/** A button under a FARO message. `id` is a small action string, e.g. `life:less_time` or `start:m-12`. */
export interface MentorChoice {
  id: string
  label: string
  /** Visually primary (the one thing FARO recommends). */
  primary?: boolean
}

/**
 * What kind of help the student asked for. Changes how FARO answers, never
 * the rules it answers under.
 */
export type MentorMode = 'chat' | 'teach' | 'focus' | 'recovery' | 'planning'

/** A small plan the student accepted in the mentor (e.g. for the weekend). Shown on Home. */
export interface DayPlan {
  label: string
  minutes: number
  items: { milestoneId: string; title: string; minutes: number }[]
}

export interface WeekPlan {
  createdAt: string
  days: DayPlan[]
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

/* ---------------------------------------------------------- review cards */

/**
 * One reconnection question.
 *
 * Bilingual on purpose: these are FARO's own cards (in production, written by
 * the instructor or generated from the module's content), not Canvas quiz
 * questions - a student token cannot read a quiz's question bank, and a
 * reconnection card must never be confused with a graded quiz.
 */
export interface ReviewQuestion {
  id: string
  moduleId: number
  prompt: Record<Lang, string>
  options: Record<Lang, string>[]
  /** Index into `options`. */
  correct: number
  /** Shown after a wrong answer, and after the right one. Explains, never scolds. */
  explain: Record<Lang, string>
}

/** A finished set of review cards. What FARO records - never a grade. */
export interface ReviewRecord {
  id: string
  at: string
  questionIds: string[]
  /** How many were answered right on the first try. Informational only. */
  firstTry: number
}

/* --------------------------------------------------------------- rewards */

export interface RewardTier {
  id: string
  /** Value in Mexican pesos. Simulated in the prototype. */
  mxn: number
  points: number
}

/** A redemption. One per semester, by design. */
export interface Redemption {
  tierId: string
  mxn: number
  at: string
}
