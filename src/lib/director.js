import { gsap, ScrollTrigger } from './motion'
import { store } from './store'

/**
 * Wires every [data-scene] wrapper to the shared store with scrubbed ScrollTriggers:
 *  - store.sp[i]: 0..1 progress through scene i (starts when its top reaches mid-screen, ends when its bottom does)
 *  - store.knots[i]: where each [data-kf] element sits in that progress, so the camera reaches a keyframe
 *    exactly when the matching piece of content is centred on screen
 *  - store.lit['k…']: milestones that have been reached
 */
export function createDirector() {
  const scenes = gsap.utils.toArray('[data-scene]')
  const last = scenes.length - 1
  const triggers = []
  if (!scenes.length) return () => {}
  store.sp.fill(0)

  const measure = (el, i) => {
    const kfs = [...el.querySelectorAll('[data-kf]')]
    if (!kfs.length) return
    const top = el.getBoundingClientRect().top + scrollY, h = el.offsetHeight
    let prev = 0
    const arr = kfs.map((k) => {
      const r = k.getBoundingClientRect()
      const p = Math.min(0.96, Math.max(prev + 0.004, (r.top + scrollY + r.height / 2 - top) / h))
      prev = p
      return p
    })
    store.knots[i] = [...arr, 1]
    

  }

  scenes.forEach((el, i) => {
    triggers.push(ScrollTrigger.create({
      trigger: el,
      start: i === 0 ? 'top top' : 'top 50%',
      end: i === last ? 'bottom bottom' : 'bottom 50%',
      scrub: 0.65,
      invalidateOnRefresh: true,
      onUpdate: (self) => { store.sp[i] = self.progress },
      onRefresh: (self) => { measure(el, i); store.sp[i] = self.progress },
    }))
  })

  // milestone lights (orbs in the journey scene)
  const j = scenes[3]
  j?.querySelectorAll('[data-kf]').forEach((el, k) => {
    triggers.push(ScrollTrigger.create({
      trigger: el, start: 'top 62%', end: 'bottom 38%',
      onEnter: () => { store.lit['k' + k] = 1; el.classList.add('is-reached') },
      onLeaveBack: () => { store.lit['k' + k] = 0; el.classList.remove('is-reached') },
    }))
  })
  ScrollTrigger.refresh()
  return () => {
    triggers.forEach((t) => t.kill())
    store.sp.fill(0)
    store.knots = {}
    store.lit = {}
  }
}
