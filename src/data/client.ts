/**
 * The one place the rest of the app talks to for course data.
 *
 * Today it resolves mock fixtures. Tomorrow `HttpFaroClient` calls the FARO
 * backend, which calls Canvas. Views never learn the difference.
 */
import type {
  CanvasActivityEvent,
  CanvasAssignment,
  CanvasCourse,
  CanvasModule,
} from '@/types'
import type { StudyProfile } from '@/types'
import {
  mockActivity,
  mockAssignments,
  mockCourse,
  mockModules,
  mockStudyProfile,
} from './canvas.mock'

export interface CourseSnapshot {
  course: CanvasCourse
  modules: CanvasModule[]
  assignments: CanvasAssignment[]
  activity: CanvasActivityEvent[]
  /**
   * How the student actually studies. Optional on purpose: a real backend may
   * not have enough history yet, and Recovery must say so rather than invent
   * a rhythm it cannot support.
   */
  profile?: StudyProfile
}

export interface FaroClient {
  getCourseSnapshot(): Promise<CourseSnapshot>
}

/** Small delay so the UI's cached-first rendering is honest, not accidental. */
const latency = (ms = 120) => new Promise((r) => setTimeout(r, ms))

export class MockFaroClient implements FaroClient {
  async getCourseSnapshot(): Promise<CourseSnapshot> {
    await latency()
    return {
      course: mockCourse,
      modules: mockModules,
      assignments: mockAssignments,
      activity: mockActivity,
      profile: mockStudyProfile,
    }
  }
}

export const faroClient: FaroClient = new MockFaroClient()
