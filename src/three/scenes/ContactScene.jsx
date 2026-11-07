import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { store } from '../../lib/store'
import { PORTAL_C } from '../config'
import { FONT_BOLD, clamp, glowTexture, smooth } from '../util'

/* ─────────────────────────────────────────────────────────────────────────────
   Contact portal. Reaching the scene runs a short choreography:
   assemble → iris unlocks (spring, slight overshoot) → membrane opens → ignition (shockwave, sparks, flash) → idle (breathing,
   vortex, lightning). Everything is driven by store.sp[6], so scrolling back closes it again.
   ───────────────────────────────────────────────────────────────────────────── */

const vert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
const frag = `
uniform float uTime; uniform float uOpen; uniform float uEnergy; uniform vec2 uMouse;
varying vec2 vUv;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash(i); float b = hash(i + vec2(1.0, 0.0)); float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  p += uMouse * 0.07 * (1.0 - length(p));            // looking into it from an angle
  float r = length(p);
  float a = atan(p.y, p.x);
  float open = smoothstep(0.0, 1.0, uOpen);

  // iris mask with a ragged, swirling edge while it opens
  float edge = open * 1.02 + (fbm(vec2(a * 2.0 + uTime * 0.4, r * 3.0)) - 0.5) * 0.12 * open;
  float mask = 1.0 - smoothstep(edge - 0.08, edge, r);

  // a tunnel: texture coordinates rush toward the centre
  float depth = 0.35 / max(r, 0.04);
  vec2 tp = vec2(a / 6.2831853 * 6.0 + depth * 0.15, depth - uTime * 0.9);
  float w = fbm(tp * 1.6 + fbm(tp * 0.8 + uTime * 0.2) * 1.6);
  float bands = 0.5 + 0.5 * sin(a * 5.0 + r * 9.0 - uTime * 2.0 + w * 6.0);
  float v = clamp(0.55 * w + 0.45 * bands, 0.0, 1.0);

  vec3 deep = vec3(0.01, 0.03, 0.12); vec3 mid = vec3(0.14, 0.42, 1.0); vec3 hi = vec3(0.25, 0.78, 0.98); vec3 white = vec3(0.85, 0.95, 1.0);
  vec3 col = mix(deep, mid, v * smoothstep(0.0, 0.9, r + 0.2));
  col += hi * pow(v, 3.0) * 0.9;

  // light at the end of the tunnel
  float core = exp(-r * 5.5);
  col += mix(hi, white, 0.6) * core * (0.7 + 0.5 * uEnergy);

  // event-horizon rim with a slight chromatic fringe
  float rim = smoothstep(0.7, 0.97, r) * (1.0 - smoothstep(0.97, 1.03, r));
  col += hi * rim * (0.8 + 0.6 * sin(uTime * 3.0 + a * 6.0)) * 0.6;
  col.r += rim * 0.15; col.b += rim * 0.1;

  float alpha = mask * (0.62 + 0.38 * v + core * 0.5);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}`

const CTA = 'LET’S BUILD SOMETHING AMAZING · '
const TICKS = 72, PETALS = 6

/** underdamped spring (k = stiffness, c = damping): overshoots a little, then settles. Sub-stepped so it stays stable. */
function useSpring(k = 60, c = 9) {
  const s = useRef({ x: 0, v: 0 })
  return (target, dt) => {
    const st = s.current, n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n
    for (let i = 0; i < n; i++) { st.v += ((target - st.x) * k - st.v * c) * h; st.x += st.v * h }
    return st.x
  }
}

