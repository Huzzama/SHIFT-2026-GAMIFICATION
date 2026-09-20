/**
 * Recovery — the screen FARO exists for.
 *
 * The order of this screen is the product argument, and it is deliberate:
 *
 *   Welcome back → where you actually are → can you still finish →
 *   what happened → how much time you have → the new route → why →
 *   the one thing to do now.
 *
 * Never show the student everything they owe before showing them how they can
 * finish. There is no overdue count anywhere on this screen, no red, no Game
 * Over. And when the numbers say the original route no longer fits, FARO says
 * that plainly instead of motivating with something it cannot support - the
 * verdict comes from `lib/recoveryPlanner.ts`, which is deterministic and
 * checkable, never from a model.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/Icon'
import { useStore } from '@/state/store'
import { interventionFor, lifeStateLabel, lifeStateOrder } from '@/lib/lifeHappened'
import {
  buildPlan,
  capacityFor,
  feasibility,
  remainingWork,
  rhythmDaily,
  strategies,
  todaysOneThing,
} from '@/lib/recoveryPlanner'
import type { DailyTimeChoice, PlanDay, PlanItem, StrategyId } from '@/types'

/** Respect the OS setting: the route animation is a nicety, never a gate. */
const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

const hhmm = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

const TIME_CHOICES: DailyTimeChoice[] = [15, 30, 45, 60, 'varies']

type Stage = 'analyzing' | 'ready' | 'recalculating'

