/**
 * FARO Mentor.
 *
 * The mentor only ever receives a `MentorContext` built by
 * `lib/mentorContext.ts` - the privacy boundary lives there, not here. Style
 * changes the voice; it never changes the academic or safety rules.
 */
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'
import { Lighthouse } from '@/components/Lighthouse'
import { useStore } from '@/state/store'
import { buildMentorContext } from '@/lib/mentorContext'
import { mentorService, mentorStyles } from '@/services/mentor'
import type { MentorMessage } from '@/types'

const uid = () => Math.random().toString(36).slice(2, 10)

export function MentorView() {
  const {
    t,
    lang,
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
          ? t.mentor.openAway(journey.progressPercent, journey.courseName)
          : t.mentor.openFlow(friction.headline, journey.progressPercent, journey.courseName),
        suggestions: away ? t.mentor.openAwaySuggest : t.mentor.openFlowSuggest,
      },
    ])
  }, [friction, journey, messages.length, setMessages, t])

  if (!journey || !friction || !purpose) {
    return <p className="muted">{t.mentor.preparing}</p>
  }

  const send = async (text: string) => {
    const clean = text.trim()
    if (!clean || thinking) return
    const student: MentorMessage = { id: uid(), role: 'student', text: clean, at: new Date().toISOString() }
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
      language: lang,
    })

    try {
      const reply = await mentorService.send({ message: clean, context, history })
      setMessages([
        ...history,
        { id: uid(), role: 'faro', text: reply.text, at: new Date().toISOString(), suggestions: reply.suggestions },
      ])
    } catch {
      setMessages([...history, { id: uid(), role: 'faro', text: t.mentor.error, at: new Date().toISOString() }])
    } finally {
      setThinking(false)
    }
  }

  const last = messages[messages.length - 1]
  const suggestions = !thinking && last?.role === 'faro' ? (last.suggestions ?? []) : []

  return (
    <div className="mentor">
      <div className="chips">
        {mentorStyles.map((s) => (
          <button
            key={s}
            className={`chip${mentorStyle === s ? ' chip--on' : ''}`}
            onClick={() => setMentorStyle(s)}
          >
            {t.mentor.styles[s]}
          </button>
        ))}
      </div>

      <div className="mentor__thread" ref={threadRef}>
        {messages.map((m) => (
          <div key={m.id} className={`msg msg--${m.role}`}>
            {m.role === 'faro' && (
              <span className="msg__avatar">
                <Lighthouse size={16} />
              </span>
            )}
            <div className={`bubble bubble--${m.role}`}>{m.text}</div>
          </div>
        ))}
        {thinking && (
          <div className="msg msg--faro">
            <span className="msg__avatar">
              <Lighthouse size={16} />
            </span>
            <div className="bubble bubble--faro bubble--typing">{t.mentor.thinking}</div>
          </div>
        )}
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
          placeholder={t.mentor.placeholder}
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
          {t.mentor.send} <Icon name="arrow" size={16} />
        </button>
      </div>

      <p className="mentor__note">{t.mentor.note}</p>
    </div>
  )
}
