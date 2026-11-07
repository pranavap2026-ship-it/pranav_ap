import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { store, setStore, useStoreKey } from '../lib/store'
import { SCENES, mapScene, sample, sceneFloat, gates } from './config'
import { clamp, damp, smooth, disposeShared, glowTexture } from './util'

// every environment is its own chunk and only mounts while the camera is near it
const SCENE_COMPONENTS = [
  lazy(() => import('./scenes/HeroScene')),
  lazy(() => import('./scenes/AboutScene')),
  lazy(() => import('./scenes/SkillsScene')),
  lazy(() => import('./scenes/JourneyScene')),
  lazy(() => import('./scenes/ProjectsScene')),
  lazy(() => import('./scenes/GithubScene')),
  lazy(() => import('./scenes/ContactScene')),
]

/** Scroll-driven camera: reads scene progress written by ScrollTrigger, flies along the keyframe path. */
function Rig() {
  const { camera, scene, size } = useThree()
  const r = useMemo(() => ({
    t: { gi: 0, trans: 0 }, pos: [0, 0, 0], look: [0, 0, 0],
    c: new THREE.Color(), yaw: 0, roll: 0, px: 0, py: 0, fov: 46, film: 0, first: true,
    pal: SCENES.map((s) => ({ bg: new THREE.Color(s.pal.bg), key: new THREE.Color(s.pal.key), fill: new THREE.Color(s.pal.fill) })),
  }), [])
  const key = useRef(), fill = useRef()

  useEffect(() => {
    scene.background = new THREE.Color('#060E1F')
    scene.fog = new THREE.FogExp2('#060E1F', 0.016)
    return () => { scene.fog = null; scene.background = null }
  }, [scene])

  useEffect(() => {
    const move = (e) => {
      if (e.pointerType !== 'mouse') return
      store.pointer.x = (e.clientX / innerWidth) * 2 - 1
      store.pointer.y = -((e.clientY / innerHeight) * 2 - 1)
    }
    addEventListener('pointermove', move, { passive: true })
    return () => removeEventListener('pointermove', move)
  }, [])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)

    // which scene are we in, and how far
    let i = 0
    for (let k = SCENES.length - 1; k >= 0; k--) if (store.sp[k] > 0.0005) { i = k; break }
    mapScene(i, store.sp[i], r.t)
    store.gi = r.first || store.reduce ? r.t.gi : damp(store.gi, r.t.gi, 5.5, dt)
    r.first = false

    const sf = sceneFloat(store.gi)
    store.sf = sf
    const a = Math.min(SCENES.length - 1, Math.floor(sf))
    const b = Math.min(SCENES.length - 1, a + 1)
    const tf = sf - a
    const f = smooth(tf)

    // position / orientation
    sample(store.gi, r.pos, r.look)
    camera.position.set(r.pos[0], r.pos[1], r.pos[2])
    camera.lookAt(r.look[0], r.look[1], r.look[2])
    const yaw = Math.atan2(r.look[0] - r.pos[0], -(r.look[2] - r.pos[2]))
    let dy = yaw - r.yaw
    if (dy > Math.PI) dy -= Math.PI * 2; else if (dy < -Math.PI) dy += Math.PI * 2
    r.yaw = yaw
    r.roll = damp(r.roll, store.reduce || dt < 1e-4 ? 0 : clamp((-dy / dt) * 0.18, -0.06, 0.06), 4, dt)
    camera.rotateZ(r.roll)
    const parallax = store.compact ? 0.35 : 1
    r.px = damp(r.px, store.reduce ? 0 : store.pointer.x * parallax, 3, dt)
    r.py = damp(r.py, store.reduce ? 0 : store.pointer.y * parallax, 3, dt)
    camera.translateX(r.px * (store.compact ? 0.2 : 0.45))
    camera.translateY(r.py * (store.compact ? 0.12 : 0.28))

    // Lens changes are eased as well, avoiding abrupt FOV jumps on narrow screens or at scene gates.
    const aspect = size.width / size.height
    const base = aspect < 1 ? Math.min(78, 46 + (1 - aspect) * 48) : 46
    const targetFov = base + (store.reduce ? 0 : 11 * Math.sin(Math.PI * tf))
    r.fov = damp(r.fov || base, targetFov, 7, dt)
    camera.fov = r.fov
    const shift = store.compact ? 0 : SCENES[a].shift + (SCENES[b].shift - SCENES[a].shift) * f
    const targetFilm = -shift * camera.getFilmWidth() * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect
    r.film = damp(r.film, targetFilm, 7, dt)
    camera.filmOffset = r.film
    camera.updateProjectionMatrix()

    // atmosphere follows the journey
    const pa = r.pal[a], pb = r.pal[b]
    r.c.copy(pa.bg).lerp(pb.bg, f)
    scene.background?.copy(r.c); scene.fog?.color.copy(r.c)
    if (key.current) key.current.color.copy(pa.key).lerp(pb.key, f)
    if (fill.current) { fill.current.color.copy(pa.fill).lerp(pb.fill, f); fill.current.position.copy(camera.position) }

    // which environments are mounted / which nav dot is lit
    let mask = 0
    for (let k = 0; k < SCENES.length; k++) if (Math.abs(sf - k) <= 1.3) mask |= 1 << k
    setStore('mask', mask)
    setStore('active', Math.round(sf))
  })

  return (
    <>
      <ambientLight intensity={0.35} color="#8FB0FF" />
      <directionalLight ref={key} position={[6, 10, 8]} intensity={1.5} />
      <pointLight ref={fill} intensity={16} distance={40} decay={1.6} />
    </>
  )
}

