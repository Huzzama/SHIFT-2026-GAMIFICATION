/**
 * A stand-in for the Gemini API, enough to test the mentor route offline.
 *
 * It checks the key header the way Google does, records every request body
 * so tests can assert what would have left for Google, and answers with a
 * reply chosen by the test (`reply`), a safety block, or a delay.
 */
import { createServer, type Server } from 'node:http'

export interface FakeGeminiOptions {
  key: string
}

export interface FakeGemini {
  server: Server
  baseUrl: string
  /** Parsed JSON bodies received, in order. */
  bodies: Record<string, unknown>[]
  /** URLs received (path + query), in order. */
  urls: string[]
  /** What the next call returns. */
  next: { kind: 'json'; text: string } | { kind: 'blocked' } | { kind: 'status'; status: number } | { kind: 'slow'; ms: number }
}

export async function startFakeGemini({ key }: FakeGeminiOptions): Promise<FakeGemini> {
  const fake: FakeGemini = {
    server: undefined as unknown as Server,
    baseUrl: '',
    bodies: [],
    urls: [],
    next: { kind: 'json', text: JSON.stringify({ text: 'ok', suggestions: [] }) },
  }

  fake.server = createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', async () => {
      fake.urls.push(req.url ?? '')
      if (req.headers['x-goog-api-key'] !== key) {
        res.writeHead(403, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: { code: 403, message: `API key ${String(req.headers['x-goog-api-key'])} not valid` } }))
      }
      fake.bodies.push(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      const next = fake.next
      if (next.kind === 'slow') await new Promise((r) => setTimeout(r, next.ms))
      if (next.kind === 'status') {
        res.writeHead(next.status, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: { code: next.status, message: 'upstream said no' } }))
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      if (next.kind === 'blocked') return res.end(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }))
      const text = next.kind === 'json' ? next.text : 'late'
      res.end(
        JSON.stringify({
          candidates: [
            {
              content: { role: 'model', parts: [{ text: 'thinking…', thought: true }, { text }] },
              finishReason: 'STOP',
            },
          ],
        }),
      )
    })
  })

  await new Promise<void>((resolve) => fake.server.listen(0, '127.0.0.1', resolve))
  const addr = fake.server.address()
  fake.baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`
  return fake
}
