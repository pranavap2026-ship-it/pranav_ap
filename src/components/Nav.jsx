import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, goTo } from '../lib/motion'
import { profile } from '../data'

/* ------------------------------------------------------------------
   Nav — desktop floating navigation (≥ 769px)
   One file: component + styles. The mobile dock lives in MobileDock.jsx.

   What it does
   - Floating glass bar that condenses after you scroll, hides while you
     scroll down, and comes back as soon as you scroll up.
   - A thin progress line along the bottom edge shows how far down the
     page you are.
   - Two sliding pills: a solid one that marks the current section, and a
     ghost one that follows the cursor / keyboard focus as a preview.
   - The CTA lights up while the Contact section is in view.
------------------------------------------------------------------ */

const links = [
  ['About', '#about'],
  ['Toolbox', '#skills'],
  ['Journey', '#journey'],
  ['Experience', '#experience'],
  ['Milestones', '#milestones'],
  ['Work', '#work'],
  ['GitHub', '#github'],
]

// Document order, used by the scroll-spy. "#top" and "#contact" have no
// link in the bar, but still decide when nothing / the CTA is highlighted.
const sectionIds = ['#top', ...links.map(([, href]) => href), '#contact']

// Where a section's top edge sits relative to the viewport.
// "#top" falls back to the very top of the page if no element has that id.
function topOf(id) {
  const el = document.querySelector(id)
  return el ? el.getBoundingClientRect().top : -window.scrollY
}

// Move a pill under a link. When a pill appears from nothing it fades in
// at the right spot instead of sliding across from the left edge.
function placePill(pill, link) {
  if (!pill) return

  if (!link) {
    pill.dataset.on = '0'
    return
  }

  const wasOn = pill.dataset.on === '1'
  if (!wasOn) pill.style.transition = 'opacity 0.25s ease'

  pill.style.setProperty('--x', `${link.offsetLeft}px`)
  pill.style.setProperty('--w', `${link.offsetWidth}px`)
  pill.dataset.on = '1'

  if (!wasOn) {
    void pill.offsetWidth // flush, so the jump happens without a slide
    pill.style.transition = ''
  }
}

