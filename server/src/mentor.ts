/**
 * The mentor's model call: Gemini, behind the backend.
 *
 * Three things live here and nowhere else:
 *
 *  1. `sanitizeMentorRequest` — the second privacy boundary. The extension
 *     already builds an eleven-field context (`src/lib/mentorContext.ts`);
 *     this re-checks every field against an allow list, drops anything
 *     extra, and caps every length. A buggy or tampered client cannot make
 *     the backend forward a name, an email or a grade.
 *  2. `systemPrompt` — the rules the model works under. The rules are the
 *     product: guide, never do graded work; no risk labels; short; ask more
 *     than tell; quote the student's own destination when motivation drops.
 *  3. `callGemini` — one POST to `models/{model}:generateContent`, with the
 *     key in a header (never in the URL, which proxies log), a timeout, and
 *     errors reduced to a status code. Gemini's error body is never read
 *     into a message or a log line.
 *
 * What leaves for Google: the sanitized context, the student's message and
 * the last few turns of this conversation. Nothing is stored here.
 */
import type { Env } from './env.ts'

/* ------------------------------------------------------------ contract */

export const GOALS = [
  'career_growth',
  'better_income',
  'career_change',
  'promotion',
  'finish_degree',
  'personal_achievement',
  'personal_development',
  'other',
] as const
export const FRICTION_STATES = ['FLOWING', 'FRICTION', 'DISCONNECTION', 'POSSIBLE_OVERWHELM', 'RECOVERY'] as const
export const STYLES = ['direct', 'encouraging', 'detailed', 'friendly', 'challenge'] as const
export const MODES = ['chat', 'teach', 'focus', 'recovery', 'planning'] as const
export const LANGS = ['es', 'en'] as const

export type MentorMode = (typeof MODES)[number]

/** Exactly the eleven fields of the extension's `MentorContext`. */
export interface MentorContext {
  course: string
  progress: number
  next_activity: string | null
  estimated_time: number | null
  student_goal: (typeof GOALS)[number]
  destination: string
  available_time: number
  momentum: number
  friction_state: (typeof FRICTION_STATES)[number]
  style: (typeof STYLES)[number]
  language: (typeof LANGS)[number]
}

export interface Turn {
  role: 'student' | 'faro'
  text: string
}

export interface MentorRequest {
  message: string
  context: MentorContext
  history: Turn[]
  mode: MentorMode
}

export interface MentorReply {
  text: string
  suggestions: string[]
}

export const LIMITS = {
  message: 1000,
  turn: 1000,
  historyTurns: 8,
  course: 120,
  activity: 160,
  destination: 280,
  suggestion: 60,
  suggestions: 3,
} as const

export class MentorInputError extends Error {}

const str = (v: unknown, max: number, field: string): string => {
  if (typeof v !== 'string') throw new MentorInputError(`${field} must be a string`)
  return v.trim().slice(0, max)
}
const num = (v: unknown, min: number, max: number, field: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new MentorInputError(`${field} must be a number`)
  return Math.min(max, Math.max(min, Math.round(v)))
}
const oneOf = <T extends string>(v: unknown, list: readonly T[], field: string): T => {
  if (typeof v !== 'string' || !(list as readonly string[]).includes(v)) throw new MentorInputError(`${field} is not allowed`)
  return v as T
}

