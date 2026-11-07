import { useEffect, useRef } from 'react'
import { gsap } from '../lib/motion'
import { profile } from '../data'

export default function Loader({ done, onFinish }) {
  const root = useRef(null)
  const finish = useRef(onFinish)
  finish.current = onFinish
  useEffect(() => {
    gsap.fromTo(root.current.querySelector('.ld-face'), { scale: 0, rotate: -20 }, { scale: 1, rotate: 0, duration: 1.2, ease: 'elastic.out(1, 0.55)' })
    gsap.fromTo(root.current.querySelector('.ld-bubble'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, delay: 0.5, duration: 0.8, ease: 'back.out(2.5)' })
    gsap.fromTo(root.current.querySelector('.ld-bar i'), { scaleX: 0 }, { scaleX: 0.85, duration: 2, ease: 'power2.out' })
  }, [])
  useEffect(() => {
    if (!done) return
    gsap.timeline()
      .to(root.current.querySelector('.ld-bar i'), { scaleX: 1, duration: 0.3 })
      .to(root.current.querySelectorAll('.ld-face, .ld-bubble, .ld-bar'), { scale: 0.6, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'back.in(2)' })
      .add(() => finish.current?.())
      .to(root.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
      .set(root.current, { display: 'none' })
  }, [done])
  return (
    <div className="loader" ref={root} role="status" aria-label="Loading">
      <div className="ld-stack">
        <span className="ld-bubble hand">hi, it’s {profile.name}!</span>
        <img className="ld-face" src={profile.avatar} alt="" />
        <div className="ld-bar"><i /></div>
      </div>
    </div>
  )
}
