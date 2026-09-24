/**
 * POST /api/mentor — the FARO mentor, answered by Gemini.
 *
 * Request:  { message, context (the eleven fields), history?, mode? }
 * Response: { text, suggestions, source: "gemini" | "guardrail", model }
 *
 * Status codes the extension relies on to fall back to its local mentor:
 *   503 mentor_not_configured   no GEMINI_API_KEY on this server
 *   502 mentor_key_rejected     Google refused the key (401/403)
 *   502 mentor_upstream         any other Gemini error
 *   502 mentor_blocked          the model's safety filter stopped the reply
 *   504 mentor_timeout
 *   429 mentor_rate_limited     per-client cap on model calls (cost control)
 *   400 invalid_request         the body failed the allow list
 *
 * Nothing about the conversation is logged: not the message, not the reply,
 * not the context. The log line is the same one every route gets (method,
 * path, status, duration).
 */
import { mentorEnabled, type Env } from '../env.ts'
import { json, type Handler } from '../http.ts'
import {
  callGemini,
  GeminiError,
  isDoItForMe,
  MentorInputError,
  sanitizeMentorRequest,
  type Fetch,
} from '../mentor.ts'

const REFUSAL = {
  es: {
    text: 'Eso no lo voy a escribir por ti: es tuyo, y es justo la parte que te enseña. Lo que sí puedo hacer es partirlo en pasos, revisar tu razonamiento o explicarte la parte que se atora. ¿Por dónde empezamos?',
    suggestions: ['Pártelo en pasos', 'Explícame el concepto', 'Revisa mi razonamiento'],
  },
  en: {
    text: 'I will not write graded work for you — it is yours, and it is the part that teaches you. I can break it into steps, check your reasoning, or explain the part that is stuck. Where do you want to start?',
    suggestions: ['Break it into steps', 'Explain the concept', 'Check my reasoning'],
  },
} as const

export function mentorRoute(env: Env, fetchImpl?: Fetch): Handler {
  const windows = new Map<string, { count: number; start: number }>()
  const allow = (key: string, now = Date.now()) => {
    const w = windows.get(key)
    if (!w || now - w.start >= 60_000) {
      windows.set(key, { count: 1, start: now })
      if (windows.size > 5000) windows.clear()
      return true
    }
    w.count += 1
    return w.count <= env.mentorPerMinute
  }

  return async (req) => {
    if (!mentorEnabled(env)) return json(503, { error: 'mentor_not_configured' })

    let parsed
    try {
      parsed = sanitizeMentorRequest(req.body)
    } catch (err) {
      if (err instanceof MentorInputError) return json(400, { error: 'invalid_request', detail: err.message })
      throw err
    }

    // Guardrail before the model: no call, no cost, same answer every time.
    if (isDoItForMe(parsed.message)) {
      return json(200, { ...REFUSAL[parsed.context.language], source: 'guardrail', model: null })
    }

    if (!allow(req.client)) return json(429, { error: 'mentor_rate_limited' }, { 'Retry-After': '60' })

    try {
      const reply = await callGemini(env, parsed, fetchImpl)
      return json(200, { ...reply, source: 'gemini', model: env.geminiModel })
    } catch (err) {
      if (err instanceof GeminiError) {
        if (err.kind === 'timeout') return json(504, { error: 'mentor_timeout' })
        if (err.kind === 'blocked') return json(502, { error: 'mentor_blocked' })
        if (err.kind === 'http' && (err.status === 401 || err.status === 403)) {
          return json(502, { error: 'mentor_key_rejected' })
        }
        return json(502, { error: 'mentor_upstream', upstreamStatus: err.status || null })
      }
      throw err
    }
  }
}
