# 3. Domain logic (`src/lib/`)

Everything FARO *decides* lives here, in pure functions. This chapter documents each module with its inputs, its exact rules and its outputs. The numbers are those in the code; if the code changes, this chapter must change with it.

## 3.1 `friction.ts` — the friction engine

**Input:** a `CourseSnapshot` and whether the student is returning after time away.
**Output:** a `FrictionSignal` with state, days without activity, pending count, momentum and a supportive headline.

**Thresholds** (`frictionRules`, configurable):

| Constant | Value | Use |
|---|---|---|
| `frictionDays` | 3 | From here on, FRICTION |
| `disconnectionDays` | 7 | From here on, DISCONNECTION |
| `overwhelmPendingCount` | 4 | Overdue pending items for POSSIBLE_OVERWHELM |
| `momentumDecayWindow` | 14 | Days of inactivity that take momentum from 100 to its floor |
| `momentumFloor` | 20 | Momentum never goes below this |

**States**, in evaluation order:

```text
returning                                   → RECOVERY
days ≥ 7                                    → DISCONNECTION
pending ≥ 4  and  days ≥ 3                  → POSSIBLE_OVERWHELM
days ≥ 3                                    → FRICTION
otherwise                                   → FLOWING
```

**Days without activity:** the most recent timestamp in `snapshot.activity`. If there is none, `disconnectionDays` (7) is assumed: with no evidence of activity, FARO treats the student as disconnected, not as on track.

**Pending:** assignments with no submission whose due date has passed.

**Momentum:**

```text
decay = min(1, days / 14)
load  = min(1, pending / 8) × 0.2
raw   = (1 − decay) × 100 − load × 100
momentum = max(20, round(raw))
```

One day without activity costs ~7 points. Eight overdue items subtract 20. Nothing takes it to zero.

**Product rule:** the `headline` comes from the dictionary per state and is always supportive language. There is no "risk" field.

## 3.2 `journey.ts` — the route and the next best action

**`buildJourney(snapshot, friction)`** orders assignments by module position and then by id, and assigns each a state:

```text
has a submission                           → completed
no submission and due date passed          → missed
no submission and module locked            → locked
the first one that is none of the above    → current
the rest                                   → upcoming
```

The last assignment of each module is a **checkpoint** (`checkpoint: true`). `progressPercent` = completed ÷ total. `currentIndex` is the first `missed` or `current`. `recalculated` is true when the friction state is not FLOWING.

**`nextBestAction(journey, availableMinutes)`** — the four-step rule:

1. Open = `missed` + `current` + `upcoming`.
2. Of those, the ones that fit in `availableMinutes`.
3. Of those, the shortest.
4. If none fits, the shortest of all open ones.

The reason shown depends on the case: *reopens the route* if it is `missed`, *fits your time* if it fits, *the shortest* otherwise.

**`comebackMilestone(journey)`** — the shortest open one, with no time condition. It is the comeback mission: not the most important, but the one least likely to be postponed again.

**`recoveryRoute(journey)`** — three steps (today / tomorrow / next session) taken from the route.

## 3.3 `recoveryPlanner.ts` — feasibility and plan

This module answers *"can I still finish?"* with numbers.

**`remainingWork(snapshot, journey)`** — everything not completed, **including locked modules**. Ignoring them would be the reassuring lie this file exists to avoid. Returns activities, minutes, modules, days until the close and the close date.

**`capacityFor(stated, profile)`** — what the student sustains per day. What they declared wins; if nothing was declared, the measured rhythm spread across the week: `(minutesPerSession × daysPerWeek) ÷ 7`, rounded to 5. With neither, 0.

**`feasibility(work, capacity)`** — the verdict:

```text
activities = 0                              → comfortable (finished)
no deadline, or daysLeft ≤ 0, or capacity ≤ 0 → unknown (no guessing)
required = minutes / daysLeft
load     = required / capacity
load ≤ 0.85                                 → comfortable
load ≤ 1.40                                 → tight
otherwise                                   → not_realistic
```

