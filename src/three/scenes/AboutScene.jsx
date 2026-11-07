import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float, Billboard, RoundedBox, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { store } from '../../lib/store'
import { about, profile } from '../../data'
import { ABOUT_C } from '../config'
import { BASE, FONT_BOLD, FONT_MED, damp, glowTexture } from '../util'

const GLYPHS = [['{ }', [-3.4, 2.3, 0.6]], ['</>', [3.5, 2.6, -0.4]], ['=>', [-2.4, 3.4, -1.6]], ['( )', [2.6, 3.7, 1.2]], ['[ ]', [4.4, 0.6, 1.4]]]

/** The monitor shows a typing animation of code built from the real profile data. */
function useCodeScreen() {
  const s = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace
    const K = '#6FA8FF', T = '#EAF2FF', M = '#8FA6D6', S = '#7FD8FF', A = '#38BDF8'
    const lines = [
      [['const ', K], ['developer ', T], ['= {', M]],
      [['  name: ', M], [`'${profile.full}'`, S], [',', M]],
      [['  role: ', M], [`'${profile.role}'`, S], [',', M]],
      [['  base: ', M], [`'${profile.location.split(',').slice(0, 2).join(',')}'`, S], [',', M]],
      [['  stack: ', M], ["['React', 'Node.js', 'MongoDB']", S], [',', M]],
      [['  building: ', M], ["() => 'AI-powered apps'", A], [',', M]],
      [['}', M]],
      [['// open to freelance work', '#5E7BB5']],
    ]
    const total = lines.reduce((n, l) => n + l.reduce((m, [t]) => m + t.length, 0), 0)
    const draw = (time) => {
      const g = canvas.getContext('2d')
      g.fillStyle = '#071027'; g.fillRect(0, 0, 640, 360)
      g.fillStyle = '#0E1C38'; g.fillRect(0, 0, 640, 34)
      ;['#2F7BFF', '#6FA8FF', '#38BDF8'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(22 + i * 20, 17, 6, 0, 7); g.fill() })
      g.font = '500 24px ui-monospace, Menlo, Consolas, monospace'; g.textBaseline = 'alphabetic'
      let left = Math.floor((time * 24) % (total + 50))
      let y = 76, caret = null
      for (const line of lines) {
        let x = 26
        for (const [t, c] of line) {
          const part = t.slice(0, Math.max(0, left)); left -= t.length
          g.fillStyle = c; g.fillText(part, x, y); x += g.measureText(part).width
          if (left < 0 && !caret) caret = [x, y]
          if (left < 0) break
        }
        if (left < 0) break
        y += 36
      }
      if (caret && Math.floor(time * 2.5) % 2 === 0) { g.fillStyle = '#6FA8FF'; g.fillRect(caret[0] + 2, caret[1] - 22, 12, 26) }
      tex.needsUpdate = true
    }
    draw(30)
    return { tex, draw }
  }, [])
  useEffect(() => () => s.tex.dispose(), [s])
  return s
}

function InfoPanel({ stat, angle, radius, i }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.3, 1.15)), [])
  useEffect(() => () => edges.dispose(), [edges])
  return (
    <Billboard position={[Math.cos(angle) * radius, 0.4 + (i % 2) * 1.4, Math.sin(angle) * radius]}>
      <mesh><planeGeometry args={[2.3, 1.15]} /><meshPhysicalMaterial color="#12264A" transparent opacity={0.55} roughness={0.15} metalness={0.2} clearcoat={1} /></mesh>
      <lineSegments geometry={edges}><lineBasicMaterial color="#6FA8FF" transparent opacity={0.7} /></lineSegments>
      <Text font={FONT_BOLD} fontSize={0.46} color="#6FA8FF" position={[0, 0.17, 0.02]} anchorX="center" anchorY="middle">{stat.value}</Text>
      <Text font={FONT_MED} fontSize={0.15} color="#D6E2FF" position={[0, -0.28, 0.02]} maxWidth={2} textAlign="center" anchorX="center" anchorY="middle">{stat.label}</Text>
    </Billboard>
  )
}

