/**
 * The one place the rest of the app talks to for course data.
 *
 * This is the seam. Above it, every screen works on `CourseSnapshot` and has
 * no idea where it came from. Below it sits `data/canvas/`, which speaks the
 * real Canvas REST API: real paths, real response shapes, real pagination,
 * real mapping. In the prototype those requests are answered by fixtures
 * instead of an institution — see `data/canvas/config.ts`, where changing one
 * value points the same code at a live Canvas.
 *
 * Keeping the interface this narrow is what makes that swap a configuration
 * change rather than a rewrite.
 */
import type {
  CanvasActivityEvent,
  CanvasAssignment,
  CanvasCourse,
  CanvasModule,
  StudyProfile,
} from '@/types'
import { createCanvasClient, createScenarioClient } from './canvas/client'

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

/**
 * The client the app uses.
 *
 * Built from the Canvas configuration, so it is the Canvas client in both
 * modes — the prototype does not run a different code path from production,
 * it runs the same one against a different transport.
 */
export const faroClient: FaroClient = createCanvasClient()

/** The demo scenario (Progress → "Try the scenario"), always from fixtures. */
export const scenarioClient: FaroClient = createScenarioClient()
