import { journey } from '../data'
import { Squiggle } from './Bits'

const BASE = import.meta.env.BASE_URL

/** Milestones of the story. Each card is a keyframe of the 3D path: the camera reaches its orb as the card centres. */
export default function Journey() {
  return (
    <section className="journey section" id="journey">
      <div className="wrap">
        <div className="sec-head glass ui">
          <span className="pill">My journey</span>
          <h2 className="h2">Where I’ve <span className="hl">been<Squiggle /></span></h2>
          <p className="lead">Follow the path: each glowing milestone lights up as you reach it.</p>
        </div>
        <ol className="jr-list">
          {journey.map((j, i) => (
            <li className={`jr-item${i % 2 ? ' flip' : ''}`} key={j.title} data-kf>
              <div className="jr-card glass ui">
                <figure className="jr-photo"><img className="is-real" src={BASE + j.photo} alt="" loading="lazy" /></figure>
                <div>
                  <span className="jr-year">{j.year}</span>
                  <h3>{j.title}</h3>
                  <span className="jr-org">{j.org}</span>
                  <p>{j.text}</p>
                  {j.note && <em className="jr-note hand">{j.note}</em>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
