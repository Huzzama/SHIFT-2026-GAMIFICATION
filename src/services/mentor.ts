/**
 * FARO Mentor service.
 *
 * The contract the UI depends on is `MentorService`. Three implementations:
 *
 *  - `LocalMentorService`: deterministic, offline, no API key. Always
 *    available, so the demo never breaks.
 *  - `HttpMentorService`: POST /api/mentor on the FARO backend, which calls
 *    Gemini with the key it holds. Only the eleven-field context, the
 *    message and the last turns of this conversation are sent.
 *  - `HybridMentorService`: Gemini through the backend, the local mentor
 *    whenever the backend or the model cannot answer.
 *
 * Which one runs is decided at run time (`VITE_MENTOR_MODE`, default `auto`):
 * `auto` asks the backend's `/health` whether it has a mentor configured and
 * uses Gemini if so — start the server with a key and the extension picks it
 * up, no rebuild. `local` never leaves the device; `gemini` always tries.
 *
 * The structured parts of the mentor (the check-in after a gap, Focus,
 * planning, points) are not here: they are computed in the view from real
 * course data, so their numbers never come from a model's guess.
 *
 * Guardrail that holds in both: the mentor guides, it does not produce graded
 * work. Style changes the voice, never the rules. Language changes the words,
 * never the rules either.
 */
import { canvasConfig } from '@/data/canvas/config'
import { dict } from '@/i18n'
import type { Lang, MentorContext, MentorMessage, MentorMode, MentorStyle } from '@/types'

export interface MentorReply {
  text: string
  suggestions?: string[]
  source: 'gemini' | 'local'
  /** True when Gemini was asked for and the local mentor answered instead. */
  fellBack?: boolean
}

export interface MentorInput {
  message: string
  context: MentorContext
  history: MentorMessage[]
  mode?: MentorMode
}

export interface MentorService {
  send(input: MentorInput): Promise<MentorReply>
}

const envMentorMode = (import.meta.env.VITE_MENTOR_MODE as string | undefined) ?? 'auto'

/** How the build chooses the mentor. Only a Gemini-backed answer ever leaves the device. */
export const mentorMode: 'auto' | 'local' | 'gemini' =
  envMentorMode === 'gemini' || envMentorMode === 'local' ? envMentorMode : 'auto'

export type MentorAvailability = 'checking' | 'gemini' | 'local'

let probe: { at: number; result: Promise<boolean> } | null = null
const PROBE_TTL_MS = 30_000

/**
 * Does the FARO backend have Gemini configured? One small GET to /health,
 * cached for 30 s so opening the mentor never waits on it twice. Nothing
 * about the student is sent.
 */
export function probeGemini(force = false): Promise<boolean> {
  if (mentorMode === 'local') return Promise.resolve(false)
  if (mentorMode === 'gemini') return Promise.resolve(true)
  if (!force && probe && Date.now() - probe.at < PROBE_TTL_MS) return probe.result
  const result = fetch(`${canvasConfig.apiUrl}/health`, { signal: AbortSignal.timeout(2_000) })
    .then((r) => (r.ok ? r.json() : null))
    .then((body: { mentor?: unknown } | null) => !!body?.mentor)
    .catch(() => false)
  probe = { at: Date.now(), result }
  return result
}

/* ------------------------------------------------------------- guardrails */

export const isDoItForMe = (message: string) => DO_IT_FOR_ME.es.test(message) || DO_IT_FOR_ME.en.test(message)

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
  async send({ message, context }: MentorInput): Promise<MentorReply> {
    await new Promise((r) => setTimeout(r, 350))

    const t = dict(context.language).mentor
    const r = t.replies
    const local = (text: string, suggestions: string[]): MentorReply => ({ text, suggestions, source: 'local' })

    if (isDoItForMe(message)) return local(t.refusal, t.refusalSuggest)

    const next = context.next_activity
    const mins = context.estimated_time ?? context.available_time

    switch (detectIntent(message, context.language)) {
      case 'next':
        return local(voice(context, r.next(next, mins)), r.nextSuggest)
      case 'behind':
        return local(voice(context, r.behind(context.progress, next, Math.min(10, mins))), r.behindSuggest)
      case 'no_time':
        return local(voice(context, r.noTime(next)), r.noTimeSuggest)
      case 'explain':
        return local(voice(context, r.explain(context.course)), r.explainSuggest)
      case 'unmotivated':
        return local(voice(context, r.unmotivated(context.destination, next)), r.unmotivatedSuggest)
      case 'plan':
        return local(voice(context, r.plan(context.available_time, next)), r.planSuggest)
      default:
        return local(voice(context, r.other(context.course)), r.otherSuggest)
    }
  }
}

/** How many past turns go with a request. The backend trims to the same number. */
export const HISTORY_TURNS = 8

/** Gemini through the FARO backend. The key lives on the server; nothing here holds one. */
export class HttpMentorService implements MentorService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async send(input: MentorInput): Promise<MentorReply> {
    const history = input.history
      .filter((m) => m.text.trim().length > 0)
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role, text: m.text }))
    const res = await fetch(`${this.baseUrl}/api/mentor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The bounded context, the message and the recent turns: nothing else leaves the client.
      body: JSON.stringify({ message: input.message, context: input.context, history, mode: input.mode ?? 'chat' }),
      signal: AbortSignal.timeout(25_000),
    })
    if (!res.ok) throw new Error(`mentor ${res.status}`)
    const body = (await res.json()) as { text?: string; suggestions?: string[] }
    if (!body.text) throw new Error('mentor empty')
    return { text: body.text, suggestions: body.suggestions ?? [], source: 'gemini' }
  }
}

/** Gemini first; the local mentor whenever Gemini cannot answer. The student always gets a reply. */
export class HybridMentorService implements MentorService {
  private readonly remote: MentorService
  private readonly local: MentorService

  constructor(remote: MentorService, local: MentorService) {
    this.remote = remote
    this.local = local
  }

  async send(input: MentorInput): Promise<MentorReply> {
    // Graded-work requests never need a model call.
    if (isDoItForMe(input.message)) return this.local.send(input)
    try {
      return await this.remote.send(input)
    } catch {
      return { ...(await this.local.send(input)), fellBack: true }
    }
  }
}

/** Asks `/health` first (cached); Gemini when the backend has it, the local mentor otherwise. */
export class AutoMentorService implements MentorService {
  private readonly hybrid: MentorService
  private readonly local: MentorService

  constructor(hybrid: MentorService, local: MentorService) {
    this.hybrid = hybrid
    this.local = local
  }

  async send(input: MentorInput): Promise<MentorReply> {
    return (await probeGemini()) ? this.hybrid.send(input) : this.local.send(input)
  }
}

const local = new LocalMentorService()
const hybrid = new HybridMentorService(new HttpMentorService(canvasConfig.apiUrl), local)

export const mentorService: MentorService =
  mentorMode === 'local' ? local : mentorMode === 'gemini' ? hybrid : new AutoMentorService(hybrid, local)

/** Kept for callers that want the style list in display order. */
export const mentorStyles: MentorStyle[] = ['direct', 'encouraging', 'detailed', 'friendly', 'challenge']
