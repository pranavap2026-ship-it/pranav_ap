import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, goTo } from '../lib/motion'
import { profile, contactSticker } from '../data'

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'
const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || ''

const initialForm = { name: '', email: '', message: '', botcheck: '' }

/** Contact portal DOM layer. The existing 3D gateway remains rendered by World.jsx behind this UI. */
export default function Contact() {
  const root = useRef(null)
  const copyTimer = useRef(null)
  const [copyStatus, setCopyStatus] = useState('idle')
  const [form, setForm] = useState(initialForm)
  const [submitState, setSubmitState] = useState('idle') // idle | sending | success | error | unconfigured
  const [feedback, setFeedback] = useState('')

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top 35%', once: true },
        defaults: { ease: 'power3.out' },
      })
      tl.from('.ct-line > span', { yPercent: 110, stagger: 0.14, duration: 1 })
        .from('.ct-card > *, .ct-copy > :not(.h2)', { y: 24, opacity: 0, stagger: 0.06, duration: 0.7 }, 0.25)
        .from('.ct-sticker', { yPercent: 30, opacity: 0, duration: 0.8 }, 0.45)
    })
    return () => mm.revert()
  }, { scope: root })

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  const copyEmail = async () => {
    window.clearTimeout(copyTimer.current)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(profile.email)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
    copyTimer.current = window.setTimeout(() => setCopyStatus('idle'), 2200)
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (submitState === 'error' || submitState === 'unconfigured') {
      setSubmitState('idle')
      setFeedback('')
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (submitState === 'sending') return

    const clean = {
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      botcheck: form.botcheck,
    }

    if (!clean.name || !clean.email || !clean.message) {
      setSubmitState('error')
      setFeedback('Please complete all fields before sending your message.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.email)) {
      setSubmitState('error')
      setFeedback('Please enter a valid email address so I can reply to you.')
      return
    }
    if (clean.name.length > 100 || clean.message.length > 5000) {
      setSubmitState('error')
      setFeedback('Please keep your name under 100 characters and your message under 5,000 characters.')
      return
    }
    if (!ACCESS_KEY) {
      setSubmitState('unconfigured')
      setFeedback('The contact form is not connected yet. Please email me directly using the address above.')
      return
    }

    setSubmitState('sending')
    setFeedback('Sending your message securely…')

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `Portfolio enquiry from ${clean.name}`,
          from_name: clean.name,
          name: clean.name,
          email: clean.email,
          message: clean.message,
          botcheck: clean.botcheck,
        }),
        signal: controller.signal,
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'The message could not be sent. Please try again.')
      }
      setSubmitState('success')
      setFeedback('Thanks! Your message has been sent successfully. I’ll get back to you soon.')
      setForm(initialForm)
    } catch (error) {
      setSubmitState('error')
      setFeedback(error.name === 'AbortError'
        ? 'The request timed out. Please check your connection and try again.'
        : (error.message || 'Something went wrong. Please try again or email me directly.'))
    } finally {
      window.clearTimeout(timeout)
    }
  }

  return (
    <section className="contact section" id="contact" ref={root} aria-labelledby="contact-title">
      <div className="wrap ct-stage">
        <div className="ct-card glass ui">
          <div className="ct-copy">
            <div className="ct-eyebrow-row">
              <span className="pill">Contact</span>
              <span className="availability"><i aria-hidden="true" />Available to connect · {profile.location}</span>
            </div>
            <h2 className="h2" id="contact-title">
              <span className="ct-line"><span>Let’s build</span></span>
              <span className="ct-line"><span>something</span></span>
              <span className="ct-line"><span>amazing.</span></span>
            </h2>
            <p>Have a project in mind, want to collaborate, or just want to say hello? Tell me a little about it. I usually reply within a day.</p>
            <div className="ct-mail">
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
              <button
                type="button"
                className={copyStatus === 'copied' ? 'is-ok' : copyStatus === 'error' ? 'is-err' : undefined}
                onClick={copyEmail}
                aria-live="polite"
              >
                {copyStatus === 'copied' ? 'Copied ✓' : copyStatus === 'error' ? 'Copy failed' : 'Copy email'}
              </button>
            </div>
            <div className="ct-links" aria-label="Other links">
              {profile.github && <a className="btn btn-ghost" href={profile.github} target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>}
              {profile.linkedin && <a className="btn btn-ghost" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>}
            </div>
          </div>

          <form className="ct-form" onSubmit={submit} noValidate>
            <div className="ct-form-heading">
              <span className="ct-form-kicker">START A CONVERSATION</span>
              <h3>Send me a message</h3>
              <p>Share the details and I’ll get back to you.</p>
            </div>
            <label htmlFor="contact-name">Name <span aria-hidden="true">*</span>
              <input id="contact-name" name="name" type="text" placeholder="Your name" autoComplete="name" maxLength="100" value={form.name} onChange={updateField} required />
            </label>
            <label htmlFor="contact-email">Email <span aria-hidden="true">*</span>
              <input id="contact-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength="254" value={form.email} onChange={updateField} required />
            </label>
            <label htmlFor="contact-message">Message <span aria-hidden="true">*</span>
              <textarea id="contact-message" name="message" rows="4" placeholder="Tell me about your idea, project or question…" maxLength="5000" value={form.message} onChange={updateField} required />
              <span className="ct-char-count">{form.message.length}/5000</span>
            </label>
            <div className="ct-honeypot" aria-hidden="true">
              <label htmlFor="contact-website">Leave this field empty
                <input id="contact-website" name="botcheck" type="checkbox" tabIndex="-1" autoComplete="off" checked={Boolean(form.botcheck)} onChange={(e) => setForm((current) => ({ ...current, botcheck: e.target.checked ? 'bot' : '' }))} />
              </label>
            </div>
            <button className="btn btn-coral ct-submit" type="submit" disabled={submitState === 'sending'}>
              {submitState === 'sending' ? <><span className="ct-spinner" aria-hidden="true" /> Sending…</> : submitState === 'success' ? <>Message sent <span aria-hidden="true">✓</span></> : <>Send message <span aria-hidden="true">↗</span></>}
            </button>
            <p className={`ct-feedback is-${submitState}`} role="status" aria-live="polite">{feedback}</p>
            <p className="ct-form-note"><span aria-hidden="true">🔒</span> Your details are used only to respond to your enquiry.</p>
          </form>
          <img className="ct-sticker" src={contactSticker} alt="" loading="lazy" />
        </div>
        <footer className="foot">
          <span>© {new Date().getFullYear()} {profile.full}</span>
          <button type="button" onClick={() => goTo('#top', { offset: 0, duration: 3 })}>Back to the universe <span aria-hidden="true">↑</span></button>
        </footer>
      </div>
    </section>
  )
}
