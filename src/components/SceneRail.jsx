import { SCENE_IDS, SCENE_NAMES } from '../three/names'
import { useStoreKey } from '../lib/store'
import { goTo } from '../lib/motion'

/** Fixed scene indicator: dots to jump between environments + the name of the current one. */
export default function SceneRail() {
  const active = useStoreKey('active')
  return (
    <nav className="rail" aria-label="Scenes">
      {SCENE_IDS.map((id, i) => (
        <a key={id} href={`#${id}`} className={i === active ? 'is-on' : undefined} aria-label={`Scene ${i + 1}: ${SCENE_NAMES[i]}`} aria-current={i === active ? 'true' : undefined}
          onClick={(e) => { e.preventDefault(); goTo(`#${id}`) }}>
          <span>{SCENE_NAMES[i]}</span><i />
        </a>
      ))}
      <b className="rail-count" aria-hidden="true">{String(active + 1).padStart(2, '0')}<em>/07</em></b>
    </nav>
  )
}