/** Rebuilds the request from scratch: only known fields, only bounded values. */
export function sanitizeMentorRequest(raw: unknown): MentorRequest {
  if (!raw || typeof raw !== 'object') throw new MentorInputError('body must be an object')
  const b = raw as Record<string, unknown>
  const c = (b.context ?? null) as Record<string, unknown> | null
  if (!c || typeof c !== 'object') throw new MentorInputError('context is required')

  const message = str(b.message, LIMITS.message, 'message')
  if (!message) throw new MentorInputError('message is empty')

  const context: MentorContext = {
    course: str(c.course, LIMITS.course, 'course'),
    progress: num(c.progress, 0, 100, 'progress'),
    next_activity: c.next_activity == null ? null : str(c.next_activity, LIMITS.activity, 'next_activity'),
    estimated_time: c.estimated_time == null ? null : num(c.estimated_time, 0, 600, 'estimated_time'),
    student_goal: oneOf(c.student_goal, GOALS, 'student_goal'),
    destination: str(c.destination ?? '', LIMITS.destination, 'destination'),
    available_time: num(c.available_time, 0, 600, 'available_time'),
    momentum: num(c.momentum, 0, 100, 'momentum'),
    friction_state: oneOf(c.friction_state, FRICTION_STATES, 'friction_state'),
    style: oneOf(c.style, STYLES, 'style'),
    language: oneOf(c.language, LANGS, 'language'),
  }

  const history: Turn[] = Array.isArray(b.history)
    ? b.history
        .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object')
        .filter((t) => (t.role === 'student' || t.role === 'faro') && typeof t.text === 'string')
        .map((t) => ({ role: t.role as Turn['role'], text: (t.text as string).trim().slice(0, LIMITS.turn) }))
        .filter((t) => t.text.length > 0)
        .slice(-LIMITS.historyTurns)
    : []

  const mode: MentorMode = b.mode == null ? 'chat' : oneOf(b.mode, MODES, 'mode')

  return { message, context, history, mode }
}

/* --------------------------------------------------------------- rules */

const DO_IT_FOR_ME = [
  /\b(write|do|solve|answer|complete|submit|finish)\b.{0,30}\b(my|the)\b.{0,20}\b(quiz|exam|test|assignment|essay|homework|report|reflection)\b/i,
  /\b(escribe|haz|hazme|resuelve|responde|contesta|completa|termina|entrega)\b.{0,30}\b(mi|el|la|este|esta)\b.{0,24}\b(quiz|examen|tarea|ensayo|reporte|reflexi[oó]n|actividad|cuestionario)\b/i,
]

/** Asked to do graded work: answered here, without spending a model call. */
export function isDoItForMe(message: string): boolean {
  return DO_IT_FOR_ME.some((re) => re.test(message))
}

const STYLE_TEXT: Record<MentorContext['style'], string> = {
  direct: 'Direct: short sentences, no warm-up.',
  encouraging: 'Encouraging: warm but brief; acknowledge effort once, never gush.',
  detailed: 'Detailed: slightly longer, explain the why in one extra sentence.',
  friendly: 'Friendly: casual and relaxed, like a classmate who has done the course.',
  challenge: 'Challenge me: push a little, ask a harder question, still kind.',
}

const MODE_TEXT: Record<MentorMode, string> = {
  chat: 'Open conversation. Answer, then usually ask one short question back.',
  teach:
    'TEACH MODE. First turn on a topic: explain it in at most three short sentences with one concrete everyday example ' +
    '(a small business, a family project), then ask exactly ONE question that checks understanding. ' +
    'When the student answers: say in one line whether it is right, explain why in one or two sentences, ' +
    'then either ask one slightly harder follow-up or suggest applying it to their next activity. Never give graded answers.',
  focus:
    'FOCUS MODE. The student has little time. Give exactly one task that fits available_time and one line on how to start. ' +
    'No extra explanation, no list.',
  recovery:
    'RECOVERY MODE. The student is coming back after a gap. Never mention backlog or overdue counts. ' +
    'Say their progress is saved, propose one small step of at most 10 minutes, and ask if they want to start.',
  planning:
    'PLANNING MODE. Build a small, realistic plan from the free time the student states: one line per day, ' +
    'day -> one task. Keep it smaller than their available time. End by asking if they want to keep it.',
}

