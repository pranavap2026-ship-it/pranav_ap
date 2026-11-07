import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Line, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { store, useStoreKey } from '../../lib/store'
import { GH_C } from '../config'
import { FONT_BOLD, FONT_MED, damp, glowTexture } from '../util'

/* ------------------------------------------------------------------
   GitHub scene: contribution grid, floating data, repo nodes.

   Animation
   - Entrance: when the camera arrives, the grid builds itself in a wave
     from left to right with a small overshoot, then the data points fade
     in and the repo nodes pop in one after another.
   - Activity bars ease to their height instead of snapping, so real
     data arriving from GitHub visibly grows into place.
   - A light scan sweeps across the grid; active days pulse softly.
   - Floating data points fade in and out over their life (no popping
     when they loop).
   - Repo nodes spin, their glow breathes, and small pulses travel along
     the links from the grid up to each repo.

   Performance
   - The whole scene hides and stops updating while the camera is not
     looking at it. Before, the grid and particles were recomputed and
     drawn on every frame, even from the other side of the galaxy.

   Reduced motion (store.reduce): everything is static and fully built.
------------------------------------------------------------------ */

const COLS = 26, ROWS = 7, GAP = 0.56
const LOW = new THREE.Color('#12264A'), HIGH = new THREE.Color('#38BDF8'), MID = new THREE.Color('#2F7BFF')

// deterministic, gentle baseline so the grid has texture before real activity loads
const base = (c, r) => 0.5 + 0.5 * Math.sin(c * 1.3 + r * 2.1) * Math.cos(c * 0.37 - r * 0.9)

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smooth = (x) => x * x * (3 - 2 * x)
// ease with a small overshoot at the end (springy landing)
const easeOutBack = (x) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  const y = x - 1
  return 1 + c3 * y * y * y + c1 * y * y
}

/** Contribution-style grid; days with recent public GitHub events rise and glow. */
function Grid({ live }) {
  const ref = useRef()
  const activity = useStoreKey('activity')
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])
  const shown = useMemo(() => new Float32Array(COLS * ROWS), []) // eased level per cell

  // target level per cell (0..1) from real activity
  const level = useMemo(() => {
    const a = new Float32Array(COLS * ROWS)
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
      const idx = c * ROWS + r, day = COLS * ROWS - 1 - idx
      const n = activity ? activity[day] || 0 : 0
      a[idx] = Math.min(1, n / 4)
    }
    return a
  }, [activity])

  // create the instance colour buffer before the first render
  useLayoutEffect(() => {
    for (let i = 0; i < COLS * ROWS; i++) ref.current.setColorAt(i, LOW)
    ref.current.instanceColor.needsUpdate = true
  }, [])

  useFrame((s, dt) => {
    const L = live.current
    if (!L.on) return

    const reduce = store.reduce
    const t = s.clock.elapsedTime
    const tIn = t - L.enter // seconds since the camera arrived
    const scan = reduce ? -99 : ((t * 5) % (COLS + 14)) - 7 // column the light is on

    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
      const idx = c * ROWS + r

      // ease toward the real level
      shown[idx] = reduce ? level[idx] : damp(shown[idx], level[idx], 3.2, dt)
      const l = shown[idx]
      const b = base(c, r)

      // build-in wave: left to right, back to front
      const grow = reduce ? 1 : easeOutBack(clamp01((tIn - (c * 0.03 + r * 0.018)) / 0.9))

      // light scan passing over this column
      const d = c - scan
      const hit = reduce ? 0 : Math.exp(-(d * d) / 6)

      const wave = reduce ? 0 : Math.sin(t * 1.2 + c * 0.45 + r * 0.3) * 0.05
      const h = Math.max(0.01, (0.12 + b * 0.18 + l * 1.3 + wave + hit * 0.16) * grow)

      dummy.position.set((c - COLS / 2) * GAP, h / 2, (r - ROWS / 2) * GAP)
      dummy.scale.set(0.44, h, 0.44)
      dummy.updateMatrix()
      ref.current.setMatrixAt(idx, dummy.matrix)

      // colour: dark → blue → cyan with activity, plus scan light and a soft pulse
      col.copy(LOW).lerp(MID, Math.min(1, b * 0.15 + Math.min(l * 2, 1) * 0.9))
      if (l > 0.5) col.lerp(HIGH, (l - 0.5) * 2)
      if (hit > 0.02) col.lerp(HIGH, hit * 0.5)
      if (!reduce && l > 0.05) {
        col.multiplyScalar(1 + Math.sin(t * 2.2 + c * 0.6 + r * 0.9) * 0.12 * Math.min(1, l * 2))
      }
      ref.current.setColorAt(idx, col)
    }

    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COLS * ROWS]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FFFFFF" emissive="#1D4ED8" emissiveIntensity={0.5} metalness={0.3} roughness={0.35} />
    </instancedMesh>
  )
}

