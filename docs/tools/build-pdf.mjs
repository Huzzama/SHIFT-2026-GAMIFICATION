/**
 * Builds one PDF per book from the Markdown chapters.
 *
 *   npm install -g marked playwright   (once)
 *   node docs/tools/build-pdf.mjs
 *
 * Chapters are concatenated in file order (00-portada / 00-cover first), rendered to
 * HTML with a small print stylesheet, and printed with Chromium. Each chapter
 * starts on a new page.
 */
import { readdir, readFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { marked } = require('marked')
const { chromium } = require('playwright')

const here = dirname(fileURLToPath(import.meta.url))
const docs = resolve(here, '..')
const out = join(docs, 'pdf')

const BOOKS = [
  // Spanish
  { dir: '01-seguridad-y-datos', file: 'FARO-1-Seguridad-y-datos.pdf', title: 'Seguridad, protocolos y manejo de datos', lang: 'es' },
  { dir: '02-tutorial-de-uso', file: 'FARO-2-Tutorial-de-uso.pdf', title: 'Tutorial de uso', lang: 'es' },
  { dir: '03-documentacion-tecnica', file: 'FARO-3-Documentacion-tecnica.pdf', title: 'Documentación técnica e implementación en Canvas', lang: 'es' },
  // English
  { dir: 'en/01-security-and-data', file: 'FARO-1-Security-and-data.pdf', title: 'Security, protocols and data handling', lang: 'en' },
  { dir: 'en/02-user-guide', file: 'FARO-2-User-guide.pdf', title: 'User guide', lang: 'en' },
  { dir: 'en/03-technical-documentation', file: 'FARO-3-Technical-documentation.pdf', title: 'Technical documentation and Canvas implementation', lang: 'en' },
]

const CSS = `
  @page { size: A4; margin: 22mm 18mm 20mm 18mm; }
  :root { --ink: #16302b; --muted: #5b6b68; --line: #d9e2df; --accent: #0f5c4e; --soft: #eef5f2; }
  html { font-size: 11pt; }
  body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: var(--ink); line-height: 1.5; margin: 0; }
  .chapter { page-break-before: always; }
  .chapter:first-child { page-break-before: auto; }
  h1 { font-size: 22pt; margin: 0 0 12pt; color: var(--accent); letter-spacing: -0.01em; }
  h2 { font-size: 15pt; margin: 20pt 0 8pt; border-bottom: 1px solid var(--line); padding-bottom: 3pt; page-break-after: avoid; }
  h3 { page-break-after: avoid; }
  h3 { font-size: 12pt; margin: 14pt 0 6pt; }
  p { margin: 0 0 8pt; }
  ul, ol { margin: 0 0 8pt 18pt; padding: 0; }
  li { margin: 0 0 3pt; }
  code { font-family: Consolas, "Courier New", monospace; font-size: 9.5pt; background: var(--soft); padding: 1px 4px; border-radius: 3px; }
  pre { background: var(--soft); border: 1px solid var(--line); border-radius: 6px; padding: 8pt 10pt; font-size: 8pt; line-height: 1.35; overflow: hidden; white-space: pre; }
  pre code { background: none; padding: 0; font-size: inherit; }
  table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; font-size: 9.5pt; page-break-inside: auto; }
  th, td { border: 1px solid var(--line); padding: 4pt 6pt; vertical-align: top; text-align: left; }
  th { background: var(--soft); font-weight: 600; }
  tr { page-break-inside: avoid; }
  blockquote { margin: 8pt 0; padding: 6pt 12pt; border-left: 3px solid var(--accent); background: var(--soft); color: var(--ink); }
  blockquote p { margin: 0; }
  hr { border: 0; border-top: 1px solid var(--line); margin: 14pt 0; }
  strong { font-weight: 650; }
  a { color: var(--accent); text-decoration: none; }
  .cover h1 { font-size: 28pt; margin-top: 60pt; }
  .cover p:first-of-type { font-size: 13pt; color: var(--muted); }
`

async function buildBook(book) {
  const dir = join(docs, book.dir)
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort()
  const sections = []
  for (const [i, f] of files.entries()) {
    const md = await readFile(join(dir, f), 'utf8')
    const cls = i === 0 ? 'chapter cover' : 'chapter'
    sections.push(`<section class="${cls}">${marked.parse(md)}</section>`)
  }
  const html = `<!doctype html><html lang="${book.lang}"><head><meta charset="utf-8"><title>FARO — ${book.title}</title><style>${CSS}</style></head><body>${sections.join('\n')}</body></html>`
  return html
}

async function main() {
  await mkdir(out, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const book of BOOKS) {
      const html = await buildBook(book)
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'load' })
      const target = join(out, book.file)
      await page.pdf({
        path: target,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate:
          '<div style="width:100%;font-size:8pt;color:#5b6b68;padding:0 18mm;display:flex;justify-content:space-between;font-family:Segoe UI,Arial,sans-serif">' +
          `<span>FARO · ${book.title}</span><span class="pageNumber"></span></div>`,
        margin: { top: '22mm', right: '18mm', bottom: '20mm', left: '18mm' },
      })
      await page.close()
      console.log(`built ${target}`)
    }
  } finally {
    await browser.close()
  }
}

await main()
