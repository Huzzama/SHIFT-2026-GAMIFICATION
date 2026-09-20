/**
 * Community — "Who is travelling with me?"
 *
 * Journey answers where the student is going, Recovery answers how they get
 * back, and this answers the question neither one can: am I the only one?
 *
 * The order of the screen is the argument. Presence first, because the single
 * most valuable second in here is learning that twenty-three other people are
 * working right now. Then a way to ask, then a way to sit down next to
 * someone, then what is happening. The feed is *not* the top of the page -
 * arriving into other people's achievements is exactly the wrong welcome for
 * a student who is struggling.
 *
 * What is deliberately missing: followers, ranks, a total like count, and any
 * way to see who is ahead of you.
 */
import { useMemo, useState } from 'react'
import {
  CourseSignals,
  EmptyState,
  MissionCard,
  PresenceStrip,
  SOSPanel,
  StudyRoomCard,
} from '@/components/CommunityBits'
import { FeedPost } from '@/components/FeedPost'
import { Icon } from '@/components/Icon'
import { StudyRoomSession } from '@/components/StudyRoomSession'
import {
  mockAuthors,
  mockMission,
  mockPresence,
  mockRooms,
  roomDurations,
} from '@/data/community.mock'
import {
  evaluateCommunityAchievements,
  missionComplete,
  missionPercent,
  rankFeed,
  sosRouting,
  totalsWithMine,
} from '@/lib/community'
import { useCommunity } from '@/state/community'
import { useStore } from '@/state/store'
import type { PostKind, SosNeed, StudyRoom } from '@/types'

type Filter = 'all' | 'help' | 'questions' | 'learning'

const COMPOSER_KINDS: PostKind[] = ['question', 'help', 'learning', 'tip']