/** A glowing ring the camera flies through at every scene change. */
function Gate({ pos, dir, index }) {
  const g = useRef(), outer = useRef(), inner = useRef(), halo = useRef()
  useLayoutEffect(() => { g.current.lookAt(pos[0] + dir[0], pos[1] + dir[1], pos[2] + dir[2]) }, [pos, dir])
  useFrame((s, dt) => {
    const d = g.current.position.distanceTo(s.camera.position)
    const near = Math.max(0, 1 - d / 22)
    if (!store.reduce) { outer.current.rotation.z += dt * 0.25 * (index % 2 ? 1 : -1); inner.current.rotation.z -= dt * 0.5 }
    g.current.scale.setScalar(1 + near * 0.35)
    halo.current.material.opacity = 0.08 + near * 0.3 + (store.reduce ? 0 : 0.035 * Math.sin(s.clock.elapsedTime * 1.8 + index))
    halo.current.scale.setScalar(1 + near * 0.12)
  })
  return (
    <group ref={g} position={pos}>
      <mesh ref={outer}><torusGeometry args={[3.5, 0.05, 12, 120]} /><meshBasicMaterial color="#6FA8FF" toneMapped={false} /></mesh>
      <mesh ref={inner}><torusGeometry args={[3.0, 0.02, 8, 90, Math.PI * 1.5]} /><meshBasicMaterial color="#38BDF8" toneMapped={false} /></mesh>
      <mesh ref={halo}><circleGeometry args={[3.4, 48]} /><meshBasicMaterial color="#2F7BFF" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <sprite scale={[13, 13, 1]}><spriteMaterial map={glowTexture()} color="#2F7BFF" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></sprite>
    </group>
  )
}
function Gates() {
  const list = useMemo(() => gates(), [])
  return list.map((g, i) => <Gate key={i} index={i} pos={g.pos} dir={g.dir} />)
}

/** One Points draw call for the whole route. */
function Stars() {
  const n = { high: 1800, mid: 1100, low: 520 }[store.tier]
  const pos = useMemo(() => {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { a[i * 3] = (Math.random() - 0.5) * 160; a[i * 3 + 1] = (Math.random() - 0.5) * 90; a[i * 3 + 2] = 40 - Math.random() * 470 }
    return a
  }, [n])
  return (
    <points frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.1} sizeAttenuation color="#BBD5FF" transparent opacity={0.7} depthWrite={false} fog={false} />
    </points>
  )
}

function Scenes() {
  const mask = useStoreKey('mask')
  return SCENE_COMPONENTS.map((C, i) => ((mask >> i) & 1 ? <Suspense key={i} fallback={null}><C /></Suspense> : null))
}

export default function World() {
  const max = Math.min({ high: 1.75, mid: 1.4, low: 1.1 }[store.tier], window.devicePixelRatio || 1)
  const [dpr, setDpr] = useState(max)
  useEffect(() => () => disposeShared(), [])
  return (
    <div className="world" aria-hidden="true">
      <Canvas
        dpr={dpr}
        camera={{ fov: 46, near: 0.1, far: 500, position: [0, 0.5, 12.5] }}
        gl={{ antialias: store.tier !== 'low', powerPreference: 'high-performance' }}
        eventSource={document.getElementById('root')}
        eventPrefix="client"
      >
        {/* adaptive pixel ratio: drops resolution when the frame rate dips */}
        <PerformanceMonitor flipflops={3} onChange={({ factor }) => setDpr(+Math.max(0.75, 1 + (max - 1) * factor).toFixed(2))} />
        <Rig />
        <Environment resolution={64} frames={1}>
          <Lightformer form="ring" intensity={2.2} color="#6FA8FF" position={[0, 5, -9]} scale={10} />
          <Lightformer intensity={1.4} color="#2F7BFF" position={[-7, 1, -2]} scale={[8, 3, 1]} />
          <Lightformer intensity={1.1} color="#38BDF8" position={[7, 0, 3]} scale={[6, 2, 1]} />
          <Lightformer intensity={0.8} color="#FFFFFF" position={[0, -5, 4]} scale={[10, 2, 1]} rotation-x={Math.PI / 2} />
        </Environment>
        <Stars />
        <Gates />
        <Scenes />
      </Canvas>
    </div>
  )
}
