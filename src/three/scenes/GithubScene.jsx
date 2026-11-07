import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Line, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { store, useStoreKey } from '../../lib/store'
import { GH_C } from '../config'
import { FONT_BOLD, FONT_MED, damp, glowTexture } from '../util'

const COLS = 26, ROWS = 7, GAP = 0.56
const LOW = new THREE.Color('#12264A'), HIGH = new THREE.Color('#38BDF8'), MID = new THREE.Color('#2F7BFF')
// deterministic, gentle baseline so the grid has texture before real activity loads
const base = (c, r) => 0.5 + 0.5 * Math.sin(c * 1.3 + r * 2.1) * Math.cos(c * 0.37 - r * 0.9)

/** Contribution-style grid; days with recent public GitHub events rise and glow. */
function Grid() {
  const ref = useRef()
  const activity = useStoreKey('activity')
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const col = useMemo(() => new THREE.Color(), [])
  const level = useMemo(() => {
    const a = new Float32Array(COLS * ROWS)
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
      const idx = c * ROWS + r, day = COLS * ROWS - 1 - idx
      const n = activity ? activity[day] || 0 : 0
      a[idx] = Math.min(1, n / 4)
    }
    return a
  }, [activity])

  useLayoutEffect(() => {
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
      const idx = c * ROWS + r, l = level[idx]
      col.copy(LOW).lerp(l > 0 ? (l > 0.5 ? HIGH : MID) : LOW, l > 0 ? 0.35 + l * 0.65 : base(c, r) * 0.5)
      ref.current.setColorAt(idx, col)
    }
    ref.current.instanceColor.needsUpdate = true
  }, [level, col])

  useFrame((s) => {
    const t = store.reduce ? 0 : s.clock.elapsedTime
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
      const idx = c * ROWS + r
      const h = 0.12 + base(c, r) * 0.18 + level[idx] * 1.3 + (store.reduce ? 0 : Math.sin(t * 1.2 + c * 0.45 + r * 0.3) * 0.05)
      dummy.position.set((c - COLS / 2) * GAP, h / 2, (r - ROWS / 2) * GAP)
      dummy.scale.set(0.44, h, 0.44)
      dummy.updateMatrix()
      ref.current.setMatrixAt(idx, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COLS * ROWS]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FFFFFF" emissive="#1D4ED8" emissiveIntensity={0.5} metalness={0.3} roughness={0.35} />
    </instancedMesh>
  )
}

/** Floating data points rising above the grid. */
function DataPoints() {
  const n = { high: 140, mid: 90, low: 50 }[store.tier]
  const ref = useRef()
  const seed = useMemo(() => Array.from({ length: n }, () => [(Math.random() - 0.5) * 15, Math.random() * 5, (Math.random() - 0.5) * 5, 0.2 + Math.random() * 0.4]), [n])
  const pos = useMemo(() => new Float32Array(n * 3), [n])
  useFrame((s) => {
    const t = store.reduce ? 0 : s.clock.elapsedTime
    seed.forEach(([x, y, z, sp], i) => {
      pos[i * 3] = x; pos[i * 3 + 1] = 0.6 + ((y + t * sp) % 5); pos[i * 3 + 2] = z
    })
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.09} sizeAttenuation color="#7FD8FF" transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function RepoNodes() {
  const repos = useStoreKey('repos').slice(0, 6)
  const nodes = useRef([])
  const list = useMemo(() => repos.map((r, i) => {
    const a = (i / Math.max(1, repos.length - 1) - 0.5) * 2.4
    return { r, p: [Math.sin(a) * 6.2, 3.1 + Math.cos(a * 2) * 0.5, -2.2 - Math.cos(a) * 0.8] }
  }), [repos])
  useFrame((s) => { nodes.current.forEach((n, i) => { if (n) n.position.y = list[i].p[1] + (store.reduce ? 0 : Math.sin(s.clock.elapsedTime * 0.9 + i) * 0.12) }) })
  return list.map(({ r, p }, i) => (
    <group key={r.id}>
      <Line points={[[0, 0.5, 0], p]} color="#38BDF8" transparent opacity={0.35} lineWidth={1} />
      {i > 0 && <Line points={[list[i - 1].p, p]} color="#6FA8FF" transparent opacity={0.3} lineWidth={1} />}
      <group ref={(el) => (nodes.current[i] = el)} position={p}>
        <mesh><octahedronGeometry args={[0.24]} /><meshStandardMaterial color="#6FA8FF" emissive="#2F7BFF" emissiveIntensity={1.1} metalness={0.5} roughness={0.2} /></mesh>
        <sprite scale={[2, 2, 1]}><spriteMaterial map={glowTexture()} color="#2F7BFF" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        <Billboard position={[0, 0.55, 0]}><Text font={FONT_MED} fontSize={0.22} color="#EAF2FF" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#04111B">{r.name}</Text></Billboard>
      </group>
    </group>
  ))
}

export default function GithubScene() {
  const root = useRef()
  useFrame((s, dt) => { root.current.rotation.y = damp(root.current.rotation.y, (store.reduce ? 0 : store.pointer.x * 0.12) + Math.sin(s.clock.elapsedTime * 0.2) * 0.04 * (store.reduce ? 0 : 1), 2, dt) })
  return (
    <group position={GH_C}>
      <group ref={root}>
        <Grid />
        <DataPoints />
        <RepoNodes />
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[16.5, 5.2]} /><meshBasicMaterial color="#1D4ED8" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
        <Text font={FONT_BOLD} fontSize={0.34} color="#6FA8FF" position={[-7.2, 0.05, 3.4]} rotation={[-Math.PI / 2, 0, 0]} anchorX="left">LAST 26 WEEKS</Text>
      </group>
    </group>
  )
}
