import { useRef, useState } from 'react'
import { useGSAP, ScrollTrigger, goTo } from '../lib/motion'
import { projects, profile } from '../data'
import { setStore } from '../lib/store'
import Art from './Art'
import { Squiggle } from './Bits'

/**
 * 3D project gallery (DOM side). The camera travels past one floating panel per project;
 * this card always shows the full details of the project currently in focus, on the side opposite its panel.
 */
export default function Work() {
  const root = useRef(null)
  const [i, setI] = useState(0)
  const p = projects[i]

  useGSAP(() => {
    root.current.querySelectorAll('.wk-mark').forEach((m, k) => {
      ScrollTrigger.create({
        trigger: m, start: 'top 50%', end: 'bottom 50%',
        onToggle: (self) => { if (self.isActive) { setI(k); setStore('project', k) } },
      })
    })
  }, { scope: root })

  const step = (d) => goTo(`#project-${Math.min(projects.length - 1, Math.max(0, i + d))}`, { offset: -innerHeight / 2 + 0.36 * innerHeight, duration: 1.6 })

  return (
    <section className="work section" id="work" ref={root} style={{ '--n': projects.length }}>
      <div className="wk-marks" aria-hidden="true">
        {projects.map((q, k) => <i className="wk-mark" id={`project-${k}`} key={q.title} data-kf style={{ '--k': k }} />)}
      </div>
      <div className="wk-stage">
        <div className="wrap wk-wrap">
          <div className="wk-head glass ui">
            <span className="pill">Selected work</span>
            <h2 className="h2 wk-title">Things I’ve <span className="hl">made<Squiggle /></span></h2>
            <p className="hand sec-note">scroll to fly through the gallery · click a panel to focus it</p>
          </div>
          <article className={`wk-card glass ui ${i % 2 ? 'at-left' : 'at-right'}`} key={p.title} aria-live="polite">
            <div className="wk-top"><span className="wk-no">{String(i + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span><span className="wk-tag">{p.tag}</span></div>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
            <div className="chips">{p.tech.map((t) => <span key={t}>{t}</span>)}</div>
            <div className="wk-links">
              {p.link && <a className="btn btn-coral" href={p.link} target="_blank" rel="noreferrer">Live demo <span>↗</span></a>}
              {(p.github || profile.github) && <a className="btn btn-line" href={p.github || profile.github} target="_blank" rel="noreferrer">{p.github ? 'GitHub repo' : 'GitHub'} <span>↗</span></a>}
            </div>
            <details className="project-details">
              <summary>Project details + architecture <span aria-hidden="true">＋</span></summary>
              <p>{p.details}</p>
              <div className="architecture">{(p.architecture || []).map((s, n) => <span key={`${s}-${n}`}>{s}{n < p.architecture.length - 1 && <i>↓</i>}</span>)}</div>
            </details>
            <div className="wk-nav">
              <button className="btn btn-line" onClick={() => step(-1)} disabled={i === 0} aria-label="Previous project">←</button>
              <button className="btn btn-line" onClick={() => step(1)} disabled={i === projects.length - 1} aria-label="Next project">→</button>
            </div>
          </article>
          <div className="wk-fallback-art" aria-hidden="true"><Art kind={p.visual} /></div>
        </div>
      </div>
      {/* every project stays in the document for search engines and screen readers */}
      <ul className="sr-only">{projects.map((q) => <li key={q.title}><b>{q.title}</b>: {q.text} Technologies: {q.tech.join(', ')}. {q.link && <a href={q.link}>Live demo</a>}</li>)}</ul>
    </section>
  )
}
