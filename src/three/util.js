import * as THREE from 'three'
export const BASE = import.meta.env.BASE_URL
export const FONT_BOLD = `${BASE}fonts/space-grotesk-latin-700-normal.woff`
export const FONT_MED = `${BASE}fonts/space-grotesk-latin-500-normal.woff`
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (t) => t * t * (3 - 2 * t)
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt))
/** true when a pointer event started on top of real page UI (glass panels, links…) so 3D should ignore it */
export const overUI = (e) => !!e.nativeEvent?.target?.closest?.('.ui, a, button, input, textarea, summary, label, .nav, .assistant-panel')
export const cursor = (v) => { document.body.style.cursor = v }

let glow = null
/** soft radial sprite texture, shared by every glow in the world */
export function glowTexture() {
  if (glow) return glow
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r; g.fillRect(0, 0, 128, 128)
  glow = new THREE.CanvasTexture(c); glow.colorSpace = THREE.SRGBColorSpace
  return glow
}
export function disposeShared() { glow?.dispose(); glow = null }
