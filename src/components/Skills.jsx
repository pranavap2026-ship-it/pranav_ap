import { memo, startTransition, useMemo, useRef, useState } from 'react'
import { useGSAP, ScrollTrigger, goToProgress } from '../lib/motion'
import { skills, skillGroups } from '../data'
import { setStore, store, useStoreKey } from '../lib/store'
import { Squiggle } from './Bits'

/**
 * Technology Galaxy (DOM side): a glass panel that follows the camera from cluster to cluster.
 * Hovering a chip lights the matching 3D node, and hovering a node lights its chip.
 *
 * Performance notes (mobile scroll):
 * - The panel sits on top of the live WebGL canvas. A backdrop blur there forces
 *   the browser to re-blur the canvas on every frame while you scroll, so it is
 *   switched off on touch / small screens (see the CSS at the bottom).
 * - The scroll handler no longer allocates arrays on every tick, and no longer
 *   calls the store from inside a React state updater.
 * - Touch scrolling over the chips no longer fires "hover" (which lit up 3D
 *   nodes and re-rendered while the finger moved).
 * - Hover changes re-render only the chips, not the whole section.
 */

// Chips live in their own component so a hover change re-renders only this list
const Chips = memo(function Chips({ items }) {
  const hover = useStoreKey('hover')

  // Touch never really "hovers"; pointerenter fires while the finger scrolls
  const enter = (s) => (e) => {
    if (e.pointerType !== 'touch') setStore('hover', s)
  }
  const leave = (e) => {
    if (e.pointerType !== 'touch') setStore('hover', null)
  }

  return (
    <ul className="sk-chips">
      {items.map((s) => (
        <li key={s}>
          <button
            className={hover === s ? 'is-hot' : undefined}
            onPointerEnter={enter(s)}
            onPointerLeave={leave}
            onFocus={() => setStore('hover', s)}
            onBlur={() => setStore('hover', null)}
          >
            {s}
          </button>
        </li>
      ))}
    </ul>
  )
})

export default function Skills() {
  const root = useRef(null)
  const active = useRef(0) // current group, readable inside the scroll handler
  const [g, setG] = useState(0)

  const groups = useMemo(() => {
    const listed = new Set(skillGroups.flatMap((x) => x.items))
    const rest = skills.filter((s) => !listed.has(s))
    return skillGroups.map((x, i) => ({
      ...x,
      items: [
        ...x.items.filter((s) => skills.includes(s)),
        ...(i === skillGroups.length - 1 ? rest : []),
      ],
    }))
  }, [])

  // Used until the 3D side publishes its real camera stops
  const fallbackKnots = useMemo(
    () => groups.map((_, k) => (k / Math.max(1, groups.length - 1)) * 0.76),
    [groups]
  )

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top 50%',
        end: 'bottom 50%',
        onUpdate: (self) => {
          const ks = store.knots[2] || fallbackKnots
          const len = Math.min(ks.length, groups.length)

          // nearest stop, no allocations
          let n = 0
          let best = Infinity
          for (let i = 0; i < len; i++) {
            const d = Math.abs(self.progress - ks[i])
            if (d < best) {
              best = d
              n = i
            }
          }

          if (n === active.current) return
          active.current = n

          setStore('group', n) // 3D side reacts immediately
          startTransition(() => setG(n)) // panel text can wait a frame
        },
      })
    },
    { scope: root }
  )

  const jump = (i) =>
    goToProgress(root.current, (store.knots[2] || fallbackKnots)[i])

  const cur = groups[g]

  return (
    <>
      <style>{css}</style>

      <section className="skills section" id="skills" ref={root}>
        <div className="sk-marks" aria-hidden="true">
          {groups.map((x) => (
            <i key={x.name} data-kf />
          ))}
        </div>

        <div className="sk-stage">
          <div className="wrap">
            <div className="sk-panel glass ui">
              <span className="pill">Technology galaxy</span>

              <h2 className="h2 sk-title">
                Things I’m{' '}
                <span className="hl">
                  good at
                  <Squiggle />
                </span>
              </h2>

              <div className="sk-tabs" role="tablist" aria-label="Skill groups">
                {groups.map((x, i) => (
                  <button
                    key={x.name}
                    role="tab"
                    aria-selected={i === g}
                    className={i === g ? 'is-on' : undefined}
                    onClick={() => jump(i)}
                  >
                    {x.name}
                  </button>
                ))}
              </div>

              <h3 className="sk-group">{cur.name}</h3>
              <p className="sk-blurb">{cur.blurb}</p>

              <Chips items={cur.items} />

              <p className="hand sec-note">
                hover a technology to light it up in the galaxy
              </p>
            </div>
          </div>
        </div>

        {/* complete list for search engines and screen readers */}
        <ul className="sr-only">
          {skills.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------
   Mobile performance overrides. Class names are unchanged, so your
   existing .sk-* and .glass styles keep applying everywhere else.
------------------------------------------------------------------ */

const css = `
.skills {
  /* Darkens the panel where the blur used to do that job.
     Raise the alpha if text looks washed out over bright stars. */
  --sk-scrim: rgba(7, 14, 32, 0.62);
}

@media (max-width: 900px), (hover: none) {
  .skills .sk-panel,
  .skills .sk-panel * {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
  }

  .skills .sk-panel {
    background-image: linear-gradient(var(--sk-scrim), var(--sk-scrim));
  }
}
`