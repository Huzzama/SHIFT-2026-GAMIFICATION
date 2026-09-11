/** The beacon mark. One shape, no glow effects, no "AI magic". */
export function Lighthouse({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 9h6l1.5 12h-9L9 9Z" fill="var(--mist-100)" stroke="var(--ink-900)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.6 13.5h4.8" stroke="var(--ink-900)" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="9.2" y="5.4" width="5.6" height="3.6" rx="1" fill="var(--beacon-400)" stroke="var(--ink-900)" strokeWidth="1.4" />
      <path d="M12 2.6v1.6M4.2 7.2l3 .7M19.8 7.2l-3 .7" stroke="var(--beacon-500)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
