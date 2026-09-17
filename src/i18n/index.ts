/**
 * Two languages, one dictionary shape.
 *
 * `Lang` lives in `types/index.ts` because the mentor context carries it -
 * the student's language is legitimate context for the model; their name and
 * email are not.
 */
import { es, type Dict } from './es'
import { en } from './en'
import type { Lang } from '@/types'

export type { Dict }

export const dictionaries: Record<Lang, Dict> = { es, en }

export const dict = (lang: Lang): Dict => dictionaries[lang]

/** Best first guess before the student has chosen: browser language. */
export function detectLang(): Lang {
  try {
    return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
  } catch {
    return 'es'
  }
}
