/**
 * The student's semester so far - simulated.
 *
 * Adult online programmes usually run courses back to back: four or five
 * short courses make a semester. The FARO reward is per semester, so the
 * balance a student sees includes the courses they already finished this
 * term. In production those totals come from FARO's own database (the same
 * rules, applied course by course); here three finished courses are
 * invented, and the Rewards screen labels them as simulated.
 *
 * Calibrated on purpose: these three plus what the demo student has already
 * done in Gestión de Proyectos put them at about 85% of the $200 reward, and
 * finishing the course's remaining activities and modules takes them to
 * exactly 10,000. "Finish this course and you reach it" is the story the
 * numbers tell, and it is true under the rules in `lib/points.ts`.
 */
export interface SemesterCourse {
  name: string
  points: number
}

export const semesterLabel = { es: 'Semestre ago–dic 2026', en: 'Aug–Dec 2026 semester' }

export const previousCourses: SemesterCourse[] = [
  { name: 'Fundamentos de administración', points: 2560 },
  { name: 'Comunicación efectiva', points: 2490 },
  { name: 'Finanzas personales', points: 2650 },
]
