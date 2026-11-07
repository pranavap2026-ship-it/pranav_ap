import { useRef } from 'react'
import { gsap, useGSAP, goTo } from '../lib/motion'
import { profile, heroCounts } from '../data'
import { Squiggle, Arrow, Spark } from './Bits'

const NO_MOTION = '(prefers-reduced-motion: reduce)'
const MOTION = '(prefers-reduced-motion: no-preference)'

export default function Hero({ ready }) {
  const root = useRef(null)

  // ==========================================
  // 1. INTRO ANIMATION
  // ==========================================

  useGSAP(() => {
    if (!ready) return

    const mm = gsap.matchMedia()

    mm.add(NO_MOTION, () => {
      gsap.set(
        '.hr-name .squiggle path, .hr-note .hand-arrow path',
        { strokeDashoffset: 0 }
      )
    })

    mm.add(MOTION, () => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' }
      })

      tl.from('.hr-hello', {
        y: 20,
        opacity: 0,
        duration: 0.8
      })

      tl.to('.hr-wave', {
        keyframes: {
          rotate: [0, 18, -8, 14, -4, 0]
        },
        duration: 1.2,
        transformOrigin: '70% 70%'
      }, 0.9)

      tl.from('.hr-name .ch', {
        yPercent: 110,
        rotate: 6,
        stagger: 0.05,
        duration: 1.1,
        ease: 'power4.out'
      }, 0.1)

      tl.to('.hr-name .squiggle path', {
        strokeDashoffset: 0,
        duration: 1.2
      }, 0.6)

      tl.from(
        '.hr-roleline, .hr-sub, .hr-counts, .hr-ctas',
        {
          y: 30,
          opacity: 0,
          stagger: 0.1,
          duration: 1
        },
        0.4
      )

      // Portrait animations
      tl.from('.hr-blob', {
        scale: 0.7,
        opacity: 0,
        duration: 1.4,
        clearProps: 'opacity'
      }, 0.1)

      tl.from('.hr-person', {
        y: 90,
        rotate: 3,
        scale: 0.94,
        opacity: 0,
        duration: 1.25
      }, 0.3)

      tl.from('.hr-profile-photo', {
        scale: 1.15,
        opacity: 0,
        duration: 1.2,
        clearProps: 'transform,opacity'
      }, 0.7)

      tl.from('.hr-photo-caption > *', {
        y: 25,
        opacity: 0,
        stagger: 0.12,
        duration: 0.7
      }, 1.1)

      tl.from('.hr-note', {
        opacity: 0,
        x: -10,
        duration: 0.6
      }, 1.6)

      tl.to('.hr-note .hand-arrow path', {
        strokeDashoffset: 0,
        duration: 0.8,
        stagger: 0.3
      }, 1.6)

      // Statistics counter
      root.current.querySelectorAll('.hr-counts b').forEach((el) => {
        const match = el.textContent.trim().match(/^(\d{1,3})(.*)$/)

        if (!match) return

        const original = match[0]
        const target = Number(match[1])
        const suffix = match[2]
        const counter = { value: 0 }

        el.textContent = `0${suffix}`

        tl.to(counter, {
          value: target,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${Math.round(counter.value)}${suffix}`
          },
          onComplete: () => {
            el.textContent = original
          }
        }, 0.9)
      })
    })

    return () => mm.revert()
  }, {
    scope: root,
    dependencies: [ready]
  })


  // ==========================================
  // 2. 3D INTERACTIVE PORTRAIT
  // ==========================================

  useGSAP(() => {
    const visual = root.current?.querySelector('.hr-visual')
    const card = root.current?.querySelector('.hr-person')
    const blob = root.current?.querySelector('.hr-blob')

    if (!visual || !card) return

    const mm = gsap.matchMedia()

    mm.add(`${MOTION} and (hover: hover)`, () => {

      gsap.set(card, {
        transformPerspective: 1000
      })

      const quick = (target, property, duration = 0.6) =>
        gsap.quickTo(target, property, {
          duration,
          ease: 'power3.out'
        })

      const rotateX = quick(card, 'rotateX')
      const rotateY = quick(card, 'rotateY')
      const moveX = quick(card, 'xPercent')
      const moveY = quick(card, 'yPercent')

      const blobX = blob && quick(blob, 'x', 0.9)
      const blobY = blob && quick(blob, 'y', 0.9)

      const onMove = (event) => {
        if (event.pointerType !== 'mouse') return

        const rect = visual.getBoundingClientRect()

        const px = (event.clientX - rect.left) / rect.width - 0.5
        const py = (event.clientY - rect.top) / rect.height - 0.5

        rotateX(py * -6)
        rotateY(px * 8)

        moveX(px * 1.2)
        moveY(py * 1)

        blobX?.(px * -22)
        blobY?.(py * -16)

        const cardRect = card.getBoundingClientRect()

        card.style.setProperty(
          '--mx',
          `${event.clientX - cardRect.left}px`
        )

        card.style.setProperty(
          '--my',
          `${event.clientY - cardRect.top}px`
        )
      }

      const onLeave = () => {
        ;[rotateX, rotateY, moveX, moveY, blobX, blobY]
          .forEach((fn) => fn?.(0))
      }

      visual.addEventListener('pointermove', onMove)
      visual.addEventListener('pointerleave', onLeave)

      return () => {
        visual.removeEventListener('pointermove', onMove)
        visual.removeEventListener('pointerleave', onLeave)
      }
    })

    return () => mm.revert()
  }, { scope: root })


  // ==========================================
  // 3. SCROLL ANIMATION
  // ==========================================

  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add(MOTION, () => {
      gsap.to('.hr-stage', {
        opacity: 0,
        yPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '45% top',
          scrub: true
        }
      })
    })

    return () => mm.revert()
  }, { scope: root })


  // ==========================================
  // 4. COMPONENT
  // ==========================================

  return (
    <section className="hero" id="top" ref={root}>

      <h1 className="sr-only">
        {profile.full} — Full Stack Developer | Creative Developer
      </h1>

      <div className="hr-stage">

        <div className="hr-grid">

          {/* LEFT CONTENT */}

          <div className="hr-copy">

            <p className="hr-hello hand">
              Hi there, I’m{' '}
              <span className="hr-wave" aria-hidden="true">
                👋
              </span>
            </p>

            <p className="hr-name" aria-hidden="true">

              <span className="hr-name-text">
                {profile.name.split('').map((character, index) => (
                  <span className="ch-mask" key={index}>
                    <span className="ch">
                      {character === ' ' ? '\u00A0' : character}
                    </span>
                  </span>
                ))}
              </span>

              <Squiggle />

            </p>

            <p className="hr-roleline">
              <span>Full Stack Developer</span>
              <i aria-hidden="true">|</i>
              <span>Creative Developer</span>
              <i aria-hidden="true">|</i>
              <span>AI Enthusiast</span>
            </p>

            <p className="hr-sub">
              <b>{profile.role}</b>
              <Spark />
              {profile.intro}
            </p>


            {/* STATISTICS */}

            <ul className="hr-counts" aria-label="Highlights">

              {heroCounts.map((count) => (
                <li key={count.label}>
                  <b>{count.value}</b>
                  <span>{count.label}</span>
                </li>
              ))}

            </ul>


            {/* BUTTONS */}

            <div className="hr-ctas">

              <button
                className="btn btn-coral"
                onClick={() => goTo('#work')}
              >
                See my work <span>→</span>
              </button>

              {profile.resume ? (

                <a
                  className="btn btn-line"
                  href={profile.resume}
                  target="_blank"
                  rel="noreferrer"
                >
                  Résumé ↓
                </a>

              ) : (

                <button
                  className="btn btn-line"
                  onClick={() => goTo('#contact')}
                >
                  Request résumé
                </button>

              )}

            </div>

          </div>


          {/* RIGHT PORTRAIT */}

          <div className="hr-visual">

            <div className="hr-blob" aria-hidden="true" />

            <div
              className="hr-person"
              role="img"
              aria-label={`Portrait of ${profile.full}`}
            >

              <img
                className="hr-profile-photo"
                src={`${import.meta.env.BASE_URL}img/photos/pranav-profile.jpg`}
                alt=""
                decoding="async"
                fetchPriority="high"
              />

              <div className="hr-photo-caption">

                <span className="hr-photo-caption-kicker">
                  Hello, I’m
                </span>

                <strong>{profile.full}</strong>

                <span className="hr-photo-caption-role">
                  Full-Stack Developer
                </span>

              </div>

            </div>


            {/* HANDWRITTEN NOTE */}

            <div className="hr-note hand">

              move your cursor,
              <br />

              I’ll move with it!

              <Arrow />

            </div>

          </div>

        </div>


        {/* SCROLL INDICATOR */}

        <a
          className="scroll-cue"
          href="#about"
          aria-label="Scroll to explore"
          onClick={(event) => {
            event.preventDefault()
            goTo('#about')
          }}
        >
          <i />
          <span>Scroll</span>
        </a>

      </div>

    </section>
  )
}