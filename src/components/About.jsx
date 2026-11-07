import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../lib/motion'
import { about, profile } from '../data'
import { Squiggle } from './Bits'
import Wave from './Wave'

/** A fanned stack of photos. Click or tap to shuffle photos. */
function PhotoStack() {
  const [order, setOrder] = useState(about.photos.map((_, i) => i))
  const stack = useRef(null)
  const isAnimating = useRef(false)

  const next = () => {
    if (isAnimating.current || !stack.current) return

    const top = stack.current.querySelector(
      `[data-i="${order[0]}"]`
    )

    if (!top) return

    isAnimating.current = true

    gsap.timeline({
      onComplete: () => {
        isAnimating.current = false
      },
    })
      .to(top, {
        x: 260,
        y: -40,
        rotate: 15,
        scale: 0.9,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      })
      .add(() => {
        setOrder((o) => [...o.slice(1), o[0]])
      })
      .set(top, {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        opacity: 1,
      })
  }

  return (
    <div
      className="stack ui"
      ref={stack}
      onClick={next}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          next()
        }
      }}
      aria-label="Shuffle photos"
    >
      {about.photos.map((src, i) => {
        const pos = order.indexOf(i)

        return (
          <figure
            key={src}
            data-i={i}
            className={`stack-card ${pos === 0 ? 'is-top' : ''}`}
            style={{
              zIndex: 10 - pos,
              '--pos': pos,
            }}
          >
            <img
              src={i === 0 ? '/img/photos/pranav-profile.jpg' : src}
              alt={i === 0 ? 'Pranav AP - Full Stack Developer' : `${profile.name}, ${about.roles[i]}`}
              loading="lazy"
              className={i === 0 ? 'pranav-profile-photo' : ''}
            />

            <figcaption>
              <span className="role-kicker hand">
                I'm a
              </span>

              <span className="role-name">
                {i === 0 ? 'Full-Stack Developer' : about.roles[i]}
              </span>
            </figcaption>
          </figure>
        )
      })}

      <span className="stack-hint hand">
        click to see my other roles ↻
      </span>
    </div>
  )
}

export default function About() {
  const root = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        const cards = gsap.utils.toArray('.stack-card')
        const copy = gsap.utils.toArray('.ab-copy > *')
        const stats = gsap.utils.toArray('.ab-stat')

        // ----------------------------------
        // 1. Photo stack entrance animation
        // ----------------------------------

        gsap.from(cards, {
          x: -65,
          y: 100,
          opacity: 0,
          scale: 0.88,
          stagger: 0.14,
          duration: 1.3,
          ease: 'back.out(1.5)',

          scrollTrigger: {
            trigger: root.current,
            start: 'top 75%',
            once: true,
          },
        })

        // ----------------------------------
        // 2. About content reveal
        // ----------------------------------

        gsap.from(copy, {
          y: 45,
          opacity: 0,
          stagger: 0.13,
          duration: 1,
          ease: 'power3.out',

          scrollTrigger: {
            trigger: '.ab-copy',
            start: 'top 80%',
            once: true,
          },
        })

        // ----------------------------------
        // 3. Heading underline animation
        // ----------------------------------

        const squiggle = root.current.querySelectorAll(
          '.ab-title .squiggle path'
        )

        gsap.set(squiggle, {
          strokeDasharray: 500,
          strokeDashoffset: 500,
        })

        gsap.to(squiggle, {
          strokeDashoffset: 0,
          duration: 1.4,
          stagger: 0.15,
          ease: 'power2.inOut',

          scrollTrigger: {
            trigger: '.ab-title',
            start: 'top 80%',
            once: true,
          },
        })

        // ----------------------------------
        // 4. Statistics card animations
        // ----------------------------------

        gsap.from(stats, {
          y: 55,
          opacity: 0,
          scale: 0.88,
          stagger: 0.12,
          duration: 0.9,
          ease: 'back.out(1.7)',

          scrollTrigger: {
            trigger: '.ab-stats',
            start: 'top 88%',
            once: true,
          },
        })

        // ----------------------------------
        // 5. Floating top photo card
        // ----------------------------------

        const topCard = root.current.querySelector(
          '.stack-card.is-top'
        )

        if (topCard) {
          gsap.to(topCard, {
            y: -8,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 1.3,
          })
        }

        // ----------------------------------
        // 6. Statistics hover animation
        // ----------------------------------

        stats.forEach((stat) => {
          const enter = () => {
            gsap.to(stat, {
              y: -7,
              scale: 1.025,
              duration: 0.3,
              ease: 'power2.out',
            })
          }

          const leave = () => {
            gsap.to(stat, {
              y: 0,
              scale: 1,
              duration: 0.4,
              ease: 'power2.out',
            })
          }

          stat.addEventListener('mouseenter', enter)
          stat.addEventListener('mouseleave', leave)

          // Remove listeners when the media context is reverted.
          return () => {
            stat.removeEventListener('mouseenter', enter)
            stat.removeEventListener('mouseleave', leave)
          }
        })
      }
    )

    return () => mm.revert()

  }, { scope: root })

  return (
    <section
      className="about section tint"
      id="about"
      ref={root}
    >
      <Wave />

      <div className="wrap ab-grid">

        {/* Left: Interactive Photo Stack */}
        <PhotoStack />

        {/* Right: About Content */}
        <div className="ab-copy glass ui">

          <span className="pill">
            About me
          </span>

          <h2 className="h2 ab-title">
            A little{' '}
            <span className="hl">
              about me
              <Squiggle />
            </span>
          </h2>

          {/* Introduction */}
          {about.paragraphs.map((p) => (
            <p className="lead" key={p}>
              {p}
            </p>
          ))}

          {/* Statistics */}
          <div className="ab-stats">

            {about.stats.map((s) => (
              <div
                className="ab-stat"
                key={s.label}
              >
                <b>{s.value}</b>

                <span>{s.label}</span>
              </div>
            ))}

          </div>

        </div>
      </div>
    </section>
  )
}