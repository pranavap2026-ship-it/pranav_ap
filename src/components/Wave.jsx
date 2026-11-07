import { useEffect, useId, useRef, useState } from 'react'

const W = 1440

/** Two seamless periods of a wave, so the layer can drift left forever without a visible seam. */
const band = (base, amp) => {
  let d = `M0 120 L0 ${base}`
  for (let k = 0; k < 2; k++) {
    const x = k * W
    d += ` C ${x + 240} ${base - amp}, ${x + 480} ${base - amp}, ${x + 720} ${base} S ${x + 1200} ${base + amp}, ${x + W} ${base}`
  }
  return `${d} L${2 * W} 120 Z`
}

const BACK = band(46, 26)  // slowest, faintest layer
const MID = band(62, 20)   // faster layer, drifts the other way
const EDGE = 'M0 64 C 180 10, 360 6, 540 40 S 900 112, 1080 76 S 1340 14, 1440 40'
const FRONT = `${EDGE} L1440 120 L0 120 Z`

/**
 * Curved section edge. Place it inside a section: it sits on the section's top border
 * and the front shape is filled with that section's background colour (--sec-bg).
 * Behind it, two translucent blue layers drift sideways and a light glint travels along the edge.
 * Animations only run while the wave is on screen. Needs React 18+ (useId).
 *
 * Props: flip (mirror the shape), glow (edge line + glint, default true)
 */
export default function Wave({ flip = false, glow = true }) {
  const ref = useRef(null)
  const [live, setLive] = useState(false)
  const gid = 'wv' + useId().replace(/:/g, '')

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setLive(true); return }
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <svg
      ref={ref}
      className={`wave${flip ? ' flip' : ''}${live ? ' is-live' : ''}`}
      viewBox={`0 0 ${W} 120`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#2F7BFF" />
          <stop offset="0.5" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#2F7BFF" />
        </linearGradient>
      </defs>

      <g className="wv-back"><path d={BACK} /></g>
      <g className="wv-mid"><path d={MID} /></g>
      <path d={FRONT} />

      {glow && (
        <>
          <path className="wv-edge" d={EDGE} stroke={`url(#${gid})`} />
          <path className="wv-glint" d={EDGE} pathLength="1" />
        </>
      )}
    </svg>
  )
}