/**
 * The whole icon set FARO uses, as inline SVG strokes. No icon font, no
 * dependency, and every glyph inherits `currentColor` so the same icon works
 * on the dark sidebar and on a white card.
 */
import type { ReactElement } from 'react'

export type IconName =
  | 'home'
  | 'route'
  | 'lighthouse'
  | 'chart'
  | 'chat'
  | 'arrow'
  | 'target'
  | 'trend'
  | 'gift'
  | 'user'
  | 'trophy'
  | 'wave'
  | 'book'
  | 'laptop'
  | 'refresh'
  | 'check'
  | 'clock'
  | 'pause'
  | 'flag'
  | 'chevron'
  | 'sun'
  | 'moon'
  | 'camera'
  | 'close'
  | 'lock'
  | 'spark'

const paths: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  route: (
    <>
      <path d="M4 6.5 9 4v14l-5 2.5Z" />
      <path d="M9 4l6 2.5V20L9 18" />
      <path d="M15 6.5 20 4v14l-5 2.5" />
    </>
  ),
  lighthouse: (
    <>
      <path d="M9.5 9h5l1.5 12h-8L9.5 9Z" />
      <path d="M9 13.5h6" />
      <rect x="9.5" y="5.5" width="5" height="3.5" rx="0.8" />
      <path d="M12 3v2.5M4.5 7l3 .8M19.5 7l-3 .8" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16v-5M12 16V6M17 16v-8" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5.5h16v10H9l-5 4v-14Z" />
      <path d="M8 10.5h8" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  trend: (
    <>
      <path d="M4 17 10 11l4 4 6-7" />
      <path d="M15 8h5v5" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M4 13h16M12 9v11" />
      <path d="M12 9c-1.5-2.5-4-3.5-5-2s1 3 5 2ZM12 9c1.5-2.5 4-3.5 5-2s-1 3-5 2Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1-3.5 3.8-5.5 7-5.5s6 2 7 5.5" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5.5a2.5 2.5 0 0 0 2.5 3M16 6h2.5A2.5 2.5 0 0 1 16 9" />
      <path d="M12 13v3M9 20h6M10 16h4v4" />
    </>
  ),
  wave: (
    <>
      <path d="M3 12c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" />
      <path d="M3 17c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" />
      <path d="M12 3v4M9.5 5.5 12 3l2.5 2.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5C7 4.5 9.5 5 12 6.5c2.5-1.5 5-2 8-1v13c-3-1-5.5-.5-8 1-2.5-1.5-5-2-8-1v-13Z" />
      <path d="M12 6.5v13" />
    </>
  ),
  laptop: (
    <>
      <rect x="5" y="5" width="14" height="10" rx="1.5" />
      <path d="M3 18.5h18" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 0 1-14.5 4.6" />
      <path d="M4 12a8 8 0 0 1 14.5-4.6" />
      <path d="M18 3.5v4h-4M6 20.5v-4h4" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  pause: (
    <>
      <path d="M9 5v14M15 5v14" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4h11l-2 4 2 4H6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3v2.2M12 18.8V21M4.4 4.4l1.6 1.6M18 18l1.6 1.6M3 12h2.2M18.8 12H21M4.4 19.6l1.6-1.6M18 6l1.6-1.6" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />,
  camera: (
    <>
      <path d="M4 8.5h3l1.5-2.5h7L17 8.5h3v11H4v-11Z" />
      <circle cx="12" cy="14" r="3.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
}

export function Icon({
  name,
  size = 20,
  stroke = 1.8,
  className,
}: {
  name: IconName
  size?: number
  stroke?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  )
}
