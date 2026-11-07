import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, goTo } from '../lib/motion'
import { profile, contactSticker } from '../data'

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'
const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || ''

const initialForm = {
  name: '',
  email: '',
  message: '',
  botcheck: '',
}

export default function Contact() {
  const root = useRef(null)
  const copyTimer = useRef(null)

  const [copyStatus, setCopyStatus] = useState('idle')
  const [form, setForm] = useState(initialForm)
  const [submitState, setSubmitState] = useState('idle')
  const [feedback, setFeedback] = useState('')

  // ==========================================
  // GSAP ANIMATIONS
  // ==========================================

  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top 35%',
          once: true,
        },
        defaults: {
          ease: 'power3.out',
        },
      })

      tl.from('.ct-line > span', {
        yPercent: 110,
        stagger: 0.14,
        duration: 1,
      })
        .from(
          '.ct-card > *, .ct-copy > :not(.h2)',
          {
            y: 24,
            opacity: 0,
            stagger: 0.06,
            duration: 0.7,
          },
          0.25
        )
        .from(
          '.ct-sticker',
          {
            yPercent: 30,
            opacity: 0,
            duration: 0.8,
          },
          0.45
        )
        .from(
          '.ct-footer',
          {
            y: 25,
            opacity: 0,
            duration: 0.8,
          },
          0.65
        )
    })

    return () => mm.revert()
  }, { scope: root })

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => window.clearTimeout(copyTimer.current)
  }, [])

  // ==========================================
  // COPY EMAIL
  // ==========================================

  const copyEmail = async () => {
    window.clearTimeout(copyTimer.current)

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable')
      }

      await navigator.clipboard.writeText(profile.email)

      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }

    copyTimer.current = window.setTimeout(() => {
      setCopyStatus('idle')
    }, 2200)
  }

  // ==========================================
  // FORM INPUT HANDLING
  // ==========================================

  const updateField = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    if (
      submitState === 'error' ||
      submitState === 'unconfigured'
    ) {
      setSubmitState('idle')
      setFeedback('')
    }
  }

  // ==========================================
  // FORM VALIDATION
  // ==========================================

  const validateForm = (data) => {
    if (!data.name || !data.email || !data.message) {
      return 'Please complete all required fields.'
    }

    if (data.name.length > 100) {
      return 'Your name must be under 100 characters.'
    }

    if (data.email.length > 254) {
      return 'Please enter a shorter email address.'
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)
    ) {
      return 'Please enter a valid email address.'
    }

    if (data.message.length > 5000) {
      return 'Your message must be under 5,000 characters.'
    }

    return null
  }

  // ==========================================
  // ACTUAL MESSAGE SUBMISSION
  // ==========================================

  const submit = async (event) => {
    event.preventDefault()

    if (submitState === 'sending') return

    const clean = {
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      botcheck: form.botcheck,
    }

    // Honeypot spam protection
    if (clean.botcheck) return

    const validationError = validateForm(clean)

    if (validationError) {
      setSubmitState('error')
      setFeedback(validationError)
      return
    }

    if (!ACCESS_KEY) {
      setSubmitState('unconfigured')
      setFeedback(
        'Contact form is not configured yet. Please email me directly.'
      )
      return
    }

    setSubmitState('sending')
    setFeedback('Sending your message securely...')

    const controller = new AbortController()

    const timeout = window.setTimeout(() => {
      controller.abort()
    }, 15000)

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },

        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `Portfolio enquiry from ${clean.name}`,
          from_name: clean.name,
          name: clean.name,
          email: clean.email,
          message: clean.message,
          botcheck: '',
        }),

        signal: controller.signal,
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
          'Unable to send your message. Please try again.'
        )
      }

      setSubmitState('success')

      setFeedback(
        'Thank you! Your message has been sent successfully. I will get back to you soon.'
      )

      setForm(initialForm)

    } catch (error) {
      setSubmitState('error')

      setFeedback(
        error.name === 'AbortError'
          ? 'Request timed out. Please check your internet connection and try again.'
          : error.message ||
            'Something went wrong. Please try again.'
      )

    } finally {
      window.clearTimeout(timeout)
    }
  }

  // ==========================================
  // SOCIAL LINKS
  // ==========================================

  const socialLinks = [
    {
      label: 'GitHub',
      url: profile.github,
    },
    {
      label: 'LinkedIn',
      url: profile.linkedin,
    },
    {
      label: 'Instagram',
      url: profile.instagram,
    },
  ].filter((item) => item.url)

  // ==========================================
  // COMPONENT
  // ==========================================

  return (
    <section
      className="contact section"
      id="contact"
      ref={root}
      aria-labelledby="contact-title"
    >
      <div className="wrap ct-stage">

        {/* ==================================
            CONTACT CARD
        ================================== */}

        <div className="ct-card glass ui">

          {/* LEFT SIDE */}

          <div className="ct-copy">

            <div className="ct-eyebrow-row">
              <span className="pill">Contact</span>

              <span className="availability">
                <i aria-hidden="true" />
                Available to connect · {profile.location}
              </span>
            </div>

            <h2 className="h2" id="contact-title">
              <span className="ct-line">
                <span>Let’s build</span>
              </span>

              <span className="ct-line">
                <span>something</span>
              </span>

              <span className="ct-line">
                <span>amazing.</span>
              </span>
            </h2>

            <p>
              Have a project in mind, want to collaborate,
              or just want to say hello?

              Tell me a little about it. I usually reply
              within a day.
            </p>

            {/* EMAIL */}

            <div className="ct-mail">

              <a href={`mailto:${profile.email}`}>
                {profile.email}
              </a>

              <button
                type="button"
                className={
                  copyStatus === 'copied'
                    ? 'is-ok'
                    : copyStatus === 'error'
                      ? 'is-err'
                      : undefined
                }
                onClick={copyEmail}
                aria-live="polite"
              >
                {copyStatus === 'copied'
                  ? 'Copied ✓'
                  : copyStatus === 'error'
                    ? 'Copy failed'
                    : 'Copy email'}
              </button>

            </div>

            {/* SOCIAL LINKS */}

            <div className="ct-links" aria-label="Social links">

              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  className="btn btn-ghost"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}

            </div>

          </div>

          {/* ==================================
              CONTACT FORM
          ================================== */}

          <form
            className="ct-form"
            onSubmit={submit}
            noValidate
          >

            <div className="ct-form-heading">

              <span className="ct-form-kicker">
                START A CONVERSATION
              </span>

              <h3>Send me a message</h3>

              <p>
                Share the details and I'll get back to you.
              </p>

            </div>

            {/* NAME */}

            <label htmlFor="contact-name">
              Name <span aria-hidden="true">*</span>

              <input
                id="contact-name"
                name="name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                maxLength={100}
                value={form.name}
                onChange={updateField}
                required
              />
            </label>

            {/* EMAIL */}

            <label htmlFor="contact-email">
              Email <span aria-hidden="true">*</span>

              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                value={form.email}
                onChange={updateField}
                required
              />
            </label>

            {/* MESSAGE */}

            <label htmlFor="contact-message">
              Message <span aria-hidden="true">*</span>

              <textarea
                id="contact-message"
                name="message"
                rows={4}
                placeholder="Tell me about your idea, project or question..."
                maxLength={5000}
                value={form.message}
                onChange={updateField}
                required
              />

              <span className="ct-char-count">
                {form.message.length}/5000
              </span>
            </label>

            {/* HONEYPOT SPAM PROTECTION */}

            <div
              className="ct-honeypot"
              aria-hidden="true"
            >
              <input
                type="text"
                name="botcheck"
                tabIndex={-1}
                autoComplete="off"
                value={form.botcheck}
                onChange={updateField}
              />
            </div>

            {/* SUBMIT BUTTON */}

            <button
              className="btn btn-coral ct-submit"
              type="submit"
              disabled={submitState === 'sending'}
            >

              {submitState === 'sending' ? (
                <>
                  <span
                    className="ct-spinner"
                    aria-hidden="true"
                  />
                  Sending...
                </>
              ) : submitState === 'success' ? (
                <>
                  Message sent
                  <span aria-hidden="true">✓</span>
                </>
              ) : (
                <>
                  Send message
                  <span aria-hidden="true">↗</span>
                </>
              )}

            </button>

            {/* FEEDBACK */}

            <p
              className={`ct-feedback is-${submitState}`}
              role="status"
              aria-live="polite"
            >
              {feedback}
            </p>

            <p className="ct-form-note">
              <span aria-hidden="true">🔒</span>
              Your details are used only to respond to your enquiry.
            </p>

          </form>

          {/* CONTACT STICKER */}

          {contactSticker && (
            <img
              className="ct-sticker"
              src={contactSticker}
              alt=""
              loading="lazy"
            />
          )}

        </div>

        {/* ==================================
            PREMIUM INTEGRATED FOOTER
        ================================== */}

        <footer className="ct-footer">

          {/* FOOTER TOP */}

          <div className="ct-footer-top">

            <div className="ct-footer-brand">

              <a
                href="#top"
                className="ct-footer-logo"
                onClick={(e) => {
                  e.preventDefault()
                  goTo('#top', { offset: 0, duration: 3 })
                }}
              >
                Pranav<span>.</span>
              </a>

              <p>
                Designing and developing digital experiences
                with code, creativity and curiosity.
              </p>

            </div>

            {/* FOOTER NAVIGATION */}

            <div className="ct-footer-nav">

              <span className="ct-footer-label">
                EXPLORE
              </span>

              <div className="ct-footer-nav-links">

                <a href="#top">Home</a>
                <a href="#about">About</a>
                <a href="#skills">Skills</a>
                <a href="#projects">Projects</a>
                <a href="#journey">Journey</a>
                <a href="#contact">Contact</a>

              </div>

            </div>

            {/* FOOTER SOCIAL */}

            <div className="ct-footer-social">

              <span className="ct-footer-label">
                CONNECT
              </span>

              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}

              <a href={`mailto:${profile.email}`}>
                Email
                <span aria-hidden="true">↗</span>
              </a>

            </div>

          </div>

          {/* FOOTER BOTTOM */}

          <div className="ct-footer-bottom">

            <span className="ct-copyright">
              © {new Date().getFullYear()} {profile.full}.
              All rights reserved.
            </span>

            <span className="ct-footer-status">
              <i aria-hidden="true" />
              Open to opportunities
            </span>

            <button
              type="button"
              className="ct-back-top"
              onClick={() =>
                goTo('#top', {
                  offset: 0,
                  duration: 3,
                })
              }
            >
              Back to the universe
              <span aria-hidden="true">↑</span>
            </button>

          </div>

        </footer>

      </div>
    </section>
  )
}