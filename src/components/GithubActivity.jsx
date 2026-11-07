import { useEffect, useState } from 'react'
import { profile } from '../data'
import { setStore } from '../lib/store'
import { Squiggle } from './Bits'

/* ------------------------------------------------------------------
   GithubActivity — one file: component + styles.

   Colours, radii and fonts come from the global CSS variables
   (--card, --line, --blue-d, --r-m, --display, ...), so re-theming
   still happens in one place.
------------------------------------------------------------------ */

const DAYS = 26 * 7

export default function GithubActivity() {
  const [repos, setRepos] = useState([])
  const [status, setStatus] = useState('Loading public repositories…')

  useEffect(() => {
    if (!profile.github) {
      setStatus('Add your GitHub profile URL in src/data.js.')
      return
    }

    const username = profile.github.split('/').filter(Boolean).pop()
    const ac = new AbortController()

    // Recently updated public repositories
    fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`,
      { signal: ac.signal }
    )
      .then((r) => {
        if (!r.ok) throw new Error('GitHub API unavailable')
        return r.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setRepos(list)
        setStore('repos', list)
        setStatus(list.length ? '' : 'No public repositories found yet.')
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setStatus(
            'Repository activity is temporarily unavailable. Visit GitHub to explore the latest work.'
          )
        }
      })

    // Recent public events → which days light up in the 3D grid
    // (optional, fails silently)
    fetch(
      `https://api.github.com/users/${username}/events/public?per_page=100`,
      { signal: ac.signal }
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((ev) => {
        if (!Array.isArray(ev)) return

        const days = new Array(DAYS).fill(0)
        const now = Date.now()

        ev.forEach((e) => {
          const d = Math.floor((now - new Date(e.created_at)) / 864e5)
          if (d >= 0 && d < DAYS) days[d]++
        })

        setStore('activity', days)
      })
      .catch(() => {})

    return () => ac.abort()
  }, [])

  return (
    <>
      <style>{css}</style>

      <section className="section github-section" id="github">
        <div className="wrap gh-stage">
          <div className="sec-head glass ui">
            <span className="pill">Open source & experiments</span>

            <h2 className="h2">
              Around my{' '}
              <span className="hl">
                GitHub
                <Squiggle />
              </span>
            </h2>

            <p className="lead">
              A live snapshot of recently updated public repositories. Cubes
              rise on days with recent public activity.
            </p>

            <a
              className="btn btn-line github-cta"
              href={profile.github}
              target="_blank"
              rel="noreferrer"
            >
              Explore GitHub ↗
            </a>
          </div>

          <div className="gh-bottom">
            {status && <p className="github-status glass ui">{status}</p>}

            <div className="repo-grid">
              {repos.map((repo) => (
                <a
                  className="repo-card glass ui"
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="repo-top">
                    <b>⌘ {repo.name}</b>
                    <span>↗</span>
                  </div>

                  <p>
                    {repo.description ||
                      'A project or experiment from my GitHub.'}
                  </p>

                  <div className="repo-meta">
                    <span>{repo.language || 'Code'}</span>
                    <span>⑂ {repo.forks_count}</span>
                    <span>★ {repo.stargazers_count}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------
   Styles (moved here from the global stylesheet)
------------------------------------------------------------------ */

const css = `
.github-section { background: var(--bg-2); }

/* ---------- Status message ---------- */

.github-status {
  padding: 20px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-s);
  color: var(--muted);
}

.github-cta { margin-top: 24px; }

/* ---------- Repository cards ---------- */

.repo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.repo-card {
  display: flex;
  flex-direction: column;
  min-height: 180px;
  padding: 22px;

  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-m);
  box-shadow: var(--shadow);

  transition:
    transform 0.3s var(--ease),
    border-color 0.3s,
    box-shadow 0.3s;
}

.repo-card:hover {
  transform: translateY(-7px);
  border-color: rgba(111, 168, 255, 0.45);
  box-shadow: var(--glow);
}

.repo-top {
  display: flex;
  justify-content: space-between;
  font-family: var(--display);
  font-size: 18px;
}

.repo-top span { color: var(--blue-d); }

.repo-card p {
  margin: 12px 0 auto;
  color: var(--muted);
  font-size: 14px;
}

.repo-meta {
  display: flex;
  gap: 14px;
  margin-top: 20px;
  font-size: 12px;
  font-weight: 700;
  color: var(--blue-d);
}

/* ---------- Responsive ---------- */

@media (max-width: 900px) {
  .repo-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 600px) {
  .repo-grid { grid-template-columns: 1fr; }
}
`