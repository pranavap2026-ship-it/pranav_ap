import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float, Billboard, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { store } from '../../lib/store'
import { profile } from '../../data'
import { FONT_BOLD, damp, glowTexture } from '../util'

/* ------------------------------------------------------------------
   Hero scene: 3D name, identity core, floating objects, particles.

   Animation
   - Intro: the name's layers start spread out in depth and swing round
     as they collapse into the final stack. The core pops in with a spring,
     the rings and code tokens follow one after another, the floating
     objects fly in from behind, and the whole scene dollies forward.
   - The core has a heartbeat, and everything reacts to how fast the
     cursor is moving: the core distorts and spins faster, the rings and
     particles swirl, the glow brightens.
   - Name layers shift against each other with the cursor, so the depth
     looks real. The front layer shimmers.
   - Floating objects grow and glow when you hover them (click still spins).
   - Particles are two layers turning at different speeds for parallax.

   Performance
   - The name, core and floating objects hide and stop updating while the
     camera is not looking at the hero.
   - The name stack uses 7 / 5 / 4 layers on high / mid / low tier, with
     the same total depth, and the core mesh is less detailed on mid / low.
     Overlapping big text layers are the expensive part on phones.

   Intro timing
   - It starts when store.ready is not false. To sync it with the loader,
     give the store `ready: false` at start and call setStore('ready', true)
     in the loader's onFinish. If store.ready is never set, it plays
     immediately.

   Reduced motion (store.reduce): everything is static and fully built.
------------------------------------------------------------------ */

const OBJECTS = [
  { g: 'oct', p: [-6.5, 2.6, -2], s: 0.55, c: '#2F7BFF' },
  { g: 'box', p: [6.8, 3.4, -3], s: 0.7, c: '#6FA8FF' },
  { g: 'tor', p: [-7.8, -1.8, 1.5], s: 0.6, c: '#38BDF8' },
  { g: 'dod', p: [7.5, -2.2, 0.5], s: 0.6, c: '#EAF2FF' },
  { g: 'ico', p: [-3.4, -3.4, 3], s: 0.45, c: '#2F7BFF' },
  { g: 'cone', p: [4.6, -3.7, 2.5], s: 0.5, c: '#6FA8FF' },
  { g: 'tor', p: [-10, 0.6, -4], s: 0.6, c: '#38BDF8' },
  { g: 'oct', p: [10, 0.4, -5], s: 0.7, c: '#2F7BFF' },
  { g: 'box', p: [0.5, 6.2, -6], s: 0.5, c: '#6FA8FF' },
]
const TOKENS = ['</>', '{ }', '( )', '=>', '[ ]', '&&']
const NAME_DEPTH = 0.45 // total depth of the layered name

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3)
// ease with a small overshoot at the end (springy landing)
const easeOutBack = (x) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  const y = x - 1
  return 1 + c3 * y * y * y + c1 * y * y
}

function Shape({ g }) {
  switch (g) {
    case 'oct': return <octahedronGeometry args={[1]} />
    case 'box': return <boxGeometry args={[1.3, 1.3, 1.3]} />
    case 'tor': return <torusGeometry args={[0.8, 0.28, 16, 48]} />
    case 'dod': return <dodecahedronGeometry args={[1]} />
    case 'ico': return <icosahedronGeometry args={[1, 0]} />
    default: return <coneGeometry args={[0.8, 1.6, 6]} />
  }
}

