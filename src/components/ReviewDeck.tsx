/**
 * Review Cards - the full-screen deck.
 *
 * One card at a time, three options, immediate feedback. A wrong answer is
 * not a dead end: the explanation appears, the wrong option greys out, and
 * the student tries again. The set finishes when all three are answered, and
 * the points are for finishing, not for a first-try score.
 *
 * Motion is part of the feedback, not decoration: the card slides in, a
 * right answer settles with a small pop, a wrong one shakes once, the
 * progress dots fill. All of it is switched off by `prefers-reduced-motion`
 * (see the `.rv-` rules in `views.css`).
 */
import { useState } from 'react'
import { Icon } from './Icon'
import { useCountUp } from './useCountUp'
import { useStore } from '@/state/store'
import { pointsConfig } from '@/lib/points'
import type { Journey, ReviewQuestion } from '@/types'

const moduleName = (journey: Journey | null, moduleId: number) =>
  journey?.milestones.find((m) => m.moduleId === moduleId)?.subtitle ?? ''

export function ReviewDeck({
  questions,
  onClose,
  onDone,
}: {
  questions: ReviewQuestion[]
  onClose: () => void
  /** Called after the student leaves the completion screen. */
  onDone: () => void
}) {
  const { t, lang, journey, completeReview } = useStore()
  const c = t.review

  const [index, setIndex] = useState(0)
  /** Wrong options tried on the current card. */
  const [tried, setTried] = useState<number[]>([])
  const [solved, setSolved] = useState(false)
  const [firstTry, setFirstTry] = useState(0)
  const [finished, setFinished] = useState(false)
  /** Bumps on every wrong answer so the shake animation replays. */
  const [shake, setShake] = useState(0)

  const q = questions[index]
  const bonus = pointsConfig.REVIEW_SET_BONUS
  const shownPoints = useCountUp(finished ? bonus : 0, 800, 0)

  const choose = (i: number) => {
    if (solved || tried.includes(i)) return
    if (i === q.correct) {
      setSolved(true)
      if (tried.length === 0) setFirstTry((n) => n + 1)
    } else {
      setTried((prev) => [...prev, i])
      setShake((n) => n + 1)
    }
  }

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      setTried([])
      setSolved(false)
      return
    }
    completeReview(
      questions.map((x) => x.id),
      firstTry,
    )
    setFinished(true)
  }

  if (finished) {
    return (
      <div className="rv-overlay" role="dialog" aria-modal="true">
        <div className="rv-done">
          <div className="rv-done__burst" aria-hidden="true">
            <Icon name="check" size={34} />
          </div>
          <div className="rv-done__flag">{c.done.flag}</div>
          <h2 className="rv-done__title">{c.done.title}</h2>
          <p className="rv-done__body">{c.done.body(firstTry, questions.length)}</p>
          <div className="rv-done__points">{c.done.points(shownPoints)}</div>
          <button className="btn btn--beacon btn--block" onClick={onDone}>
            {c.done.cta} <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    )
  }

  const lastWrong = tried.length > 0 && !solved

  return (
    <div className="rv-overlay" role="dialog" aria-modal="true" aria-label={c.deck.progress(index + 1, questions.length)}>
      <div className="rv-top">
        <div className="rv-dots" aria-hidden="true">
          {questions.map((x, i) => (
            <span
              key={x.id}
              className={`rv-dot${i < index || (i === index && solved) ? ' rv-dot--on' : ''}${i === index ? ' rv-dot--current' : ''}`}
            />
          ))}
        </div>
        <button className="rv-close" onClick={onClose} aria-label={c.deck.close}>
          <Icon name="close" size={18} />
        </button>
      </div>

      <div key={q.id} className="rv-card">
        <div className="rv-card__meta">
          <span>{c.deck.progress(index + 1, questions.length)}</span>
          <span>{c.deck.module(moduleName(journey, q.moduleId))}</span>
        </div>
        <h2 className="rv-card__prompt">{q.prompt[lang]}</h2>

        <div key={shake} className={`rv-options${lastWrong ? ' rv-options--shake' : ''}`}>
          {q.options.map((o, i) => {
            const isRight = solved && i === q.correct
            const isWrong = tried.includes(i)
            return (
              <button
                key={i}
                className={`rv-opt${isRight ? ' rv-opt--right' : ''}${isWrong ? ' rv-opt--wrong' : ''}`}
                onClick={() => choose(i)}
                disabled={solved || isWrong}
              >
                <span className="rv-opt__key" aria-hidden="true">
                  {isRight ? <Icon name="check" size={14} /> : String.fromCharCode(65 + i)}
                </span>
                <span className="rv-opt__text">{o[lang]}</span>
              </button>
            )
          })}
        </div>

        {(solved || lastWrong) && (
          <div className={`rv-feedback${solved ? ' rv-feedback--right' : ''}`} aria-live="polite">
            <strong>{solved ? c.deck.correct : c.deck.wrong}</strong> {q.explain[lang]}
            {lastWrong && <div className="rv-feedback__retry">{c.deck.retry}</div>}
          </div>
        )}
      </div>

      <div className="rv-foot">
        <button className="btn btn--beacon btn--block" onClick={next} disabled={!solved}>
          {index + 1 < questions.length ? c.deck.next : c.deck.finish} <Icon name="arrow" size={16} />
        </button>
        <p className="rv-note">{c.deck.note}</p>
      </div>
    </div>
  )
}
