/**
 * One post in the community feed.
 *
 * Three decisions worth naming:
 *
 *  - Reaction counts are shown per verb, never summed into one popularity
 *    number. "12 applause" says what happened; "12 likes" is a score.
 *  - Every answer is labelled by where it came from. A peer answer with forty
 *    useful marks is still a peer answer, and the label says so.
 *  - Report is present from the start. Moderation is not a v2 feature you can
 *    bolt on after people have been hurt.
 */
import { useState } from 'react'
import { AuthorRow } from './CommunityBits'
import { Icon } from './Icon'
import type { Dict } from '@/i18n'
import { reactionEmoji, reactionsFor } from '@/lib/community'
import type { CommunityAuthor, CommunityPost, ReactionKind, Reactions } from '@/types'

const MIN = 60 * 1000

function timeAgo(iso: string, t: Dict) {
  const c = t.community.feed.ago
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 2 * MIN) return c.now
  if (diff < 60 * MIN) return c.min(Math.round(diff / MIN))
  if (diff < 24 * 60 * MIN) return c.hour(Math.round(diff / (60 * MIN)))
  return c.day(Math.round(diff / (24 * 60 * MIN)))
}

export function FeedPost({
  post,
  authors,
  totals,
  mine,
  myAnswer,
  markedHelpful,
  t,
  onReact,
  onAnswer,
  onMarkHelpful,
  onOpenProfile,
}: {
  post: CommunityPost
  authors: CommunityAuthor[]
  totals: Reactions
  mine: ReactionKind[]
  myAnswer: { text: string; helpful: number } | undefined
  markedHelpful: string[]
  t: Dict
  onReact: (kind: ReactionKind) => void
  onAnswer: (text: string) => void
  onMarkHelpful: (commentId: string) => void
  onOpenProfile: (authorId: string) => void
}) {
  const c = t.community.feed
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [reported, setReported] = useState(false)

  const author = authors.find((a) => a.id === post.authorId) ?? authors[0]
  const asking = post.kind === 'question' || post.kind === 'help'
  const answerCount = post.comments.length + (myAnswer ? 1 : 0)

  const sourceLabel = (s: 'peer' | 'instructor' | 'mentor') =>
    s === 'peer' ? c.peerAnswer : s === 'instructor' ? c.instructorAnswer : c.mentorAnswer

  return (
    <article className={`cm-post cm-post--${post.kind}`}>
      <header className="cm-post__head">
        <AuthorRow author={author} onOpen={onOpenProfile}>
          <span className={`cm-tag cm-tag--${post.kind}`}>{c.kinds[post.kind]}</span>
        </AuthorRow>
        <div className="cm-post__meta">
          {timeAgo(post.at, t)}
          {post.moduleName && ` · ${post.moduleName}`}
        </div>
      </header>

      {post.title && <div className="cm-post__title">{post.title}</div>}
      <p className="cm-post__text">{post.text}</p>
      {post.resourceLabel && (
        <div className="cm-post__resource">
          <Icon name="book" size={14} /> {post.resourceLabel}
        </div>
      )}

      <div className="cm-react">
        {reactionsFor(post.kind).map((kind) => {
          const on = mine.includes(kind)
          const n = totals[kind] ?? 0
          return (
            <button
              key={kind}
              className={`cm-react__btn${on ? ' cm-react__btn--on' : ''}`}
              onClick={() => onReact(kind)}
              title={c.reactions[kind]}
            >
              <span aria-hidden="true">{reactionEmoji[kind]}</span>
              {n > 0 && <span className="cm-react__n">{n}</span>}
            </button>
          )
        })}
        <button className="cm-react__more" onClick={() => setOpen(!open)}>
          <Icon name="chat" size={14} />
          {answerCount > 0 ? c.answers(answerCount) : asking ? c.noAnswers : c.comment}
        </button>
      </div>

      {open && (
        <div className="cm-thread">
          {post.comments.map((cm) => {
            const a = authors.find((x) => x.id === cm.authorId) ?? authors[0]
            const marked = markedHelpful.includes(cm.id)
            return (
              <div key={cm.id} className="cm-answer">
                <div className="cm-answer__head">
                  <AuthorRow author={a} size={24} onOpen={onOpenProfile}>
                    <span className={`cm-source cm-source--${cm.source}`}>
                      {sourceLabel(cm.source)}
                    </span>
                  </AuthorRow>
                </div>
                <p className="cm-answer__text">{cm.text}</p>
                <div className="cm-answer__foot">
                  <button
                    className={`cm-helpful${marked ? ' cm-helpful--on' : ''}`}
                    onClick={() => onMarkHelpful(cm.id)}
                  >
                    💡 {marked ? c.marked : c.markHelpful}
                  </button>
                  <span className="cm-answer__count">
                    {c.helpful(cm.helpful + (marked ? 1 : 0))}
                  </span>
                </div>
              </div>
            )
          })}

          {myAnswer && (
            <div className="cm-answer cm-answer--mine">
              <div className="cm-answer__head">
                <AuthorRow
                  author={{
                    ...(authors.find((a) => a.id === 'me') ?? authors[0]),
                    name: c.yourAnswer,
                  }}
                  size={24}
                  onOpen={onOpenProfile}
                >
                  <span className="cm-source cm-source--peer">{c.peerAnswer}</span>
                </AuthorRow>
              </div>
              <p className="cm-answer__text">{myAnswer.text}</p>
              {myAnswer.helpful > 0 && (
                <div className="cm-answer__reward">
                  <Icon name="check" size={14} /> {c.youHelped(myAnswer.helpful)}
                </div>
              )}
            </div>
          )}

          {asking && !myAnswer && (
            <div className="cm-reply">
              <textarea
                className="composer__input"
                rows={2}
                placeholder={c.answerPlaceholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                className="btn"
                disabled={draft.trim().length < 3}
                onClick={() => {
                  onAnswer(draft.trim())
                  setDraft('')
                }}
              >
                {c.answerCta}
              </button>
            </div>
          )}

          <p className="cm-note">{c.peerNote}</p>

          <button className="cm-report" onClick={() => setReported(true)} disabled={reported}>
            <Icon name="flag" size={12} /> {reported ? c.reported : c.report}
          </button>
        </div>
      )}
    </article>
  )
}
