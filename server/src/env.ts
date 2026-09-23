/**
 * Configuration, read once at start-up.
 *
 * Every secret the backend holds enters through here and nowhere else. The
 * Canvas token is read from the environment (or `server/.env`, which git
 * ignores), kept in memory, and never written back out: not to logs, not to
 * responses, not to error messages. `describe()` is what the rest of the
 * code is allowed to print, and it does not contain the token.
 *
 * `.env` is parsed by hand rather than with a library because the file has
 * exactly one job and the parser is twelve lines. A backend whose whole
 * purpose is to keep one secret should not need third-party code to read it.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface Env {
  /** e.g. https://canvas.instructure.com - no trailing slash. */
  canvasApiUrl: string
  /** Bearer token for the Canvas API. Read once; never exposed. */
  canvasAccessToken: string
  /** Course FARO opens for. Optional: the first active enrollment is used when absent. */
  courseId: number | null
  host: string
  port: number
  /** Browser origins allowed to call this server. Everything else gets 403. */
  allowedOrigins: string[]
  /** Requests per minute per client before the server answers 429. */
  rateLimitPerMinute: number
  /** Seconds a Canvas call may take before it is abandoned. */
  canvasTimeoutMs: number
  logLevel: 'info' | 'debug'
}

const DEFAULTS = {
  host: '127.0.0.1',
  port: 3000,
  allowedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  rateLimitPerMinute: 120,
  canvasTimeoutMs: 10_000,
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

  if (!canvasApiUrl) throw new ConfigError('CANVAS_API_URL is required (e.g. https://canvas.instructure.com)')
  if (!/^https:\/\//.test(canvasApiUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(canvasApiUrl)) {
    throw new ConfigError('CANVAS_API_URL must use https:// (plain http is allowed only for localhost)')
  }
  if (!canvasAccessToken) throw new ConfigError('CANVAS_ACCESS_TOKEN is required')

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
    rateLimitPerMinute: Number(get('FARO_RATE_LIMIT_PER_MINUTE')) || DEFAULTS.rateLimitPerMinute,
    canvasTimeoutMs: Number(get('FARO_CANVAS_TIMEOUT_MS')) || DEFAULTS.canvasTimeoutMs,
    logLevel,
  }
}

/** The only representation of the config that may be logged or returned. */
export function describe(env: Env) {
  return {
    canvasHost: new URL(env.canvasApiUrl).host,
    courseId: env.courseId,
    host: env.host,
    port: env.port,
    allowedOrigins: env.allowedOrigins,
    tokenPresent: env.canvasAccessToken.length > 0,
  }
}