`feasibilityRules = { comfortableLoad: 0.85, stretchLoad: 1.4 }`. `not_realistic` exists on purpose.

**`strategies(work, capacity)`** — three paces over the same work, with `PACE = { comfortable: 1, balanced: 1.35, intensive: 2 }` multiplying the required daily minutes. Each strategy computes its days needed and its slack (`buffer = daysLeft − days`). **At most one** carries `suggested: true`: the feasible one closest to the student's capacity. With no known capacity, none is suggested.

**`buildPlan(journey, work, dailyMinutes, strategy)`** — packs the work into days:

- Priority: `missed` first; then nearest due date; then course order.
- Minimum budget per day: 10 minutes.
- Front-loaded: finishing early leaves the slack *before* the close.
- An activity longer than a whole day is scheduled anyway, taking its own day.
- What does not fit before the close goes to `overflow`. It is shown, never silently dropped.

**`todaysOneThing(plan)`** — the first item of the first day.

## 3.4 `lifeHappened.ts` — the life state and the intervention

Six states, each with an intervention kind and a minute budget:

| State | Intervention | Minutes |
|---|---|---|
| `less_time` | `shrink_session` | 10 |
| `overwhelmed` | `single_action` | 15 |
| `dont_understand` | `mentor` | 15 |
| `lost_routine` | `comeback_mission` | 10 |
| `need_break` | `pause` | keeps the current one |
| `ready` | `continue` | 20 |

Nothing here touches dates or academic rules. It only changes the size and shape of the next step.

## 3.5 `points.ts` and `rhythm.ts` — points

`pointsConfig`:

| Constant | Value |
|---|---|
| `POINTS_PER_ACTIVITY` | 10 |
| `POINTS_PER_MODULE` | 50 |
| `STREAK_BONUS` | 5 (every 3 consecutive days, `rhythmMilestoneEvery = 3`) |
| `COMEBACK_BONUS` | 25 (once, if there is at least one session and `awayGap ≥ frictionDays`) |
| `REWARD_REDEMPTION_RATE` | 100 points = 1 unit |

`learningRhythm(sessions)` counts consecutive days with a session, ending today. Breaking the streak stops adding; it never subtracts.

## 3.6 `achievements.ts` — the five achievements

| Id | Exact condition |
|---|---|
| `the_comeback` | `awayGap ≥ 3` and at least one session exists |
| `back_on_track` | at least 2 sessions and `momentum ≥ 65` |
| `weathered_the_storm` | some session with `pendingAtStart ≥ 2` |
| `smart_session` | some session with `fitAvailableTime` |
| `finisher` | `progressPercent ≥ 100` |

While unearned, `hint` is shown, never a reproach.

## 3.7 `sessions.ts` — FARO's own record

A `StudySession` is what FARO notes down when the student marks a step as done. It stores minutes, how many pending items there were at the start and whether it fitted the declared time. `applySessions` overlays the sessions on the route so momentum, points and achievements respond instantly, without waiting for Canvas to record the submission.

## 3.8 `community.ts` — feed ranking and SOS routing

**`rankFeed(posts, ctx)`** orders by: relevance to the student's course and module, whether someone is asking for help and unanswered, and recency. **It ignores reactions on purpose.** `KIND_WEIGHT` puts `help: 5` above `achievement: 2`.

**`sosRouting`**: `topic → mentor`, `time → recovery`, `people → community`. Three kinds of stuck, three systems.

**`communityPointsConfig`**: `POINTS_PER_HELPFUL_MARK: 5`, `POINTS_PER_COMPLETED_ROOM: 20`. Joining a room gives no points; finishing it does.

## 3.9 `mentorContext.ts` — the privacy boundary

One function, `buildMentorContext`, that produces the eleven fields of `MentorContext`. If a piece of data is not built here, the mentor does not receive it. It does not read `Profile`. It is the only file Book 1 cites as the mentor's data contract.