/** A floating tech object: flies in, drifts, parallaxes against the cursor, glows on hover, spins on click. */
function FloatingObject({ o, i, intro }) {
  const g = useRef(), m = useRef(), mat = useRef()
  const spin = useRef(0)
  const hover = useRef(0)
  const over = useRef(false)

  useFrame((_, dt) => {
    const I = intro.current
    if (!I.on) return

    const reduce = store.reduce
    const k = reduce ? 0 : 1

    // fly in from far behind, one after another
    const e = reduce ? 1 : easeOutBack(clamp01((I.tIn - 0.5 - i * 0.09) / 0.9))

    const depth = 0.5 + (o.p[2] + 6) * 0.06
    g.current.position.x = o.p[0] + store.pointer.x * depth * k
    g.current.position.y = o.p[1] + store.pointer.y * depth * 0.6 * k
    g.current.position.z = o.p[2] - (1 - e) * 9

    hover.current = damp(hover.current, over.current ? 1 : 0, 8, dt)
    m.current.scale.setScalar(
      o.s * Math.max(0.0001, e) * (1 + hover.current * 0.18 + spin.current * 0.02)
    )
    mat.current.emissiveIntensity = 0.12 + hover.current * 0.5

    const v = (reduce ? 0 : 0.15 + (i % 3) * 0.08) + spin.current
    m.current.rotation.x += dt * v
    m.current.rotation.y += dt * v * 1.3
    spin.current = damp(spin.current, 0, 1.6, dt)
  })

  return (
    <group ref={g} position={o.p}>
      <Float speed={store.reduce ? 0 : 1.2 + (i % 4) * 0.25} floatIntensity={0.9} rotationIntensity={0}>
        <mesh
          ref={m}
          scale={o.s}
          onClick={(e) => { e.stopPropagation(); spin.current = 6 }}
          onPointerOver={(e) => { e.stopPropagation(); over.current = true }}
          onPointerOut={() => { over.current = false }}
        >
          <Shape g={o.g} />
          <meshStandardMaterial ref={mat} color={o.c} metalness={0.65} roughness={0.22} emissive={o.c} emissiveIntensity={0.12} />
        </mesh>
      </Float>
    </group>
  )
}

/** Two particle layers turning at different speeds, so the sky has depth. */
function Particles({ intro }) {
  const n = { high: 900, mid: 520, low: 220 }[store.tier]
  const all = useRef(), near = useRef(), far = useRef()

  const [nearPos, farPos] = useMemo(() => {
    const make = (count, r0, r1) => {
      const a = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const r = r0 + Math.random() * (r1 - r0)
        const th = Math.random() * Math.PI * 2
        const ph = Math.acos(2 * Math.random() - 1)
        a[i * 3] = r * Math.sin(ph) * Math.cos(th)
        a[i * 3 + 1] = r * Math.cos(ph) * 0.7
        a[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 2
      }
      return a
    }
    const nearN = Math.round(n * 0.35)
    return [make(nearN, 4, 10), make(n - nearN, 10, 19)]
  }, [n])

  useFrame((_, dt) => {
    const I = intro.current
    const reduce = store.reduce
    const k = reduce ? 0 : 1

    near.current.rotation.y += dt * 0.03 * k * (1 + I.energy * 4)
    far.current.rotation.y -= dt * 0.012 * k * (1 + I.energy * 2)

    // the cloud expands outward during the intro
    const e = reduce ? 1 : easeOutCubic(clamp01((I.tIn - 0.1) / 1.8))
    all.current.scale.setScalar(0.4 + 0.6 * e)
  })

  return (
    <group ref={all}>
      <points ref={near} frustumCulled={false}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[nearPos, 3]} /></bufferGeometry>
        <pointsMaterial size={0.06} sizeAttenuation color="#9CC4FF" transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points ref={far} frustumCulled={false}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[farPos, 3]} /></bufferGeometry>
        <pointsMaterial size={0.04} sizeAttenuation color="#9CC4FF" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

/** 3D typography: a front face plus stacked darker copies behind it for depth. */
function NameStack({ intro, compact }) {
  const group = useRef(), front = useRef()
  const layers = useRef([])
  const name = profile.name.toUpperCase()
  const count = { high: 7, mid: 5, low: 4 }[store.tier]
  const step = NAME_DEPTH / (count - 1)
  const baseY = compact ? 2.6 : 2.5

  useFrame((s) => {
    const I = intro.current
    if (!I.on) return

    const reduce = store.reduce
    const p = reduce ? 1 : easeOutCubic(clamp01((I.tIn - 0.15) / 1.5))
    const spread = 1 - p // 1 = exploded, 0 = assembled

    // rises, scales up and swings round to face front
    const g = group.current
    g.position.y = baseY - spread * 0.8
    g.scale.setScalar(0.88 + 0.12 * p)
    g.rotation.y = -spread * 0.5

    // layers start far apart in depth, then collapse; they also slide against
    // each other with the cursor (deeper layers move more)
    const px = reduce ? 0 : store.pointer.x
    for (let i = 0; i < count; i++) {
      const layer = layers.current[i]
      if (!layer) continue
      const depth = count - 1 - i
      layer.position.z = -depth * step * (1 + spread * 6)
      layer.position.x = -px * depth * step * 0.4
    }

    // front face glows brighter while it assembles, then settles into a slow shimmer
    front.current.emissiveIntensity =
      0.28 + spread * 0.35 + (reduce ? 0 : Math.sin(s.clock.elapsedTime * 1.4) * 0.06)
  })

  return (
    <group ref={group} position={[0, baseY, -1.5]}>
      {Array.from({ length: count }, (_, i) => {
        const isFront = i === count - 1
        return (
          <Text
            key={i}
            ref={(el) => (layers.current[i] = el)}
            font={FONT_BOLD}
            fontSize={compact ? 2.3 : 3.1}
            letterSpacing={-0.04}
            anchorX="center"
            anchorY="middle"
            position={[0, 0, -(count - 1 - i) * step]}
          >
            {name}
            <meshStandardMaterial
              ref={isFront ? front : undefined}
              color={isFront ? '#EAF2FF' : '#1D4ED8'}
              emissive={isFront ? '#6FA8FF' : '#0B2A63'}
              emissiveIntensity={isFront ? 0.28 : 0.7}
              metalness={0.2}
              roughness={0.35}
            />
          </Text>
        )
      })}
    </group>
  )
}

