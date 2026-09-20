/**
 * An active Study Room.
 *
 * The product idea is small and the whole point: someone else is working at
 * the same time as you, and nothing is asked of you beyond being here. No
 * chat, no camera, no "are you still there". The only thing the room reports
 * is how many people are in it.
 *
 * Reward rule from the spec, enforced here: entering earns nothing. The
 * session has to actually finish.
 */
import { useEffect, useRef, useState } from 'react'
import { Avatar } from './CommunityBits'
import { Icon } from './Icon'
import type { Dict } from '@/i18n'
import { mockAuthors } from '@/data/community.mock'
import { communityPointsConfig } from '@/lib/community'
import type { StudyRoom } from '@/types'

/**
 * Prototype time. One real second stands for one minute of the session, so
 * the whole loop - join, study together, finish - can be shown in a demo
 * instead of in three quarters of an hour. Labelled on screen; set to 60000
 * for real time.
 */
const TICK_MS = 1000

const clock = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function StudyRoomSession({
  room,
  t,
  onLeave,
  onComplete,
}: {
  room: StudyRoom
  t: Dict
  onLeave: () => void
  onComplete: (minutes: number) => void
}) {
  const c = t.community.rooms
  const total = room.focusMinutes * 60
  const [left, setLeft] = useState(total)
  const [done, setDone] = useState(false)
  const awarded = useRef(false)

  useEffect(() => {
    if (done) return
    const id = setInterval(() => {
      setLeft((prev) => {
        const next = prev - 60
        if (next <= 0) {
          setDone(true)
          return 0
        }
        return next
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [done])

  useEffect(() => {
    if (done && !awarded.current) {
      awarded.current = true
      onComplete(room.focusMinutes)
    }
  }, [done, onComplete, room.focusMinutes])

  const peers = mockAuthors.filter((a) => a.id !== 'me').slice(0, room.participants)
  const percent = Math.round(((total - left) / total) * 100)

  if (done) {
    return (
      <section className="cm-session cm-session--done">
        <div className="cm-session__flag">
          <Icon name="check" size={14} /> {c.done.title}
        </div>
        <div className="cm-session__title">{c.done.body(room.participants)}</div>
        <div className="cm-session__points">
          {c.done.points(communityPointsConfig.POINTS_PER_COMPLETED_ROOM)}
        </div>
        <button className="btn btn--onDark btn--block" onClick={onLeave}>
          {c.done.back}
        </button>
      </section>
    )
  }

  return (
    <section className="cm-session">
      <div className="cm-session__flag">
        {room.mode === 'quiet' ? c.quiet : c.pomodoro(room.focusMinutes, room.breakMinutes)}
      </div>
      <div className="cm-session__name">{room.name}</div>

      <div className="cm-session__clock">{clock(left)}</div>
      <div className="cm-session__sub">{c.remaining}</div>

      <div className="meter meter--onDark" style={{ marginTop: 'var(--space-4)' }}>
        <div className="meter__fill" style={{ width: `${percent}%` }} />
      </div>

      <div className="cm-session__peers">
        {peers.map((a) => (
          <Avatar key={a.id} author={a} size={28} />
        ))}
        <span className="cm-session__count">{c.inRoom(room.participants)}</span>
      </div>

      <p className="cm-session__note">{c.note}</p>
      <p className="cm-session__proto">{c.prototypeClock}</p>

      <button className="btn btn--onDark btn--block" onClick={onLeave}>
        {c.leave}
      </button>
    </section>
  )
}
