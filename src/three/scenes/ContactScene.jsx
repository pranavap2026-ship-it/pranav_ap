import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { store } from '../../lib/store'
import { PORTAL_C } from '../config'
import { clamp, damp, glowTexture, smooth } from '../util'

const vert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
const frag = `
uniform float uTime; uniform float uOpen; varying vec2 vUv;
void main(){
  vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
  float open = smoothstep(0.0, 1.0, uOpen);
  float mask = 1.0 - smoothstep(open - 0.1, open, r);
  float s1 = sin(a * 4.0 + r * 10.0 - uTime * 2.2 + sin(r * 6.0 + uTime) * 1.5);
  float s2 = sin(a * 7.0 - r * 14.0 + uTime * 1.6);
  float v = 0.5 + 0.5 * (0.6 * s1 + 0.4 * s2);
  vec3 deep = vec3(0.02, 0.07, 0.22), mid = vec3(0.18, 0.48, 1.0), hi = vec3(0.22, 0.74, 0.97);
  vec3 col = mix(deep, mid, v * (1.0 - r * 0.4));
  col += hi * pow(max(0.0, 1.0 - r), 2.5) * 0.8;
  col += hi * smoothstep(0.78, 1.0, r) * 0.5 * open;
  gl_FragColor = vec4(col, mask * (0.55 + 0.45 * v));
}`

/** A ring gateway; its swirling membrane opens as the visitor reaches the contact scene. */
export default function ContactScene() {
  const rings = useRef(), outer = useRef(), light = useRef(), glow = useRef(), pts = useRef()
  const open = useRef(0)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpen: { value: 0 } }), [])
  const n = { high: 420, mid: 260, low: 120 }[store.tier]
  const seed = useMemo(() => Array.from({ length: n }, () => [Math.random() * Math.PI * 2, Math.random(), 0.3 + Math.random() * 0.7]), [n])
  const pos = useMemo(() => new Float32Array(n * 3), [n])
  const mat = useRef()
  useEffect(() => () => mat.current?.dispose(), [])

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    open.current = damp(open.current, clamp((store.sp[6] - 0.1) / 0.35), 2.2, dt)
    const o = smooth(open.current)
    uniforms.uTime.value = store.reduce ? 0 : t
    uniforms.uOpen.value = o
    if (!store.reduce) { rings.current.rotation.z += dt * 0.25; outer.current.rotation.z -= dt * 0.12 }
    light.current.intensity = 40 * o
    glow.current.material.opacity = 0.15 + o * 0.5
    // energy spiralling into the portal
    seed.forEach(([a, r, sp], i) => {
      const f = store.reduce ? r : (r + t * 0.12 * sp) % 1
      const rad = 7 * (1 - f) + 0.3, ang = a + f * 5 + (store.reduce ? 0 : t * 0.2)
      pos[i * 3] = Math.cos(ang) * rad; pos[i * 3 + 1] = Math.sin(ang) * rad; pos[i * 3 + 2] = (1 - f) * -1.5 + f * 0.5
    })
    pts.current.geometry.attributes.position.needsUpdate = true
    pts.current.material.opacity = 0.2 + o * 0.7
  })

  return (
    <group position={PORTAL_C}>
      <group ref={rings}>
        <mesh><torusGeometry args={[3.5, 0.13, 20, 140]} /><meshStandardMaterial color="#0B2A63" emissive="#38BDF8" emissiveIntensity={1.4} metalness={0.7} roughness={0.2} /></mesh>
        <mesh><torusGeometry args={[3.1, 0.03, 8, 120]} /><meshBasicMaterial color="#6FA8FF" toneMapped={false} /></mesh>
      </group>
      <mesh ref={outer}><torusGeometry args={[4.3, 0.04, 8, 140, Math.PI * 1.6]} /><meshBasicMaterial color="#2F7BFF" toneMapped={false} /></mesh>
      <mesh>
        <circleGeometry args={[3.4, 96]} />
        <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <sprite ref={glow} scale={[16, 16, 1]}><spriteMaterial map={glowTexture()} color="#2F7BFF" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      <pointLight ref={light} color="#38BDF8" intensity={0} distance={30} decay={1.6} position={[0, 0, 3]} />
      <points ref={pts} frustumCulled={false}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
        <pointsMaterial size={0.07} sizeAttenuation color="#9CE3FF" transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}
