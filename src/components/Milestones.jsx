import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/motion'
import { scoreboard, certifications } from '../data'
import { Squiggle } from './Bits'
import Wave from './Wave'
import Brand from './Brand'
import { brands } from '../lib/brands'
import Odometer from './Odometer'

/** Certificate wall, then "by the numbers": four big numbers that roll into place. */
export default function Milestones() {
  const root = useRef(null)
  useGSAP(() => {
    gsap.utils.toArray('.squiggle path', root.current).forEach((p) =>
      gsap.to(p, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: p, start: 'top 85%' } }))
    gsap.from('.cert-frame', { y: 50, rotate: (i) => (i % 2 ? 8 : -8), opacity: 0, stagger: 0.06, duration: 0.9, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.ms-wall', start: 'top 85%' } })

    // simple stats: fade up, digits roll into place, a coral line draws underneath
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.nums', start: 'top 82%' } })
    tl.from('.num-cell', { y: 40, opacity: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out' })
    gsap.utils.toArray('.nums .odo-col', root.current).forEach((col, i) => {
      tl.fromTo(col, { yPercent: 0 }, { yPercent: -((10 + +col.dataset.d) / 20) * 100, duration: 2.2, ease: 'power4.out' }, 0.15 + i * 0.05)
    })
    tl.from('.num-line', { scaleX: 0, stagger: 0.12, duration: 1.2, ease: 'expo.inOut' }, 0.4)
      .from('.num-meta, .num-note', { y: 12, opacity: 0, stagger: 0.08, duration: 0.6 }, 0.9)
  }, { scope: root })

  return (
    <section className="milestones section" id="milestones" ref={root}>
      <Wave flip />
      <div className="wrap">
        <div className="sec-head center">
          <span className="pill">Milestones</span>
          <h2 className="h2">Credentials <span className="hl">wall<Squiggle /></span></h2>
        </div>
        <div className="ms-wall">
          {certifications.map(([t, by, brand], i) => (
            <figure className="cert-frame ui" data-kf key={t} style={{ '--r': `${[-2, 1.5, -1, 2][i % 4]}deg` }}>
              <span className="cert-border">
                <span className="cert-logo">{brands[brand] ? <Brand name={brand} size={30} /> : <span className="glyph">{brand}</span>}</span>
                <b>{t}</b>
                <span className="cert-by">{by}</span>
                <span className="cert-seal">✓</span>
              </span>
            </figure>
          ))}
        </div>

        <div className="sec-head center ms-nums-head">
          <h2 className="h2">By the <span className="hl">numbers<Squiggle /></span></h2>
        </div>
        <div className="nums">
          {scoreboard.map((s) => (
            <div className="num-cell glass ui" key={s.label}>
              <div className="num-val"><Odometer value={s.value} /><small>{s.suffix}</small></div>
              <i className="num-line" />
              <div className="num-meta">{s.brand ? <Brand name={s.brand} size={18} /> : <span className="glyph">{s.icon}</span>}<b>{s.label}</b></div>
              <span className="num-note">{s.note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
