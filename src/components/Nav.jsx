import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, goTo } from '../lib/motion'
import { profile } from '../data'

const links = [['About', '#about'], ['Toolbox', '#skills'], ['Journey', '#journey'], ['Experience', '#experience'], ['Milestones', '#milestones'], ['Work', '#work'], ['GitHub', '#github']]
const sheetLinks = links.concat([['Contact', '#contact']])

/**
 * Fixed glass navigation.
 * - turns into a glass bar once you scroll, hides when scrolling down, returns when scrolling up
 * - highlights the section you are reading, with a gradient line that slides between links
 * - mobile menu: staggered links, closes on Esc, outside tap or link tap
 */
export default function Nav({ ready }) {
  const ref = useRef(null)
  const linksRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [stuck, setStuck] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [active, setActive] = useState(null)
  const [hover, setHover] = useState(null)
  const [ind, setInd] = useState({ x: 0, w: 0, on: false })
  const [size, setSize] = useState(0)

  // intro
  useEffect(() => {
    if (!ready || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.from(ref.current, { y: -80, opacity: 0, duration: 1.1, delay: 0.3, ease: 'power3.out', clearProps: 'transform,opacity' })
  }, [ready])

  // glass after scrolling, hide on scroll down, show on scroll up
  useEffect(() => {
    let last = scrollY
    let queued = false
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        const y = scrollY
        setStuck(y > 40)
        if (Math.abs(y - last) > 6) { setHidden(y > last && y > 320); last = y }
        queued = false
      })
    }
    addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // which section is in the middle of the screen
  useEffect(() => {
    const els = links.map(([, h]) => document.querySelector(h)).filter(Boolean)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive('#' + e.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    const atTop = () => { if (scrollY < 200) setActive(null) }
    addEventListener('scroll', atTop, { passive: true })
    return () => { io.disconnect(); removeEventListener('scroll', atTop) }
  }, [])

  // sliding indicator follows the hovered link, otherwise the active one
  const target = hover ?? active
  useLayoutEffect(() => {
    const a = target && linksRef.current?.querySelector(`a[href="${target}"]`)
    setInd(a ? { x: a.offsetLeft, w: a.offsetWidth, on: true } : (p) => ({ ...p, on: false }))
  }, [target, size])

  useEffect(() => {
    const ro = new ResizeObserver(() => setSize((s) => s + 1))
    ro.observe(linksRef.current)
    return () => ro.disconnect()
  }, [])

  // close the mobile menu on Esc or outside tap
  useEffect(() => {
    if (!open) return
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    const out = (e) => { if (!ref.current.contains(e.target)) setOpen(false) }
    addEventListener('keydown', esc)
    addEventListener('pointerdown', out)
    return () => { removeEventListener('keydown', esc); removeEventListener('pointerdown', out) }
  }, [open])

  const go = (e, h) => { e.preventDefault(); setOpen(false); goTo(h) }

  return (
    <header className={`nav${open ? ' is-open' : ''}${stuck ? ' is-stuck' : ''}${hidden && !open ? ' is-hidden' : ''}`} ref={ref}>
      <a href="#top" className="nav-brand" onClick={(e) => go(e, '#top')}>
        <img src={profile.avatar} alt="" />
        <span>{profile.name.toLowerCase()}<em>.</em></span>
      </a>

      <nav className="nav-links" aria-label="Primary" ref={linksRef} onMouseLeave={() => setHover(null)}>
        {links.map(([l, h]) => (
          <a
            key={h}
            href={h}
            className={active === h ? 'is-active' : undefined}
            aria-current={active === h ? 'location' : undefined}
            onMouseEnter={() => setHover(h)}
            onFocus={() => setHover(h)}
            onBlur={() => setHover(null)}
            onClick={(e) => go(e, h)}
          >{l}</a>
        ))}
        <span className="nav-ind" aria-hidden="true" style={{ '--x': `${ind.x}px`, '--w': `${ind.w}px`, opacity: ind.on ? 1 : 0 }} />
      </nav>

      <a href="#contact" className="btn btn-coral nav-cta" onClick={(e) => go(e, '#contact')}>Let’s chat <span aria-hidden="true">↗</span></a>
      <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu"><i /><i /></button>

      <div className="nav-sheet" aria-hidden={!open}>
        {sheetLinks.map(([l, h], i) => (
          <a key={h} href={h} tabIndex={open ? 0 : -1} style={{ '--i': i }} className={active === h ? 'is-active' : undefined} onClick={(e) => go(e, h)}>{l}</a>
        ))}
      </div>
    </header>
  )
}