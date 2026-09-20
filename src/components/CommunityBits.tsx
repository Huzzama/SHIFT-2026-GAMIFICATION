/**
 * Community building blocks.
 *
 * Presentation only — every one of these takes data and callbacks and owns no
 * state of its own, so the same pieces can later be fed by the Community
 * Service instead of the mock.
 */
import { Icon } from './Icon'
import type { Dict } from '@/i18n'
import { sosOrder } from '@/lib/community'
import type {
  CommunityAuthor,
  CommunityMission,
  CoursePresence,
  SosNeed,
  StudyRoom,
} from '@/types'

export function Avatar({ author, size = 34 }: { author: CommunityAuthor; size?: number }) {
  return (
    <span
      className={`cm-avatar tint--${author.tone}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {author.initials}
    </span>
  )
}

/**
 * Aggregate presence, and a line saying so.
 *
 * The note is not decoration. A student looking at "23 people are studying"
 * deserves to know immediately that the reverse is also true: nobody is
 * watching them either.
 */
export function PresenceStrip({
  presence,
  t,
  onOpenRooms,
}: {
  presence: CoursePresence
  t: Dict
  onOpenRooms: () => void
}) {
  const c = t.community
  return (
    <section className="cm-presence">
      <div className="cm-presence__pulse" aria-hidden="true">
        <span className="cm-presence__dot" />
      </div>
      <div className="cm-presence__text">
        <div className="cm-presence__now">{c.presence.studyingNow(presence.studyingNow)}</div>
        <div className="cm-presence__course">{presence.courseName}</div>
        <div className="cm-presence__meta">
          {c.presence.students(presence.students)} · {c.presence.inRooms(presence.inRooms)}
        </div>
      </div>
      <button className="cm-presence__go" onClick={onOpenRooms}>
        <Icon name="arrow" size={18} />
      </button>
    </section>
  )
}

/** Social proof without a ranking: how many people, never which people. */
export function CourseSignals({ presence, t }: { presence: CoursePresence; t: Dict }) {
  const c = t.community
  return (
    <section className="card">
      <div className="eyebrow">{c.course.eyebrow}</div>
      <ul className="cm-signals">
        <li>
          <Icon name="check" size={16} />
          {c.presence.completedThisWeek(presence.completedThisWeek)}
        </li>
        <li>
          <Icon name="trend" size={16} />
          {c.presence.activities(presence.activitiesThisWeek)}
        </li>
        <li>
          <Icon name="refresh" size={16} />
          {c.presence.rhythm(presence.rhythmDays)}
        </li>
      </ul>
      <p className="cm-note">{c.presence.note}</p>
    </section>
  )
}

export function MissionCard({
  mission,
  mine,
  percent,
  complete,
  t,
}: {
  mission: CommunityMission
  mine: number
  percent: number
  complete: boolean
  t: Dict
}) {
  const c = t.community.mission
  return (
    <section className={`cm-mission${complete ? ' cm-mission--done' : ''}`}>
      <div className="cm-mission__eyebrow">
        <Icon name="target" size={14} /> {c.eyebrow}
      </div>
      <div className="cm-mission__title">
        {complete ? c.complete.title : c.title(mission.target)}
      </div>
      <div className="meter" style={{ marginTop: 'var(--space-3)' }}>
        <div className="meter__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="cm-mission__row">
        <span>{c.progress(mission.progress + mine, mission.target)}</span>
        <span>{mine > 0 ? c.yours(mine) : c.endsIn(mission.endsInDays)}</span>
      </div>
      <p className="cm-mission__body">
        {complete ? c.complete.body : c.contributors(mission.contributors)}
      </p>
    </section>
  )
}

export function StudyRoomCard({
  room,
  t,
  onJoin,
}: {
  room: StudyRoom
  t: Dict
  onJoin: () => void
}) {
  const c = t.community.rooms
  return (
    <div className="cm-room">
      <div className="cm-room__head">
        <span className="cm-room__name">{room.name}</span>
        <span className={`cm-room__mode cm-room__mode--${room.mode}`}>
          {room.mode === 'quiet' ? c.quiet : c.pomodoro(room.focusMinutes, room.breakMinutes)}
        </span>
      </div>
      <div className="cm-room__course">{room.courseName}</div>
      <div className="cm-room__meta">
        <span>
          <Icon name="user" size={14} /> {c.participants(room.participants)}
        </span>
        <span>
          <Icon name="clock" size={14} /> {room.minutes} min
        </span>
      </div>
      {room.mode === 'quiet' && <div className="cm-room__quiet">{c.quietNote}</div>}
      <button className="btn btn--ghost btn--block" onClick={onJoin}>
        {c.join}
      </button>
    </div>
  )
}

/** Empty states that invite, never "Nothing here." */
export function EmptyState({
  title,
  body,
  cta,
  onCta,
}: {
  title: string
  body: string
  cta: string
  onCta: () => void
}) {
  return (
    <div className="cm-empty">
      <div className="cm-empty__title">{title}</div>
      <p className="cm-empty__body">{body}</p>
      <button className="btn btn--ghost" onClick={onCta}>
        {cta}
      </button>
    </div>
  )
}

/**
 * SOS — three kinds of stuck, three different systems.
 *
 * This panel is the clearest statement of FARO's thesis: being overwhelmed,
 * not understanding, and feeling alone are different problems, and answering
 * all three with the same screen is how products fail people. Community is
 * the answer to only one of them.
 */
export function SOSPanel({
  t,
  onChoose,
  onCancel,
}: {
  t: Dict
  onChoose: (need: SosNeed) => void
  onCancel: () => void
}) {
  const c = t.community.sos
  return (
    <section className="cm-sos">
      <div className="cm-sos__title">{c.title}</div>
      <p className="cm-sos__body">{c.body}</p>
      <div className="cm-sos__options">
        {sosOrder.map((need) => (
          <button key={need} className="cm-sos__opt" onClick={() => onChoose(need)}>
            <span className="cm-sos__opt-go" aria-hidden="true">
              <Icon name="arrow" size={16} />
            </span>
            <span className="cm-sos__opt-text">
              <span className="cm-sos__opt-title">{c[need].title}</span>
              <span className="cm-sos__opt-body">{c[need].body}</span>
            </span>
          </button>
        ))}
      </div>
      <button className="btn btn--onDark btn--block" onClick={onCancel}>
        {c.cancel}
      </button>
    </section>
  )
}
