import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, goTo } from '../lib/motion'
import { profile } from '../data'

const links = [
  ['About', '#about'],
  ['Toolbox', '#skills'],
  ['Journey', '#journey'],
  ['Experience', '#experience'],
  ['Milestones', '#milestones'],
  ['Work', '#work'],
  ['GitHub', '#github'],
]

const mobileLinks = [
  { label: 'Home', href: '#top', icon: 'home' },
  { label: 'About', href: '#about', icon: 'user' },
  { label: 'Work', href: '#work', icon: 'spark' },
  { label: 'Journey', href: '#journey', icon: 'compass' },
  { label: 'Contact', href: '#contact', icon: 'mail' },
]

function NavIcon({ type }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  const icons = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9" />
        <path d="M9 21v-7h6v7" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    spark: (
      <>
        <path d="m12 2 2.2 6.8L21 12l-6.8 3.2L12 22l-3.2-6.8L2 12l6.8-3.2L12 2Z" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  }

  return <svg {...common}>{icons[type]}</svg>
}

export default function Nav({ ready }) {
  const ref = useRef(null)
  const linksRef = useRef(null)

  const [active, setActive] = useState('#top')
  const [hover, setHover] = useState(null)
  const [ind, setInd] = useState({ x: 0, w: 0, on: false })
  const [size, setSize] = useState(0)

  // Desktop navigation intro
  useEffect(() => {
    if (!ready || matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.from(ref.current, {
      y: -80,
      opacity: 0,
      duration: 1.1,
      delay: 0.3,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    })
  }, [ready])

  // Detect active section
  useEffect(() => {
    const sections = [
      '#top',
      '#about',
      '#skills',
      '#journey',
      '#experience',
      '#milestones',
      '#work',
      '#github',
      '#contact',
    ]
      .map((id) => document.querySelector(id))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`)
          }
        })
      },
      {
        rootMargin: '-40% 0px -50% 0px',
        threshold: 0,
      }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  // Desktop sliding indicator
  const target = hover ?? active

  useLayoutEffect(() => {
    const link = target && linksRef.current?.querySelector(
      `a[href="${target}"]`
    )

    setInd(
      link
        ? {
            x: link.offsetLeft,
            w: link.offsetWidth,
            on: true,
          }
        : (previous) => ({ ...previous, on: false })
    )
  }, [target, size])

  // Update desktop indicator on resize
  useEffect(() => {
    if (!linksRef.current) return

    const observer = new ResizeObserver(() => {
      setSize((value) => value + 1)
    })

    observer.observe(linksRef.current)

    return () => observer.disconnect()
  }, [])

  const navigate = (event, href) => {
    event.preventDefault()
    goTo(href)
  }

  return (
    <>
      {/* DESKTOP NAVIGATION */}

      <header className="nav" ref={ref}>

        <a
          href="#top"
          className="nav-brand"
          onClick={(e) => navigate(e, '#top')}
        >
          <img src={profile.avatar} alt="" />
          <span>
            {profile.name.toLowerCase()}
            <em>.</em>
          </span>
        </a>

        <nav
          className="nav-links"
          aria-label="Primary"
          ref={linksRef}
          onMouseLeave={() => setHover(null)}
        >
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className={active === href ? 'is-active' : undefined}
              onMouseEnter={() => setHover(href)}
              onFocus={() => setHover(href)}
              onBlur={() => setHover(null)}
              onClick={(e) => navigate(e, href)}
            >
              {label}
            </a>
          ))}

          <span
            className="nav-ind"
            aria-hidden="true"
            style={{
              '--x': `${ind.x}px`,
              '--w': `${ind.w}px`,
              opacity: ind.on ? 1 : 0,
            }}
          />
        </nav>

        <a
          href="#contact"
          className="btn btn-coral nav-cta"
          onClick={(e) => navigate(e, '#contact')}
        >
          Let's chat <span>↗</span>
        </a>

      </header>


      {/* MOBILE FLOATING NAVIGATION */}

      <nav className="mobile-dock" aria-label="Mobile navigation">

        <div className="mobile-dock-inner">

          {mobileLinks.map((item, index) => {

            const isActive = active === item.href

            const isCenter = index === 2

            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  mobile-dock-item
                  ${isActive ? 'is-active' : ''}
                  ${isCenter ? 'dock-center' : ''}
                `}
                aria-current={isActive ? 'location' : undefined}
                onClick={(e) => navigate(e, item.href)}
              >

                <span className="dock-icon">
                  <NavIcon type={item.icon} />
                </span>

                <span className="dock-label">
                  {item.label}
                </span>

                {isActive && (
                  <span className="dock-active-dot" />
                )}

              </a>
            )
          })}

        </div>

        <div className="dock-glow" aria-hidden="true" />

      </nav>
    </>
  )
}