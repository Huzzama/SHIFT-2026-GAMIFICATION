/**
 * Configuration, read once at start-up.
 *
 * Every secret the backend holds enters through here and nowhere else: the
 * Canvas token and the Gemini API key. Both are read from the environment
 * (or `server/.env`, which git ignores), kept in memory, and never written
 * back out: not to logs, not to responses, not to error messages.
 * `describe()` is what the rest of the code is allowed to print, and it
 * contains neither.
 *
 * `.env` is parsed by hand rather than with a library because the file has
 * exactly one job and the parser is twelve lines. A backend whose whole
 * purpose is to keep one secret should not need third-party code to read it.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface Env {
  /** e.g. https://canvas.instructure.com - no trailing slash. Empty when Canvas is not configured. */
  canvasApiUrl: string
  /** Bearer token for the Canvas API. Read once; never exposed. Empty when Canvas is not configured. */
  canvasAccessToken: string
  /** Course FARO opens for. Optional: the first active enrollment is used when absent. */
  courseId: number | null
  host: string
  port: number
  /** Browser origins allowed to call this server. Everything else gets 403. */
  allowedOrigins: string[]
  /**
   * Also accept any Chrome extension origin (chrome-extension://<id>). On by
   * default only when the server listens on loopback, so a developer can load
   * the unpacked extension without first copying its id into .env. A deployed
   * server should list the exact extension id instead (FARO_STRICT_ORIGINS=true).
   */
  allowExtensionOrigins: boolean
  /** Requests per minute per client before the server answers 429. */
  rateLimitPerMinute: number
  /** Seconds a Canvas call may take before it is abandoned. */
  canvasTimeoutMs: number
  logLevel: 'info' | 'debug'
  /** Gemini API key for the mentor. Empty = mentor off (the extension falls back to its local mentor). */
  geminiApiKey: string
  /** Model code, e.g. gemini-3.5-flash. */
  geminiModel: string
  /** Base URL of the Gemini API. Overridable only so tests can point at a fake. */
  geminiApiBase: string
  geminiTimeoutMs: number
  /** Mentor requests per minute per client, on top of the global limit. Caps cost. */
  mentorPerMinute: number
}

const DEFAULTS = {
  host: '127.0.0.1',
  port: 3000,
  allowedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  rateLimitPerMinute: 120,
  canvasTimeoutMs: 10_000,
  geminiModel: 'gemini-3.5-flash',
  geminiApiBase: 'https://generativelanguage.googleapis.com',
  geminiTimeoutMs: 20_000,
  mentorPerMinute: 20,
} as const

/** KEY=value lines; `#` comments; optional surrounding quotes. Nothing else. */
export function parseDotenv(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function loadDotenv(dir: string): Record<string, string> {
  try {
    return parseDotenv(readFileSync(resolve(dir, '.env'), 'utf8'))
  } catch {
    return {}
  }
}

export class ConfigError extends Error {}

/**
 * Builds the config from `process.env`, falling back to `.env` in `dir`.
 *
 * Process environment wins over the file, which is the convention that lets
 * a deployment override a checked-in default without editing files.
 */
export function loadEnv(dir = process.cwd(), source: NodeJS.ProcessEnv = process.env): Env {
  const file = loadDotenv(dir)
  const get = (k: string) => source[k] ?? file[k] ?? ''

  const canvasApiUrl = get('CANVAS_API_URL').replace(/\/+$/, '')
  const canvasAccessToken = get('CANVAS_ACCESS_TOKEN')
  const geminiApiKey = get('GEMINI_API_KEY')

  // Canvas is optional so the mentor can be tried against mock course data,
  // but half a Canvas configuration is a mistake worth stopping for.
  if (canvasApiUrl && !canvasAccessToken) throw new ConfigError('CANVAS_ACCESS_TOKEN is required when CANVAS_API_URL is set')
  if (canvasAccessToken && !canvasApiUrl) throw new ConfigError('CANVAS_API_URL is required when CANVAS_ACCESS_TOKEN is set')
  if (canvasApiUrl && !isSafeUrl(canvasApiUrl)) {
    throw new ConfigError('CANVAS_API_URL must use https:// (plain http is allowed only for localhost)')
  }
  if (!canvasApiUrl && !geminiApiKey) {
    throw new ConfigError('Nothing to serve: set CANVAS_API_URL + CANVAS_ACCESS_TOKEN, GEMINI_API_KEY, or both')
  }

  const geminiApiBase = (get('GEMINI_API_BASE') || DEFAULTS.geminiApiBase).replace(/\/+$/, '')
  if (!isSafeUrl(geminiApiBase)) throw new ConfigError('GEMINI_API_BASE must use https://')

  const courseIdRaw = get('FARO_COURSE_ID')
  const courseId = courseIdRaw ? Number(courseIdRaw) : null
  if (courseId !== null && !Number.isInteger(courseId)) throw new ConfigError('FARO_COURSE_ID must be an integer')

  const origins = get('FARO_ALLOWED_ORIGINS')
  const logLevel = get('FARO_LOG_LEVEL') === 'debug' ? 'debug' : 'info'

  return {
    canvasApiUrl,
    canvasAccessToken,
    courseId,
    host: get('FARO_HOST') || DEFAULTS.host,
    port: Number(get('FARO_PORT')) || DEFAULTS.port,
    allowedOrigins: origins
      ? origins.split(',').map((o) => o.trim()).filter(Boolean)
      : [...DEFAULTS.allowedOrigins],
    allowExtensionOrigins: get('FARO_STRICT_ORIGINS') !== 'true' && isLoopback(get('FARO_HOST') || DEFAULTS.host),
    rateLimitPerMinute: Number(get('FARO_RATE_LIMIT_PER_MINUTE')) || DEFAULTS.rateLimitPerMinute,
    canvasTimeoutMs: Number(get('FARO_CANVAS_TIMEOUT_MS')) || DEFAULTS.canvasTimeoutMs,
    logLevel,
    geminiApiKey,
    geminiModel: get('GEMINI_MODEL') || DEFAULTS.geminiModel,
    geminiApiBase,
    geminiTimeoutMs: Number(get('GEMINI_TIMEOUT_MS')) || DEFAULTS.geminiTimeoutMs,
    mentorPerMinute: Number(get('FARO_MENTOR_PER_MINUTE')) || DEFAULTS.mentorPerMinute,
  }
}

function isLoopback(host: string): boolean {
  return host === '127.0.0.1' || host === 'localhost' || host === '::1'
}

function isSafeUrl(u: string): boolean {
  return /^https:\/\//.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)/.test(u)
}

export const canvasEnabled = (env: Env) => env.canvasApiUrl.length > 0 && env.canvasAccessToken.length > 0
export const mentorEnabled = (env: Env) => env.geminiApiKey.length > 0

/** The only representation of the config that may be logged or returned. */
export function describe(env: Env) {
  return {
    canvasHost: canvasEnabled(env) ? new URL(env.canvasApiUrl).host : null,
    courseId: env.courseId,
    host: env.host,
    port: env.port,
    allowedOrigins: env.allowedOrigins,
    allowExtensionOrigins: env.allowExtensionOrigins,
    tokenPresent: env.canvasAccessToken.length > 0,
    mentor: mentorEnabled(env) ? { provider: 'gemini', model: env.geminiModel } : null,
  }
}
