import { useEffect, useMemo, useState } from 'react'
import { profile, projects, skills } from '../data'

const prompts = [
  'What projects has Pranav built?',
  'What technologies does he use?',
  'How can I contact Pranav?',
]

export default function PortfolioAssistant() {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')

  const [answer, setAnswer] = useState(
    'Hi! I can help you explore Pranav’s portfolio. Try asking about projects, skills or contact details.'
  )

  const replies = useMemo(() => [
    {
      keys: ['project', 'built', 'work'],
      text: `Pranav’s featured work includes ${projects
        .map((p) => p.title)
        .join(', ')}. Open the project cards to see each project's details and technology stack.`,
    },
    {
      keys: ['skill', 'technology', 'stack', 'tech'],
      text: `Some technologies in Pranav’s toolbox: ${skills.join(', ')}.`,
    },
    {
      keys: ['contact', 'email', 'hire', 'reach'],
      text: `You can contact Pranav at ${profile.email}, or use the contact section at the bottom of this page.`,
    },
    {
      keys: ['experience', 'intern', 'freelance', 'leadership'],
      text: 'Pranav has completed freelance website work for Draksha Ayurveda, a frontend internship with Syntecxhub, and student leadership with IEEE Communications Society at CEP.',
    },
    {
      keys: ['education', 'college', 'study'],
      text: 'Pranav is pursuing B.Tech in Computer Science and Engineering at College of Engineering, Poonjar.',
    },
  ], [])

  // Listen to the mobile dock AI button
  useEffect(() => {
    const toggleAssistant = () => {
      setOpen((current) => !current)
    }

    window.addEventListener(
      'portfolio:toggle-assistant',
      toggleAssistant
    )

    return () => {
      window.removeEventListener(
        'portfolio:toggle-assistant',
        toggleAssistant
      )
    }
  }, [])

  // Close with Escape
  useEffect(() => {
    if (!open) return

    const close = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', close)

    return () => window.removeEventListener('keydown', close)
  }, [open])

  const ask = (value) => {
    const q = (value || question).trim()

    if (!q) return

    const match = replies.find((reply) =>
      reply.keys.some((key) => q.toLowerCase().includes(key))
    )

    setAnswer(
      match?.text ||
      'I can answer questions about Pranav’s projects, skills, experience, education and contact details. Try one of those topics.'
    )

    setQuestion(q)
  }

  return (
    <>
      {/* Desktop floating launcher */}
      <button
        className="assistant-launch"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Open portfolio assistant"
      >
        {open ? '×' : '✦'}
        <span>Ask about me</span>
      </button>

      {/* Assistant panel */}
      {open && (
        <aside
          className="assistant-panel"
          aria-label="Portfolio assistant"
        >
          <div className="assistant-head">
            <div>
              <b>Portfolio guide ✦</b>
              <small>Quick answers about Pranav</small>
            </div>

            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              ×
            </button>
          </div>

          <div className="assistant-answer">
            {answer}
          </div>

          <div className="assistant-prompts">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => ask(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              ask()
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about projects, skills…"
              aria-label="Ask a question"
            />

            <button type="submit">
              Send
            </button>
          </form>

          <small className="assistant-note">
            Portfolio FAQ assistant · answers are based on the information on this site.
          </small>
        </aside>
      )}
    </>
  )
}