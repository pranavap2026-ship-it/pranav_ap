import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { gsap, useGSAP } from '../lib/motion'
import { about, profile } from '../data'
import { Squiggle } from './Bits'
import Wave from './Wave'

/* ------------------------------------------------------------------
   About — one file: component + styles.

   Photo deck
   - Cards sit in a fan. The top card can be swiped / dragged away (touch
     and mouse), clicked, tapped, or driven from the keyboard. It then
     slides to the back of the deck.
   - Dots under the deck show which role is on top and jump to any role.
   - On desktop the whole deck tilts a little toward the cursor.

   Copy
   - Card, title words, squiggle and paragraphs reveal in one sequence.
   - Stat numbers count up when they scroll into view.

   Layout
   - Two columns from 1000px, single column below.
   - Colours come from the surrounding text colour, so it works on a
     light or dark section. Only --abt-accent is fixed.

   Delete the old .stack*, .stack-card*, .ab-* and .role-* CSS: this file
   replaces it.
------------------------------------------------------------------ */

const REDUCED = '(prefers-reduced-motion: reduce)'

// Where each card sits in the fan, by position in the deck (0 = top)
const FAN = [
  { x: 0, y: 0, r: 0, s: 1 },
  { x: 16, y: -10, r: 4.5, s: 0.965 },
  { x: -18, y: -18, r: -5, s: 0.93 },
  { x: 28, y: -26, r: 8, s: 0.9 },
]

// Next order: advance one card, or bring `target` to the top
function reorder(order, target) {
  if (target === null) return [...order.slice(1), order[0]]
  const k = order.indexOf(target)
  return [...order.slice(k), ...order.slice(0, k)]
}

