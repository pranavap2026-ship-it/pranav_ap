/* Scene + camera journey configuration. Pure data and maths (no three import) so it can be unit-tested in Node.
   Everything lives in one world: the camera travels roughly along -Z, visiting seven "environments". */
import { journey, certifications, projects, skillGroups } from '../data'
import { store } from '../lib/store'

export const SCENE_IDS = ['top', 'about', 'skills', 'journey', 'work', 'github', 'contact']
export const SCENE_NAMES = ['Universe', 'Workspace', 'Galaxy', 'Journey', 'Gallery', 'Activity', 'Portal']

/* ───────── world layout ───────── */
export const ABOUT_C = [0, 0.2, -46]

export const SKILL_C = [0, 0, -100]
export const SKILL_R = 9
export const skillCluster = (g) => {
  const a = (g * Math.PI * 2) / skillGroups.length
  return [SKILL_C[0] + SKILL_R * Math.sin(a), SKILL_C[1] + 0.8 * Math.sin(2 * a), SKILL_C[2] + SKILL_R * Math.cos(a)]
}

export const EXPERIENCE_COUNT = 3
export const JOURNEY_N = journey.length + EXPERIENCE_COUNT + certifications.length
export const journeyPoint = (k) => [4 * Math.sin(k * 0.9), 0.8 * Math.sin(k * 0.55 + 0.5), -146 - 4.6 * k]

export const PROJECT_Z0 = -222
export const PROJECT_DZ = -9.4
export const projectPos = (k) => [(k % 2 ? 1 : -1) * 5.2, 0.45 * Math.sin(k * 1.7), PROJECT_Z0 + PROJECT_DZ * k]

export const GH_C = [0, 0, -345]
export const PORTAL_C = [0, 0, -400]

/* ───────── camera keyframes per scene ({ p: position, l: look-at }) ───────── */
const kfHero = [
  { p: [0, 0.5, 12.5], l: [0, 0.6, 0] },
  { p: [2.9, 0.3, 6.4], l: [0.2, 0.3, 0] },
]
const kfAbout = [
  { p: [-7.6, 2.6, -41.5], l: ABOUT_C },
  { p: [0.8, 3.2, -37.6], l: ABOUT_C },
  { p: [8.0, 2.0, -43.0], l: ABOUT_C },
  { p: [6.4, 1.0, -52.0], l: ABOUT_C },
]
const kfSkills = skillGroups.map((_, g) => {
  const a = (g * Math.PI * 2) / skillGroups.length
  const c = skillCluster(g)
  return { p: [c[0] + 7.2 * Math.sin(a), c[1] + 1.3, c[2] + 7.2 * Math.cos(a)], l: c }
})
const kfJourney = Array.from({ length: JOURNEY_N }, (_, k) => {
  const t = journeyPoint(k), n = journeyPoint(Math.min(k + 1, JOURNEY_N - 1))
  return { p: [t[0] * 0.6, t[1] + 1.3, t[2] + 5.6], l: [(t[0] + n[0]) / 2, t[1], (t[2] + n[2]) / 2 - 1] }
})
const kfProjects = projects.map((_, k) => {
  const P = projectPos(k)
  return { p: [-P[0] * 0.2, 0.3, P[2] + 9], l: [P[0] * 0.55, P[1], P[2]] }
})
const kfGithub = [
  { p: [0, 5.2, -329], l: [0, -0.6, -345] },
  { p: [8.5, 3.2, -335], l: [0, 0.2, -345] },
  { p: [-7.5, 2.2, -336], l: [0, 0.2, -345] },
]
const kfContact = [
  { p: [0, 0.8, -381], l: PORTAL_C },
  { p: [0, 0.2, -390.5], l: PORTAL_C },
]

const defKnots = (n, last) => last
  ? Array.from({ length: n }, (_, j) => (n === 1 ? 0 : j / (n - 1)))
  : [...Array.from({ length: n }, (_, j) => (n === 1 ? 0 : (j / (n - 1)) * 0.76)), 1]

