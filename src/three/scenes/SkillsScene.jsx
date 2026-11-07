import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { store, setStore } from '../../lib/store'
import { skills, skillGroups } from '../../data'
import { SKILL_C, skillCluster } from '../config'
import { FONT_BOLD, FONT_MED, cursor, damp, glowTexture, overUI } from '../util'

const GROUP_COLORS = ['#2F7BFF', '#38BDF8', '#6FA8FF', '#7C9CFF', '#5EEAD4']
const TILTS = [[0, 0], [0.9, 0.2], [-0.8, -0.3]]

/** skillGroups from data.js, with any skill that isn't listed dropped into the last group */
function useGroups() {
  return useMemo(() => {
    const listed = new Set(skillGroups.flatMap((g) => g.items))
    const leftovers = skills.filter((s) => !listed.has(s))
    return skillGroups.map((g, gi) => ({
      ...g, gi, color: GROUP_COLORS[gi % GROUP_COLORS.length], center: skillCluster(gi),
      items: [...g.items.filter((s) => skills.includes(s)), ...(gi === skillGroups.length - 1 ? leftovers : [])],
    }))
  }, [])
}

function Node({ name, color, gi, r, a, reg }) {
  const m = useRef(), mat = useRef(), s = useRef(1)
  useEffect(() => { reg(name, m) }, [name, reg])
  useFrame((_, dt) => {
    const hov = store.hover === name
    const act = store.group === gi
    s.current = damp(s.current, hov ? 2.1 : act ? 1.25 : 1, 8, dt)
    m.current.scale.setScalar(s.current)
    mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, hov ? 2.4 : act ? 0.95 : 0.4, 8, dt)
  })
  return (
    <group position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
      <mesh
        ref={m}
        onPointerOver={(e) => { if (overUI(e)) return; e.stopPropagation(); setStore('hover', name); cursor('pointer') }}
        onPointerOut={() => { if (store.hover === name) setStore('hover', null); cursor('') }}
      >
        <sphereGeometry args={[0.17, 20, 20]} />
        <meshStandardMaterial ref={mat} color={color} emissive={color} emissiveIntensity={0.4} metalness={0.5} roughness={0.25} />
      </mesh>
      <Billboard position={[0, 0.38, 0]}>
        <Text font={FONT_MED} fontSize={0.24} color="#EAF2FF" anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#050A1D">{name}</Text>
      </Billboard>
    </group>
  )
}

function Cluster({ g, reg }) {
  const spin = useRef([]), ring = useRef()
  const orbits = useMemo(() => {
    const layers = [[], [], []]
    g.items.forEach((name, k) => layers[k % 3].push(name))
    return layers
  }, [g])
  useFrame((_, dt) => {
    const k = store.reduce ? 0 : 1
    spin.current.forEach((o, i) => { if (o) o.rotation.y += dt * (0.22 + i * 0.08) * (i % 2 ? -1 : 1) * k })
    ring.current.rotation.z += dt * 0.2 * k
  })
  return (
    <group position={g.center}>
      <mesh><icosahedronGeometry args={[0.34, 1]} /><meshStandardMaterial color={g.color} emissive={g.color} emissiveIntensity={0.9} metalness={0.4} roughness={0.2} /></mesh>
      <sprite scale={[3.2, 3.2, 1]}><spriteMaterial map={glowTexture()} color={g.color} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      <mesh ref={ring} rotation={[1.2, 0, 0]}><torusGeometry args={[0.62, 0.012, 8, 64]} /><meshBasicMaterial color={g.color} toneMapped={false} /></mesh>
      <Billboard position={[0, 2.35, 0]}>
        <Text font={FONT_BOLD} fontSize={0.42} color="#EAF2FF" anchorX="center" anchorY="middle" maxWidth={5} textAlign="center" outlineWidth={0.015} outlineColor="#050A1D">{g.name}</Text>
      </Billboard>
      {orbits.map((names, li) => (
        <group key={li} rotation={[TILTS[li][0], 0, TILTS[li][1]]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.25 + li * 0.62, 0.006, 6, 96]} /><meshBasicMaterial color={g.color} transparent opacity={0.28} /></mesh>
          <group ref={(el) => (spin.current[li] = el)}>
            {names.map((name, k) => <Node key={name} name={name} color={g.color} gi={g.gi} r={1.25 + li * 0.62} a={(k / names.length) * Math.PI * 2 + li} reg={reg} />)}
          </group>
        </group>
      ))}
    </group>
  )
}