/** A fanned stack of photos. Swipe, click, tap, or use the dots. */
function PhotoStack() {
  const count = about.photos.length

  const [order, setOrder] = useState(() => about.photos.map((_, i) => i))

  const stage = useRef(null)
  const tilt = useRef(null)
  const stack = useRef(null)
  const busy = useRef(false)
  const drag = useRef(null)
  const orderRef = useRef(order)
  orderRef.current = order

  const topInner = () =>
    stack.current?.querySelector('.abt-card.is-top .abt-inner')

  /* Throw the top card away, then send it to the back of the deck.
     GSAP only moves .abt-inner; the fan position lives on the outer card
     in CSS, so the two never fight over the same transform. */
  const next = (dir = 1, target = null) => {
    const el = stack.current
    if (busy.current || !el || count < 2) return
    if (target !== null && target === orderRef.current[0]) return

    const inner = topInner()
    if (!inner) return

    busy.current = true

    const commit = () => {
      // Commit the new order and reset the thrown card in the same frame
      flushSync(() => setOrder((o) => reorder(o, target)))
      gsap.set(inner, { clearProps: 'transform,opacity' })
      busy.current = false
    }

    if (matchMedia(REDUCED).matches) {
      commit()
      return
    }

    gsap.to(inner, {
      x: dir * el.offsetWidth * 1.05,
      y: -30,
      rotate: dir * 16,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: commit,
    })
  }

  /* Pointer: a short press is a click, a drag is a swipe */
  const onPointerDown = (e) => {
    if (busy.current) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    drag.current = {
      x0: e.clientX,
      dx: 0,
      moved: false,
      t0: performance.now(),
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer already gone */
    }
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return

    d.dx = e.clientX - d.x0
    if (Math.abs(d.dx) > 6) d.moved = true

    if (d.moved) {
      const inner = topInner()
      if (inner) {
        gsap.set(inner, {
          x: d.dx,
          y: -Math.abs(d.dx) * 0.06,
          rotate: d.dx * 0.05,
        })
      }
    }
  }

  const endDrag = (e, cancelled) => {
    const d = drag.current
    drag.current = null
    if (!d) return

    const speed = d.dx / Math.max(1, performance.now() - d.t0) // px per ms

    if (!d.moved) {
      if (!cancelled) next(1)
      return
    }

    if (!cancelled && (Math.abs(d.dx) > 90 || Math.abs(speed) > 0.5)) {
      next(d.dx >= 0 ? 1 : -1)
      return
    }

    // Not far enough: spring back
    const inner = topInner()
    if (inner) {
      gsap.to(inner, {
        x: 0,
        y: 0,
        rotate: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.6)',
      })
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
      e.preventDefault()
      next(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      next(-1)
    }
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Entrance + idle float
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const inners = gsap.utils.toArray('.abt-inner', stage.current)

        // Deepest card first, so the top card lands last
        gsap.from(inners, {
          x: -90,
          y: 100,
          rotate: -14,
          scale: 0.9,
          opacity: 0,
          stagger: { each: 0.12, from: 'end' },
          duration: 1.2,
          ease: 'back.out(1.4)',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: stage.current,
            start: 'top 80%',
            once: true,
          },
        })

        gsap.to(tilt.current, {
          y: -6,
          duration: 2.8,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 1.6,
        })
      })

      // Tilt toward the cursor (mouse devices only)
      mm.add(
        '(hover: hover) and (prefers-reduced-motion: no-preference)',
        () => {
          const el = stage.current
          const rx = gsap.quickTo(tilt.current, 'rotationX', {
            duration: 0.6,
            ease: 'power3.out',
          })
          const ry = gsap.quickTo(tilt.current, 'rotationY', {
            duration: 0.6,
            ease: 'power3.out',
          })

          const move = (e) => {
            const r = el.getBoundingClientRect()
            const x = (e.clientX - r.left) / r.width - 0.5
            const y = (e.clientY - r.top) / r.height - 0.5
            ry(x * 10)
            rx(-y * 8)
          }
          const leave = () => {
            rx(0)
            ry(0)
          }

          el.addEventListener('pointermove', move)
          el.addEventListener('pointerleave', leave)

          return () => {
            el.removeEventListener('pointermove', move)
            el.removeEventListener('pointerleave', leave)
          }
        }
      )

      return () => mm.revert()
    },
    { scope: stage }
  )

  return (
    <div className="abt-stage ui" ref={stage}>
      <div className="abt-tilt" ref={tilt}>
        <div
          className="abt-stack"
          ref={stack}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endDrag(e, false)}
          onPointerCancel={(e) => endDrag(e, true)}
          onKeyDown={onKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Shuffle photos"
        >
          {about.photos.map((src, i) => {
            const pos = order.indexOf(i)
            const fan = FAN[Math.min(pos, FAN.length - 1)]
            const role = i === 0 ? 'Full-Stack Developer' : about.roles[i]

            return (
              <figure
                key={src}
                data-i={i}
                className={`abt-card${pos === 0 ? ' is-top' : ''}`}
                data-far={pos >= FAN.length ? '' : undefined}
                aria-hidden={pos === 0 ? undefined : true}
                style={{
                  zIndex: 20 - pos,
                  '--x': `${fan.x}px`,
                  '--y': `${fan.y}px`,
                  '--r': `${fan.r}deg`,
                  '--s': fan.s,
                  '--b': 1 - Math.min(pos, 3) * 0.1,
                }}
              >
                <div className="abt-inner">
                  <img
                    src={i === 0 ? '/img/photos/pranav-profile.jpg' : src}
                    alt={
                      i === 0
                        ? 'Pranav AP - Full Stack Developer'
                        : `${profile.name}, ${about.roles[i]}`
                    }
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                    className={i === 0 ? 'pranav-profile-photo' : undefined}
                  />

                  <figcaption className="abt-cap">
                    <span className="abt-kicker hand">I'm a</span>
                    <span className="abt-role">{role}</span>
                  </figcaption>
                </div>
              </figure>
            )
          })}
        </div>
      </div>

      <div className="abt-meta">
        <div className="abt-dots" role="group" aria-label="Choose a role">
          {about.photos.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`abt-dot${order[0] === i ? ' is-on' : ''}`}
              aria-label={`Show ${i === 0 ? 'Full-Stack Developer' : about.roles[i]}`}
              aria-pressed={order[0] === i}
              onClick={() => next(1, i)}
            />
          ))}
        </div>

        <span className="abt-hint hand">
          <span className="abt-hint-mouse">
            click the stack to see my other roles ↻
          </span>
          <span className="abt-hint-touch">
            swipe the stack to see my other roles
          </span>
        </span>
      </div>
    </div>
  )
}