/** The call to action set around the gateway; letters appear in order as it opens and a highlight chases around them. */
function TextRing({ openRef }) {
  const g = useRef(), refs = useRef([])
  const chars = useMemo(() => [...CTA], [])
  const R = 5.5
  useFrame((s, dt) => {
    const t = s.clock.elapsedTime, o = openRef.current
    if (!store.reduce) g.current.rotation.z -= dt * 0.07
    const head = (t * 0.22) % 1
    refs.current.forEach((m, i) => {
      if (!m) return
      const reveal = clamp(o * 1.9 - (i / chars.length) * 0.9)
      const d = (i / chars.length - head + 1) % 1
      m.fillOpacity = reveal * (0.5 + 0.5 * Math.exp(-d * 7))
    })
  })
  return (
    <group ref={g}>
      {chars.map((ch, i) => {
        if (ch === ' ') return null
        const a = (i / chars.length) * Math.PI * 2
        return <Text key={i} ref={(el) => (refs.current[i] = el)} font={FONT_BOLD} fontSize={0.42} color="#B5D3FF" fillOpacity={0} anchorX="center" anchorY="middle" position={[Math.sin(a) * R, Math.cos(a) * R, 0]} rotation={[0, 0, -a]}>{ch}</Text>
      })}
    </group>
  )
}