/** Floating data points rising above the grid. Each one fades in and out over its life. */
function DataPoints({ live }) {
  const n = { high: 140, mid: 90, low: 50 }[store.tier]
  const ref = useRef()
  const seed = useMemo(
    () => Array.from({ length: n }, () => [(Math.random() - 0.5) * 15, Math.random() * 5, (Math.random() - 0.5) * 5, 0.2 + Math.random() * 0.4]),
    [n]
  )
  const pos = useMemo(() => new Float32Array(n * 3), [n])
  const colr = useMemo(() => new Float32Array(n * 3), [n])

  useFrame((s) => {
    const L = live.current
    if (!L.on) return

    const reduce = store.reduce
    const t = reduce ? 0 : s.clock.elapsedTime
    // points appear a moment after the grid starts building
    const appear = reduce ? 1 : smooth(clamp01((s.clock.elapsedTime - L.enter - 0.8) / 1.4))

    for (let i = 0; i < n; i++) {
      const [x, y, z, sp] = seed[i]
      const life = ((y + t * sp) % 5) / 5 // 0 → 1 as the point rises

      pos[i * 3] = x + (reduce ? 0 : Math.sin(t * 0.5 + i) * 0.12)
      pos[i * 3 + 1] = 0.6 + life * 5
      pos[i * 3 + 2] = z

      // additive blending: darker colour = more transparent, so this is a fade
      const f = Math.sin(Math.PI * life) * appear
      colr[i * 3] = 0.5 * f
      colr[i * 3 + 1] = 0.85 * f
      colr[i * 3 + 2] = f
    }

    const g = ref.current.geometry.attributes
    g.position.needsUpdate = true
    g.color.needsUpdate = true
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[colr, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.09} sizeAttenuation vertexColors color="#FFFFFF" transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

const FLOW = 2 // pulses travelling along each link

function RepoNodes({ live }) {
  const all = useStoreKey('repos')
  const nodes = useRef([])
  const meshes = useRef([])
  const glows = useRef([])
  const links = useRef([])
  const chain = useRef([])
  const flow = useRef()

  const list = useMemo(
    () =>
      (all || []).slice(0, 6).map((r, i, arr) => {
        const a = (i / Math.max(1, arr.length - 1) - 0.5) * 2.4
        return { r, p: [Math.sin(a) * 6.2, 3.1 + Math.cos(a * 2) * 0.5, -2.2 - Math.cos(a) * 0.8] }
      }),
    [all]
  )

  const flowPos = useMemo(() => new Float32Array(list.length * FLOW * 3), [list])
  const flowCol = useMemo(() => new Float32Array(list.length * FLOW * 3), [list])

  useFrame((s) => {
    const L = live.current
    if (!L.on) return

    const reduce = store.reduce
    const t = s.clock.elapsedTime
    const tIn = t - L.enter

    list.forEach((item, i) => {
      // nodes pop in one after another, links fade in just before them
      const pop = reduce ? 1 : easeOutBack(clamp01((tIn - 0.7 - i * 0.12) / 0.8))
      const fade = reduce ? 1 : clamp01((tIn - 0.5 - i * 0.12) / 0.6)

      const g = nodes.current[i]
      if (g) {
        g.position.y = item.p[1] + (reduce ? 0 : Math.sin(t * 0.9 + i) * 0.12)
        g.scale.setScalar(Math.max(0.0001, pop))
      }

      const m = meshes.current[i]
      if (m && !reduce) {
        m.rotation.y = t * 0.7 + i
        m.rotation.x = Math.sin(t * 0.5 + i) * 0.3
      }

      const gl = glows.current[i]
      if (gl && !reduce) {
        const breathe = Math.sin(t * 1.6 + i * 1.3)
        const k = 2 * (1 + breathe * 0.1)
        gl.scale.set(k, k, 1)
        gl.material.opacity = 0.5 + breathe * 0.12
      }

      if (links.current[i]) links.current[i].material.opacity = 0.35 * fade
      if (chain.current[i]) chain.current[i].material.opacity = 0.3 * fade
    })

    // pulses travelling from the grid up to each repo
    if (flow.current && list.length) {
      let k = 0
      list.forEach((item, i) => {
        const ready = reduce ? 0 : clamp01((tIn - 1 - i * 0.12) / 0.6)
        for (let j = 0; j < FLOW; j++) {
          const ph = (t * 0.32 + i * 0.17 + j / FLOW) % 1
          const e = smooth(ph)
          flowPos[k * 3] = item.p[0] * e
          flowPos[k * 3 + 1] = 0.5 + (item.p[1] - 0.5) * e
          flowPos[k * 3 + 2] = item.p[2] * e

          const f = Math.sin(Math.PI * ph) * ready
          flowCol[k * 3] = 0.45 * f
          flowCol[k * 3 + 1] = 0.8 * f
          flowCol[k * 3 + 2] = f
          k++
        }
      })
      const a = flow.current.geometry.attributes
      a.position.needsUpdate = true
      a.color.needsUpdate = true
    }
  })

  return (
    <>
      {list.map(({ r, p }, i) => (
        <group key={r.id}>
          <Line ref={(el) => (links.current[i] = el)} points={[[0, 0.5, 0], p]} color="#38BDF8" transparent opacity={0.35} lineWidth={1} />
          {i > 0 && (
            <Line ref={(el) => (chain.current[i] = el)} points={[list[i - 1].p, p]} color="#6FA8FF" transparent opacity={0.3} lineWidth={1} />
          )}
          <group ref={(el) => (nodes.current[i] = el)} position={p}>
            <mesh ref={(el) => (meshes.current[i] = el)}>
              <octahedronGeometry args={[0.24]} />
              <meshStandardMaterial color="#6FA8FF" emissive="#2F7BFF" emissiveIntensity={1.1} metalness={0.5} roughness={0.2} />
            </mesh>
            <sprite ref={(el) => (glows.current[i] = el)} scale={[2, 2, 1]}>
              <spriteMaterial map={glowTexture()} color="#2F7BFF" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <Billboard position={[0, 0.55, 0]}>
              <Text font={FONT_MED} fontSize={0.22} color="#EAF2FF" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#04111B">
                {r.name}
              </Text>
            </Billboard>
          </group>
        </group>
      ))}

      {list.length > 0 && (
        <points key={list.length} ref={flow} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[flowPos, 3]} />
            <bufferAttribute attach="attributes-color" args={[flowCol, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.14} sizeAttenuation vertexColors color="#FFFFFF" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
      )}
    </>
  )
}

export default function GithubScene() {
  const outer = useRef()
  const root = useRef()

  // Shared with the children: is the camera looking here, and since when
  const live = useRef({ on: false, enter: 0 })

  const view = useMemo(
    () => ({
      frustum: new THREE.Frustum(),
      matrix: new THREE.Matrix4(),
      sphere: new THREE.Sphere(new THREE.Vector3(), 10), // covers grid, repos and label
      scale: new THREE.Vector3(),
    }),
    []
  )

  // Priority -1: runs before the children's frame callbacks, so on the very
  // first visible frame they already know the scene is live.
  useFrame((s, dt) => {
    const { frustum, matrix, sphere, scale } = view

    // Is the scene inside the camera's view? (uses world position, so parent transforms are fine)
    outer.current.getWorldPosition(sphere.center)
    outer.current.getWorldScale(scale)
    sphere.radius = 10 * Math.max(scale.x, scale.y, scale.z)

    matrix.multiplyMatrices(s.camera.projectionMatrix, s.camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(matrix)
    const on = frustum.intersectsSphere(sphere)

    if (on && !live.current.on) live.current.enter = s.clock.elapsedTime // entrance replays each visit
    live.current.on = on
    root.current.visible = on // nothing is drawn while we are out of view
    if (!on) return

    const reduce = store.reduce
    const px = reduce ? 0 : store.pointer.x
    const py = reduce ? 0 : store.pointer.y || 0

    root.current.rotation.y = damp(
      root.current.rotation.y,
      px * 0.12 + Math.sin(s.clock.elapsedTime * 0.2) * 0.04 * (reduce ? 0 : 1),
      2,
      dt
    )
    root.current.rotation.x = damp(root.current.rotation.x, -py * 0.05, 2, dt)
  }, -1)

  return (
    <group ref={outer} position={GH_C}>
      <group ref={root} visible={false}>
        <Grid live={live} />
        <DataPoints live={live} />
        <RepoNodes live={live} />
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16.5, 5.2]} />
          <meshBasicMaterial color="#1D4ED8" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <Text font={FONT_BOLD} fontSize={0.34} color="#6FA8FF" position={[-7.2, 0.05, 3.4]} rotation={[-Math.PI / 2, 0, 0]} anchorX="left">
          LAST 26 WEEKS
        </Text>
      </group>
    </group>
  )
}