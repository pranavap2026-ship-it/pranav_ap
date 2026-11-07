import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float, Billboard, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { store } from '../../lib/store'
import { profile } from '../../data'
import { FONT_BOLD, damp, glowTexture } from '../util'

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

/** A floating tech object: drifts, parallaxes against the cursor, and spins when you click it. */
function FloatingObject({ o, i }) {
  const g = useRef(), m = useRef()
  const spin = useRef(0)
  useFrame((_, dt) => {
    const depth = 0.5 + (o.p[2] + 6) * 0.06
    g.current.position.x = o.p[0] + store.pointer.x * depth * (store.reduce ? 0 : 1)
    g.current.position.y = o.p[1] + store.pointer.y * depth * 0.6 * (store.reduce ? 0 : 1)
    const v = (store.reduce ? 0 : 0.15 + (i % 3) * 0.08) + spin.current
    m.current.rotation.x += dt * v; m.current.rotation.y += dt * v * 1.3
    spin.current = damp(spin.current, 0, 1.6, dt)
  })
  return (
    <group ref={g} position={o.p}>
      <Float speed={store.reduce ? 0 : 1.2 + (i % 4) * 0.25} floatIntensity={0.9} rotationIntensity={0}>
        <mesh ref={m} scale={o.s} onClick={(e) => { e.stopPropagation(); spin.current = 6 }}>
          <Shape g={o.g} />
          <meshStandardMaterial color={o.c} metalness={0.65} roughness={0.22} emissive={o.c} emissiveIntensity={0.12} />
        </mesh>
      </Float>
    </group>
  )
}

function Particles() {
  const n = { high: 900, mid: 520, low: 220 }[store.tier]
  const ref = useRef()
  const pos = useMemo(() => {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 4 + Math.random() * 15, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1)
      a[i * 3] = r * Math.sin(ph) * Math.cos(th); a[i * 3 + 1] = r * Math.cos(ph) * 0.7; a[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 2
    }
    return a
  }, [n])
  useFrame((_, dt) => { if (!store.reduce) ref.current.rotation.y += dt * 0.012 })
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.045} sizeAttenuation color="#9CC4FF" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

export default function HeroScene() {
  const root = useRef(), core = useRef(), rings = useRef(), tokens = useRef()
  const compact = store.tier === 'low'
  const name = profile.name.toUpperCase()

  useFrame((_, dt) => {
    const k = store.reduce ? 0 : 1
    core.current.rotation.y += dt * 0.22 * k
    rings.current.rotation.y += dt * 0.3 * k
    rings.current.rotation.x += dt * 0.07 * k
    tokens.current.rotation.y -= dt * 0.18 * k
    // whole universe leans toward the cursor
    root.current.rotation.y = damp(root.current.rotation.y, store.pointer.x * 0.14 * k, 3, dt)
    root.current.rotation.x = damp(root.current.rotation.x, -store.pointer.y * 0.07 * k, 3, dt)
  })

  return (
    <group ref={root}>
      {/* 3D typography: a front face plus stacked darker copies behind it for depth */}
      <group position={[0, compact ? 2.6 : 2.5, -1.5]}>
        {Array.from({ length: 7 }, (_, i) => (
          <Text key={i} font={FONT_BOLD} fontSize={compact ? 2.3 : 3.1} letterSpacing={-0.04} anchorX="center" anchorY="middle" position={[0, 0, -(6 - i) * 0.075]}>
            {name}
            <meshStandardMaterial color={i === 6 ? '#EAF2FF' : '#1D4ED8'} emissive={i === 6 ? '#6FA8FF' : '#0B2A63'} emissiveIntensity={i === 6 ? 0.28 : 0.7} metalness={0.2} roughness={0.35} />
          </Text>
        ))}
      </group>

      {/* digital identity core */}
      <group position={[0, -0.1, 0]}>
        <mesh ref={core}>
          <icosahedronGeometry args={[1.05, 4]} />
          <MeshDistortMaterial color="#1D4ED8" emissive="#2F7BFF" emissiveIntensity={0.55} roughness={0.15} metalness={0.7} distort={store.reduce ? 0 : 0.28} speed={1.4} />
        </mesh>
        <mesh><icosahedronGeometry args={[1.55, 1]} /><meshBasicMaterial color="#6FA8FF" wireframe transparent opacity={0.28} /></mesh>
        <sprite scale={[7, 7, 1]}><spriteMaterial map={glowTexture()} color="#2F7BFF" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        <group ref={rings}>
          <mesh rotation={[1.2, 0, 0]}><torusGeometry args={[2.3, 0.014, 8, 128]} /><meshBasicMaterial color="#38BDF8" toneMapped={false} /></mesh>
          <mesh rotation={[0.4, 0.8, 0]}><torusGeometry args={[2.7, 0.01, 8, 128]} /><meshBasicMaterial color="#6FA8FF" toneMapped={false} /></mesh>
          <mesh rotation={[-0.7, 0.2, 1]}><torusGeometry args={[3.1, 0.01, 8, 128]} /><meshBasicMaterial color="#2F7BFF" toneMapped={false} /></mesh>
        </group>
        <group ref={tokens}>
          {TOKENS.map((t, i) => {
            const a = (i / TOKENS.length) * Math.PI * 2
            return (
              <Billboard key={t} position={[Math.cos(a) * 3.6, Math.sin(a * 2) * 0.7, Math.sin(a) * 3.6]}>
                <Text font={FONT_BOLD} fontSize={0.42} color="#9CC4FF" anchorX="center" anchorY="middle" fillOpacity={0.9}>{t}</Text>
              </Billboard>
            )
          })}
        </group>
      </group>

      {OBJECTS.slice(0, compact ? 5 : OBJECTS.length).map((o, i) => <FloatingObject key={i} o={o} i={i} />)}
      <Particles />
    </group>
  )
}
