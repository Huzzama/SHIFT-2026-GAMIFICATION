/**
 * FARO Mentor.
 *
 * Two layers, on purpose:
 *
 *  - Structured moments, computed here from real course data: the check-in
 *    when something changed ("I noticed something changed"), Focus sessions,
 *    the way back, weekend planning, points toward TecmiRewards, and the
 *    local Teach-me loop. Their numbers come from `lib/`, never from a model.
 *  - Open conversation, answered by `mentorService`: Gemini through the FARO
 *    backend when the build enables it, the local mentor otherwise or when
 *    Gemini cannot answer.
 *
 * The mentor only ever receives a `MentorContext` built by
 * `lib/mentorContext.ts` — the privacy boundary lives there, not here.
 * Style changes the voice; mode changes the kind of help; neither changes
 * the academic or safety rules.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon, type IconName } from '@/components/Icon'
import { Lighthouse } from '@/components/Lighthouse'
import { REVIEW_BANK_COURSE_ID, reviewBank } from '@/data/reviewBank'
import { lifeStateOrder, minutesFor } from '@/lib/lifeHappened'
import { buildMentorContext } from '@/lib/mentorContext'
import { pathToPoints } from '@/lib/rewardPath'
import { answerTeach, lessonQuestions, teachTopics, type TeachState } from '@/lib/teach'
import { buildTimeSession, openSteps, planDays, sessionMinutes } from '@/lib/timeSession'
import { mentorService, mentorStyles, probeGemini, type MentorAvailability } from '@/services/mentor'
import { useStore } from '@/state/store'
import type { JourneyMilestone, LifeState, MentorChoice, MentorMessage, MentorMode, WeekPlan } from '@/types'

const uid = () => Math.random().toString(36).slice(2, 10)
const now = () => new Date().toISOString()

const REWARD_WORDS = /\b(puntos?|points?|recompensas?|rewards?|tecmi ?rewards?|premios?|canje|redeem)\b/i

const MODE_ICONS: Record<Exclude<MentorMode, 'chat'>, IconName> = {
  focus: 'compass',
  recovery: 'recalculate',
  teach: 'book',
  planning: 'calendar',
}

export function MentorView({
  onOpenRecovery,
  onOpenRewards,
}: {
  onOpenRecovery: () => void
  onOpenRewards: () => void
}) {
  const store = useStore()
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
    snapshot,
    awayGap,
    reviewSet,
    reviewOffered,
    semester,
    completeMilestone,
    setLifeState,
    setAvailableMinutes,
    setWeekPlan,
  } = store

  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [teach, setTeach] = useState<TeachState | null>(null)
  const [satMinutes, setSatMinutes] = useState<number | null>(null)
  const [mode, setMode] = useState<MentorMode>('chat')
  const [ai, setAi] = useState<MentorAvailability>('checking')
  const threadRef = useRef<HTMLDivElement>(null)
  /** A plan between "here is a plan" and "keep it". Not rendered, so not state. */
  const pendingPlan = useRef<WeekPlan | null>(null)
  const m = t.mentor

  const moduleNames = useMemo(
    () => new Map((snapshot?.modules ?? []).map((mod) => [mod.id, mod.name] as [number, string])),
    [snapshot],
  )
  // Lessons exist only for the course the bank was written for.
  const hasLessons = !!journey && journey.courseId === REVIEW_BANK_COURSE_ID

  // Is Gemini available through the backend right now? Asked each time the mentor opens.
  useEffect(() => {
    let alive = true
    void probeGemini(true).then((ok) => alive && setAi(ok ? 'gemini' : 'local'))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const changed = !!friction && (friction.state !== 'FLOWING' || awayGap >= 3)

  // The opening line is the intervention: it names the moment, not the debt.
  useEffect(() => {
    if (messages.length > 0 || !friction || !journey) return
    setMessages([
      changed
        ? faro(m.noticed(Math.max(awayGap, 1)), lifeStateOrder.map((s) => ({ id: `life:${s}`, label: t.recovery.states[s] })))
        : faro(m.openDest(purpose?.destination ?? '', journey.progressPercent), modeChoices()),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friction, journey, messages.length])

  if (!journey || !friction || !purpose) {
    return <p className="muted">{m.preparing}</p>
  }

  /* ------------------------------------------------------------ helpers */

  function faro(text: string, choices?: MentorChoice[], suggestions?: string[], source: 'gemini' | 'local' = 'local'): MentorMessage {
    return { id: uid(), role: 'faro', text, at: now(), choices, suggestions, source }
  }
  function student(text: string): MentorMessage {
    return { id: uid(), role: 'student', text, at: now() }
  }
  function modeChoices(): MentorChoice[] {
    return (['focus', 'teach', 'planning', 'recovery'] as const).map((k) => ({ id: `mode:${k}`, label: m.modes[k] }))
  }
  const startChoice = (ms: JourneyMilestone, primary = true): MentorChoice => ({
    id: `start:${ms.id}`,
    label: m.choice.start(ms.title),
    primary,
  })
  const firstOpen = () => {
    const byNba = nextAction ? journey!.milestones.find((x) => x.id === nextAction.milestoneId) : undefined
    return byNba ?? openSteps(journey!)[0] ?? null
  }
  const shortest = () => [...openSteps(journey!)].sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)[0] ?? null

  /** Append the student's words (if any) and FARO's answer in one update. */
  const push = (said: string | null, ...replies: MentorMessage[]) => {
    const next = [...messages, ...(said ? [student(said)] : []), ...replies]
    setMessages(next)
    return next
  }

  /* ------------------------------------------------------- structured */

  function focusReply(minutes: number): MentorMessage {
    const items = buildTimeSession(journey!, minutes, { reviewAvailable: reviewOffered })
    if (items.length === 0) return faro(m.focus.empty)
    const lines = items
      .map((i, n) =>
        `${n + 1}. ${
          i.kind === 'review'
            ? m.focus.review(i.minutes)
            : i.kind === 'step'
              ? m.focus.step(i.milestone.title, i.minutes)
              : m.focus.partial(i.milestone.title, i.minutes)
        }`,
      )
      .join('\n')
    const first = items[0]
    const choices: MentorChoice[] =
      first.kind === 'review'
        ? [{ id: 'nav:review', label: m.choice.reviewCards, primary: true }]
        : [startChoice(first.milestone)]
    return faro(m.focus.reply(sessionMinutes(items), lines), choices)
  }

  function wayBackReply(): MentorMessage {
    const step = shortest()
    if (!step) return faro(m.life.nothing)
    const mins = Math.min(10, step.estimatedMinutes)
    if (reviewOffered && reviewSet.length > 0) {
      const module = moduleNames.get(reviewSet[0].moduleId) ?? journey!.courseName
      return faro(m.wayBack.withCards(module, step.title, mins), [
        { id: 'nav:review', label: m.choice.reviewCards, primary: true },
        { id: `start:${step.id}`, label: m.choice.skipToStep },
      ])
    }
    return faro(m.wayBack.noCards(step.title, mins), [startChoice(step)])
  }

  function teachAsk(): MentorMessage {
    if (ai === 'gemini') {
      const topics = hasLessons ? teachTopics(journey!, reviewBank, moduleNames).slice(0, 3).map((x) => x.name) : []
      return faro(m.teach.askOpen, undefined, topics.map((x) => m.teach.topicMessage(x)))
    }
    if (!hasLessons) return faro(m.teach.none)
    return faro(
      m.teach.ask,
      teachTopics(journey!, reviewBank, moduleNames)
        .slice(0, 4)
        .map((x) => ({ id: `teach:${x.moduleId}`, label: x.name })),
    )
  }

  function questionChoices(qid: string, options: number[]): MentorChoice[] {
    const q = reviewBank.find((x) => x.id === qid)!
    return options.map((i) => ({ id: `answer:${i}`, label: q.options[i][lang] }))
  }

  function teachStart(moduleId: number): MentorMessage {
    const qs = lessonQuestions(reviewBank, moduleId)
    if (qs.length === 0) return faro(m.teach.none)
    const q = qs[0]
    setTeach({ moduleId, index: 0, tried: [] })
    return faro(
      m.teach.intro(moduleNames.get(moduleId) ?? '', q.explain[lang], q.prompt[lang]),
      questionChoices(q.id, q.options.map((_, i) => i)),
    )
  }

  function teachAnswer(option: number): MentorMessage {
    if (!teach) return teachAsk()
    const step = answerTeach(reviewBank, teach, option)
    if (step.kind === 'wrong') {
      setTeach({ ...teach, tried: [...teach.tried, option] })
      return faro(m.teach.wrong(step.question.explain[lang]), questionChoices(step.question.id, step.remaining))
    }
    if (step.next) {
      setTeach({ moduleId: teach.moduleId, index: teach.index + 1, tried: [] })
      return faro(m.teach.rightNext(step.next.prompt[lang]), questionChoices(step.next.id, step.next.options.map((_, i) => i)))
    }
    setTeach(null)
    const next = firstOpen()
    return faro(m.teach.rightDone(next?.title ?? null), [
      ...(next ? [startChoice(next)] : []),
      { id: 'mode:teach', label: m.choice.anotherTopic },
    ])
  }

  const dayChoices = (prefix: string, withNone: boolean): MentorChoice[] => [
    ...(withNone ? [{ id: `${prefix}:0`, label: m.choice.none }] : []),
    ...[30, 45, 60, 90].map((x) => ({ id: `${prefix}:${x}`, label: m.choice.minutes(x) })),
  ]

  function planProposal(sat: number, sun: number): MentorMessage {
    const days = planDays(journey!, [
      { label: m.planner.sat, minutes: sat },
      { label: m.planner.sun, minutes: sun },
    ])
    if (days.every((d) => d.items.length === 0)) return faro(m.planner.nothing)
    const lines = days
      .map((d) => m.planner.day(d.label, d.minutes, d.items.length ? d.items.map((i) => i.title).join(', ') : m.planner.rest))
      .join('\n')
    pendingPlan.current = { createdAt: now(), days }
    return faro(m.planner.proposal(lines), [
      { id: 'plan:keep', label: m.choice.keepPlan, primary: true },
      { id: 'mode:planning', label: m.choice.changePlan },
    ])
  }

  function rewardsReply(): MentorMessage {
    if (semester.redemption) return faro(m.rewards.redeemed, [{ id: 'nav:rewards', label: m.choice.openImpact }])
    if (!semester.next) {
      const top = semester.reached
      return faro(m.rewards.reached(top ? `$${top.mxn} MXN` : ''), [{ id: 'nav:rewards', label: m.choice.openImpact, primary: true }])
    }
    return faro(m.rewards.gap(semester.toNext.toLocaleString(lang === 'es' ? 'es-MX' : 'en-US'), `$${semester.next.mxn} MXN`), [
      { id: 'reward:path', label: m.choice.showPath, primary: true },
      { id: 'noop', label: m.choice.notNow },
    ])
  }

  function rewardPathReply(): MentorMessage {
    const path = pathToPoints(journey!, semester.toNext)
    if (path.steps.length === 0) return faro(m.rewards.short, [{ id: 'nav:rewards', label: m.choice.openImpact }])
    const text = path.reachable ? m.rewards.path(path.steps.length, path.minutes, path.modules) : m.rewards.short
    return faro(text, [startChoice(path.steps[0]), { id: 'nav:rewards', label: m.choice.openImpact }])
  }

  function lifeReply(state: LifeState): MentorMessage {
    setLifeState(state)
    const minutes = minutesFor(state, availableMinutes)
    switch (state) {
      case 'less_time':
        return focusReply(minutes)
      case 'overwhelmed': {
        const step = shortest()
        return step
          ? faro(m.life.overwhelmed(step.title, step.estimatedMinutes), [startChoice(step), { id: 'life:need_break', label: m.choice.notToday }])
          : faro(m.life.nothing)
      }
      case 'dont_understand':
        setMode('teach')
        return teachAsk()
      case 'lost_routine':
        return wayBackReply()
      case 'need_break':
        return faro(m.life.need_break, [{ id: 'life:ready', label: m.choice.ready }])
      case 'ready': {
        const step = firstOpen()
        return step ? faro(m.life.ready(step.title, step.estimatedMinutes), [startChoice(step)]) : faro(m.life.nothing)
      }
    }
  }

  /* ------------------------------------------------------------ choices */

  function choose(choice: MentorChoice) {
    const [kind, arg] = [choice.id.split(':')[0], choice.id.slice(choice.id.indexOf(':') + 1)]
    switch (kind) {
      case 'life':
        push(choice.label, lifeReply(arg as LifeState))
        return
      case 'mode':
        return startMode(arg as MentorMode, choice.label)
      case 'focus': {
        const minutes = Number(arg)
        setAvailableMinutes(minutes)
        setMode('chat')
        push(choice.label, focusReply(minutes))
        return
      }
      case 'start': {
        const ms = journey!.milestones.find((x) => x.id === arg)
        if (!ms) return
        completeMilestone(ms)
        push(choice.label, faro(m.started(ms.title)))
        return
      }
      case 'teach':
        push(choice.label, teachStart(Number(arg)))
        return
      case 'answer':
        push(choice.label, teachAnswer(Number(arg)))
        return
      case 'sat': {
        const minutes = Number(arg)
        setSatMinutes(minutes)
        push(choice.label, faro(m.planner.askSun, dayChoices('sun', true)))
        return
      }
      case 'sun':
        push(choice.label, planProposal(satMinutes ?? 0, Number(arg)))
        return
      case 'plan':
        if (pendingPlan.current) setWeekPlan(pendingPlan.current)
        setMode('chat')
        push(choice.label, faro(m.planner.saved))
        return
      case 'reward':
        push(choice.label, rewardPathReply())
        return
      case 'nav':
        if (arg === 'review') onOpenRecovery()
        if (arg === 'rewards') onOpenRewards()
        return
      default:
        push(choice.label)
    }
  }

  function startMode(next: MentorMode, said: string) {
    setMode(next)
    setTeach(null)
    switch (next) {
      case 'focus':
        push(said, faro(m.focus.ask, [5, 10, 15, 30].map((x) => ({ id: `focus:${x}`, label: m.choice.minutes(x) }))))
        return
      case 'recovery':
        push(said, wayBackReply())
        return
      case 'teach':
        push(said, teachAsk())
        return
      case 'planning':
        setSatMinutes(null)
        push(said, faro(m.planner.askSat, dayChoices('sat', true)))
        return
      default:
        push(said)
    }
  }

  /* ------------------------------------------------------- open text */

  const send = async (text: string) => {
    const clean = text.trim()
    if (!clean || thinking) return
    setDraft('')

    // Points are answered from the Rewards rules, never guessed by a model.
    if (REWARD_WORDS.test(clean)) {
      push(clean, rewardsReply())
      return
    }

    const history = push(clean)
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
      const reply = await mentorService.send({ message: clean, context, history: history.slice(0, -1), mode })
      const note = reply.fellBack ? `${reply.text}\n\n— ${m.source.fallback}` : reply.text
      setMessages([...history, faro(note, undefined, reply.suggestions, reply.source)])
    } catch {
      setMessages([...history, faro(m.error)])
    } finally {
      setThinking(false)
    }
  }

  /* ------------------------------------------------------------ render */

  const last = messages[messages.length - 1]
  const lastIsFaro = !thinking && last?.role === 'faro'
  const suggestions = lastIsFaro ? (last.suggestions ?? []) : []
  const choices = lastIsFaro ? (last.choices ?? []) : []

  return (
    <div className="mentor">
      <div className="mentor__modes" role="toolbar" aria-label={m.styleLabel}>
        {(['focus', 'recovery', 'teach', 'planning'] as const).map((k) => (
          <button
            key={k}
            className={`chip chip--mode${mode === k ? ' chip--on' : ''}`}
            onClick={() => startMode(k, m.modeAsk[k])}
            disabled={thinking}
          >
            <Icon name={MODE_ICONS[k]} size={14} /> {m.modes[k]}
          </button>
        ))}
        <label className="mentor__voice">
          <span>{m.styleLabel}</span>
          <select value={mentorStyle} onChange={(e) => setMentorStyle(e.target.value as typeof mentorStyle)}>
            {mentorStyles.map((s) => (
              <option key={s} value={s}>
                {m.styles[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mentor__thread" ref={threadRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`msg msg--${msg.role}`}>
            {msg.role === 'faro' && (
              <span className={`msg__avatar${msg.source === 'gemini' ? ' msg__avatar--ai' : ''}`}>
                <Lighthouse size={16} />
              </span>
            )}
            <div className={`bubble bubble--${msg.role}`}>{msg.text}</div>
          </div>
        ))}
        {thinking && (
          <div className="msg msg--faro">
            <span className="msg__avatar">
              <Lighthouse size={16} />
            </span>
            <div className="bubble bubble--faro bubble--typing">{m.thinking}</div>
          </div>
        )}
      </div>

      {choices.length > 0 && (
        <div className="mentor__choices">
          {choices.map((c) => (
            <button key={c.id} className={`choice${c.primary ? ' choice--primary' : ''}`} onClick={() => choose(c)}>
              {c.label}
              {c.primary && <Icon name="arrow" size={14} />}
            </button>
          ))}
        </div>
      )}

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
          placeholder={m.placeholder}
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
          {m.send} <Icon name="arrow" size={16} />
        </button>
      </div>

      <p className="mentor__note">
        {m.note} {ai === 'gemini' ? m.source.gemini : ai === 'local' ? m.source.local : ''}
      </p>
    </div>
  )
}
