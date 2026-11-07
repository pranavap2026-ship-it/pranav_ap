import { useMemo } from 'react'

/* Soft illustrated project artwork in the peach palette. */
export default function Art({ kind }) {
  const cells = useMemo(() => Array.from({ length: 48 }, (_, i) => (Math.sin(i * 1.3) + Math.cos(i * 0.7) + 2) / 4), [])
  if (kind === 'gauge') {
    return (
      <div className="art art-gauge">
        <div className="art-doc">{[80, 64, 92, 58, 76, 88, 50].map((w, i) => <i key={i} style={{ width: `${w}%` }} className={i === 2 || i === 5 ? 'flag' : ''} />)}</div>
        <div className="art-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" className="bg" /><circle cx="50" cy="50" r="40" className="fg" pathLength="100" /></svg><b>82</b><span>risk</span></div>
      </div>
    )
  }
  if (kind === 'heatmap') {
    return (
      <div className="art art-heat">
        <div className="art-grid">{cells.map((v, i) => <i key={i} style={{ '--v': v, animationDelay: `${(i % 8) * 0.18}s` }} />)}</div>
        <div className="art-pill">● live risk</div>
      </div>
    )
  }
  if (kind === 'review') {
    return (
      <div className="art art-review">
        <div className="art-code">
          {[62, 80, 48, 90, 70, 56].map((w, i) => <i key={i} style={{ width: `${w}%` }} className={i === 1 ? 'bug' : i === 3 ? 'sec' : ''} />)}
        </div>
        <div className="art-tags"><span className="art-chat">🐞 possible bug</span><span className="art-chat me">🔒 security</span><span className="art-chat">⚡ optimise</span></div>
      </div>
    )
  }
  if (kind === 'market') {
    return (
      <div className="art art-market">
        <div className="art-map"><i className="pin p1" /><i className="pin p2" /><i className="pin p3" /></div>
        <span className="art-chat">is 5pm ok for the visit?</span>
        <span className="art-chat me">✦ booking confirmed!</span>
      </div>
    )
  }
  return (
    <div className="art art-site">
      <div className="art-page">
        <b>Draksha</b>
        <span className="leaf" />
        <div className="art-lines">{[88, 64, 76].map((w, i) => <i key={i} style={{ width: `${w}%` }} />)}</div>
        <em>Book a visit</em>
      </div>
      <span className="art-pill">● live</span>
    </div>
  )
}
