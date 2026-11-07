import { experience } from '../data'
import { Squiggle } from './Bits'

export default function Experience() {
  return <section className="section experience" id="experience"><div className="wrap">
    <div className="sec-head glass ui"><span className="pill">Beyond the code</span><h2 className="h2">Experience & <span className="hl">leadership<Squiggle /></span></h2><p className="lead">Real-world delivery, collaboration and learning through hands-on work.</p></div>
    <div className="exp-grid">
      {experience.map((e, i) => (
        <article className={`exp-card glass ui${i % 2 ? ' right' : ''}`} key={e.title} data-kf>
          <span className="exp-date">{e.date}</span><h3>{e.title}</h3><b>{e.org}</b><p>{e.text}</p>
          <div className="chips">{e.chips.map((c) => <span key={c}>{c}</span>)}</div>
        </article>
      ))}
    </div>
  </div></section>
}