/** Galaxy of technology nodes with animated links to each cluster and to the central core. */
export default function SkillsScene() {
  const groups = useGroups()
  const nodes = useRef(new Map())
  const reg = useMemo(() => (name, ref) => nodes.current.set(name, ref), [])
  const lines = useRef(), pulses = useRef([])
  const core = useRef()

  const links = useMemo(() => {
    // static: core → clusters and the pentagon between clusters; dynamic: node → its cluster centre
    const stat = []
    groups.forEach((g, i) => {
      stat.push(...SKILL_C, ...g.center)
      const n = groups[(i + 1) % groups.length]
      stat.push(...g.center, ...n.center)
    })
    const dyn = groups.flatMap((g) => g.items.map((name) => ({ name, c: g.center })))
    const arr = new Float32Array((stat.length / 3 + dyn.length * 2) * 3)
    arr.set(stat)
    return { arr, dyn, statCount: stat.length }
  }, [groups])

  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame((s, dt) => {
    const k = store.reduce ? 0 : 1
    core.current.rotation.y += dt * 0.3 * k; core.current.rotation.x += dt * 0.12 * k
    let o = links.statCount
    for (const d of links.dyn) {
      const ref = nodes.current.get(d.name)
      if (ref?.current) { ref.current.getWorldPosition(v); links.arr[o] = v.x; links.arr[o + 1] = v.y; links.arr[o + 2] = v.z }
      else { links.arr[o] = d.c[0]; links.arr[o + 1] = d.c[1]; links.arr[o + 2] = d.c[2] }
      links.arr[o + 3] = d.c[0]; links.arr[o + 4] = d.c[1]; links.arr[o + 5] = d.c[2]
      o += 6
    }
    lines.current.geometry.attributes.position.needsUpdate = true
    // data pulses travelling core → cluster
    const t = s.clock.elapsedTime
    pulses.current.forEach((p, i) => {
      if (!p) return
      const c = groups[i].center
      const f = store.reduce ? 0.5 : (t * 0.35 + i * 0.21) % 1
      p.position.set(SKILL_C[0] + (c[0] - SKILL_C[0]) * f, SKILL_C[1] + (c[1] - SKILL_C[1]) * f, SKILL_C[2] + (c[2] - SKILL_C[2]) * f)
    })
  })

  return (
    <group>
      <group position={SKILL_C}>
        <mesh ref={core}><icosahedronGeometry args={[1.0, 1]} /><meshBasicMaterial color="#6FA8FF" wireframe transparent opacity={0.5} /></mesh>
        <mesh><sphereGeometry args={[0.45, 24, 24]} /><meshStandardMaterial color="#1D4ED8" emissive="#2F7BFF" emissiveIntensity={1.2} /></mesh>
        <sprite scale={[8, 8, 1]}><spriteMaterial map={glowTexture()} color="#2F7BFF" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      </group>
      <lineSegments ref={lines} frustumCulled={false}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[links.arr, 3]} /></bufferGeometry>
        <lineBasicMaterial color="#6FA8FF" transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      {groups.map((g, i) => (
        <mesh key={g.name} ref={(el) => (pulses.current[i] = el)}><sphereGeometry args={[0.09, 12, 12]} /><meshBasicMaterial color={g.color} toneMapped={false} /></mesh>
      ))}
      {groups.map((g) => <Cluster key={g.name} g={g} reg={reg} />)}
    </group>
  )
}