export default function About() {
  const root = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const el = root.current
        const copy = el.querySelector('.abt-copy')
        const pill = el.querySelector('.abt-pill')
        const words = el.querySelectorAll('.abt-title .abt-w > span')
        const squiggle = el.querySelectorAll('.abt-title .squiggle path')
        const paras = el.querySelectorAll('.abt-p')
        const statsEl = el.querySelector('.abt-stats')
        const stats = gsap.utils.toArray('.abt-stat', el)

        // Squiggle starts undrawn (measured, not guessed)
        squiggle.forEach((path) => {
          const length = path.getTotalLength?.() || 500
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
        })

        /* 1. Copy card: one sequence, top to bottom */
        gsap
          .timeline({
            scrollTrigger: { trigger: copy, start: 'top 80%', once: true },
          })
          .from(copy, {
            y: 40,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          })
          .from(
            pill,
            { y: 14, opacity: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' },
            '-=0.55'
          )
          .from(
            words,
            { yPercent: 110, duration: 0.9, stagger: 0.08, ease: 'power4.out' },
            '-=0.45'
          )
          .to(
            squiggle,
            { strokeDashoffset: 0, duration: 1.1, stagger: 0.12, ease: 'power2.inOut' },
            '-=0.4'
          )
          .from(
            paras,
            {
              y: 24,
              opacity: 0,
              stagger: 0.12,
              duration: 0.8,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
            },
            '-=0.8'
          )

        /* 2. Stats: cards rise, numbers count up */
        const trigger = { trigger: statsEl, start: 'top 90%', once: true }

        gsap.from(stats, {
          y: 40,
          opacity: 0,
          scale: 0.92,
          stagger: 0.1,
          duration: 0.8,
          ease: 'back.out(1.6)',
          clearProps: 'transform,opacity',
          scrollTrigger: trigger,
        })

        const restore = []

        stats.forEach((stat, index) => {
          const b = stat.querySelector('b')
          if (!b) return

          const raw = b.textContent
          const m = raw.match(/^(\d+(?:\.\d+)?)(.*)$/s)
          if (!m) return // not a number, leave as is

          const end = parseFloat(m[1])
          const decimals = (m[1].split('.')[1] || '').length
          const suffix = m[2]
          const o = { n: 0 }
          const format = () => `${o.n.toFixed(decimals)}${suffix}`

          b.textContent = format()
          restore.push(() => {
            b.textContent = raw
          })

          gsap.to(o, {
            n: end,
            duration: 1.6,
            delay: 0.15 + index * 0.1,
            ease: 'power2.out',
            onUpdate: () => {
              b.textContent = format()
            },
            onComplete: () => {
              b.textContent = raw
            },
            scrollTrigger: trigger,
          })
        })

        // If motion preferences change, put the real numbers back
        return () => restore.forEach((fn) => fn())
      })

      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <>
      <style>{css}</style>

      <section className="about section tint" id="about" ref={root}>
        <Wave />

        <div className="wrap abt-grid">
          {/* Left: photo deck */}
          <PhotoStack />

          {/* Right: copy */}
          <div className="abt-copy ui">
            <span className="pill abt-pill">About me</span>

            <h2 className="h2 abt-title">
              <span className="abt-w"><span>A</span></span>{' '}
              <span className="abt-w"><span>little</span></span>{' '}
              <span className="hl">
                <span className="abt-w"><span>about</span></span>{' '}
                <span className="abt-w"><span>me</span></span>
                <Squiggle />
              </span>
            </h2>

            {about.paragraphs.map((p) => (
              <p className="abt-p" key={p}>
                {p}
              </p>
            ))}

            <div className="abt-stats">
              {about.stats.map((s) => (
                <div className="abt-stat" key={s.label}>
                  <b>{s.value}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------
   Styles
------------------------------------------------------------------ */

const css = `
/* Cards fly sideways during a swipe: never let that scroll the page */
.about { overflow-x: clip; }

.abt-grid {
  --abt-accent: #3b8bff;
  --abt-surface: rgba(128, 150, 190, 0.08);
  --abt-edge: rgba(128, 150, 190, 0.22);
  --abt-spring: cubic-bezier(0.34, 1.45, 0.55, 1);

  position: relative;
  z-index: 1;

  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(32px, 6vw, 72px);
  align-items: center;
}

@supports (background: color-mix(in srgb, red 10%, transparent)) {
  .abt-grid {
    --abt-surface: color-mix(in srgb, currentColor 6%, transparent);
    --abt-edge: color-mix(in srgb, currentColor 16%, transparent);
  }
}

@supports (transition-timing-function: linear(0, 1)) {
  .abt-grid {
    --abt-spring: linear(
      0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%,
      1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%,
      1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%,
      0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1
    );
  }
}

@media (min-width: 1000px) {
  .abt-grid {
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  }
}

.abt-grid *,
.abt-grid *::before,
.abt-grid *::after {
  box-sizing: border-box;
}

/* ---------- Photo deck ---------- */

.abt-stage {
  justify-self: center;

  width: min(100%, 400px);
  padding-inline: 20px; /* room for the fan to spread */

  perspective: 1000px;
  -webkit-tap-highlight-color: transparent;
}

@media (min-width: 1000px) {
  .abt-stage { width: min(100%, 440px); }
}

.abt-tilt {
  will-change: transform;
}

.abt-stack {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;

  touch-action: pan-y; /* vertical scroll stays native, horizontal is ours */
  -webkit-user-select: none;
  user-select: none;
  outline: none;
}

@media (hover: hover) {
  .abt-stack { cursor: grab; }
  .abt-stack:active { cursor: grabbing; }
}

.abt-stack:focus-visible {
  outline: 2px solid var(--abt-accent);
  outline-offset: 10px;
  border-radius: 30px;
}

/* Outer card = fan position (CSS). Inner = motion (GSAP). */
.abt-card {
  position: absolute;
  inset: 0;
  margin: 0;

  transform-origin: 50% 100%;
  transform:
    translate3d(var(--x), var(--y), 0)
    rotate(var(--r))
    scale(var(--s));

  transition:
    transform 0.75s var(--abt-spring),
    opacity 0.4s ease;

  will-change: transform;
}

.abt-card[data-far] {
  opacity: 0;
  pointer-events: none;
}

.abt-inner {
  position: absolute;
  inset: 0;

  overflow: hidden;
  border-radius: 26px;

  background: #0b1731;

  box-shadow:
    0 28px 50px -22px rgba(5, 12, 30, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.abt-inner img {
  display: block;
  width: 100%;
  height: 100%;

  object-fit: cover;
  object-position: 50% 20%;

  filter: brightness(var(--b, 1));
  transition: filter 0.5s ease;

  -webkit-user-drag: none;
  pointer-events: none;
}

/* Light sweep across the top card on hover */
.abt-inner::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;

  background: linear-gradient(
    115deg,
    transparent 38%,
    rgba(255, 255, 255, 0.16) 50%,
    transparent 62%
  );

  transform: translateX(-120%);
  pointer-events: none;
}

@media (hover: hover) {
  .abt-card.is-top:hover .abt-inner::after {
    transform: translateX(120%);
    transition: transform 0.9s ease;
  }
}

.abt-cap {
  position: absolute;
  z-index: 2;
  inset: auto 0 0 0;

  display: flex;
  flex-direction: column;
  gap: 2px;

  padding: 64px 22px 20px;

  color: #fff;
  background: linear-gradient(to top, rgba(4, 10, 24, 0.9), transparent);

  transition: opacity 0.4s ease;
}

.abt-card:not(.is-top) .abt-cap { opacity: 0; }

.abt-kicker {
  color: #9fe6ff;
  font-size: 1.05rem;
  line-height: 1.1;
}

.abt-role {
  font-size: clamp(1.15rem, 1rem + 0.8vw, 1.45rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

/* ---------- Dots + hint ---------- */

.abt-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;

  margin-top: 26px;
}

.abt-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.abt-dot {
  position: relative;

  width: 8px;
  height: 8px;
  padding: 0;

  border: 0;
  border-radius: 99px;

  background: var(--abt-edge);
  cursor: pointer;

  transition:
    width 0.5s var(--abt-spring),
    background 0.3s ease;
}

/* Bigger touch target than the dot itself */
.abt-dot::before {
  content: "";
  position: absolute;
  inset: -12px -5px;
}

.abt-dot.is-on {
  width: 26px;
  background: var(--abt-accent);
}

.abt-dot:focus-visible {
  outline: 2px solid var(--abt-accent);
  outline-offset: 3px;
}

.abt-hint {
  font-size: 1rem;
  text-align: center;
  opacity: 0.7;
}

.abt-hint-touch { display: none; }

@media (hover: none) {
  .abt-hint-mouse { display: none; }
  .abt-hint-touch { display: inline; }
}

/* ---------- Copy ---------- */

.abt-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(14px, 2vw, 20px);

  padding: clamp(22px, 4vw, 42px);

  background: var(--abt-surface);
  border: 1px solid var(--abt-edge);
  border-radius: clamp(22px, 3vw, 30px);

  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);

  box-shadow: 0 24px 60px -30px rgba(5, 12, 30, 0.45);
}

.abt-title {
  margin: 0;
}

/* Each title word reveals from behind a mask */
.abt-w {
  display: inline-block;
  overflow: hidden;
  vertical-align: top;

  padding-bottom: 0.14em;
  margin-bottom: -0.14em;
}

.abt-w > span {
  display: inline-block;
}

.abt-p {
  max-width: 62ch;
  margin: 0;

  font-size: clamp(1rem, 0.96rem + 0.25vw, 1.125rem);
  line-height: 1.75;

  opacity: 0.88;
}

/* ---------- Stats ---------- */

.abt-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
  gap: 12px;

  width: 100%;
  margin-top: 6px;
}

.abt-stat {
  padding: 16px 16px 14px;

  background: var(--abt-surface);
  border: 1px solid var(--abt-edge);
  border-radius: 18px;

  transition:
    transform 0.4s var(--abt-spring),
    border-color 0.3s ease;
}

@media (hover: hover) {
  .abt-stat:hover {
    transform: translateY(-5px);
    border-color: var(--abt-accent);
  }
}

.abt-stat b {
  display: block;

  font-size: clamp(1.7rem, 1.3rem + 1.6vw, 2.4rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;

  color: transparent;
  background: linear-gradient(135deg, #36c9ff, #2f6bff);
  -webkit-background-clip: text;
  background-clip: text;
}

.abt-stat span {
  display: block;
  margin-top: 8px;

  font-size: 0.82rem;
  line-height: 1.3;

  opacity: 0.72;
}

/* ---------- Small screens ---------- */

@media (max-width: 520px) {
  .abt-stage { padding-inline: 18px; }

  .abt-stats { gap: 10px; }

  .abt-stat { padding: 14px 14px 12px; }

  /* odd one out gets the full row */
  .abt-stat:last-child:nth-child(odd) { grid-column: 1 / -1; }
}

/* ---------- Reduced motion ---------- */

@media (prefers-reduced-motion: reduce) {
  .abt-card,
  .abt-dot,
  .abt-stat,
  .abt-inner img {
    transition-duration: 0.01ms !important;
  }

  .abt-card.is-top:hover .abt-inner::after {
    transition: none;
  }
}
`