export function CommunityView({
  onAskMentor,
  onOpenRecovery,
}: {
  onAskMentor: () => void
  onOpenRecovery: () => void
}) {
  const { t, journey, awayGap } = useStore()
  const community = useCommunity()

  const [sosOpen, setSosOpen] = useState(false)
  const [room, setRoom] = useState<StudyRoom | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [kind, setKind] = useState<PostKind>('question')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [posted, setPosted] = useState(false)
  const [creating, setCreating] = useState(false)

  const c = t.community

  /** The module the student is actually on — the feed's relevance signal. */
  const moduleName = useMemo(() => {
    const open = journey?.milestones.find((m) => m.status !== 'completed')
    return open?.subtitle ?? null
  }, [journey])

  const courseName = journey?.courseName ?? mockPresence.courseName

  const feed = useMemo(
    () => rankFeed(community.allPosts, { courseName, moduleName }),
    [community.allPosts, courseName, moduleName],
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return feed
    if (filter === 'help') return feed.filter((p) => p.kind === 'help')
    if (filter === 'questions') return feed.filter((p) => p.kind === 'question')
    return feed.filter((p) => p.kind === 'learning' || p.kind === 'tip' || p.kind === 'resource')
  }, [feed, filter])

  const recognitions = useMemo(
    () =>
      evaluateCommunityAchievements(
        {
          answersGiven: Object.keys(community.answers).length,
          helpfulMarksReceived: community.helpfulMarksReceived,
          postsShared: community.posts.length,
          completedRoomSessions: community.completedRoomSessions,
          cameBackAndParticipated:
            awayGap >= 3 &&
            (community.completedRoomSessions > 0 ||
              community.posts.length > 0 ||
              Object.keys(community.answers).length > 0),
        },
        c.achievements,
      ),
    [community, awayGap, c.achievements],
  )

  const earned = recognitions.filter((r) => r.earned).length
  const percent = missionPercent(mockMission, community.missionContributions)
  const complete = missionComplete(mockMission, community.missionContributions)

  const chooseSos = (need: SosNeed) => {
    setSosOpen(false)
    const target = sosRouting[need]
    if (target === 'mentor') return onAskMentor()
    if (target === 'recovery') return onOpenRecovery()
    setFilter('all')
  }

  const submit = () => {
    community.share(kind, title.trim(), text.trim(), {
      courseName,
      moduleName: moduleName ?? undefined,
    })
    setTitle('')
    setText('')
    setPosted(true)
  }

  /* An active room is the whole screen: no feed to scroll while focusing. */
  if (room) {
    return (
      <StudyRoomSession
        room={room}
        t={t}
        onLeave={() => setRoom(null)}
        onComplete={(mins) => community.completeRoom(mins)}
      />
    )
  }

  return (
    <div className="stack">
      <PresenceStrip presence={mockPresence} t={t} onOpenRooms={() => setFilter('all')} />

      {sosOpen ? (
        <SOSPanel t={t} onChoose={chooseSos} onCancel={() => setSosOpen(false)} />
      ) : (
        <button className="cm-sosbtn" onClick={() => setSosOpen(true)}>
          <span className="cm-sosbtn__mark" aria-hidden="true">
            <Icon name="wave" size={18} />
          </span>
          {c.sos.button}
          <Icon name="arrow" size={16} />
        </button>
      )}

      {/* Ask ---------------------------------------------------------------- */}
      <section className="card stack">
        <div>
          <div className="eyebrow">{c.ask.eyebrow}</div>
          <p className="muted" style={{ margin: '6px 0 0' }}>{c.ask.context(courseName, moduleName)}</p>
        </div>
        <div className="chips">
          {COMPOSER_KINDS.map((k) => (
            <button
              key={k}
              className={`chip${kind === k ? ' chip--on' : ''}`}
              onClick={() => {
                setKind(k)
                setPosted(false)
              }}
            >
              {c.ask.kinds[k as 'question' | 'help' | 'learning' | 'tip']}
            </button>
          ))}
        </div>
        <input
          className="purpose__input cm-input"
          placeholder={c.ask.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="purpose__input"
          rows={3}
          placeholder={c.ask.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn--block" disabled={text.trim().length < 5} onClick={submit}>
          {c.ask.post} <Icon name="arrow" size={16} />
        </button>
        {posted && <div className="cm-posted">{c.ask.shared(courseName)}</div>}
      </section>

      {/* Study rooms -------------------------------------------------------- */}
      <section>
        <div className="section">
          <div className="section__title">
            <Icon name="user" size={22} /> {c.rooms.eyebrow}
          </div>
          <button className="section__link" onClick={() => setCreating(!creating)}>
            {c.rooms.create} <Icon name="arrow" size={16} />
          </button>
        </div>
        <p className="muted" style={{ margin: '0 0 var(--space-3)' }}>{c.rooms.body}</p>

        {creating && (
          <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
            <div className="eyebrow">{c.rooms.createTitle}</div>
            <div className="chips" style={{ marginTop: 'var(--space-3)' }}>
              {roomDurations.map((d) => (
                <button
                  key={d}
                  className="chip"
                  onClick={() =>
                    setRoom({
                      id: `new-${d}`,
                      name: c.rooms.myRoom,
                      courseName,
                      participants: 1,
                      minutes: d,
                      mode: 'quiet',
                      focusMinutes: d,
                      breakMinutes: 0,
                    })
                  }
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
        )}

        {mockRooms.length === 0 ? (
          <EmptyState
            title={c.empty.rooms.title}
            body={c.empty.rooms.body}
            cta={c.empty.rooms.cta}
            onCta={() => setCreating(true)}
          />
        ) : (
          <div className="cm-rooms">
            {mockRooms.map((r) => (
              <StudyRoomCard key={r.id} room={r} t={t} onJoin={() => setRoom(r)} />
            ))}
          </div>
        )}
      </section>

      {/* Cooperative mission ------------------------------------------------- */}
      <MissionCard
        mission={mockMission}
        mine={community.missionContributions}
        percent={percent}
        complete={complete}
        t={t}
      />

      {/* Feed ---------------------------------------------------------------- */}
      <section>
        <div className="section">
          <div className="section__title">
            <Icon name="chat" size={22} /> {c.feed.eyebrow}
          </div>
        </div>
        <div className="chips" style={{ marginBottom: 'var(--space-3)' }}>
          {(['all', 'help', 'questions', 'learning'] as Filter[]).map((f) => (
            <button
              key={f}
              className={`chip${filter === f ? ' chip--on' : ''}`}
              onClick={() => setFilter(f)}
            >
              {c.feed.filters[f]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={c.empty.feed.title}
            body={c.empty.feed.body}
            cta={c.empty.feed.cta}
            onCta={() => {
              setKind('learning')
              setFilter('all')
            }}
          />
        ) : (
          <div className="cm-feed">
            {filtered.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                authors={mockAuthors}
                totals={totalsWithMine(post.reactions, community.reactions[post.id] ?? [])}
                mine={community.reactions[post.id] ?? []}
                myAnswer={community.answers[post.id]}
                markedHelpful={community.markedHelpful}
                t={t}
                onReact={(k) => community.react(post.id, k)}
                onAnswer={(txt) => {
                  community.answer(post.id, txt)
                  // Prototype: peers marking an answer useful, compressed to
                  // a couple of seconds so the loop is visible in a demo.
                  setTimeout(() => community.recordHelpfulMarks(post.id, 6), 2500)
                }}
                onMarkHelpful={(id) => community.markHelpful(id)}
              />
            ))}
          </div>
        )}
      </section>

      <CourseSignals presence={mockPresence} t={t} />

      {/* Recognition ---------------------------------------------------------- */}
      <section className="card">
        <div className="row row--between">
          <div className="eyebrow">{c.recognition.eyebrow}</div>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            {c.recognition.of(earned, recognitions.length)}
          </span>
        </div>
        {community.points > 0 && (
          <div className="cm-points">{c.recognition.points(community.points)}</div>
        )}
        <ul className="badges" style={{ marginTop: 'var(--space-3)' }}>
          {recognitions.map((r) => (
            <li key={r.id} className={`badge${r.earned ? ' badge--earned' : ''}`}>
              <span className="badge__mark" aria-hidden="true" />
              <div>
                <div className="badge__title">{r.title}</div>
                <div className="badge__body">{r.earned ? r.description : r.hint}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="mentor__note">{c.privacy}</p>
    </div>
  )
}
