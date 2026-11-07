import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { store } from '../../lib/store'
import { journey, certifications, experience } from '../../data'
import { JOURNEY_N, journeyPoint } from '../config'
import { FONT_BOLD, FONT_MED, damp, glowTexture } from '../util'

const labelFor = (k) => {
  if (k < journey.length) return journey[k].year
  if (k < journey.length + experience.length) return experience[k - journey.length].org.split(/[ ·&]/)[0]
  return certifications[k - journey.length - experience.length][0].split(/[ :·]/)[0]
}
const colorFor = (k) => (k < journey.length ? '#2F7BFF' : k < journey.length + experience.length ? '#38BDF8' : '#EAF2FF')

/** A milestone orb that lights up (and pulses a ring) once its DOM card has been reached. */
function Orb({ k, p }) {
  const g = useRef(), core = useRef(), ring = useRef(), halo = useRef()
  const lit = useRef(0)
  const color = colorFor(k)
  useFrame((s, dt) => {
    lit.current = damp(lit.current, store.lit['k' + k] ? 1 : 0, 4, dt)
    const L = lit.current
    core.current.material.emissiveIntensity = 0.2 + L * 2.2
    core.current.scale.setScalar(0.8 + L * 0.4)
    halo.current.material.opacity = 0.05 + L * 0.5
    ring.current.rotation.z += dt * (0.4 + L) * (store.reduce ? 0 : 1)
    ring.current.scale.setScalar(1 + L * 0.25 + (store.reduce ? 0 : Math.sin(s.clock.elapsedTime * 2 + k) * 0.04 * L))
  })
  return (
    <group ref={g} position={p}>
      <mesh ref={core}><icosahedronGeometry args={[0.3, 2]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} metalness={0.5} roughness={0.2} /></mesh>
      <mesh ref={ring} rotation={[1.1, 0.3, 0]}><torusGeometry args={[0.6, 0.02, 8, 64]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      <sprite ref={halo} scale={[3.4, 3.4, 1]}><spriteMaterial map={glowTexture()} color={color} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      <Billboard position={[k % 2 ? -1.1 : 1.1, 0.75, 0]}>
        <Text font={FONT_BOLD} fontSize={0.32} color="#EAF2FF" anchorX={k % 2 ? 'right' : 'left'} anchorY="middle" outlineWidth={0.012} outlineColor="#061624">{labelFor(k)}</Text>
      </Billboard>
    </group>
  )
}

/** A glowing curved pathway with milestones along it; a comet travels it as you scroll. */
export default function JourneyScene() {
  const pts = useMemo(() => Array.from({ length: JOURNEY_N }, (_, k) => new THREE.Vector3(...journeyPoint(k))), [])
  const curve = useMemo(() => {
    const first = pts[0].clone().add(new THREE.Vector3(0, 0, 14)), last = pts[pts.length - 1].clone().add(new THREE.Vector3(0, 0, -16))
    return new THREE.CatmullRomCurve3([first, ...pts, last], false, 'catmullrom', 0.5)
  }, [pts])
  const comet = useRef()
  const dust = useMemo(() => {
    const n = { high: 260, mid: 160, low: 80 }[store.tier]
    const a = new Float32Array(n * 3), v = new THREE.Vector3()
    for (let i = 0; i < n; i++) {
      curve.getPoint(Math.random(), v)
      a[i * 3] = v.x + (Math.random() - 0.5) * 6; a[i * 3 + 1] = v.y + (Math.random() - 0.5) * 4; a[i * 3 + 2] = v.z + (Math.random() - 0.5) * 3
    }
    return a
  }, [curve])
  const cp = useMemo(() => new THREE.Vector3(), [])
  const t = useRef(0)

  useFrame((_, dt) => {
    // map scene progress onto the curve (the curve has 14/16 units of lead-in/out)
    const target = 0.06 + store.sp[3] * 0.86
    t.current = damp(t.current, target, 4, dt)
    curve.getPoint(Math.min(0.999, t.current), cp)
    comet.current.position.copy(cp)
  })

  return (
    <group>
      <mesh><tubeGeometry args={[curve, 240, 0.04, 8, false]} /><meshBasicMaterial color="#38BDF8" toneMapped={false} /></mesh>
      <mesh><tubeGeometry args={[curve, 120, 0.22, 6, false]} /><meshBasicMaterial color="#2F7BFF" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      {pts.map((p, k) => <Orb key={k} k={k} p={p} />)}
      <group ref={comet}>
        <mesh><sphereGeometry args={[0.16, 16, 16]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} /></mesh>
        <sprite scale={[2.6, 2.6, 1]}><spriteMaterial map={glowTexture()} color="#6FA8FF" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      </group>
      <points frustumCulled={false}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[dust, 3]} /></bufferGeometry>
        <pointsMaterial size={0.06} sizeAttenuation color="#9CC4FF" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}
