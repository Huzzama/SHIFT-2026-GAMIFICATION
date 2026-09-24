/**
 * Entry point. `node src/index.ts` (Node 22.18+ strips the types itself).
 *
 * Reads `.env` from the `server/` directory, refuses to start with nothing to
 * serve (no Canvas and no mentor), and prints a start-up line that names the
 * Canvas host, the mentor model and the port - never a token or a key.
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildApp } from './app.ts'
import { ConfigError, describe, loadEnv } from './env.ts'

const serverDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function main() {
  let env
  try {
    env = loadEnv(serverDir)
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`[faro-server] ${err.message}`)
      console.error('[faro-server] Copy server/.env.example to server/.env and fill it in.')
      process.exit(1)
    }
    throw err
  }

  const app = buildApp({ env })
  await app.listen(env.port, env.host)

  const d = describe(env)
  console.log(`[faro-server] listening on http://${d.host}:${d.port}`)
  console.log(
    d.canvasHost
      ? `[faro-server] Canvas: ${d.canvasHost} (read-only, token in memory only)`
      : '[faro-server] Canvas: not configured (the extension can still run in mock mode)',
  )
  console.log(
    d.mentor
      ? `[faro-server] Mentor: Gemini ${d.mentor.model} (key in memory only)`
      : '[faro-server] Mentor: not configured (the extension uses its local mentor)',
  )

  const shutdown = () => {
    console.log('[faro-server] shutting down')
    void app.close().then(() => process.exit(0))
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

void main()
