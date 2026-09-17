/**
 * Builds the minimum context the mentor is allowed to see.
 *
 * This function is the privacy boundary. If a field is not built here, the
 * mentor never receives it - no name, no email, no Canvas ids, no message
 * history beyond the current conversation, no dropout classification.
 */
import type {
  FrictionSignal,
  Journey,
  Lang,
  MentorContext,
  MentorStyle,
  NextBestAction,
  Purpose,
} from '@/types'

export function buildMentorContext(args: {
  journey: Journey
  friction: FrictionSignal
  purpose: Purpose
  nextAction: NextBestAction | null
  availableMinutes: number
  style: MentorStyle
  language: Lang
}): MentorContext {
  const { journey, friction, purpose, nextAction, availableMinutes, style, language } = args
  return {
    course: journey.courseName,
    progress: journey.progressPercent,
    next_activity: nextAction?.title ?? null,
    estimated_time: nextAction?.estimatedMinutes ?? null,
    student_goal: purpose.goal,
    destination: purpose.destination,
    available_time: availableMinutes,
    momentum: friction.momentum,
    friction_state: friction.state,
    style,
    language,
  }
}
