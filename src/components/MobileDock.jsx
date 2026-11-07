import { useEffect, useRef, useState } from 'react'
import { goTo } from '../lib/motion'

/* ------------------------------------------------------------------
   MobileDock — floating glass navigation (mobile only, ≤ 768px)
   One file: component + styles.

   Motion design
   - Dock rises in once on load (the only non-interactive motion,
     plus a slow halo breath behind the active button).
   - One orb slides between tabs on a spring. It squashes while it
     travels and settles with a small overshoot.
   - The selected icon lifts into the orb and redraws its own stroke.
------------------------------------------------------------------ */

const items = [
  { label: 'Home', href: '#top', icon: 'home' },
  { label: 'About', href: '#about', icon: 'user' },
  { label: 'Work', href: '#work', icon: 'briefcase' },
  { label: 'Journey', href: '#journey', icon: 'compass' },
  { label: 'Contact', href: '#contact', icon: 'mail' },
]

// pathLength=1 on every shape lets CSS "draw" the stroke on selection
const P = { pathLength: 1 }

const icons = {
  home: <path {...P} d="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9 21v-7h6v7" />,
  user: (
    <>
      <circle {...P} cx="12" cy="8" r="4" />
      <path {...P} d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),
  briefcase: (
    <>
      <rect {...P} x="3" y="7" width="18" height="14" rx="2" />
      <path {...P} d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" />
    </>
  ),
  compass: (
    <>
      <circle {...P} cx="12" cy="12" r="9" />
      <path {...P} d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  mail: (
    <>
      <rect {...P} x="3" y="5" width="18" height="14" rx="2" />
      <path {...P} d="m3 7 9 7 9-7" />
    </>
  ),
}

function Icon({ name }) {
  return (
    <svg
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

// Where a section's top edge sits relative to the viewport.
// "#top" falls back to the very top of the page if no element has that id.
function topOf(href) {
  const el = document.querySelector(href)
  return el ? el.getBoundingClientRect().top : -window.scrollY
}

export default function MobileDock() {
  const [active, setActive] = useState(0)
  const [moving, setMoving] = useState(false)

  const lockUntil = useRef(0) // ignore scroll updates while a tap-scroll runs
  const syncRef = useRef(() => {})
  const prevActive = useRef(0)

  /* Scroll-spy: the active tab is the last section whose top has
     passed 40% of the viewport. More reliable than a thin observer band,
     and it handles short last sections by snapping to the end. */
  useEffect(() => {
    let frame = 0

    const sync = () => {
      frame = 0
      if (performance.now() < lockUntil.current) return

      const line = window.innerHeight * 0.4
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4

      let index = 0
      if (atBottom) {
        index = items.length - 1
      } else {
        items.forEach((item, i) => {
          if (topOf(item.href) <= line) index = i
        })
      }
      setActive(index)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync)
    }

    syncRef.current = sync
    sync()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  /* Squash the orb briefly each time the active tab changes */
  useEffect(() => {
    if (prevActive.current === active) return
    prevActive.current = active
    setMoving(true)
    const timer = setTimeout(() => setMoving(false), 170)
    return () => clearTimeout(timer)
  }, [active])

  const navigate = (event, href, index) => {
    event.preventDefault()

    // Hold the highlight on the target instead of flickering through
    // every section the page scrolls past.
    lockUntil.current = performance.now() + 1300
    setTimeout(() => syncRef.current(), 1400)

    setActive(index)
    navigator.vibrate?.(8)

    goTo(href, { offset: 0, duration: 1.1 })
  }

  return (
    <>
      <style>{css}</style>

      <nav
        className="mobile-dock"
        aria-label="Mobile navigation"
        style={{ '--i': active, '--n': items.length }}
      >
        <div
          className={`dock-bubble${moving ? ' is-moving' : ''}`}
          aria-hidden="true"
        >
          <span className="dock-orb" />
        </div>

        {items.map((item, index) => {
          const isActive = index === active

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => navigate(e, item.href, index)}
              className={`dock-item${isActive ? ' is-active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'location' : undefined}
            >
              <span className="dock-icon">
                <Icon name={item.icon} />
              </span>
              <span className="dock-label">{item.label}</span>
            </a>
          )
        })}
      </nav>
    </>
  )
}

/* ------------------------------------------------------------------
   Styles
------------------------------------------------------------------ */

const css = `
.mobile-dock { display: none; }

@media (max-width: 768px) {

  /* ---------- Dock shell ---------- */

  .mobile-dock {
    --pad: 8px;
    --dock-h: 68px;
    --orb: 52px;
    --lift: 20px;
    --ring: #0b1731;
    --cyan: #6fe3ff;

    /* Fallback spring; upgraded below where linear() is supported */
    --spring: cubic-bezier(0.34, 1.45, 0.55, 1);

    position: fixed;
    z-index: 9999;
    inset-inline: 0;
    bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    margin-inline: auto;

    width: min(calc(100% - 32px), 480px);
    height: var(--dock-h);

    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    padding-inline: var(--pad);

    background: linear-gradient(
      150deg,
      rgba(25, 39, 65, 0.9),
      rgba(9, 19, 39, 0.94)
    );
    border: 1px solid rgba(145, 180, 255, 0.2);
    border-radius: 26px;

    -webkit-backdrop-filter: blur(24px) saturate(140%);
    backdrop-filter: blur(24px) saturate(140%);

    box-shadow:
      0 14px 40px rgba(0, 0, 0, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);

    animation: dock-in 0.85s var(--spring) both;
  }

  @supports (transition-timing-function: linear(0, 1)) {
    .mobile-dock {
      --spring: linear(
        0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%,
        1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%,
        1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%,
        0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1
      );
    }
  }

  /* Thin light along the top edge */
  .mobile-dock::before {
    content: "";
    position: absolute;
    top: -1px;
    inset-inline: 18%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(130, 225, 255, 0.55),
      transparent
    );
    pointer-events: none;
  }

  @keyframes dock-in {
    from { opacity: 0; transform: translateY(140%); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ---------- Sliding orb ---------- */

  .dock-bubble {
    position: absolute;
    z-index: 0;
    top: 0;
    bottom: 0;
    left: var(--pad);
    width: calc((100% - 2 * var(--pad)) / var(--n));

    transform: translateX(calc(var(--i) * 100%));
    transition: transform 0.7s var(--spring);

    pointer-events: none;
  }

  /* Soft halo behind the orb */
  .dock-bubble::before {
    content: "";
    position: absolute;
    top: -34px;
    left: 50%;
    width: 84px;
    height: 84px;
    margin-left: -42px;

    background: radial-gradient(
      closest-side,
      rgba(60, 190, 255, 0.4),
      transparent
    );

    opacity: 0.75;
    animation: orb-breathe 3.4s ease-in-out infinite;
  }

  .dock-orb {
    position: absolute;
    top: calc(var(--lift) * -0.9);
    left: 50%;
    width: var(--orb);
    height: var(--orb);
    margin-left: calc(var(--orb) / -2);

    border-radius: 18px;

    background: linear-gradient(145deg, #3fd6ff, #2a6dff 80%);

    box-shadow:
      0 0 0 5px var(--ring),
      0 0 0 6px rgba(120, 200, 255, 0.22),
      0 8px 22px rgba(40, 120, 255, 0.45),
      inset 0 1px 1px rgba(255, 255, 255, 0.45);

    transition: transform 0.6s var(--spring);
  }

  /* Squash while travelling, then spring back */
  .dock-bubble.is-moving .dock-orb {
    transform: scale(1.2, 0.86);
    transition: transform 0.16s ease-out;
  }

  @keyframes orb-breathe {
    0%, 100% { opacity: 0.55; transform: scale(0.94); }
    50%      { opacity: 0.95; transform: scale(1.08); }
  }

  /* ---------- Items ---------- */

  .dock-item {
    position: relative;
    z-index: 1;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;

    padding-bottom: 10px;

    color: #8b9bb7;
    text-decoration: none;

    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    outline: none;

    transition: color 0.25s ease;
  }

  .dock-icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 10px;

    transition:
      transform 0.6s var(--spring),
      color 0.25s ease;
  }

  .dock-icon svg {
    width: 21px;
    height: 21px;
    overflow: visible;
  }

  .dock-label {
    font-size: 10px;
    font-weight: 600;
    line-height: 12px;
    letter-spacing: 0.1px;

    transition: color 0.25s ease;
  }

  /* Active: icon lifts into the orb and redraws itself */
  .dock-item.is-active .dock-icon {
    color: #fff;
    transform: translateY(calc(var(--lift) * -1));
  }

  .dock-item.is-active .dock-label {
    color: var(--cyan);
  }

  .dock-item.is-active .dock-icon svg * {
    stroke-dasharray: 1 1;
    animation: icon-draw 0.7s 0.12s ease-out both;
  }

  @keyframes icon-draw {
    from { stroke-dashoffset: 1; opacity: 0; }
    12%  { opacity: 1; }
    to   { stroke-dashoffset: 0; opacity: 1; }
  }

  /* Press feedback */
  .dock-item:active .dock-icon {
    transform: scale(0.86);
    transition-duration: 0.12s;
  }

  .dock-item.is-active:active .dock-icon {
    transform: translateY(calc(var(--lift) * -1)) scale(0.9);
  }

  /* Keyboard focus */
  .dock-item:focus-visible .dock-icon {
    outline: 2px solid var(--cyan);
    outline-offset: 3px;
  }

  @media (hover: hover) {
    .dock-item:not(.is-active):hover { color: #d9eaff; }
  }

  /* ---------- Site integration ---------- */

  .assistant-launch {
    display: none !important;
  }

  .assistant-panel {
    position: fixed !important;
    left: 50% !important;
    bottom: calc(100px + env(safe-area-inset-bottom, 0px)) !important;
    transform: translateX(-50%);

    width: calc(100% - 32px);
    max-width: 420px;
    max-height: 65vh;
    overflow-y: auto;

    border-radius: 20px;
    z-index: 1001 !important;
  }

  .hero { padding-bottom: 90px; }

  body { scroll-padding-bottom: 100px; }
}

/* ---------- Small phones ---------- */

@media (max-width: 380px) {
  .mobile-dock {
    --pad: 5px;
    width: calc(100% - 20px);
    border-radius: 23px;
  }

  .dock-label { font-size: 9px; }
}

/* ---------- Reduced motion ---------- */

@media (prefers-reduced-motion: reduce) {
  .mobile-dock,
  .mobile-dock *,
  .mobile-dock *::before {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
`