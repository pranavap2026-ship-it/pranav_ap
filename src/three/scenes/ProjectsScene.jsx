import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { store, setStore } from '../../lib/store'
import { projects } from '../../data'
import { projectPos } from '../config'
import { goTo } from '../../lib/motion'
import { FONT_BOLD, FONT_MED, cursor, damp, overUI } from '../util'
import { drawProjectArt } from '../projectArt'

const trim = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

/** Preview texture for a project: its image when it has one, otherwise procedural artwork. */
function usePreview(p, i) {
  const t = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 300
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
    drawProjectArt(canvas, p, i)
    if (p.image) {
      const img = new Image()
      img.onload = () => { canvas.getContext('2d').drawImage(img, 0, 34, 640, 266); tex.needsUpdate = true }
      img.src = p.image
    }
    return tex
  }, [p, i])
  useEffect(() => () => t.dispose(), [t])
  return t
}

function Panel({ p, i }) {
  const g = useRef(), halo = useRef()
  const base = projectPos(i)
  const side = base[0] < 0 ? -1 : 1
  const fwd = useRef(0), tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0 }), hov = useRef(0), over = useRef(false)
  const tex = usePreview(p, i)
  const low = store.tier === 'low'

  useFrame((s, dt) => {
    const active = store.project === i ? 1 : 0
    fwd.current = damp(fwd.current, active, 4, dt)
    hov.current = damp(hov.current, over.current ? 1 : 0, 8, dt)
    const T = tilt.current
    T.x = damp(T.x, over.current ? T.tx : 0, 8, dt); T.y = damp(T.y, over.current ? T.ty : 0, 8, dt)
    const f = fwd.current
    const bob = store.reduce ? 0 : Math.sin(s.clock.elapsedTime * 0.8 + i) * 0.08
    g.current.position.set(base[0] - side * f * 0.5, base[1] + bob, base[2] + f * 1.6)
    // panels sit angled toward the flight path and square up when they're the focus
    g.current.rotation.set(T.x, -side * 0.38 * (1 - f) + T.y, 0)
    g.current.scale.setScalar(1 + f * 0.07 + hov.current * 0.03)
    halo.current.material.opacity = 0.08 + f * 0.3 + hov.current * 0.15
  })

  const pick = (e) => {
    if (overUI(e)) return
    e.stopPropagation()
    setStore('selected', i)
    goTo(document.getElementById('project-' + i), { offset: -innerHeight / 2 + 0.36 * innerHeight, duration: 1.6 })
  }

  return (
    <group
      ref={g}
      onPointerMove={(e) => {
        if (overUI(e)) { over.current = false; return }
        e.stopPropagation(); over.current = true; cursor('pointer')
        tilt.current.ty = (e.uv.x - 0.5) * 0.45; tilt.current.tx = -(e.uv.y - 0.5) * 0.3
      }}
      onPointerOut={() => { over.current = false; cursor('') }}
      onClick={pick}
    >
      <mesh ref={halo} position={[0, 0, -0.1]}><planeGeometry args={[5.2, 3.7]} /><meshBasicMaterial color="#2F7BFF" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <RoundedBox args={[4.8, 3.3, 0.1]} radius={0.12} smoothness={4}>
        <meshPhysicalMaterial color="#0E1C38" transparent opacity={0.82} roughness={0.12} metalness={0.25} clearcoat={1} clearcoatRoughness={0.1} envMapIntensity={1.2} />
      </RoundedBox>
      <mesh position={[0, 0.5, 0.07]}><planeGeometry args={[4.4, 2.06]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      <Text font={FONT_MED} fontSize={0.13} color="#6FA8FF" position={[-2.2, -0.78, 0.08]} anchorX="left" anchorY="middle">{String(i + 1).padStart(2, '0') + '  ·  ' + p.tag}</Text>
      <Text font={FONT_BOLD} fontSize={0.3} color="#EAF2FF" position={[-2.2, -1.04, 0.08]} anchorX="left" anchorY="middle" maxWidth={4.4}>{p.title}</Text>
      {!low && <Text font={FONT_MED} fontSize={0.115} color="#B9CCF0" position={[-2.2, -1.3, 0.08]} anchorX="left" anchorY="top" maxWidth={4.4} lineHeight={1.35}>{trim(p.text, 96)}</Text>}
      <Text font={FONT_MED} fontSize={0.12} color="#38BDF8" position={[-2.2, -1.57, 0.08]} anchorX="left" anchorY="middle" maxWidth={4.4}>{trim(p.tech.join('  ·  '), 56)}</Text>
      {p.link && <Text font={FONT_BOLD} fontSize={0.12} color="#EAF2FF" position={[2.2, -0.78, 0.08]} anchorX="right" anchorY="middle">LIVE ↗</Text>}
    </group>
  )
}

/** Floating exhibition: every project sits at its own depth; the camera threads between them. */
export default function ProjectsScene() {
  // light shafts / floor so the gallery reads as a space, not floating cards
  const floor = useMemo(() => {
    const a = projectPos(0)[2], b = projectPos(projects.length - 1)[2]
    return { z: (a + b) / 2, len: Math.abs(a - b) + 40 }
  }, [])
  return (
    <group>
      <gridHelper args={[60, 60, '#2F7BFF', '#12264A']} position={[0, -3.4, floor.z]} scale={[1, 1, floor.len / 60]} material-transparent material-opacity={0.35} />
      {projects.map((p, i) => <Panel key={p.title} p={p} i={i} />)}
    </group>
  )
}
