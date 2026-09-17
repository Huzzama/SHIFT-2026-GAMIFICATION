/**
 * The FARO wordmark from the brand sheet: F, a lighthouse standing in for
 * the A, R, O — with the four-word tagline underneath. Pure SVG, inherits
 * `currentColor`, so it reads white on the teal sidebar and teal on paper.
 */
export function LighthouseGlyph({ height = 32 }: { height?: number }) {
  // Drawn in a 40x48 box: beam plates left and right, lantern, tapered tower.
  const w = (height * 40) / 48
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 40 48"
      fill="currentColor"
      aria-hidden="true"
      className="wordmark__glyph"
    >
      {/* beams */}
      <path d="M0 13.5 12.5 11v6L0 19.5Z" />
      <path d="M40 13.5 27.5 11v6L40 19.5Z" />
      {/* lantern room */}
      <path d="M20 2 14.5 8h11L20 2Z" />
      <rect x="15.5" y="8" width="9" height="6" rx="0.8" />
      <rect x="13.5" y="14" width="13" height="2.4" rx="0.6" />
      {/* tower: two legs and a mid band, so it still reads as an A */}
      <path d="M15.5 17.5h9L31 48h-6l-2-13h-6l-2 13h-6L15.5 17.5Zm2.3 10.5h4.4l-.7-5h-3Z" />
    </svg>
  )
}

export function Wordmark({
  size = 28,
  tagline = true,
  taglineText = 'Focus. Advance. Reward. Own.',
}: {
  size?: number
  tagline?: boolean
  taglineText?: string
}) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span className="wordmark" style={{ fontSize: size }}>
        <span>F</span>
        <LighthouseGlyph height={size * 1.22} />
        <span>RO</span>
      </span>
      {tagline && (
        <span className="wordmark__tag" style={{ fontSize: Math.max(9, size * 0.34) }}>
          {taglineText}
        </span>
      )}
    </div>
  )
}