export default function ContactScene() {
  const root = useRef(), body = useRef(), petals = useRef([]), rings = useRef(), outer = useRef(), core = useRef()
  const ticks = useRef(), glow = useRef(), flare = useRef(), light = useRef(), shock = useRef([]), flash = useRef()
  const vortex = useRef(), sparks = useRef(), bolts = useRef(), debris = useRef(), mat = useRef()
  const spring = useSpring()
  const st = useRef({ t0: null, prev: 0, ign: 9, seed: false, boltT: 0, mx: 0, my: 0 }).current
  const openRef = useRef(0)
  const tier = store.tier

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpen: { value: 0 }, uEnergy: { value: 0 }, uMouse: { value: new THREE.Vector2() } }), [])
  useEffect(() => () => mat.current?.dispose(), [])

  /* inward vortex: radius shrinks and spin accelerates as particles fall toward the centre */
  const NV = { high: 460, mid: 280, low: 120 }[tier]
  const V = useMemo(() => {
    const r = new Float32Array(NV), a = new Float32Array(NV), sp = new Float32Array(NV), pos = new Float32Array(NV * 3)
    for (let i = 0; i < NV; i++) { r[i] = 0.4 + Math.random() * 8.5; a[i] = Math.random() * Math.PI * 2; sp[i] = 0.5 + Math.random() * 0.9 }
    return { r, a, sp, pos }
  }, [NV])

  /* ignition sparks */
  const NS = tier === 'low' ? 60 : 150
  const S = useMemo(() => ({ pos: new Float32Array(NS * 3), vel: new Float32Array(NS * 3) }), [NS])

  /* lightning that crackles across the membrane once it is open */
  const NB = 3, SEG = 14
  const B = useMemo(() => new Float32Array(NB * SEG * 2 * 3), [])

  /* floating shards at different depths */
  const ND = tier === 'high' ? 36 : tier === 'mid' ? 22 : 0
  const D = useMemo(() => Array.from({ length: ND }, () => ({ a: Math.random() * 6.28, r: 5 + Math.random() * 3.6, z: (Math.random() - 0.5) * 3.4, s: 0.06 + Math.random() * 0.2, w: 0.03 + Math.random() * 0.1 })), [ND])
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), c: new THREE.Color(), dim: new THREE.Color('#0B2A63'), hot: new THREE.Color('#9CE3FF') }), [])

  useLayoutEffect(() => {
    // static tick-mark transforms (colours are animated each frame)
    for (let i = 0; i < TICKS; i++) {
      const a = (i / TICKS) * Math.PI * 2
      tmp.o.position.set(Math.cos(a) * 4.05, Math.sin(a) * 4.05, 0); tmp.o.rotation.set(0, 0, a); tmp.o.scale.set(1, i % 6 === 0 ? 1.8 : 1, 1); tmp.o.updateMatrix()
      ticks.current.setMatrixAt(i, tmp.o.matrix); ticks.current.setColorAt(i, tmp.dim)
    }
    ticks.current.instanceMatrix.needsUpdate = true; ticks.current.instanceColor.needsUpdate = true
  }, [tmp])

  useFrame((s, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05), t = s.clock.elapsedTime, still = store.reduce
    if (st.t0 === null) st.t0 = t

    // ── choreography clock ──
    const appear = still ? 1 : smooth(clamp((t - st.t0) / 1.9))                  // parts fly in from depth when the scene mounts
    const target = clamp((store.sp[6] - 0.08) / 0.32)
    const op = still ? target : spring(target, dt)                                 // spring = small overshoot ("pop")
    const o = clamp(op)
    openRef.current = o
    if (st.prev <= 0.55 && op > 0.55) { st.ign = 0; st.seed = true }               // ignition moment (flag, so slow frame rates can't miss it)
    if (op < 0.2) st.ign = 9
    st.prev = op
    st.ign += dt
    const ig = st.ign
    const idle = still ? 0 : t

    // ── pointer: the whole gateway leans toward the cursor, the membrane parallaxes ──
    st.mx += (store.pointer.x - st.mx) * Math.min(1, dt * 3); st.my += (store.pointer.y - st.my) * Math.min(1, dt * 3)
    root.current.rotation.y = still ? 0 : st.mx * 0.2; root.current.rotation.x = still ? 0 : -st.my * 0.12
    uniforms.uMouse.value.set(still ? 0 : st.mx, still ? 0 : st.my)

    // ── assembly + breathing ──
    body.current.position.z = -(1 - appear) * 12
    body.current.scale.setScalar((0.7 + 0.3 * appear) * (1 + (still ? 0 : Math.sin(idle * 1.2) * 0.012 * o)))
    const unlock = op                                                              // 0 → 1 (+overshoot)
    petals.current.forEach((p, i) => {
      if (!p) return
      p.rotation.z = (i / PETALS) * Math.PI * 2 + unlock * 0.95 + (1 - appear) * 2.4
      p.scale.setScalar(1 + unlock * 0.07)
    })
    rings.current.rotation.z += still ? 0 : dt * (0.12 + o * 0.55)                 // spin-up as it opens
    outer.current.rotation.z -= still ? 0 : dt * (0.06 + o * 0.2)
    rings.current.scale.setScalar(1 + (op - o) * 0.5 + (ig < 3 ? Math.exp(-ig * 5) * 0.06 : 0))
    core.current.material.emissiveIntensity = 0.7 + o * 1.2 + Math.exp(-ig * 3) * 2.2

    // ── shader ──
    uniforms.uTime.value = idle
    uniforms.uOpen.value = o
    uniforms.uEnergy.value = Math.exp(-ig * 2.5)

    // ── chaser lights around the tick ring ──
    const head = (idle * (0.18 + o * 0.35)) % 1
    for (let i = 0; i < TICKS; i++) {
      const d = (i / TICKS - head + 1) % 1, k = Math.exp(-d * 9) * (0.15 + 0.85 * o)
      tmp.c.copy(tmp.dim).lerp(tmp.hot, k)
      ticks.current.setColorAt(i, tmp.c)
    }
    ticks.current.instanceColor.needsUpdate = true

    // ── glow, flare, flash, light ──
    const flick = still ? 1 : 0.92 + 0.08 * Math.sin(t * 17) * Math.sin(t * 5.3)
    glow.current.material.opacity = 0.12 + o * 0.42 + Math.exp(-ig * 2.2) * 0.35
    flare.current.material.opacity = o * 0.5 * (0.7 + 0.3 * Math.sin(idle * 2)) + Math.exp(-ig * 3) * 0.5
    flare.current.scale.set(7 + o * 8 + Math.exp(-ig * 3) * 8, 0.9 + o * 0.5, 1)
    flash.current.material.opacity = Math.exp(-ig * 5.5) * 0.9 * (ig < 1.5 ? 1 : 0)
    light.current.intensity = (30 * o + Math.exp(-ig * 3) * 120) * flick

    // ── shockwave rings on ignition ──
    shock.current.forEach((m, i) => {
      if (!m) return
      const f = clamp((ig - i * 0.18) / 1.7)
      m.visible = f > 0 && f < 1
      m.scale.setScalar(0.4 + f * 9)
      m.material.opacity = (1 - f) * (1 - f) * 0.7
    })

    // ── vortex ──
    for (let i = 0; i < NV; i++) {
      let r = V.r[i]
      r -= dt * (still ? 0 : 0.35 + 1.4 / (r + 0.6)) * V.sp[i] * (0.4 + o)
      if (r < 0.35) { r = 7 + Math.random() * 2.5; V.a[i] = Math.random() * Math.PI * 2 }
      V.r[i] = r
      V.a[i] += dt * (still ? 0 : (0.3 + 2.2 / (r + 0.8))) * V.sp[i]
      V.pos[i * 3] = Math.cos(V.a[i]) * r; V.pos[i * 3 + 1] = Math.sin(V.a[i]) * r; V.pos[i * 3 + 2] = -(1 - r / 9.5) * 2.4
    }
    vortex.current.geometry.attributes.position.needsUpdate = true
    vortex.current.material.opacity = 0.15 + o * 0.7

    // ── sparks: a burst of particles flung outward at ignition ──
    if (st.seed) {
      st.seed = false
      for (let i = 0; i < NS; i++) {
        const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7
        S.pos[i * 3] = Math.cos(a) * 3.4; S.pos[i * 3 + 1] = Math.sin(a) * 3.4; S.pos[i * 3 + 2] = 0
        S.vel[i * 3] = Math.cos(a) * sp; S.vel[i * 3 + 1] = Math.sin(a) * sp; S.vel[i * 3 + 2] = (Math.random() - 0.2) * 5
      }
    }
    if (ig < 2.6) {
      for (let i = 0; i < NS; i++) {
        S.pos[i * 3] += S.vel[i * 3] * dt; S.pos[i * 3 + 1] += S.vel[i * 3 + 1] * dt; S.pos[i * 3 + 2] += S.vel[i * 3 + 2] * dt
        S.vel[i * 3] *= 0.96; S.vel[i * 3 + 1] *= 0.96; S.vel[i * 3 + 2] *= 0.96
      }
      sparks.current.geometry.attributes.position.needsUpdate = true
    }
    sparks.current.material.opacity = clamp(1 - ig / 2.4) * (ig < 2.6 ? 1 : 0)
    sparks.current.visible = ig < 2.6

    // ── lightning: jagged chords across the membrane, re-rolled ~11×/s ──
    if (bolts.current && o > 0.6) {
      st.boltT -= dt
      if (st.boltT <= 0 && !still) {
        st.boltT = 0.09
        for (let b = 0; b < NB; b++) {
          const a1 = Math.random() * Math.PI * 2, a2 = a1 + 0.9 + Math.random() * 1.6
          const x1 = Math.cos(a1) * 3.2, y1 = Math.sin(a1) * 3.2, x2 = Math.cos(a2) * 3.2, y2 = Math.sin(a2) * 3.2
          const nx = -(y2 - y1), ny = x2 - x1, nl = Math.hypot(nx, ny) || 1
          let px = x1, py = y1
          for (let k = 1; k <= SEG; k++) {
            const f = k / SEG, j = (Math.random() - 0.5) * 0.7 * Math.sin(Math.PI * f)
            const qx = x1 + (x2 - x1) * f + (nx / nl) * j * (1 - f * 0.2) * 1.4, qy = y1 + (y2 - y1) * f + (ny / nl) * j * 1.4
            const o6 = (b * SEG + (k - 1)) * 6
            B[o6] = px; B[o6 + 1] = py; B[o6 + 2] = 0.05; B[o6 + 3] = qx; B[o6 + 4] = qy; B[o6 + 5] = 0.05
            px = qx; py = qy
          }
        }
        bolts.current.geometry.attributes.position.needsUpdate = true
      }
      bolts.current.material.opacity = (o - 0.6) * 2.4 * (0.4 + 0.6 * Math.random())
    } else if (bolts.current) bolts.current.material.opacity = 0

    // ── shards orbit at different speeds/depths ──
    if (debris.current) {
      D.forEach((d, i) => {
        const a = d.a + idle * d.w
        tmp.o.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, d.z); tmp.o.rotation.set(idle * d.w * 3 + i, idle * d.w * 2, i); tmp.o.scale.setScalar(d.s * (0.6 + 0.4 * appear)); tmp.o.updateMatrix()
        debris.current.setMatrixAt(i, tmp.o.matrix)
      })
      debris.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group position={PORTAL_C}>
      <group ref={root}>
        <group ref={body}>
          {/* spinning main ring + inner hairline */}
          <group ref={rings}>
            <mesh ref={core}><torusGeometry args={[3.5, 0.13, 20, 140]} /><meshStandardMaterial color="#0B2A63" emissive="#38BDF8" emissiveIntensity={0.7} metalness={0.7} roughness={0.2} /></mesh>
            <mesh><torusGeometry args={[3.1, 0.03, 8, 120]} /><meshBasicMaterial color="#6FA8FF" toneMapped={false} /></mesh>
          </group>

          {/* iris petals: segmented arcs that rotate apart as the gateway unlocks */}
          {Array.from({ length: PETALS }, (_, i) => (
            <group key={i} ref={(el) => (petals.current[i] = el)}>
              <mesh><torusGeometry args={[3.78, 0.075, 8, 40, Math.PI / 3.3]} /><meshStandardMaterial color="#12306E" emissive="#2F7BFF" emissiveIntensity={0.9} metalness={0.8} roughness={0.25} /></mesh>
            </group>
          ))}
          <mesh ref={outer}><torusGeometry args={[4.4, 0.035, 8, 140, Math.PI * 1.6]} /><meshBasicMaterial color="#2F7BFF" toneMapped={false} /></mesh>

          {/* tick marks with a light chasing around them */}
          <instancedMesh ref={ticks} args={[undefined, undefined, TICKS]} frustumCulled={false}>
            <boxGeometry args={[0.05, 0.22, 0.05]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} />
          </instancedMesh>

          {/* swirling membrane */}
          <mesh>
            <circleGeometry args={[3.4, 96]} />
            <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} transparent depthWrite={false} side={THREE.DoubleSide} />
          </mesh>

          {tier !== 'low' && <TextRing openRef={openRef} />}
        </group>

        {/* ignition: white flash, lens flare, shock rings, sparks */}
        <sprite ref={flash} scale={[22, 22, 1]}><spriteMaterial map={glowTexture()} color="#EAF6FF" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        <sprite ref={flare} position={[0, 0, 0.1]} scale={[8, 1, 1]}><spriteMaterial map={glowTexture()} color="#8FD8FF" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        <sprite ref={glow} scale={[16, 16, 1]}><spriteMaterial map={glowTexture()} color="#2F7BFF" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        {[0, 1, 2].map((i) => (
          <mesh key={i} ref={(el) => (shock.current[i] = el)} visible={false}>
            <ringGeometry args={[0.97, 1, 96]} /><meshBasicMaterial color="#8FE3FF" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        ))}
        <points ref={sparks} frustumCulled={false} visible={false}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[S.pos, 3]} /></bufferGeometry>
          <pointsMaterial size={0.12} sizeAttenuation map={glowTexture()} color="#BDEBFF" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>

        {tier !== 'low' && (
          <lineSegments ref={bolts} frustumCulled={false}>
            <bufferGeometry><bufferAttribute attach="attributes-position" args={[B, 3]} /></bufferGeometry>
            <lineBasicMaterial color="#B9EEFF" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </lineSegments>
        )}

        <points ref={vortex} frustumCulled={false}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[V.pos, 3]} /></bufferGeometry>
          <pointsMaterial size={0.075} sizeAttenuation color="#9CE3FF" transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>

        {ND > 0 && (
          <instancedMesh ref={debris} args={[undefined, undefined, ND]} frustumCulled={false}>
            <icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#6FA8FF" emissive="#2F7BFF" emissiveIntensity={0.6} metalness={0.7} roughness={0.25} />
          </instancedMesh>
        )}
      </group>

      {/* nebula colour behind the gateway */}
      {[[-12, 3, -10, 32, '#1D4ED8', 0.24], [12, -2, -14, 30, '#0E7490', 0.2], [0, 0, -24, 50, '#312E81', 0.18]].map(([x, y, z, sc, c, op], i) => (
        <sprite key={i} position={[x, y, z]} scale={[sc, sc, 1]}><spriteMaterial map={glowTexture()} color={c} transparent opacity={op} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></sprite>
      ))}
      <pointLight ref={light} color="#38BDF8" intensity={0} distance={32} decay={1.6} position={[0, 0, 3]} />
    </group>
  )
}