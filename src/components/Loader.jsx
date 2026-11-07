import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/motion'
import { profile } from '../data'

/* ------------------------------------------------------------------
   Loader — "ignite" intro. One file: component + styles.

   The idea: the progress you watch fill up is what opens the page.

   Intro
   - Avatar springs in, wrapped by three rings: a progress ring, a
     slowly turning dashed ring, and an orbit with two small dots.
   - A dotted grid lights up outward from the avatar as loading advances.
   - A huge counter fills from the bottom like liquid.
   - A status line decodes through dev-style steps.

   Exit (when `done` flips to true)
   - Ring completes, outer rings burst outward, content shrinks away.
   - A point of light ignites where the avatar was and blooms into a
     circle that opens the page underneath (iris reveal).
   - `onFinish` fires the moment the iris starts, so the page's own
     entrance plays as it opens.

   Behaviour
   - Exit waits for the intro to finish, so fast loads never cut it short.
   - Page scroll is locked while the loader is on screen.
   - Reduced motion: static layout, short fade out.
------------------------------------------------------------------ */

const REDUCED = '(prefers-reduced-motion: reduce)'
const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789/<>_-'

// [progress threshold, status text]
const STATUS = [
  [0, 'starting dev server'],
  [0.2, 'resolving imports'],
  [0.45, 'compiling styles'],
  [0.7, 'hydrating components'],
  [1, 'ready'],
]

