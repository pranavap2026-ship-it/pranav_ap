import { useSyncExternalStore } from 'react'

export const SCENE_COUNT = 7

/**
 * One mutable object shared by the DOM and the 3D world.
 * 3D code reads it inside useFrame (no React re-renders); the few values that React cares about
 * (hovered skill, active project, repos…) are changed through setStore() so subscribers update.
 */
export const store = {
  tier: 'high',          // high | mid | low
  compact: false,        // phones / small tablets
  reduce: false,         // prefers-reduced-motion
  webgl: false,
  sp: new Array(SCENE_COUNT).fill(0), // scroll progress of each scene (0..1), written by ScrollTrigger
  knots: {},             // per-scene keyframe progress measured from the DOM
  gi: 0,                 // smoothed global keyframe index of the camera
  sf: 0,                 // scene "float": 2.4 = 40% of the way from scene 2 to scene 3
  active: 0,             // rounded scene index (for nav UI)
  mask: 0,               // bit mask of mounted 3D scenes
  lit: {},               // milestone lights { k0: 1, ... }
  repos: [],             // GitHub repos shown in 3D
  activity: null,        // per-day public activity counts (oldest → newest)
  hover: null,           // hovered skill name
  group: 0,              // active skill group
  project: 0,            // active project index
  selected: -1,          // project clicked in 3D
  pointer: { x: 0, y: 0 },
}

const subs = new Map()
export function setStore(key, value) {
  if (store[key] === value) return
  store[key] = value
  subs.get(key)?.forEach((f) => f())
}
export function useStoreKey(key) {
  return useSyncExternalStore(
    (cb) => { if (!subs.has(key)) subs.set(key, new Set()); subs.get(key).add(cb); return () => subs.get(key).delete(cb) },
    () => store[key],
    () => store[key],
  )
}

export function detectEnvironment() {
  const w = innerWidth
  const coarse = matchMedia('(pointer: coarse)').matches
  const mem = navigator.deviceMemory || 8
  const cores = navigator.hardwareConcurrency || 8
  store.compact = w < 900
  store.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  store.tier = w < 760 ? 'low' : (w < 1100 || coarse || mem <= 4 || cores <= 4) ? 'mid' : 'high'
  try {
    const c = document.createElement('canvas')
    store.webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { store.webgl = false }
  return store
}
