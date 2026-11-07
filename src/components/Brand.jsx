import { brands } from '../lib/brands'

/** Official brand mark (Simple Icons) in its brand colour. */
export default function Brand({ name, size = 22, mono = false }) {
  const b = brands[name]
  if (!b) return null
  return (
    <svg className="brand" width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={b.title}>
      <path d={b.path} fill={mono ? 'currentColor' : b.hex} />
    </svg>
  )
}