export function RecoveryView({
  onAskMentor,
  onGoHome,
  onOpenJourney,
  onOpenCommunity,
}: {
  onAskMentor: () => void
  onGoHome: () => void
  onOpenJourney: () => void
  onOpenCommunity: () => void
}) {
  const {
    t,
    lang,
    snapshot,
    journey,
    friction,
    awayGap,
    availableMinutes,
    setAvailableMinutes,
    lifeState,
    setLifeState,
    setPaused,
    completeMilestone,
    sessions,
  } = useStore()

  const [stage, setStage] = useState<Stage>('analyzing')
  const [timeChoice, setTimeChoice] = useState<DailyTimeChoice | null>(null)
  const [strategyId, setStrategyId] = useState<StrategyId | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [finished, setFinished] = useState<PlanItem | null>(null)

  /* -- Stage 2: analysing. Brief, honest, and skipped when motion is off. */
  useEffect(() => {
    if (reducedMotion()) return setStage('ready')
    const id = setTimeout(() => setStage('ready'), 900)
    return () => clearTimeout(id)
  }, [])

  const copy = t.recovery.plan

  /* ------------------------------------------------------ the numbers */

  const work = useMemo(
    () => (snapshot && journey ? remainingWork(snapshot, journey) : null),
    [snapshot, journey],
  )
  const profile = snapshot?.profile
  const capacity = useMemo(
    () => capacityFor(availableMinutes, profile),
    [availableMinutes, profile],
  )
  const check = useMemo(
    () => (work ? feasibility(work, capacity) : null),
    [work, capacity],
  )
  const options = useMemo(
    () => (work ? strategies(work, capacity) : []),
    [work, capacity],
  )

  const suggested = options.find((s) => s.suggested) ?? null

  /** The pace actually used to lay out the plan, in priority order. */
  const dailyMinutes = useMemo(() => {
    const chosen = strategyId ? options.find((s) => s.id === strategyId) : null
    if (chosen) return chosen.dailyMinutes
    if (typeof timeChoice === 'number') return timeChoice
    if (timeChoice === 'varies') return suggested?.dailyMinutes ?? capacity
    return capacity || suggested?.dailyMinutes || 30
  }, [strategyId, timeChoice, options, suggested, capacity])

  const plan = useMemo(
    () =>
      work && journey
        ? buildPlan(journey, work, dailyMinutes, strategyId ?? 'balanced')
        : null,
    [work, journey, dailyMinutes, strategyId],
  )

  /* -- Stage 7: recalculating. Fires whenever the pace actually changes. */
  const firstPace = useRef(true)
  useEffect(() => {
    if (firstPace.current) {
      firstPace.current = false
      return
    }
    setUpdated(false)
    if (reducedMotion()) return setUpdated(true)
    setStage('recalculating')
    const id = setTimeout(() => {
      setStage('ready')
      setUpdated(true)
    }, 750)
    return () => clearTimeout(id)
  }, [dailyMinutes])

  if (!journey || !friction || !work || !check || !plan) {
    return <p className="muted">{t.recovery.loading}</p>
  }

  const intervention = lifeState ? interventionFor(lifeState, lang) : null
  const oneThing = todaysOneThing(plan)
  const oneThingDone = oneThing
    ? sessions.some((s) => s.milestoneId === oneThing.milestoneId)
    : false

  const chooseTime = (c: DailyTimeChoice) => {
    setTimeChoice(c)
    setStrategyId(null)
    if (typeof c === 'number') setAvailableMinutes(c)
    else if (suggested) setAvailableMinutes(suggested.dailyMinutes)
  }

  const chooseStrategy = (id: StrategyId) => {
    const s = options.find((o) => o.id === id)
    if (!s) return
    setStrategyId(id)
    setTimeChoice(null)
    setAvailableMinutes(s.dailyMinutes)
  }

  const runIntervention = () => {
    if (!intervention) return
    if (intervention.kind === 'mentor') return onAskMentor()
    if (intervention.kind === 'pause') {
      setPaused(true)
      return onGoHome()
    }
  }

  const start = () => {
    if (!oneThing) return
    const milestone = journey.milestones.find((m) => m.id === oneThing.milestoneId)
    if (!milestone) return
    completeMilestone(milestone, Math.min(oneThing.minutes, dailyMinutes))
    setFinished(oneThing)
  }

  const dayLabel = (d: PlanDay) =>
    d.index === 0 ? copy.route.today : d.index === 1 ? copy.route.tomorrow : copy.route.day(d.index + 1)

  const visibleDays = expanded ? plan.days : plan.days.slice(0, 3)
  const unknown = check.state === 'unknown'

  /* ------------------------------------------------------------ render */

  if (stage === 'analyzing') {
    return (
      <div className="stack">
        <div className="rcv-scan">
          <span className="rcv-scan__ring" aria-hidden="true" />
          <p className="rcv-scan__label">{copy.analyzing}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      {/* A — Welcome back. Emotional first, academic second. */}
      <section className="rcv-hero">
        <span className="rcv-hero__mark" aria-hidden="true">
          <Icon name="wave" size={26} />
        </span>
        <h1 className="rcv-hero__title">{copy.welcome.title}</h1>
        <p className="rcv-hero__sub">{copy.welcome.sub}</p>
        {awayGap > 0 && <p className="rcv-hero__away">{copy.welcome.away(awayGap)}</p>}
      </section>

      {/* B — The situation in three numbers. Not eighteen rows. */}
      <section className="card">
        <div className="eyebrow">{copy.situation.eyebrow}</div>
        <div className="rcv-sit">
          <div className="rcv-sit__cell">
            <div className="rcv-sit__value">{copy.situation.days(work.daysLeft)}</div>
            <div className="rcv-sit__label">{copy.situation.daysLabel}</div>
          </div>
          <div className="rcv-sit__cell">
            <div className="rcv-sit__value">{hhmm(work.minutes)}</div>
            <div className="rcv-sit__label">{copy.situation.workLabel}</div>
          </div>
          <div className="rcv-sit__cell">
            <div className="rcv-sit__value">{copy.situation.modules(work.modules)}</div>
            <div className="rcv-sit__label">{copy.situation.modulesLabel}</div>
          </div>
        </div>
      </section>

      {/* C — Feasibility. The one verdict FARO must never fake. */}
      <section className={`rcv-feas rcv-feas--${check.state}`}>
        <div className="rcv-feas__eyebrow">
          <Icon name={check.state === 'not_realistic' ? 'target' : 'check'} size={14} />
          {copy.feasibility.eyebrow}
        </div>
        <h2 className="rcv-feas__title">{copy.feasibility[check.state].title}</h2>
        <p className="rcv-feas__body">
          {check.state === 'comfortable' && copy.feasibility.comfortable.body(check.requiredDailyMinutes)}
          {check.state === 'tight' &&
            copy.feasibility.tight.body(check.requiredDailyMinutes, check.capacityMinutes)}
          {check.state === 'not_realistic' &&
            copy.feasibility.not_realistic.body(check.requiredDailyMinutes)}
          {unknown && copy.feasibility.unknown.body}
        </p>

        {!unknown && (
          <>
            <div className="rcv-gauge">
              <div
                className="rcv-gauge__fill"
                style={{ width: `${Math.min(100, Math.round(check.load * 100))}%` }}
              />
              <span className="rcv-gauge__mark" aria-hidden="true" />
            </div>
            <div className="rcv-gauge__legend">
              <span>{copy.feasibility.required(check.requiredDailyMinutes)}</span>
              <span>{copy.feasibility.yours(check.capacityMinutes)}</span>
            </div>
          </>
        )}

        {check.state === 'not_realistic' && (
          <div className="rcv-alts">
            <div className="rcv-alts__title">{copy.feasibility.alternatives.title}</div>
            <ul className="rcv-alts__list">
              <li>{copy.feasibility.alternatives.mandatory}</li>
              <li>{copy.feasibility.alternatives.impact}</li>
              <li>{copy.feasibility.alternatives.realistic}</li>
            </ul>
            <button className="btn btn--onDark btn--block" onClick={onAskMentor}>
              {copy.feasibility.alternatives.mentor} <Icon name="arrow" size={16} />
            </button>
          </div>
        )}
      </section>

      {unknown && (
        <button className="btn btn--block" onClick={onAskMentor}>
          {copy.feasibility.alternatives.mentor} <Icon name="arrow" size={16} />
        </button>
      )}

      {/* D — What happened. Optional, and it shapes the plan below. */}
      <section className="card stack">
        <div>
          <div className="eyebrow">{copy.whatHappened.eyebrow}</div>
          <p className="muted" style={{ margin: '6px 0 0' }}>{copy.whatHappened.body}</p>
        </div>
        <div className="chips">
          {lifeStateOrder.map((s) => (
            <button
              key={s}
              className={`chip${lifeState === s ? ' chip--on' : ''}`}
              onClick={() => setLifeState(lifeState === s ? null : s)}
            >
              {lifeStateLabel(s, lang)}
            </button>
          ))}
        </div>
        {intervention && (
          <div className="intervention">
            <div className="intervention__headline">{intervention.headline}</div>
            <p className="intervention__body">{intervention.body}</p>
            {intervention.minutes > 0 && (
              <div className="intervention__meta">{t.recovery.sizedTo(intervention.minutes)}</div>
            )}
            {(intervention.kind === 'mentor' || intervention.kind === 'pause') && (
              <button
                className="btn btn--block"
                style={{ marginTop: 'var(--space-4)' }}
                onClick={runIntervention}
              >
                {intervention.cta} <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
        )}
      </section>

      {!unknown && (
        <>
          {/* E — How much time. The student is the authority on their week. */}
          <section className="card">
            <div className="eyebrow">{copy.time.eyebrow}</div>
            <p className="muted" style={{ margin: '6px 0 12px' }}>{copy.time.body}</p>
            <div className="chips">
              {TIME_CHOICES.map((c) => (
                <button
                  key={String(c)}
                  className={`chip${timeChoice === c ? ' chip--on' : ''}`}
                  onClick={() => chooseTime(c)}
                >
                  {c === 'varies'
                    ? copy.time.varies
                    : c === 60
                      ? copy.time.hour
                      : copy.time.perDay(c)}
                </button>
              ))}
            </div>
            {timeChoice === 'varies' && (
              <div className="rcv-flex">
                <div className="rcv-flex__title">{copy.time.flexible.title}</div>
                <ul className="rcv-flex__list">
                  <li>{copy.time.flexible.min(Math.max(10, Math.round(dailyMinutes / 2)))}</li>
                  <li>{copy.time.flexible.rec(dailyMinutes)}</li>
                  <li>{copy.time.flexible.extra}</li>
                </ul>
              </div>
            )}
          </section>

          {/* F — Three paces. Never good/better/best. */}
          {options.length > 0 && (
            <section className="card">
              <div className="eyebrow">{copy.strategies.eyebrow}</div>
              <div className="rcv-strats">
                {options.map((s) => (
                  <button
                    key={s.id}
                    className={`rcv-strat${strategyId === s.id ? ' rcv-strat--on' : ''}${s.feasible ? '' : ' rcv-strat--off'}`}
                    onClick={() => chooseStrategy(s.id)}
                    disabled={!s.feasible}
                  >
                    <div className="rcv-strat__head">
                      <span className="rcv-strat__name">{copy.strategies[s.id]}</span>
                      {s.suggested && (
                        <span className="rcv-strat__tag">{copy.strategies.suggested}</span>
                      )}
                    </div>
                    <div className="rcv-strat__rate">{copy.time.perDay(s.dailyMinutes)}</div>
                    <div className="rcv-strat__body">
                      {s.feasible
                        ? copy.strategies.body(s.days, s.buffer)
                        : copy.strategies.notFeasible(s.days)}
                    </div>
                  </button>
                ))}
              </div>
              {suggested && capacity > 0 && (
                <p className="muted" style={{ margin: '12px 0 0', fontSize: 'var(--text-xs)' }}>
                  {copy.strategies.suggestedWhy(capacity)}
                </p>
              )}
            </section>
          )}

          {/* G — The new route. Three days, then opt in to the rest. */}
          <section className="card">
            {stage === 'recalculating' ? (
              <div className="rcv-scan rcv-scan--inline">
                <span className="rcv-scan__ring" aria-hidden="true" />
                <p className="rcv-scan__label">{copy.recalculating}</p>
              </div>
            ) : (
              <>
                {updated && (
                  <div className="rcv-updated">
                    <Icon name="refresh" size={14} />
                    <span>
                      <strong>{copy.route.updated.title}</strong> {copy.route.updated.body(dailyMinutes)}
                    </span>
                  </div>
                )}
                <div className="eyebrow">{copy.route.eyebrow}</div>
                <ol className="rcv-route">
                  {visibleDays.map((d) => (
                    <li key={d.index} className={`rcv-day${d.checkpoint ? ' rcv-day--checkpoint' : ''}`}>
                      <span className="rcv-day__dot" aria-hidden="true" />
                      <div className="rcv-day__when">{dayLabel(d)}</div>
                      <div className="rcv-day__items">
                        {d.items.map((i) => (
                          <div key={i.milestoneId} className="rcv-day__item">
                            <span className="rcv-day__title">{i.title}</span>
                            <span className="rcv-day__min">{i.minutes} min</span>
                          </div>
                        ))}
                        {d.checkpointLabel && (
                          <div className="rcv-day__flag">
                            <Icon name="flag" size={12} /> {copy.route.checkpoint(d.checkpointLabel)}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>

                {plan.days.length > 3 && (
                  <button className="btn btn--ghost btn--block" onClick={() => setExpanded(!expanded)}>
                    {expanded ? copy.route.showLess : copy.route.showAll(plan.days.length)}
                  </button>
                )}

                {plan.overflow.length > 0 && (
                  <p className="rcv-overflow">{copy.route.overflow(plan.overflow.length)}</p>
                )}
              </>
            )}
          </section>

          {/* H — Why. The planner is not a black box. */}
          <section className="card">
            <button className="rcv-why__head" onClick={() => setWhyOpen(!whyOpen)}>
              <span>{copy.why.title}</span>
              <Icon name="chevron" size={16} className={whyOpen ? 'flip' : undefined} />
            </button>
            {whyOpen && (
              <>
                <ul className="rcv-why__list">
                  <li>{copy.why.days(work.daysLeft)}</li>
                  {rhythmDaily(profile) > 0 && <li>{copy.why.rhythm(rhythmDaily(profile))}</li>}
                  <li>{copy.why.pending(work.activities)}</li>
                  <li>{copy.why.duration}</li>
                  <li>{copy.why.deadlines}</li>
                </ul>
                <p className="muted" style={{ margin: '10px 0 0', fontSize: 'var(--text-xs)' }}>
                  {copy.why.note}
                </p>
              </>
            )}
          </section>

          {/* I — One action. The whole plan, reduced to what to do now. */}
          {finished ? (
            <section className="mission mission--done">
              <div className="mission__flag">
                <Icon name="check" size={14} /> {copy.done.flag}
              </div>
              <div className="mission__title">{copy.done.title}</div>
              <p className="mission__body">{copy.done.body(finished.title, friction.momentum)}</p>
              <button className="btn btn--onDark btn--block" onClick={onOpenJourney}>
                {copy.done.journey} <Icon name="arrow" size={16} />
              </button>
              <button
                className="btn btn--onDark btn--block"
                style={{ marginTop: 'var(--space-2)' }}
                onClick={onGoHome}
              >
                {copy.done.home}
              </button>
            </section>
          ) : null}

          {/* Social recovery. Coming back to the course and coming back to the
              people are two different returns, and the second one is the one
              nobody offers. */}
          {finished ? (
            <section className="card">
              <div className="eyebrow">{t.community.recoveryCta.title}</div>
              <p className="muted" style={{ margin: '6px 0 12px', lineHeight: 1.55 }}>
                {t.community.recoveryCta.body}
              </p>
              <button className="btn btn--ghost btn--block" onClick={onOpenCommunity}>
                {t.community.recoveryCta.cta} <Icon name="arrow" size={16} />
              </button>
            </section>
          ) : oneThing && !oneThingDone ? (
            <section className="nba">
              <div className="nba__eyebrow">{copy.oneThing.eyebrow}</div>
              <div className="nba__title">{oneThing.title}</div>
              <div className="nba__meta">
                <Icon name="clock" size={14} /> {copy.oneThing.meta(oneThing.minutes)}
                <br />
                {oneThing.minutes > dailyMinutes
                  ? copy.oneThing.longer(dailyMinutes)
                  : copy.oneThing.why}
              </div>
              <div className="nba__cta">
                <button className="btn btn--beacon btn--block" onClick={start}>
                  {copy.oneThing.start} <Icon name="arrow" size={16} />
                </button>
              </div>
            </section>
          ) : (
            <section className="card">
              <div className="eyebrow">{copy.oneThing.eyebrow}</div>
              <p style={{ margin: '8px 0 0' }}>{copy.oneThing.none}</p>
            </section>
          )}
        </>
      )}

      <p className="mentor__note">{t.recovery.note}</p>
    </div>
  )
}
