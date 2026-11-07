import { useMemo, useRef, useState } from 'react'
import { useGSAP, ScrollTrigger, goToProgress } from '../lib/motion'
import { skills, skillGroups } from '../data'
import { setStore, store, useStoreKey } from '../lib/store'
import { Squiggle } from './Bits'

/**
 * Technology Galaxy (DOM side): a glass panel that follows the camera from cluster to cluster.
 * Hovering a chip lights the matching 3D node, and hovering a node lights its chip.
 */
export default function Skills() {
  const root = useRef(null)
  const [g, setG] = useState(0)
  const hover = useStoreKey('hover')
  const groups = useMemo(() => {
    const listed = new Set(skillGroups.flatMap((x) => x.items))
    const rest = skills.filter((s) => !listed.has(s))
    return skillGroups.map((x, i) => ({ ...x, items: [...x.items.filter((s) => skills.includes(s)), ...(i === skillGroups.length - 1 ? rest : [])] }))
  }, [])

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: root.current, start: 'top 50%', end: 'bottom 50%',
      onUpdate: (self) => {
        const ks = store.knots[2] || groups.map((_, k) => (k / (groups.length - 1)) * 0.76)
        let n = 0
        ks.slice(0, groups.length).forEach((k, idx) => { if (Math.abs(self.progress - k) < Math.abs(self.progress - ks[n])) n = idx })
        setG((o) => { if (o !== n) setStore('group', n); return n })
      },
    })
  }, { scope: root })

  const jump = (i) => goToProgress(root.current, (store.knots[2] || groups.map((_, k) => (k / (groups.length - 1)) * 0.76))[i])
  const cur = groups[g]

  return (
    <section className="skills section" id="skills" ref={root}>
      <div className="sk-marks" aria-hidden="true">{groups.map((x, i) => <i key={x.name} data-kf />)}</div>
      <div className="sk-stage"><div className="wrap">
        <div className="sk-panel glass ui">
          <span className="pill">Technology galaxy</span>
          <h2 className="h2 sk-title">Things I’m <span className="hl">good at<Squiggle /></span></h2>
          <div className="sk-tabs" role="tablist" aria-label="Skill groups">
            {groups.map((x, i) => <button key={x.name} role="tab" aria-selected={i === g} className={i === g ? 'is-on' : undefined} onClick={() => jump(i)}>{x.name}</button>)}
          </div>
          <h3 className="sk-group">{cur.name}</h3>
          <p className="sk-blurb">{cur.blurb}</p>
          <ul className="sk-chips">
            {cur.items.map((s) => (
              <li key={s}><button className={hover === s ? 'is-hot' : undefined} onPointerEnter={() => setStore('hover', s)} onPointerLeave={() => setStore('hover', null)} onFocus={() => setStore('hover', s)} onBlur={() => setStore('hover', null)}>{s}</button></li>
            ))}
          </ul>
          <p className="hand sec-note">hover a technology to light it up in the galaxy</p>
        </div>
      </div></div>
      {/* complete list for search engines and screen readers */}
      <ul className="sr-only">{skills.map((s) => <li key={s}>{s}</li>)}</ul>
    </section>
  )
}
