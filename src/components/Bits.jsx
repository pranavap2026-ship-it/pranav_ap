/* Small hand-drawn bits used around the site. */
export function Squiggle({ className = '' }) {
  return (
    <svg className={`squiggle ${className}`} viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 14 C 30 2, 50 24, 80 12 S 130 2, 160 13 S 215 24, 245 11 S 285 4, 298 12" pathLength="1" />
    </svg>
  )
}

export function Arrow({ className = '' }) {
  return (
    <svg className={`hand-arrow ${className}`} viewBox="0 0 120 80" aria-hidden="true">
      <path d="M6 10 C 40 4, 86 18, 100 60" pathLength="1" />
      <path d="M86 52 L 101 64 L 108 46" pathLength="1" />
    </svg>
  )
}

export function Spark({ className = '' }) {
  return (
    <svg className={`spark ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0c.8 6.4 3.6 9.6 12 12-8.4 2.4-11.2 5.6-12 12-.8-6.4-3.6-9.6-12-12C8.4 9.6 11.2 6.4 12 0z" />
    </svg>
  )
}
