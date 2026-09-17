/**
 * FARO Mentor service.
 *
 * The contract the UI depends on is `MentorService`. The prototype ships
 * `LocalMentorService` - deterministic, offline, no API key - so the flow can
 * be demoed and tested. `HttpMentorService` is the real path: POST /api/mentor
 * with nothing but a `MentorContext`, and the backend owns the model call,
 * the tools and the guardrails.
 *
 * Guardrail that holds in both: the mentor guides, it does not produce graded
 * work. Style changes the voice, never the rules. Language changes the words,
 * never the rules either.
 */
import { dict } from '@/i18n'
import type { Lang, MentorContext, MentorMessage, MentorStyle } from '@/types'

export interface MentorReply {
  text: string
  suggestions?: string[]
}

export interface MentorService {
  send(input: {
    message: string
    context: MentorContext
    history: MentorMessage[]
  }): Promise<MentorReply>
}

/* ------------------------------------------------------------- guardrails */

const DO_IT_FOR_ME: Record<Lang, RegExp> = {
  en: /\b(write|do|solve|answer|complete|submit|finish)\b.{0,30}\b(my|the)\b.{0,20}\b(quiz|exam|test|assignment|essay|homework|report|reflection)\b/i,
  es: /\b(escribe|haz|hazme|resuelve|responde|contesta|completa|termina|entrega)\b.{0,30}\b(mi|el|la|este|esta)\b.{0,24}\b(quiz|examen|tarea|ensayo|reporte|reflexi[oó]n|actividad|cuestionario)\b/i,
}

/* ------------------------------------------------------------------ voice */

function voice(ctx: MentorContext, body: string): string {
  const v = dict(ctx.language).mentor.voice
  const opener = v.openers[ctx.style](ctx.momentum < 60)
  return `${opener}${body}${v.closers[ctx.style]}`.trim()
}

/* ------------------------------------------------------------ local mentor */

type Intent = 'next' | 'behind' | 'no_time' | 'explain' | 'unmotivated' | 'plan' | 'other'

const intents: Record<Lang, [Intent, RegExp][]> = {
  en: [
    ['next', /\b(next|what should i do|where do i start|start)\b/],
    ['behind', /\b(behind|catch up|missed|late|lost)\b/],
    ['no_time', /\b(no time|busy|only \d+ ?min|10 minutes|short on time)\b/],
    ['explain', /\b(explain|understand|confused|what is|how does|don'?t get)\b/],
    ['unmotivated', /\b(motivat|tired|give up|quit|why bother|pointless|break)\b/],
    ['plan', /\b(plan|schedule|organi[sz]e|week)\b/],
  ],
  es: [
    ['next', /\b(siguiente|qu[eé] hago|por d[oó]nde empiezo|empezar|ahora)\b/],
    ['behind', /\b(atrasad[oa]|al corriente|perd[ií]|tarde|retras|regreso|recuperaci[oó]n)\b/],
    ['no_time', /\b(no tengo tiempo|ocupad[oa]|solo (tengo )?\d+ ?min|10 minutos|poco tiempo|menos tiempo)\b/],
    ['explain', /\b(expl[ií]ca|entiendo|confund|qu[eé] es|c[oó]mo funciona|no me queda|ejemplo)\b/],
    ['unmotivated', /\b(motiva|cansad[oa]|rendir|renuncio|para qu[eé]|sin sentido|pausa|ganas)\b/],
    ['plan', /\b(plan|agenda|organiza|semana|horario)\b/],
  ],
}

function detectIntent(message: string, lang: Lang): Intent {
  const m = message.toLowerCase()
  for (const [intent, re] of intents[lang]) if (re.test(m)) return intent
  // Fall back to the other language: students mix them.
  const other: Lang = lang === 'es' ? 'en' : 'es'
  for (const [intent, re] of intents[other]) if (re.test(m)) return intent
  return 'other'
}

export class LocalMentorService implements MentorService {
  async send({ message, context }: { message: string; context: MentorContext; history: MentorMessage[] }): Promise<MentorReply> {
    await new Promise((r) => setTimeout(r, 350))

    const t = dict(context.language).mentor
    const r = t.replies

    if (DO_IT_FOR_ME.es.test(message) || DO_IT_FOR_ME.en.test(message)) {
      return { text: t.refusal, suggestions: t.refusalSuggest }
    }

    const next = context.next_activity
    const mins = context.estimated_time ?? context.available_time

    switch (detectIntent(message, context.language)) {
      case 'next':
        return { text: voice(context, r.next(next, mins)), suggestions: r.nextSuggest }
      case 'behind':
        return {
          text: voice(context, r.behind(context.progress, next, Math.min(10, mins))),
          suggestions: r.behindSuggest,
        }
      case 'no_time':
        return { text: voice(context, r.noTime(next)), suggestions: r.noTimeSuggest }
      case 'explain':
        return { text: voice(context, r.explain(context.course)), suggestions: r.explainSuggest }
      case 'unmotivated':
        return {
          text: voice(context, r.unmotivated(context.destination, next)),
          suggestions: r.unmotivatedSuggest,
        }
      case 'plan':
        return {
          text: voice(context, r.plan(context.available_time, next)),
          suggestions: r.planSuggest,
        }
      default:
        return { text: voice(context, r.other(context.course)), suggestions: r.otherSuggest }
    }
  }
}

/** Real implementation, for when the FARO backend exists. */
export class HttpMentorService implements MentorService {
  constructor(private baseUrl: string) {}

  async send(input: { message: string; context: MentorContext; history: MentorMessage[] }): Promise<MentorReply> {
    const res = await fetch(`${this.baseUrl}/api/mentor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Only the message and the bounded context leave the client.
      body: JSON.stringify({ message: input.message, context: input.context }),
    })
    if (!res.ok) throw new Error(`Mentor request failed: ${res.status}`)
    return (await res.json()) as MentorReply
  }
}

export const mentorService: MentorService = new LocalMentorService()

/** Kept for callers that want the style list in display order. */
export const mentorStyles: MentorStyle[] = ['direct', 'encouraging', 'detailed', 'friendly', 'challenge']