export default function Nav({ ready }) {
  const rootRef = useRef(null)
  const barRef = useRef(null)
  const linksRef = useRef(null)
  const activePillRef = useRef(null)
  const hoverPillRef = useRef(null)

  const lockUntil = useRef(0) // ignore scroll updates while a click-scroll runs
  const syncRef = useRef(() => {})

  const [active, setActive] = useState('#top')
  const [hover, setHover] = useState(null)
  const [size, setSize] = useState(0)

  // No point previewing the link that is already selected
  const hoverTarget = hover && hover !== active ? hover : null

  /* Intro: the bar drops in once after the loader */
  useEffect(() => {
    if (!ready || matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.from(rootRef.current, {
      y: -80,
      opacity: 0,
      duration: 1.1,
      delay: 0.3,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    })
  }, [ready])

  /* One scroll handler for everything scroll-driven:
     progress line, condensed state, hide/show, and the active section.
     Visual state is written straight to the DOM, so scrolling never
     re-renders the component (only a section change does). */
  useEffect(() => {
    const bar = barRef.current
    let frame = 0
    let lastY = window.scrollY

    const update = () => {
      frame = 0

      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      const locked = performance.now() < lockUntil.current

      // progress + condensed
      bar.style.setProperty(
        '--p',
        max > 0 ? Math.min(1, Math.max(0, y / max)).toFixed(4) : '0'
      )
      bar.toggleAttribute('data-scrolled', y > 24)

      // hide on the way down, return on the way up
      const dy = y - lastY
      if (locked || y <= 480) bar.removeAttribute('data-hidden')
      else if (dy > 6) bar.setAttribute('data-hidden', '')
      else if (dy < -6) bar.removeAttribute('data-hidden')
      if (Math.abs(dy) > 6) lastY = y

      // active section: the last one whose top has passed 40% of the viewport
      if (!locked) {
        const line = window.innerHeight * 0.4
        const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4

        let current = sectionIds[0]
        if (atBottom) current = sectionIds[sectionIds.length - 1]
        else
          sectionIds.forEach((id) => {
            if (topOf(id) <= line) current = id
          })

        setActive(current)
      }
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    syncRef.current = update
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  /* Position the pills (written to the DOM, no extra state) */
  useLayoutEffect(() => {
    const root = linksRef.current
    if (!root) return

    const find = (href) => href && root.querySelector(`a[href="${href}"]`)

    placePill(activePillRef.current, find(active))
    placePill(hoverPillRef.current, find(hoverTarget))

    // Turn slide transitions on only after the first placement
    if (!root.classList.contains('is-placed')) {
      requestAnimationFrame(() => root.classList.add('is-placed'))
    }
  }, [active, hoverTarget, size])

  /* Re-measure when the links resize (window resize, web fonts loading) */
  useEffect(() => {
    const root = linksRef.current
    if (!root) return

    const bump = () => setSize((value) => value + 1)

    const observer = new ResizeObserver(bump)
    observer.observe(root)
    document.fonts?.ready.then(bump)

    return () => observer.disconnect()
  }, [])

  const navigate = (event, href) => {
    event.preventDefault()

    // Hold the highlight on the target while the page scrolls there,
    // instead of flickering through every section on the way.
    lockUntil.current = performance.now() + 1300
    setTimeout(() => syncRef.current(), 1400)

    setActive(href)
    goTo(href)
  }

  return (
    <>
      <style>{css}</style>

      <header className="dn" ref={rootRef}>
        <div className="dn-bar" ref={barRef}>

          <a
            href="#top"
            className="dn-brand"
            onClick={(e) => navigate(e, '#top')}
          >
            <img src={profile.avatar} alt="" />
            <span>
              {profile.name.toLowerCase()}
              <em>.</em>
            </span>
          </a>

          <nav
            className="dn-links"
            aria-label="Primary"
            ref={linksRef}
            onMouseLeave={() => setHover(null)}
          >
            <span
              className="dn-pill dn-pill--active"
              ref={activePillRef}
              data-on="0"
              aria-hidden="true"
            />
            <span
              className="dn-pill dn-pill--hover"
              ref={hoverPillRef}
              data-on="0"
              aria-hidden="true"
            />

            {links.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className={`dn-link${active === href ? ' is-active' : ''}`}
                aria-current={active === href ? 'location' : undefined}
                onMouseEnter={() => setHover(href)}
                onFocus={() => setHover(href)}
                onBlur={() => setHover(null)}
                onClick={(e) => navigate(e, href)}
              >
                {label}
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className={`dn-cta${active === '#contact' ? ' is-active' : ''}`}
            onClick={(e) => navigate(e, '#contact')}
          >
            Let's chat <span className="dn-arrow">↗</span>
          </a>

          <span className="dn-progress" aria-hidden="true">
            <i />
          </span>

        </div>
      </header>
    </>
  )
}

/* ------------------------------------------------------------------
   Styles — change the colours here
------------------------------------------------------------------ */

const css = `
.dn {
  --dn-ink: #eaf4ff;
  --dn-muted: #9aa9c4;
  --dn-cyan: #6fe3ff;
  --dn-blue-a: #3a86ff;
  --dn-blue-b: #2457e6;
  --dn-edge: rgba(145, 180, 255, 0.2);
  --dn-ring: #0b1731;

  /* Fallback spring; upgraded where linear() is supported */
  --spring: cubic-bezier(0.34, 1.45, 0.55, 1);

  position: fixed;
  z-index: 900;
  top: 14px;
  inset-inline: 0;

  display: flex;
  justify-content: center;
  padding-inline: 24px;

  pointer-events: none;
}

@supports (transition-timing-function: linear(0, 1)) {
  .dn {
    --spring: linear(
      0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%,
      1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%,
      1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%,
      0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1
    );
  }
}

.dn *,
.dn *::before,
.dn *::after {
  box-sizing: border-box;
}

/* ---------- Bar ---------- */

.dn-bar {
  position: relative;
  pointer-events: auto;

  width: min(1120px, 100%);

  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;

  padding: 8px 10px 8px 12px;

  background: linear-gradient(
    150deg,
    rgba(25, 39, 65, 0.7),
    rgba(9, 19, 39, 0.78)
  );
  border: 1px solid var(--dn-edge);
  border-radius: 20px;

  -webkit-backdrop-filter: blur(22px) saturate(140%);
  backdrop-filter: blur(22px) saturate(140%);

  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);

  transition:
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease,
    width 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    padding 0.35s ease,
    background 0.35s ease,
    box-shadow 0.35s ease;
}

/* Thin light along the top edge */
.dn-bar::before {
  content: "";
  position: absolute;
  top: -1px;
  inset-inline: 20%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(130, 225, 255, 0.5),
    transparent
  );
  pointer-events: none;
}

/* After scrolling: tighter and more solid */
.dn-bar[data-scrolled] {
  width: min(1040px, 100%);
  padding-block: 6px;

  background: linear-gradient(
    150deg,
    rgba(22, 35, 60, 0.88),
    rgba(8, 17, 36, 0.92)
  );

  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* Scrolling down: slide away. Keyboard focus always brings it back. */
.dn-bar[data-hidden]:not(:focus-within) {
  transform: translateY(calc(-100% - 28px));
  opacity: 0;
}

/* ---------- Brand ---------- */

.dn-brand {
  justify-self: start;

  display: inline-flex;
  align-items: center;
  gap: 10px;

  color: var(--dn-ink);
  text-decoration: none;
  font-weight: 700;
  letter-spacing: -0.01em;

  border-radius: 12px;
  outline: none;
}

.dn-brand img {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  object-fit: cover;

  box-shadow: 0 0 0 0 transparent;
  transition: box-shadow 0.35s ease, transform 0.5s var(--spring);
}

.dn-brand em {
  font-style: normal;
  color: var(--dn-cyan);
}

.dn-brand:hover img,
.dn-brand:focus-visible img {
  transform: scale(1.06);
  box-shadow:
    0 0 0 2px var(--dn-ring),
    0 0 0 3.5px rgba(111, 227, 255, 0.7);
}

/* ---------- Links ---------- */

.dn-links {
  position: relative;

  display: flex;
  gap: 2px;
  padding: 4px;

  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(145, 180, 255, 0.1);
  border-radius: 15px;
}

.dn-link {
  position: relative;
  z-index: 1;

  padding: 8px 13px;

  color: var(--dn-muted);
  font-size: 13.5px;
  font-weight: 550;
  white-space: nowrap;
  text-decoration: none;

  border-radius: 11px;
  outline: none;

  transition: color 0.25s ease;
}

.dn-link:hover,
.dn-link:focus-visible {
  color: var(--dn-ink);
}

.dn-link.is-active {
  color: var(--dn-cyan);
}

.dn-link:focus-visible {
  box-shadow: 0 0 0 2px var(--dn-cyan);
}

/* Sliding pills */

.dn-pill {
  position: absolute;
  z-index: 0;
  top: 4px;
  bottom: 4px;
  left: 0;

  width: var(--w, 0px);
  border-radius: 11px;

  transform: translateX(var(--x, 0px));
  opacity: 0;

  pointer-events: none;
}

.dn-pill[data-on="1"] {
  opacity: 1;
}

.dn-links.is-placed .dn-pill {
  transition:
    transform 0.55s var(--spring),
    width 0.55s var(--spring),
    opacity 0.25s ease;
}

.dn-pill--active {
  background: linear-gradient(
    180deg,
    rgba(63, 214, 255, 0.2),
    rgba(42, 109, 255, 0.14)
  );
  border: 1px solid rgba(111, 227, 255, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 18px rgba(60, 170, 255, 0.18);
}

.dn-pill--hover {
  background: rgba(255, 255, 255, 0.07);
}

/* ---------- CTA ---------- */

.dn-cta {
  justify-self: end;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 10px 16px;

  color: #fff;
  font-size: 14px;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;

  background: linear-gradient(145deg, var(--dn-blue-a), var(--dn-blue-b));
  border-radius: 13px;
  outline: none;

  box-shadow:
    0 6px 18px rgba(36, 87, 230, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);

  transition:
    transform 0.4s var(--spring),
    box-shadow 0.3s ease;
}

.dn-cta:hover {
  transform: translateY(-1px);
  box-shadow:
    0 10px 26px rgba(36, 87, 230, 0.55),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);
}

.dn-cta:active {
  transform: scale(0.96);
  transition-duration: 0.12s;
}

.dn-cta:focus-visible {
  box-shadow:
    0 0 0 2px var(--dn-ring),
    0 0 0 4px var(--dn-cyan);
}

/* Contact section in view */
.dn-cta.is-active {
  box-shadow:
    0 0 0 2px var(--dn-ring),
    0 0 0 3.5px rgba(111, 227, 255, 0.6),
    0 8px 24px rgba(36, 87, 230, 0.5),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);
}

.dn-arrow {
  display: inline-block;
  transition: transform 0.4s var(--spring);
}

.dn-cta:hover .dn-arrow,
.dn-cta:focus-visible .dn-arrow {
  transform: translate(2px, -2px);
}

/* ---------- Scroll progress ---------- */

.dn-progress {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: -1px;
  height: 2px;

  overflow: hidden;
  border-radius: 2px;

  opacity: 0;
  transition: opacity 0.3s ease;

  pointer-events: none;
}

.dn-bar[data-scrolled] .dn-progress {
  opacity: 1;
}

.dn-progress i {
  display: block;
  height: 100%;

  background: linear-gradient(90deg, #36dfff, #438bff);

  transform: scaleX(var(--p, 0));
  transform-origin: left;
}

/* ---------- Responsive ---------- */

@media (max-width: 1100px) {
  .dn { padding-inline: 16px; }
  .dn-brand span { display: none; }
}

@media (max-width: 940px) {
  .dn-link { padding: 8px 10px; font-size: 13px; }
  .dn-cta { padding: 9px 13px; font-size: 13px; }
}

/* Phones use MobileDock instead */
@media (max-width: 768px) {
  .dn { display: none; }
}

/* ---------- Reduced motion ---------- */

@media (prefers-reduced-motion: reduce) {
  .dn *,
  .dn *::before {
    transition-duration: 0.01ms !important;
    animation: none !important;
  }

  .dn-bar,
  .dn-bar[data-hidden]:not(:focus-within) {
    transition-duration: 0.01ms !important;
  }
}
`