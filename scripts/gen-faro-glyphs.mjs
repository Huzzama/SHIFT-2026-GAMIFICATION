// Regenerates src/components/faroGlyphs.tsx from design/faro-icons/svg/*.svg.
// Run: node scripts/gen-faro-glyphs.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const dir = 'design/faro-icons/svg'
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const key = (file) => camel(file.replace(/^faro-/, '').replace(/\.svg$/, '').replace(/^(t\d|state|nav)-/, (m) => (m.startsWith('t') ? '' : m)))

const out = []
for (const file of readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = readFileSync(`${dir}/${file}`, 'utf8')
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const jsx = inner
    .replace(/\s+\/>/g, ' />')
    .replace(/style="([^"]*)"/g, (_, css) => {
      const obj = css.split(';').filter(Boolean).map((d) => {
        const [p, ...v] = d.split(':')
        return `${camel(p.trim())}: '${v.join(':').trim()}'`
      })
      return `style={{ ${obj.join(', ')} }}`
    })
    .replace(/\b(stroke-width|stroke-dasharray|stroke-linejoin|stroke-linecap)=/g, (m) => camel(m.slice(0, -1)) + '=')
    .replace(/(\w+)="([^"]*)"/g, '$1="$2"')
    .replace(/\s{2,}/g, ' ')
  out.push(`  '${key(file)}': (\n    <>\n      ${jsx.trim()}\n    </>\n  ),`)
}

writeFileSync(
  'src/components/faroGlyphs.tsx',
  `/**
 * FARO's own icon language (v1.0), generated from design/faro-icons/svg by
 * scripts/gen-faro-glyphs.mjs. Do not edit by hand: change the SVG master
 * and regenerate. Strokes use currentColor; the single accent in each glyph
 * reads --faro-accent / --faro-accent-line / --faro-done / --faro-surface,
 * which tokens.css and Icon.tsx set per theme and per meaning.
 */
import type { ReactElement } from 'react'

export const faroGlyphs = {
${out.join('\n')}
} satisfies Record<string, ReactElement>

export type FaroGlyph = keyof typeof faroGlyphs
`,
)
console.log('glyphs:', out.length)