function PortraitFrame() {
  const tex = useTexture(`${BASE}img/photos/portrait-profile.jpg`)
  tex.colorSpace = THREE.SRGBColorSpace
  return (
    <Float speed={store.reduce ? 0 : 1} floatIntensity={0.6} rotationIntensity={0.1}>
      <group position={[-3.7, 1.7, -1.6]} rotation={[0, 0.5, 0]}>
        <RoundedBox args={[1.9, 2.4, 0.08]} radius={0.05} smoothness={3}><meshStandardMaterial color="#12264A" metalness={0.5} roughness={0.3} emissive="#2F7BFF" emissiveIntensity={0.15} /></RoundedBox>
        <mesh position={[0, 0, 0.05]}><planeGeometry args={[1.7, 2.2]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      </group>
    </Float>
  )
}

export default function AboutScene() {
  const orbit = useRef(), mon = useRef(), glyphs = useRef()
  const screen = useCodeScreen()
  const last = useRef(0)
  const tier = store.tier

  useFrame((s, dt) => {
    const k = store.reduce ? 0 : 1
    orbit.current.rotation.y += dt * 0.12 * k
    glyphs.current.rotation.y += dt * 0.05 * k
    mon.current.rotation.y = damp(mon.current.rotation.y, Math.sin(s.clock.elapsedTime * 0.3) * 0.06 * k + store.pointer.x * 0.1 * k, 2, dt)
    if (!store.reduce && s.clock.elapsedTime - last.current > 0.1) { last.current = s.clock.elapsedTime; screen.draw(s.clock.elapsedTime) }
  })

  return (
    <group position={ABOUT_C}>
      {/* floating platform */}
      <mesh position={[0, -1.35, 0]}><cylinderGeometry args={[5.6, 5.6, 0.12, 64]} /><meshStandardMaterial color="#0A1731" metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[0, -1.28, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[5.6, 0.03, 8, 128]} /><meshBasicMaterial color="#38BDF8" toneMapped={false} /></mesh>
      <mesh position={[0, -1.7, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[7, 48]} /><meshBasicMaterial color="#2F7BFF" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>

      {/* desk */}
      <mesh position={[0, -0.8, 0]}><boxGeometry args={[6.4, 0.16, 2.9]} /><meshStandardMaterial color="#12264A" metalness={0.35} roughness={0.45} /></mesh>
      <mesh position={[-2.8, -1.1, 1.1]}><boxGeometry args={[0.14, 0.5, 0.14]} /><meshStandardMaterial color="#0E1C38" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[2.8, -1.1, 1.1]}><boxGeometry args={[0.14, 0.5, 0.14]} /><meshStandardMaterial color="#0E1C38" metalness={0.6} roughness={0.4} /></mesh>

      {/* monitor */}
      <group ref={mon} position={[0, 0, -0.6]}>
        <mesh position={[0, -0.4, 0]}><cylinderGeometry args={[0.1, 0.14, 0.7, 12]} /><meshStandardMaterial color="#1B2F5C" metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0, -0.74, 0.05]}><boxGeometry args={[1.2, 0.05, 0.7]} /><meshStandardMaterial color="#1B2F5C" metalness={0.8} roughness={0.3} /></mesh>
        <RoundedBox args={[3.6, 2.15, 0.12]} radius={0.06} smoothness={3} position={[0, 0.85, 0]}><meshStandardMaterial color="#0B1B3A" metalness={0.7} roughness={0.25} /></RoundedBox>
        <mesh position={[0, 0.85, 0.07]}><planeGeometry args={[3.4, 1.95]} /><meshBasicMaterial map={screen.tex} toneMapped={false} /></mesh>
        <sprite position={[0, 0.85, 0.5]} scale={[7, 5, 1]}><spriteMaterial map={glowTexture()} color="#2F7BFF" transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      </group>

      {/* keyboard, mouse, mug */}
      <mesh position={[0, -0.69, 0.65]}><boxGeometry args={[2.0, 0.06, 0.66]} /><meshStandardMaterial color="#0E1C38" metalness={0.5} roughness={0.4} emissive="#2F7BFF" emissiveIntensity={0.12} /></mesh>
      <mesh position={[1.6, -0.7, 0.7]}><boxGeometry args={[0.24, 0.08, 0.38]} /><meshStandardMaterial color="#1B2F5C" metalness={0.6} roughness={0.3} /></mesh>
      <group position={[-2.3, -0.55, 0.5]}>
        <mesh><cylinderGeometry args={[0.24, 0.21, 0.4, 24]} /><meshStandardMaterial color="#EAF2FF" roughness={0.4} /></mesh>
        <mesh position={[0.27, 0, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.12, 0.03, 8, 20]} /><meshStandardMaterial color="#EAF2FF" roughness={0.4} /></mesh>
      </group>

      {/* desk lamp (the one warm light in the palette) */}
      <group position={[2.5, -0.72, -0.5]}>
        <mesh><cylinderGeometry args={[0.32, 0.36, 0.08, 20]} /><meshStandardMaterial color="#1B2F5C" metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0.25]}><cylinderGeometry args={[0.03, 0.03, 1.0, 8]} /><meshStandardMaterial color="#6FA8FF" metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[-0.12, 1.1, 0]} rotation={[0, 0, -0.9]}><coneGeometry args={[0.28, 0.4, 20, 1, true]} /><meshStandardMaterial color="#FFD2A0" emissive="#FFB36B" emissiveIntensity={0.6} side={THREE.DoubleSide} /></mesh>
        <pointLight position={[-0.3, 0.9, 0.1]} color="#FFB36B" intensity={7} distance={7} decay={2} />
      </group>

      <PortraitFrame />

      {/* code glyphs and personal info panels */}
      <group ref={glyphs}>
        {GLYPHS.map(([t, p], i) => (
          <Float key={t} speed={store.reduce ? 0 : 1.2} floatIntensity={0.8} rotationIntensity={0.1}>
            <Billboard position={p}><Text font={FONT_BOLD} fontSize={0.62} color={i % 2 ? '#6FA8FF' : '#38BDF8'} fillOpacity={0.85} anchorX="center" anchorY="middle">{t}</Text></Billboard>
          </Float>
        ))}
      </group>
      <group ref={orbit}>
        {about.stats.map((st, i) => <InfoPanel key={st.label} stat={st} i={i} angle={(i / about.stats.length) * Math.PI * 2 + 0.6} radius={tier === 'low' ? 4.6 : 5.0} />)}
      </group>
    </group>
  )
}