/** Digital identity core: distorting sphere, wire shell, glow, rings and code tokens. */
function Core({ intro }) {
  const group = useRef(), core = useRef(), shell = useRef(), glow = useRef()
  const rings = useRef(), tokens = useRef(), distort = useRef()
  const ringMeshes = useRef([])
  const tokenNodes = useRef([])
  const detail = { high: 4, mid: 3, low: 2 }[store.tier]

  const tokenBase = useMemo(
    () =>
      TOKENS.map((_, i) => {
        const a = (i / TOKENS.length) * Math.PI * 2
        return [Math.cos(a) * 3.6, Math.sin(a * 2) * 0.7, Math.sin(a) * 3.6]
      }),
    []
  )

  useFrame((s, dt) => {
    const I = intro.current
    if (!I.on) return

    const reduce = store.reduce
    const k = reduce ? 0 : 1
    const t = s.clock.elapsedTime
    const e = I.energy // 0..1, how fast the cursor is moving

    // pop in with a spring, then breathe like a heartbeat
    const p = reduce ? 1 : clamp01((I.tIn - 0.3) / 1.4)
    const beat = reduce ? 0 : Math.sin(t * 1.6) * 0.03
    group.current.scale.setScalar(Math.max(0.0001, easeOutBack(p)) * (1 + beat))

    core.current.rotation.y += dt * (0.22 + e * 0.9) * k
    distort.current.distort = reduce ? 0 : 0.28 * easeOutCubic(p) + e * 0.25

    // wire shell turns the other way and pulses
    shell.current.rotation.y -= dt * 0.12 * k
    shell.current.rotation.x += dt * 0.05 * k
    shell.current.material.opacity = 0.28 + (reduce ? 0 : Math.sin(t * 1.1) * 0.06)

    // glow pulses and flares with cursor movement
    const gs = 7 * (1 + beat * 1.5 + e * 0.12)
    glow.current.scale.set(gs, gs, 1)
    glow.current.material.opacity = 0.55 + e * 0.2

    // rings draw in one after another, then keep turning (faster with the cursor)
    rings.current.rotation.y += dt * (0.3 + e * 0.8) * k
    rings.current.rotation.x += dt * 0.07 * k
    ringMeshes.current.forEach((m, j) => {
      if (m) m.scale.setScalar(Math.max(0.0001, reduce ? 1 : easeOutBack(clamp01((I.tIn - 0.7 - j * 0.15) / 0.9))))
    })

    // tokens orbit, bob and pop in
    tokens.current.rotation.y -= dt * (0.18 + e * 0.4) * k
    tokenNodes.current.forEach((n, j) => {
      if (!n) return
      n.position.y = tokenBase[j][1] + Math.sin(t * 1.1 + j) * 0.12 * k
      n.scale.setScalar(Math.max(0.0001, reduce ? 1 : easeOutBack(clamp01((I.tIn - 1 - j * 0.1) / 0.7))))
    })
  })

  return (
    <group ref={group} position={[0, -0.1, 0]}>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.05, detail]} />
        <MeshDistortMaterial ref={distort} color="#1D4ED8" emissive="#2F7BFF" emissiveIntensity={0.55} roughness={0.15} metalness={0.7} distort={store.reduce ? 0 : 0.28} speed={1.4} />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.55, 1]} />
        <meshBasicMaterial color="#6FA8FF" wireframe transparent opacity={0.28} />
      </mesh>
      <sprite ref={glow} scale={[7, 7, 1]}>
        <spriteMaterial map={glowTexture()} color="#2F7BFF" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      <group ref={rings}>
        <mesh ref={(el) => (ringMeshes.current[0] = el)} rotation={[1.2, 0, 0]}><torusGeometry args={[2.3, 0.014, 8, 128]} /><meshBasicMaterial color="#38BDF8" toneMapped={false} /></mesh>
        <mesh ref={(el) => (ringMeshes.current[1] = el)} rotation={[0.4, 0.8, 0]}><torusGeometry args={[2.7, 0.01, 8, 128]} /><meshBasicMaterial color="#6FA8FF" toneMapped={false} /></mesh>
        <mesh ref={(el) => (ringMeshes.current[2] = el)} rotation={[-0.7, 0.2, 1]}><torusGeometry args={[3.1, 0.01, 8, 128]} /><meshBasicMaterial color="#2F7BFF" toneMapped={false} /></mesh>
      </group>

      <group ref={tokens}>
        {TOKENS.map((t, i) => (
          <Billboard key={t} ref={(el) => (tokenNodes.current[i] = el)} position={tokenBase[i]}>
            <Text font={FONT_BOLD} fontSize={0.42} color="#9CC4FF" anchorX="center" anchorY="middle" fillOpacity={0.9}>{t}</Text>
          </Billboard>
        ))}
      </group>
    </group>
  )
}

