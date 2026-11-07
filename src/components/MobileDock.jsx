import { useEffect, useState } from 'react'
import { goTo } from '../lib/motion'

const items = [
  { label: 'Home', href: '#top', icon: 'home' },
  { label: 'About', href: '#about', icon: 'user' },
  { label: 'Work', href: '#work', icon: 'briefcase' },
  { label: 'Journey', href: '#journey', icon: 'compass' },
  { label: 'Contact', href: '#contact', icon: 'mail' },
]

const icons = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9 21v-7h6v7" />
  ),

  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),

  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" />
    </>
  ),

  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),

  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 7 9-7" />
    </>
  ),
}

function Icon({ name }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}

export default function MobileDock() {
  const [active, setActive] = useState('#top')

  // Detect active section while scrolling
  useEffect(() => {
    const sections = items
      .map(({ href }) => document.querySelector(href))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio
          )

        if (visible.length) {
          setActive(`#${visible[0].target.id}`)
        }
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5],
      }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  // Smooth navigation
  const navigate = (event, href) => {
    event.preventDefault()

    setActive(href)

    goTo(href, {
      offset: 0,
      duration: 1.1,
    })
  }

  return (
    <nav className="mobile-dock" aria-label="Mobile navigation">

      {/* Background light effect */}
      <div className="dock-light" aria-hidden="true" />

      {items.map((item) => {
        const isActive = active === item.href

        return (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => navigate(e, item.href)}
            className={`dock-item ${
              isActive ? 'is-active' : ''
            }`}
            aria-label={item.label}
            aria-current={isActive ? 'location' : undefined}
          >
            {/* Icon */}
            <span className="dock-icon">
              <Icon name={item.icon} />
            </span>

            {/* Label */}
            <span className="dock-label">
              {item.label}
            </span>

            {/* Active indicator */}
            {isActive && (
              <i className="dock-dot" aria-hidden="true" />
            )}
          </a>
        )
      })}

    </nav>
  )
}