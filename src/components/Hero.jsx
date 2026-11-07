import { useRef } from 'react'
import { gsap, useGSAP, goTo } from '../lib/motion'
import { profile, heroCounts } from '../data'
import { Squiggle, Arrow, Spark } from './Bits'

const NO_MOTION = '(prefers-reduced-motion: reduce)'
const MOTION = '(prefers-reduced-motion: no-preference)'

/**
 * Hero. One intro sequence on load, then a pointer-driven 3D portrait card with a soft glare,
 * and a gentle parallax as you scroll away. All of it is skipped for reduced motion.
 */
export default function Hero({ ready }) {
  const root = useRef(null)

  // ───────── 1. Intro sequence ─────────
  useGSAP(() => {
    if (!ready) return
    const mm = gsap.matchMedia()

    // reduced motion: show the drawn lines in their final state, nothing animates
    mm.add(NO_MOTION, () => {
      gsap.set('.hr-name .squiggle path, .hr-note .hand-arrow path', { strokeDashoffset: 0 })
    })

    mm.add(MOTION, () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from('.hr-hello', { y: 20, opacity: 0, duration: 0.8 })
        .to('.hr-wave', { keyframes: { rotate: [0, 18, -8, 14, -4, 0] }, duration: 1.2, ease: 'power1.inOut', transformOrigin: '70% 70%' }, 0.9)
        .from('.hr-name .ch', { yPercent: 110, rotate: 6, stagger: 0.05, duration: 1.1, ease: 'power4.out' }, 0.1)
        .to('.hr-name .squiggle path', { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.6)
        .from('.hr-roleline, .hr-sub, .hr-counts, .hr-ctas', { y: 30, opacity: 0, stagger: 0.1, duration: 1 }, 0.4)

        // portrait side: backdrop first, then the card, then the photo inside it
        .from('.hr-blob', { scale: 0.7, opacity: 0, duration: 1.4, clearProps: 'opacity' }, 0.1)
        .from('.hr-person', { y: 90, rotate: 3, scale: 0.94, opacity: 0, duration: 1.25 }, 0.3)
        // clearProps hands the photo back to the CSS hover zoom once the intro ends
        .from('.hr-profile-photo', { scale: 1.15, opacity: 0, duration: 1.2, clearProps: 'transform,opacity' }, 0.7)
        .from('.hr-photo-caption > *', { y: 25, opacity: 0, stagger: 0.12, duration: 0.7 }, 1.1)
        .from('.hr-note', { opacity: 0, x: -10, duration: 0.6 }, 1.6)
        .to('.hr-note .hand-arrow path', { strokeDashoffset: 0, duration: 0.8, stagger: 0.3, ease: 'power2.inOut' }, 1.6)

      // highlight numbers count up (only plain numbers like "3+" or "10")
      root.current.querySelectorAll('.hr-counts b').forEach((el) => {
        const m = el.textContent.trim().match(/^(\d{1,3})(.*)$/)
        if (!m) return
        const o = { v: 0 }
        el.textContent = `0${m[2]}`
        tl.to(o, { v: +m[1], duration: 1.2, ease: 'power2.out', onUpdate: () => { el.textContent = `${Math.round(o.v)}${m[2]}` } }, 0.9)
      })
    })

    return () => mm.revert()
  }, { scope: root, dependencies: [ready] })

  // ───────── 2. Pointer-driven portrait card ─────────
  useGSAP(() => {
    const visual = root.current?.querySelector('.hr-visual')
    const card = root.current?.querySelector('.hr-person')
    const blob = root.current?.querySelector('.hr-blob')
    if (!visual || !card) return
    const mm = gsap.matchMedia()

    mm.add(`${MOTION} and (hover: hover)`, () => {
      gsap.set(card, { transformPerspective: 1000 })
      // the tilt uses rotateX/Y and xPercent/yPercent, so it never fights the intro's x, y and rotate
      const quick = (t, prop, d = 0.6) => gsap.quickTo(t, prop, { duration: d, ease: 'power3.out' })
      const rX = quick(card, 'rotateX')
      const rY = quick(card, 'rotateY')
      const mX = quick(card, 'xPercent')
      const mY = quick(card, 'yPercent')
      const bX = blob && quick(blob, 'x', 0.9) // backdrop drifts the other way for depth
      const bY = blob && quick(blob, 'y', 0.9)

      const onMove = (e) => {
        if (e.pointerType !== 'mouse') return
        const r = visual.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        rX(py * -6); rY(px * 8); mX(px * 1.2); mY(py * 1)
        bX?.(px * -22); bY?.(py * -16)
        const c = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - c.left}px`)
        card.style.setProperty('--my', `${e.clientY - c.top}px`)
      }
      const onLeave = () => { [rX, rY, mX, mY, bX, bY].forEach((f) => f?.(0)) }

      visual.addEventListener('pointermove', onMove)
      visual.addEventListener('pointerleave', onLeave)
      return () => {
        visual.removeEventListener('pointermove', onMove)
        visual.removeEventListener('pointerleave', onLeave)
      }
    })

    return () => mm.revert()
  }, { scope: root })

  // ───────── 3. Content dissolves as the camera dives into the universe ─────────
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION, () => {
      gsap.to('.hr-stage', { opacity: 0, yPercent: -6, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: '45% top', scrub: true } })
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section className="hero" id="top" ref={root}>
      <h1 className="sr-only">{profile.full} — Full Stack Developer | Creative Developer</h1>
      <div className="hr-stage"><div className="hr-grid">
        {/* left: copy */}
        <div className="hr-copy">
          <p className="hr-hello hand">
            Hi there, I’m <span className="hr-wave" aria-hidden="true">👋</span>
          </p>

          <p className="hr-name" aria-hidden="true">
            <span className="hr-name-text" aria-hidden="true">
              {profile.name.split('').map((c, i) => (
                <span className="ch-mask" key={i}>
                  <span className="ch">{c === ' ' ? '\u00A0' : c}</span>
                </span>
              ))}
            </span>
            <Squiggle />
          </p>

          <p className="hr-roleline">
            <span>Full Stack Developer</span><i aria-hidden="true">|</i>
            <span>Creative Developer</span><i aria-hidden="true">|</i>
            <span>AI Enthusiast</span>
          </p>

          <p className="hr-sub">
            <b>{profile.role}</b>
            <Spark />
            {profile.intro}
          </p>

          <ul className="hr-counts" aria-label="Highlights">
            {heroCounts.map((c) => (
              <li key={c.label}>
                <b>{c.value}</b>
                <span>{c.label}</span>
              </li>
            ))}
          </ul>

          <div className="hr-ctas">
            <button className="btn btn-coral" onClick={() => goTo('#work')}>
              See my work <span>→</span>
            </button>
            {profile.resume ? (
              <a className="btn btn-line" href={profile.resume} target="_blank" rel="noreferrer">Résumé ↓</a>
            ) : (
              <button className="btn btn-line" onClick={() => goTo('#contact')}>Request résumé</button>
            )}
          </div>
        </div>

        {/* right: portrait card */}
        <div className="hr-visual">
          <div className="hr-blob" aria-hidden="true" />

          <div className="hr-person" role="img" aria-label={`Portrait of ${profile.full}`}>
            <img
              className="hr-profile-photo"
              src={`${import.meta.env.BASE_URL}img/photos/pranav-profile.jpg`}
              alt=""
              decoding="async"
              fetchPriority="high"
            />
            <div className="hr-photo-caption">
              <span className="hr-photo-caption-kicker">Hello, I’m</span>
              <strong>{profile.full}</strong>
              <span className="hr-photo-caption-role">Full-Stack Developer</span>
            </div>
          </div>

          <div className="hr-note hand">
            move your cursor,<br />
            I’ll move with it!
            <Arrow />
          </div>
        </div>
      </div>
      <a className="scroll-cue" href="#about" aria-label="Scroll to explore" onClick={(e) => { e.preventDefault(); goTo('#about') }}><i /><span>Scroll</span></a>
      </div>
    </section>
  )
}