export function systemPrompt(ctx: MentorContext, mode: MentorMode): string {
  const lang = ctx.language === 'es' ? 'Spanish (Mexico), using "tú"' : 'English'
  return [
    'You are FARO, a learning companion for adult students who study asynchronous courses while they work.',
    'You are part of the university\'s academic accompaniment. You are not a generic chatbot.',
    '',
    'Rules that never change, whatever the style or mode:',
    '1. Guide learning; never produce graded work (essays, assignment deliverables, quiz or exam answers). Offer steps, hints, examples, or check the student\'s reasoning instead.',
    '2. Never label the student: no "at risk", "falling behind", "failing", no counts of overdue work.',
    '3. Be brief: at most 90 words, plain text, no markdown, no emojis, at most one question per reply.',
    '4. Ask more than you tell. Prefer a short question that makes the student think.',
    '5. Calm and human. No cheerleading ("You can do it!", "Amazing!"). Short acknowledgements are fine: "Got it.", "Take your time.", "That makes sense."',
    '6. When motivation is low, connect today\'s small step to the destination the student wrote, quoting a few of their words.',
    '7. Only use the facts in the context below. Do not invent due dates, grades, points or course content you were not given; say you are not sure instead.',
    '8. Deadlines, extensions and grades belong to the institution; never promise them.',
    '9. If the student mentions a crisis or wanting to hurt themselves, respond with care, stop the study talk, and encourage them to contact university student support or local emergency services right away.',
    '',
    `Reply in ${lang}.`,
    `Style: ${STYLE_TEXT[ctx.style]}`,
    `Mode: ${MODE_TEXT[mode]}`,
    '',
    'Student context (the only facts you know about them):',
    JSON.stringify(ctx),
    '',
    'Return JSON only: {"text": "<your reply>", "suggestions": ["<up to 3 short replies the student might tap next, written in their voice>"]}',
  ].join('\n')
}

/* ---------------------------------------------------------------- call */

export class GeminiError extends Error {
  readonly kind: 'http' | 'timeout' | 'network' | 'blocked' | 'empty'
  readonly status: number
  constructor(kind: GeminiError['kind'], status = 0) {
    super(`Gemini ${kind}${status ? ` ${status}` : ''}`)
    this.kind = kind
    this.status = status
  }
}

export type Fetch = typeof fetch

interface GeminiPart {
  text?: string
  thought?: boolean
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[]
  promptFeedback?: { blockReason?: string }
}

export async function callGemini(env: Env, req: MentorRequest, fetchImpl: Fetch = fetch): Promise<MentorReply> {
  const contents = [
    ...req.history.map((t) => ({ role: t.role === 'faro' ? 'model' : 'user', parts: [{ text: t.text }] })),
    { role: 'user', parts: [{ text: req.message }] },
  ]

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt(req.context, req.mode) }] },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  }

  const url = `${env.geminiApiBase}/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent`
  let res: Response
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiApiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(env.geminiTimeoutMs),
    })
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    throw new GeminiError(name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network')
  }

  if (!res.ok) {
    await res.body?.cancel().catch(() => {})
    throw new GeminiError('http', res.status)
  }

  const data = (await res.json()) as GeminiResponse
  if (data.promptFeedback?.blockReason) throw new GeminiError('blocked')
  const cand = data.candidates?.[0]
  if (cand?.finishReason === 'SAFETY' || cand?.finishReason === 'PROHIBITED_CONTENT') throw new GeminiError('blocked')

  const raw = (cand?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
    .trim()
  if (!raw) throw new GeminiError('empty')

  return parseReply(raw)
}

/** Accepts the JSON we asked for, and survives a model that answered in prose anyway. */
export function parseReply(raw: string): MentorReply {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  try {
    const obj = JSON.parse(cleaned) as { text?: unknown; suggestions?: unknown }
    const text = typeof obj.text === 'string' ? obj.text.trim() : ''
    if (text) {
      const suggestions = Array.isArray(obj.suggestions)
        ? obj.suggestions
            .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
            .map((s) => s.trim().slice(0, LIMITS.suggestion))
            .slice(0, LIMITS.suggestions)
        : []
      return { text, suggestions }
    }
  } catch {
    /* fall through to plain text */
  }
  return { text: cleaned, suggestions: [] }
}