/* shift: horizontal screen offset of the 3D scene (fraction of width, + = right) so it sits beside the text. */
const defs = [
  { kf: kfHero, shift: 0, pal: { bg: '#060E1F', fog: '#060E1F', key: '#6FA8FF', fill: '#2F7BFF' } },
  { kf: kfAbout, shift: -0.2, pal: { bg: '#071429', fog: '#071429', key: '#FFD2A0', fill: '#2F7BFF' } },
  { kf: kfSkills, shift: 0.2, pal: { bg: '#050A1D', fog: '#050A1D', key: '#8FB8FF', fill: '#38BDF8' } },
  { kf: kfJourney, shift: 0, pal: { bg: '#061624', fog: '#061624', key: '#7FD8FF', fill: '#2F7BFF' } },
  { kf: kfProjects, shift: 0, pal: { bg: '#070E22', fog: '#070E22', key: '#A9C8FF', fill: '#2F7BFF' } },
  { kf: kfGithub, shift: 0, pal: { bg: '#04111B', fog: '#04111B', key: '#7FD8FF', fill: '#38BDF8' } },
  { kf: kfContact, shift: -0.2, pal: { bg: '#050A1A', fog: '#050A1A', key: '#8FD8FF', fill: '#38BDF8' } },
]
export const SCENES = defs.map((d, i) => ({ ...d, id: SCENE_IDS[i], name: SCENE_NAMES[i], knots: defKnots(d.kf.length, i === defs.length - 1) }))

/* flatten into one global keyframe list */
export const G0 = []
const P = [], L = []
SCENES.forEach((s) => { G0.push(P.length); s.kf.forEach((k) => { P.push(k.p); L.push(k.l) }) })
export const KF_COUNT = P.length

const smooth = (t) => t * t * (3 - 2 * t)
const ease = (f) => f + 0.6 * (smooth(f) - f) // soft dwell on every keyframe

/** scene index + scroll progress → global keyframe index (float), plus how far into the scene→scene transition we are. */
export function mapScene(i, p, out) {
  const sc = SCENES[i]
  const knots = store.knots[i] || sc.knots
  const m = knots.length
  let j = 0
  while (j < m - 2 && p > knots[j + 1]) j++
  const k0 = knots[j], k1 = knots[j + 1]
  let f = k1 > k0 ? (p - k0) / (k1 - k0) : 0
  f = Math.min(1, Math.max(0, f))
  out.gi = G0[i] + j + ease(f)
  out.trans = i < SCENES.length - 1 && j === m - 2 ? f : 0
  return out
}

/** scene float for a global keyframe index: integer = settled inside a scene, fraction = flying to the next one. */
export function sceneFloat(gi) {
  let i = SCENES.length - 1
  while (i > 0 && gi < G0[i]) i--
  const n = SCENES[i].kf.length
  const off = gi - G0[i]
  return i + (off > n - 1 && i < SCENES.length - 1 ? Math.min(1, off - (n - 1)) : 0)
}

function cr(a, b, c, d, f) {
  const f2 = f * f, f3 = f2 * f
  return 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f2 + (-a + 3 * b - 3 * c + d) * f3)
}
/** Catmull-Rom through the global keyframes (pos and look-at). */
export function sample(gi, pos, look) {
  const max = KF_COUNT - 1
  const g = Math.min(max, Math.max(0, gi))
  const i1 = Math.min(max - 1, Math.floor(g)), f = g - i1
  const ix = (i) => Math.min(max, Math.max(0, i))
  for (let c = 0; c < 3; c++) {
    pos[c] = cr(P[ix(i1 - 1)][c], P[i1][c], P[ix(i1 + 1)][c], P[ix(i1 + 2)][c], f)
    look[c] = cr(L[ix(i1 - 1)][c], L[i1][c], L[ix(i1 + 1)][c], L[ix(i1 + 2)][c], f)
  }
}

/** Where the glowing transition gates sit: halfway along each scene→scene fly-through. */
export function gates() {
  const out = []
  for (let i = 0; i < SCENES.length - 1; i++) {
    const g = G0[i + 1] - 0.5
    const a = [0, 0, 0], b = [0, 0, 0], l = [0, 0, 0]
    sample(g - 0.02, a, l); sample(g + 0.02, b, l); sample(g, l, [0, 0, 0])
    out.push({ pos: l.slice(), dir: [b[0] - a[0], b[1] - a[1], b[2] - a[2]] })
  }
  return out
}
