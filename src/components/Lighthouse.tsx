/**
 * The beacon mark on its own — used wherever the wordmark is too wide
 * (tab bar, mentor bubbles). Inherits `currentColor`; no glow effects.
 */
import { LighthouseGlyph } from './Wordmark'

export function Lighthouse({ size = 20 }: { size?: number }) {
  return <LighthouseGlyph height={size} />
}
