import { Component, lazy, Suspense, useEffect, useState } from 'react'
import { startScroll, lenis, ScrollTrigger } from './lib/motion'
import { profile, lookFrames } from './data'
import { detectEnvironment, store } from './lib/store'
import { createDirector } from './lib/director'
import Loader from './components/Loader'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Work from './components/Work'
import Journey from './components/Journey'
import Skills from './components/Skills'
import Milestones from './components/Milestones'
import Contact from './components/Contact'
import Experience from './components/Experience'
import GithubActivity from './components/GithubActivity'
import PortfolioAssistant from './components/PortfolioAssistant'
import SceneRail from './components/SceneRail'

const BASE = import.meta.env.BASE_URL
const loadWorld = () => import('./three/World')
const World = lazy(loadWorld)
const load = (src) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = src })

// if WebGL ever fails, the DOM content keeps working on its own
class Guard extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(e) { console.warn('3D world disabled:', e); document.documentElement.classList.remove('has-3d') }
  render() { return this.state.failed ? null : this.props.children }
}

// the environment must be known before the first render decides whether to mount the canvas
detectEnvironment()
if (store.webgl) document.documentElement.classList.add('has-3d', `tier-${store.tier}`)

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const cursor = document.querySelector('.custom-cursor')
    const move = (e) => { if (cursor && matchMedia('(pointer:fine)').matches) { cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px` } }
    const down = () => cursor?.classList.add('is-down')
    const up = () => cursor?.classList.remove('is-down')
    window.addEventListener('pointermove', move); window.addEventListener('pointerdown', down); window.addEventListener('pointerup', up)
    const stopScroll = startScroll()
    const dir = innerWidth < 820 ? 'sm' : 'lg'
    const t0 = performance.now()
    Promise.all([
      document.fonts?.ready,
      load(BASE + profile.avatar),
      load(`${BASE}img/stickers/${dir}/f${String(lookFrames.from).padStart(3, '0')}.webp`),
      store.webgl ? loadWorld().catch(() => {}) : null, // warm the 3D chunk behind the loader
    ]).then(() => setTimeout(() => setLoaded(true), Math.max(0, 1500 - (performance.now() - t0))))
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); stopScroll?.() }
  }, [])

  // one director for the whole page, created after the sections exist
  useEffect(() => {
    const kill = createDirector()
    const main = document.querySelector('main')
    const ro = new ResizeObserver(() => ScrollTrigger.refresh())
    if (main) ro.observe(main)
    const refreshAfterAssets = () => ScrollTrigger.refresh()
    window.addEventListener('load', refreshAfterAssets, { once: true })
    return () => { kill(); ro.disconnect(); window.removeEventListener('load', refreshAfterAssets) }
  }, [])

  const finish = () => { setReady(true); lenis?.start(); ScrollTrigger.refresh() }

  return (
    <>
      <Loader done={loaded} onFinish={finish} />
      <Nav ready={ready} />
      {store.webgl && <Guard><Suspense fallback={null}><World /></Suspense></Guard>}
      {store.webgl && <SceneRail />}
      <main>
        <div className="scene" data-scene="0"><Hero ready={ready} /></div>
        <div className="scene" data-scene="1"><About /></div>
        <div className="scene" data-scene="2"><Skills /></div>
        <div className="scene" data-scene="3"><Journey /><Experience /><Milestones /></div>
        <div className="scene" data-scene="4"><Work /></div>
        <div className="scene" data-scene="5"><GithubActivity /></div>
        <div className="scene" data-scene="6"><Contact /></div>
      </main>
      <PortfolioAssistant />
      <div className="custom-cursor" aria-hidden="true" />
    </>
  )
}