export default function HeroScene() {
  const root = useRef(), heavy = useRef()
  const compact = store.tier === 'low'

  // Shared with the children: intro clock, visibility, cursor energy
  const intro = useRef({ started: false, t0: 0, tIn: -1, on: true, energy: 0, px: 0, py: 0 })

  const view = useMemo(
    () => ({
      frustum: new THREE.Frustum(),
      matrix: new THREE.Matrix4(),
      sphere: new THREE.Sphere(new THREE.Vector3(), 15), // covers name, core and objects
      scale: new THREE.Vector3(),
    }),
    []
  )

  // Priority -1: runs before the children's frame callbacks, so they always
  // see this frame's intro time and visibility.
  useFrame((s, dt) => {
    const I = intro.current
    const reduce = store.reduce
    const now = s.clock.elapsedTime
    const k = reduce ? 0 : 1

    // intro clock: starts when the page is ready (or immediately if never set)
    if (reduce) {
      I.tIn = 99
    } else {
      if (!I.started && store.ready !== false) {
        I.started = true
        I.t0 = now
      }
      I.tIn = I.started ? now - I.t0 : -1
    }

    // is the hero inside the camera's view?
    const { frustum, matrix, sphere, scale } = view
    root.current.getWorldPosition(sphere.center)
    root.current.getWorldScale(scale)
    sphere.radius = 15 * Math.max(scale.x, scale.y, scale.z)
    s.camera.updateMatrixWorld()
    matrix.multiplyMatrices(s.camera.projectionMatrix, s.camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(matrix)
    I.on = frustum.intersectsSphere(sphere)
    heavy.current.visible = I.on // nothing is drawn while we are out of view

    // cursor energy: how fast the pointer is moving (0..1, eased)
    const dx = store.pointer.x - I.px
    const dy = store.pointer.y - I.py
    I.px = store.pointer.x
    I.py = store.pointer.y
    const speed = Math.hypot(dx, dy) / Math.max(dt, 0.001)
    I.energy = reduce ? 0 : damp(I.energy, Math.min(1, speed * 0.3), 3, dt)

    // whole universe leans toward the cursor
    root.current.rotation.y = damp(root.current.rotation.y, store.pointer.x * 0.14 * k, 3, dt)
    root.current.rotation.x = damp(root.current.rotation.x, -store.pointer.y * 0.07 * k, 3, dt)

    // dolly forward during the intro
    heavy.current.position.z = reduce ? 0 : -(1 - easeOutCubic(clamp01(I.tIn / 1.8))) * 3
  }, -1)

  return (
    <group ref={root}>
      <Particles intro={intro} />

      <group ref={heavy}>
        <NameStack intro={intro} compact={compact} />
        <Core intro={intro} />
        {OBJECTS.slice(0, compact ? 5 : OBJECTS.length).map((o, i) => (
          <FloatingObject key={i} o={o} i={i} intro={intro} />
        ))}
      </group>
    </group>
  )
}