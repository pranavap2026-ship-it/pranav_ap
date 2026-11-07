import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Draggable } from 'gsap/Draggable'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'

// registered exactly once; every component imports gsap from here
gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, useGSAP)
gsap.defaults({ ease: 'power4.out', duration: 1 })

export let lenis = null
let tickerCallback = null
let scrollHandler = null

/** Create the single site-wide Lenis instance and return its disposer. */
export function startScroll() {
  if (lenis) return stopScroll
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  lenis = new Lenis(reduce ? { smoothWheel: false, lerp: 1, autoRaf: false } : { lerp: 0.1, autoRaf: false })
  scrollHandler = () => ScrollTrigger.update()
  tickerCallback = (time) => lenis?.raf(time * 1000)
  lenis.on('scroll', scrollHandler)
  gsap.ticker.add(tickerCallback)
  gsap.ticker.lagSmoothing(0)
  lenis.stop()
  return stopScroll
}

/** Remove the ticker and Lenis listeners so hot reloads and React remounts cannot leak RAF work. */
export function stopScroll() {
  if (!lenis) return
  if (tickerCallback) gsap.ticker.remove(tickerCallback)
  if (scrollHandler) lenis.off('scroll', scrollHandler)
  lenis.destroy()
  lenis = null
  tickerCallback = null
  scrollHandler = null
  gsap.ticker.lagSmoothing(500, 33)
}
export function goTo(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { offset: -30, duration: 1.8, ...opts })
  else if (typeof target === 'string') document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
}
/** Scroll so that scene `el` is at progress `p` (0..1), using the same mapping as the scene's ScrollTrigger. */
export function goToProgress(el, p, duration = 1.8) {
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  const y = top - innerHeight * 0.5 + p * el.offsetHeight
  if (lenis) lenis.scrollTo(Math.max(0, y), { duration })
  else window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
}
export { gsap, ScrollTrigger, SplitText, Draggable, useGSAP }
