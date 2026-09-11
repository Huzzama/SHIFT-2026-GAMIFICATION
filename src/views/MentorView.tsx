/**
 * FARO Mentor.
 *
 * The mentor only ever receives a `MentorContext` built by
 * `lib/mentorContext.ts` - the privacy boundary lives there, not here. Style
 * changes the voice; it never changes the academic or safety rules.
 */
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/state/store'
import { buildMentorContext } from '@/lib/mentorContext'
import { mentorService } from '@/services/mentor'
import type { MentorMessage, MentorStyle } from '@/types'

const STYLES: { id: MentorStyle; label: string }[] = [
  { id: 'direct', label: 'Direct' },
  { id: 'encouraging', label: 'Encouraging' },
  { id: 'detailed', label: 'Detailed' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'challenge', label: 'Challenge me' },
]

const uid = () => Math.random().toString(36).slice(2, 10)

export function MentorView() {
  const {
    journey,
    friction,
    purpose,
    nextAction,
    availableMinutes,
    mentorStyle,
    setMentorStyle,
    messages,
    setMessages,
  } = useStore()

  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  // The opening line is the intervention: it names the moment, not the debt.
  useEffect(() => {
    if (messages.length > 0 || !friction || !journey) return
    const away = friction.state === 'DISCONNECTION' || friction.state === 'RECOVERY'
    setMessages([
      {
        id: uid(),
        role: 'faro',
        at: new Date().toISOString(),
        text: away
          ? `Welcome back. Your progress is still here - ${journey.progressPercent}% of ${journey.courseName}, exactly where you left it. We are not catching everything up today. Want a ten-minute way back in?`
          : `${friction.headline} You are at ${journey.progressPercent}% of ${journey.courseName}. What do you need?`,
        suggestions: away
          ? ['Give me a 10-minute mission', 'I am behind', 'Plan my week']
          : ['What should I do next?', 'Explain something', 'Plan my week'],
      },
    ])
  }, [friction, journey, messages.length, setMessages])

  if (!journey || !friction || !purpose) {
    return <p className="muted">Getting your context ready…</p>
  }

  const send = async (text: string) => {
    const clean = text.trim()
    if (!clean || thinking) return
    const student: MentorMessage = {
      id: uid(),
      role: 'student',
      text: clean,
      at: new Date().toISOString(),
    }
    const history = [...messages, student]
    setMessages(history)
    setDraft('')
    setThinking(true)

    const context = buildMentorContext({
      journey,
      friction,
      purpose,
      nextAction,
      availableMinutes,
      style: mentorStyle,
    })

    try {
      const reply = await mentorService.send({ message: clean, context, history })
      setMessages([
        ...history,
        {
          id: uid(),
          role: 'faro',
          text: reply.text,
          at: new Date().toISOString(),
          suggestions: reply.suggestions,
        },
      ])
    } catch {
      setMessages([
        ...history,
        {
          id: uid(),
          role: 'faro',
          text: 'I could not reach my side of things just now. Your progress is safe - try again in a moment.',
          at: new Date().toISOString(),
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  const last = messages[messages.length - 1]
  const suggestions = !thinking && last?.role === 'faro' ? (last.suggestions ?? []) : []

  return (
    <div className="mentor">
      <div className="chips">
        {STYLES.map((s) => (
          <button
            key={s.id}
            className={`chip${mentorStyle === s.id ? ' chip--on' : ''}`}
            onClick={() => setMentorStyle(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mentor__thread" ref={threadRef}>
        {messages.map((m) => (
          <div key={m.id} className={`bubble bubble--${m.role === 'faro' ? 'faro' : 'student'}`}>
            {m.text}
          </div>
        ))}
        {thinking && <div className="bubble bubble--faro bubble--typing">FARO is thinking…</div>}
      </div>

      {suggestions.length > 0 && (
        <div className="chips">
          {suggestions.map((s) => (
            <button key={s} className="chip" onClick={() => void send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="composer">
        <textarea
          className="composer__input"
          rows={1}
          placeholder="Ask FARO anything about this course…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send(draft)
            }
          }}
        />
        <button className="btn" disabled={!draft.trim() || thinking} onClick={() => void send(draft)}>
          Send
        </button>
      </div>

      <p className="mentor__note">
        FARO guides your learning. It will not write graded work for you, and it
        only sees your course progress and the goal you set - never your personal data.
      </p>
    </div>
  )
}
