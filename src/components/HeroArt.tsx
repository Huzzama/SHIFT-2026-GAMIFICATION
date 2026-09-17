/**
 * The lighthouse on its rock from the brand sheet, reduced to a flat SVG so
 * it ships inside the extension (no image hosts, no CSP exceptions).
 */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" fill="none" aria-hidden="true" className={className}>
      {/* beam */}
      <path d="M80 30 0 12v12l80 12Z" fill="#f2b95c" opacity="0.28" />
      <path d="M80 30l80-18v12l-80 12Z" fill="#f2b95c" opacity="0.28" />
      {/* hills */}
      <path d="M0 140c26-30 52-44 82-42 24 2 46 14 78 30v52H0Z" fill="#175a3e" />
      <path d="M40 140c18-16 40-24 66-22 22 2 36 10 54 20v2H40Z" fill="#5bcd8d" opacity="0.55" />
      <path d="M0 140c14-14 30-22 48-22 16 0 30 6 44 16v6H0Z" fill="#7a4fb5" opacity="0.65" />
      {/* rock */}
      <path d="M52 108c8-10 20-14 34-12 10 1 18 6 24 14v30H52Z" fill="#14302c" />
      {/* tower */}
      <path d="M70 108 74 46h12l4 62Z" fill="#f3f6f5" />
      <path d="M72.5 70h15l.6 8h-16.2ZM71.4 88h17.2l.6 8H70.8Z" fill="#d97a2f" />
      {/* gallery + lantern */}
      <rect x="70" y="42" width="20" height="5" rx="1" fill="#14302c" />
      <rect x="74" y="30" width="12" height="12" rx="1.5" fill="#14302c" />
      <rect x="76.5" y="32.5" width="7" height="7" rx="1" fill="#f2b95c" />
      <path d="M80 22l-7 8h14Z" fill="#14302c" />
      <circle cx="80" cy="36" r="10" fill="#f2b95c" opacity="0.22" />
    </svg>
  )
}