export default function Loader({ done, onFinish }) {
  const root = useRef(null)
  const sheetRef = useRef(null)
  const edgeRef = useRef(null)
  const ringRef = useRef(null)
  const numRef = useRef(null)
  const statusRef = useRef(null)

  const finish = useRef(onFinish)
  finish.current = onFinish

  const progress = useRef({ value: 0 }) // 0 → 1, drives everything
  const statusIdx = useRef(0)
  const reduced = useRef(false)

  const introTl = useRef(null)
  const idleTl = useRef(null)
  const scrambleTl = useRef(null)
  const ctxRef = useRef(null)
  const unlock = useRef(() => {})

  const gradient = useId().replace(/:/g, '')

  // Status line: letters decode left to right
  const scrambleTo = (text) => {
    const el = statusRef.current
    scrambleTl.current?.kill()

    if (reduced.current) {
      el.textContent = text
      return
    }

    const o = { p: 0 }
    scrambleTl.current = gsap.to(o, {
      p: 1,
      duration: 0.5,
      ease: 'none',
      onUpdate() {
        const keep = Math.floor(o.p * text.length)
        el.textContent =
          text.slice(0, keep) +
          Array.from(text.slice(keep), (c) =>
            c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
          ).join('')
      },
      onComplete() {
        el.textContent = text
      },
    })
  }

  // One place that turns progress into visuals. Written straight to the
  // DOM so loading never re-renders the component.
  const draw = () => {
    const el = root.current
    if (!el) return

    const v = progress.current.value

    ringRef.current.style.strokeDashoffset = String(1 - v) // pathLength = 1
    numRef.current.textContent = String(Math.round(v * 100))
    el.style.setProperty('--lit', v.toFixed(3))

    let idx = 0
    STATUS.forEach(([threshold], i) => {
      if (v >= threshold) idx = i
    })
    if (idx !== statusIdx.current) {
      statusIdx.current = idx
      scrambleTo(STATUS[idx][1])
    }
  }

  /* Intro + scroll lock (layout effect: no flash of the finished state) */
  useLayoutEffect(() => {
    const el = root.current
    const q = gsap.utils.selector(el)
    reduced.current = matchMedia(REDUCED).matches

    const html = document.documentElement
    const previousOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    unlock.current = () => {
      html.style.overflow = previousOverflow
      unlock.current = () => {}
    }

    if (reduced.current) {
      progress.current.value = 0.88
      draw()
      return () => unlock.current()
    }

    const ctx = gsap.context(() => {
      // All SVG groups scale and spin around the middle of the 200×200 box
      gsap.set(q('.ldr-ring, .ldr-dashed, .ldr-orbit'), { svgOrigin: '100 100' })

      const tl = gsap.timeline()
      tl.from(q('.ldr-glow'), { opacity: 0, duration: 0.9, ease: 'power2.out' }, 0)
        .fromTo(
          q('.ldr-face'),
          { scale: 0, rotate: -20 },
          { scale: 1, rotate: 0, duration: 1.2, ease: 'elastic.out(1, 0.55)' },
          0.1
        )
        .fromTo(
          q('.ldr-ring'),
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' },
          0.2
        )
        .fromTo(
          q('.ldr-dashed'),
          { scale: 0.4, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.6)' },
          0.3
        )
        .fromTo(
          q('.ldr-orbit'),
          { scale: 0.3, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.6)' },
          0.4
        )
        .fromTo(
          q('.ldr-bubble'),
          { scale: 0, opacity: 0, rotate: -8 },
          { scale: 1, opacity: 1, rotate: -3, duration: 0.8, ease: 'back.out(2.5)' },
          0.8
        )
        .from(
          q('.ldr-hud > *'),
          { y: 24, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' },
          0.7
        )
      introTl.current = tl

      // Rings keep turning while we wait
      gsap.to(q('.ldr-dashed'), { rotation: 360, duration: 14, ease: 'none', repeat: -1 })
      gsap.to(q('.ldr-orbit'), { rotation: -360, duration: 6, ease: 'none', repeat: -1 })

      // Creep toward 88%; the last stretch happens when the page is ready
      gsap.to(progress.current, {
        value: 0.88,
        duration: 2.6,
        ease: 'power2.out',
        onUpdate: draw,
      })

      // Gentle float
      idleTl.current = gsap.to(q('.ldr-badge'), {
        y: -5,
        duration: 1.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.2,
      })
    }, el)
    ctxRef.current = ctx

    return () => {
      ctx.revert()
      scrambleTl.current?.kill()
      unlock.current()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Exit */
  useEffect(() => {
    if (!done) return

    const el = root.current
    const q = gsap.utils.selector(el)
    let cancelled = false
    let exitTl = null

    const exit = () => {
      if (cancelled) return

      idleTl.current?.kill()
      gsap.killTweensOf(progress.current)

      if (reduced.current) {
        progress.current.value = 1
        draw()
        exitTl = gsap
          .timeline()
          .to(el, { opacity: 0, duration: 0.3, delay: 0.15 })
          .add(() => finish.current?.())
          .set(el, { display: 'none' })
          .add(() => unlock.current())
        return
      }

      // Iris geometry: centred on the avatar, big enough to clear every corner
      const sheet = sheetRef.current
      const edge = edgeRef.current
      const rect = el.querySelector('.ldr-badge').getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const maxR =
        Math.hypot(
          Math.max(cx, window.innerWidth - cx),
          Math.max(cy, window.innerHeight - cy)
        ) + 12

      sheet.style.setProperty('--cx', `${cx}px`)
      sheet.style.setProperty('--cy', `${cy}px`)
      edge.style.left = `${cx}px`
      edge.style.top = `${cy}px`

      const iris = { r: 0 }
      const setIris = () => {
        sheet.style.setProperty('--r', `${iris.r}px`)
        // glowing rim sits just outside the hole
        const d = (iris.r + 4) * 2
        edge.style.width = `${d}px`
        edge.style.height = `${d}px`
      }

      exitTl = gsap
        .timeline()
        // 1. ring completes
        .to(progress.current, {
          value: 1,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: draw,
        })
        // 2. beat: avatar swells, outer rings burst away
        .to(q('.ldr-badge'), { y: 0, scale: 1.08, duration: 0.3, ease: 'power2.out' }, '-=0.15')
        .to(
          q('.ldr-dashed, .ldr-orbit'),
          { scale: 2.6, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06 },
          '<'
        )
        // 3. everything else gets out of the way
        .to(
          q('.ldr-bubble'),
          { scale: 0, opacity: 0, duration: 0.4, ease: 'back.in(2)' },
          '-=0.35'
        )
        .to(
          q('.ldr-hud > *'),
          { y: 28, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power2.in' },
          '<'
        )
        .to(
          q('.ldr-face, .ldr-ring'),
          { scale: 0, opacity: 0, duration: 0.45, ease: 'back.in(2)' },
          '-=0.1'
        )
        // 4. ignite: page starts its own entrance, the iris opens
        .add(() => {
          sheet.classList.add('is-opening')
          el.style.pointerEvents = 'none'
          finish.current?.()
        })
        .set(edge, { opacity: 1 })
        .to(iris, { r: maxR, duration: 1.35, ease: 'expo.inOut', onUpdate: setIris })
        .to(edge, { opacity: 0, duration: 0.3, ease: 'power1.in' }, '-=0.3')
        .set(el, { display: 'none' })
        .add(() => {
          ctxRef.current?.kill() // stop the rings from spinning behind display:none
          scrambleTl.current?.kill()
          unlock.current()
        })
    }

    // Let the intro finish first if it is still playing
    if (introTl.current && !reduced.current) introTl.current.then(exit)
    else exit()

    return () => {
      cancelled = true
      exitTl?.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  return (
    <div className="ldr" ref={root} role="status" aria-label="Loading">
      <style>{css}</style>

      {/* Background layer. This is the part the iris cuts open. */}
      <div className="ldr-sheet" ref={sheetRef}>
        <div className="ldr-glow" />
        <div className="ldr-grid" />
      </div>

      <div className="ldr-stack">
        <span className="ldr-bubble hand">hi, it’s {profile.name}!</span>

        <div className="ldr-badge">
          <svg className="ldr-rings" viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <linearGradient
                id={gradient}
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="200"
                y2="200"
              >
                <stop offset="0" stopColor="#36dfff" />
                <stop offset="1" stopColor="#2a6dff" />
              </linearGradient>
            </defs>

            {/* Progress ring */}
            <g className="ldr-ring">
              <circle className="ldr-track" cx="100" cy="100" r="70" />
              <circle
                className="ldr-progress"
                ref={ringRef}
                cx="100"
                cy="100"
                r="70"
                pathLength="1"
                transform="rotate(-90 100 100)"
                stroke={`url(#${gradient})`}
              />
            </g>

            {/* Slow dashed ring */}
            <g className="ldr-dashed">
              <circle cx="100" cy="100" r="82" />
            </g>

            {/* Orbit with two dots */}
            <g className="ldr-orbit">
              <circle className="ldr-orbit-line" cx="100" cy="100" r="93" />
              <circle className="ldr-dot-a" cx="100" cy="7" r="3" />
              <circle className="ldr-dot-b" cx="100" cy="193" r="2" />
            </g>
          </svg>

          <img className="ldr-face" src={profile.avatar} alt="" />
        </div>
      </div>

      <div className="ldr-hud">
        <p className="ldr-status">
          <span ref={statusRef}>{STATUS[0][1]}</span>
          <i className="ldr-caret" />
        </p>

        <p className="ldr-count" aria-hidden="true">
          <span className="ldr-num" ref={numRef}>0</span>
          <span className="ldr-pct">%</span>
        </p>
      </div>

      {/* Glowing rim of the iris */}
      <div className="ldr-edge" ref={edgeRef} aria-hidden="true" />
    </div>
  )
}

/* ------------------------------------------------------------------
   Styles — change the colours here
------------------------------------------------------------------ */

const css = `
.ldr {
  --ldr-bg: #070f20;
  --ldr-ink: #eaf4ff;
  --ldr-muted: #7f90ad;
  --ldr-cyan: #6fe3ff;
  --ldr-navy: #0b1731;
  --lit: 0; /* 0 → 1, set from JS as loading advances */

  position: fixed;
  z-index: 10000;
  inset: 0;
  overflow: hidden;

  color: var(--ldr-ink);
}

.ldr *,
.ldr *::before,
.ldr *::after {
  box-sizing: border-box;
}

/* ---------- Background (cut open by the iris) ---------- */

.ldr-sheet {
  position: absolute;
  inset: 0;
  background: var(--ldr-bg);
}

.ldr-sheet.is-opening {
  -webkit-mask-image: radial-gradient(
    circle at var(--cx) var(--cy),
    transparent var(--r),
    #000 calc(var(--r) + 1px)
  );
  mask-image: radial-gradient(
    circle at var(--cx) var(--cy),
    transparent var(--r),
    #000 calc(var(--r) + 1px)
  );
}

.ldr-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    55% 45% at 50% 52%,
    rgba(42, 109, 255, 0.24),
    transparent 70%
  );
}

/* Dot grid that lights up outward with progress */
.ldr-grid {
  position: absolute;
  inset: 0;

  background-image: radial-gradient(
    rgba(145, 180, 255, 0.3) 1px,
    transparent 1.3px
  );
  background-size: 26px 26px;

  -webkit-mask-image: radial-gradient(
    circle farthest-corner at 50% 52%,
    #000 calc(var(--lit) * 60% - 28%),
    transparent calc(var(--lit) * 60%)
  );
  mask-image: radial-gradient(
    circle farthest-corner at 50% 52%,
    #000 calc(var(--lit) * 60% - 28%),
    transparent calc(var(--lit) * 60%)
  );
}

/* ---------- Centre stack ---------- */

.ldr-stack {
  position: absolute;
  inset: 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;

  pointer-events: none;
}

.ldr .ldr-bubble {
  position: relative;

  padding: 10px 18px;

  color: var(--ldr-navy);
  font-size: 20px;
  line-height: 1.1;
  white-space: nowrap;

  background: var(--ldr-ink);
  border-radius: 18px;

  transform-origin: 50% 100%;
}

.ldr .ldr-bubble::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -7px;

  width: 16px;
  height: 16px;
  margin-left: -8px;

  background: inherit;
  border-radius: 3px;
  transform: rotate(45deg);
}

.ldr-badge {
  position: relative;
  width: min(220px, 56vw);
  aspect-ratio: 1;
}

.ldr-rings {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ldr-rings circle {
  fill: none;
  stroke-linecap: round;
}

.ldr-track {
  stroke: rgba(145, 180, 255, 0.16);
  stroke-width: 3;
}

.ldr-progress {
  stroke-width: 3;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  filter: drop-shadow(0 0 6px rgba(80, 200, 255, 0.55));
}

.ldr-dashed circle {
  stroke: rgba(111, 227, 255, 0.45);
  stroke-width: 1.5;
  stroke-dasharray: 1.5 8;
}

.ldr-orbit-line {
  stroke: rgba(145, 180, 255, 0.12);
  stroke-width: 1;
}

.ldr-dot-a {
  fill: #6fe3ff;
  filter: drop-shadow(0 0 5px rgba(80, 220, 255, 0.9));
}

.ldr-dot-b {
  fill: #438bff;
  filter: drop-shadow(0 0 4px rgba(67, 139, 255, 0.9));
}

.ldr-face {
  position: absolute;
  inset: 20%;

  width: 60%;
  height: 60%;

  object-fit: cover;
  border-radius: 50%;

  box-shadow:
    0 0 0 4px var(--ldr-bg),
    0 14px 40px rgba(42, 109, 255, 0.35);
}

/* ---------- Status + counter ---------- */

.ldr-hud {
  position: absolute;
  inset: auto 0 0 0;

  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;

  padding: clamp(20px, 4vw, 48px);

  pointer-events: none;
}

.ldr-hud p {
  margin: 0;
}

.ldr-status {
  display: flex;
  align-items: center;

  min-height: 1.4em;

  color: var(--ldr-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
}

.ldr-caret {
  width: 7px;
  height: 14px;
  margin-left: 6px;

  background: var(--ldr-cyan);

  animation: ldr-blink 1s steps(1) infinite;
}

@keyframes ldr-blink {
  50% { opacity: 0; }
}

.ldr-count {
  display: flex;
  align-items: flex-start;
  gap: 4px;

  line-height: 0.82;
}

/* The number fills from the bottom like liquid as loading advances */
.ldr-num {
  display: block;

  font-size: clamp(64px, 15vw, 190px);
  font-weight: 800;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;

  color: transparent;
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  background-image: linear-gradient(
    to top,
    var(--ldr-ink) calc(var(--lit) * 100%),
    rgba(234, 244, 255, 0.13) calc(var(--lit) * 100%)
  );
}

.ldr-pct {
  margin-top: 0.4em;

  color: var(--ldr-cyan);
  font-size: clamp(20px, 3.4vw, 40px);
  font-weight: 700;
}

/* ---------- Iris rim ---------- */

.ldr-edge {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;

  border: 3px solid rgba(150, 240, 255, 0.95);
  border-radius: 50%;

  box-shadow:
    0 0 28px 6px rgba(54, 223, 255, 0.65),
    0 0 90px 20px rgba(42, 109, 255, 0.35);

  transform: translate(-50%, -50%);
  opacity: 0;

  pointer-events: none;
}

@media (max-width: 480px) {
  .ldr .ldr-bubble { font-size: 18px; }
}

@media (prefers-reduced-motion: reduce) {
  .ldr-caret { animation: none; }
}
`