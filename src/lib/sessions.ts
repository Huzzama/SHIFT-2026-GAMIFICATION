/**
 * Folds FARO's own study sessions back into the Canvas snapshot.
 *
 * Canvas stays the source of truth, but it syncs on its own schedule. When a
 * student finishes a step inside FARO, the route, the momentum and the
 * progress should move now - not after the next sync. So the snapshot the rest
 * of the app derives from is the Canvas one plus whatever happened in FARO
 * since, shaped exactly like Canvas would have returned it.
 *
 * Nothing here writes to Canvas. A real implementation posts the submission
 * through the FARO backend and lets the next snapshot supersede this.
 */
import type { CourseSnapshot } from '@/data/client'
import type { CanvasActivityEvent, StudySession } from '@/types'

export function applySessions(
  snapshot: CourseSnapshot,
  sessions: StudySession[],
): CourseSnapshot {
  if (sessions.length === 0) return snapshot

  const doneIds = new Set(sessions.map((s) => s.assignmentId))
  const atFor = new Map(sessions.map((s) => [s.assignmentId, s.at]))

  const assignments = snapshot.assignments.map((a) => {
    if (a.submission || !doneIds.has(a.id)) return a
    return {
      ...a,
      submission: {
        id: a.id,
        assignment_id: a.id,
        submitted_at: atFor.get(a.id) ?? new Date().toISOString(),
        score: null,
        workflow_state: 'submitted' as const,
      },
    }
  })

  const fresh: CanvasActivityEvent[] = sessions.map((s) => ({
    course_id: snapshot.course.id,
    at: s.at,
    kind: 'submission',
  }))

  return { ...snapshot, assignments, activity: [...fresh, ...snapshot.activity] }
}

export const totalMinutes = (sessions: StudySession[]) =>
  sessions.reduce((sum, s) => sum + s.minutes, 0)
