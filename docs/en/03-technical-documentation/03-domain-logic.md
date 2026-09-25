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

`pointsConfig` (semester scale):

| Constant | Value |
|---|---|
| `POINTS_PER_ACTIVITY` | 50 per completed activity on the route (submitted in Canvas or finished in FARO) |
| `POINTS_PER_MODULE` | 250 per module with all its activities completed |
| `STREAK_BONUS` | 25 (every 3 consecutive days, `rhythmMilestoneEvery = 3`) |
| `COMEBACK_BONUS` | 125 (once, if there is at least one FARO session and `awayGap ≥ frictionDays`) |
| `REVIEW_SET_BONUS` | 75 per finished set of review cards |

`computePoints` also returns `thisWeek`: what was earned in the last 7 days through actions taken in FARO (sessions, cards, and the comeback bonus if one of them earned it).

`learningRhythm(sessions)` counts consecutive days with a session, ending today, and only feeds the rhythm bonus: a day without a session makes it stop adding; it never subtracts. What the student sees is not that count but the `weekRhythm` week (3.13).

## 3.5b `rewards.ts` — the semester reward

`rewardsConfig = { SEMESTER_GOAL: 10_000, SEMESTER_CAP_MXN: 200 }` and three tiers on a single track:

| Tier | Points |
|---|---|
| $50 MXN | 2,500 |
| $100 MXN | 5,000 |
| $200 MXN | 10,000 |

- `semesterStatus({ currentCourse, previousCourses, redemption })` → total, percentage (capped at 100), tier reached, next tier and points to go.
- Tiers **unlock, they are not bought**: reaching one deducts nothing.
- `canRedeem(tier, status)` — the tier is reached and nothing was redeemed this semester. **One redemption per semester**: redeeming closes the reward at that tier.
- `remainingCoursePoints(journey)` — the minimum finishing the current course is worth (remaining activities + modules; bonuses come on top).

The semester's previous courses live in `data/rewards.mock.ts` (simulated, labelled on screen). Demo calibration: 7,700 from previous courses + 850 from the current course = 8,550 (85%); finishing the remaining activities and modules (1,450) reaches exactly 10,000.

## 3.5c `reviewCards.ts` — reconnection cards

- `touchedModules(journey)` — modules with at least one completed activity, most recent first.
- `pickReviewSet(journey, bank)` — 3 questions: up to 2 from the most recent module, then the one before. Deterministic. Returns `[]` when there are not enough (the offer is hidden; questions are never invented).
- `shouldOfferReview({ awayGap, frictionDays, questions, records })` — offered if `awayGap ≥ 3`, there are 3 questions and no set was completed today.
- `reviewedToday(records)` — one rewarded set per day.

The bank (`data/reviewBank.ts`) is bilingual and tied to the demo course (`REVIEW_BANK_COURSE_ID`): a real course with no bank gets no cards. In production, the bank is written by the instructor or generated by the backend from the module's pages; **a student token cannot read Canvas quiz questions**, and a reconnection card must never be confused with a graded quiz.

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

**`communityPointsConfig`**: `POINTS_PER_HELPFUL_MARK: 25`, `POINTS_PER_COMPLETED_ROOM: 100`. Joining a room gives no points; finishing it does.

## 3.9 `mentorContext.ts` — the privacy boundary

One function, `buildMentorContext`, that produces the eleven fields of `MentorContext`. If a piece of data is not built here, the mentor does not receive it. It does not read `Profile`. It is the only file Book 1 cites as the mentor's data contract. When Gemini answers, the backend applies the same contract again (`sanitizeMentorRequest`, chapter 5): the extension is not the only barrier.

## 3.10 `timeSession.ts` — "how much time do you have?"

Turns a number of minutes into a session. Used by Home's picker (5 / 10 / 20 / 30+), the Mentor's Focus mode (5 / 10 / 15 / 30) and the weekend plan, so the three always agree.

`sessionRules = { REVIEW_MINUTES: 3, OPEN_ENDED_MINUTES: 45 }` — the review counts as 3 minutes; the "30+" option plans 45.

**`openSteps(journey)`** — open activities in the order FARO would do them: `missed` first, then `current` and `upcoming` in route order. `locked` ones are left out.

**`buildTimeSession(journey, minutes, { reviewAvailable })`**:

```text
reviewAvailable and minutes ≥ 3             → first { review, 3 min }
for each step of openSteps, in order:
  fits in what is left                      → added
  does not fit                              → stop (never skips to a shorter later one)
no step added and ≥ 5 min left              → { partial: "the first N min" of the first step }
```

It never skips ahead: a module's quiz does not come before the exercise it checks. `sessionMinutes(items)` adds the session up. Minutes are FARO's estimates; the UI says "about".

**`planDays(journey, days)`** — e.g. Saturday 60 and Sunday 45. Steps go in route order and are never repeated across days; a day stops at the first step that does not fit, so the plan stays smaller than the time, on purpose. A step longer than an empty day's whole budget still takes that day rather than disappearing. A day with 0 minutes stays empty. The result is a `DayPlan[]`; if the student accepts it, it is saved as a `WeekPlan` with `setWeekPlan` (storage key `weekPlan`) and shows on Home.

## 3.11 `rewardPath.ts` — the realistic path to the next milestone

**`pathToPoints(journey, gap)`** answers "what do I need for the next TecmiRewards milestone?" with the same numbers as Impact, never with a model's.

- Walks everything not completed in route order, `missed` first. **Locked steps are included**: they open as the route advances, and leaving them out would understate the course.
- Each step adds `POINTS_PER_ACTIVITY` (50); if it is its module's last open step, it also adds `POINTS_PER_MODULE` (250).
- Stops when the points cover `gap`.
- Returns `{ steps, modules, points, minutes, reachable }`. `reachable: false` when finishing everything left in the course still falls short; the Mentor says so, without dressing it up.

**Only guaranteed points count.** Rhythm, comeback and review-card bonuses would shorten the path, but promising them would be a nudge dressed up as a fact.

## 3.12 `teach.ts` — Teach me without a model

The loop: **explain briefly → one question → answer → adapt.** The review bank (`data/reviewBank.ts`) already holds, per module, a question, its options and a short explanation: a micro-lesson.

- **`teachTopics(journey, bank, moduleNames)`** — modules with questions; the ones the student has touched (`touchedModules`) first, then the rest in course order.
- **`lessonQuestions(bank, moduleId)`** — the module's questions, in order.
- **`answerTeach(bank, state, option)`** with `TeachState = { moduleId, index, tried }`:

```text
right option → { right, next: the module's next question | null }
wrong option → { wrong, question, remaining: options without those already tried }
```

With `next`, the Mentor asks the second, slightly different question; with `null`, it suggests applying it to the next step. With `wrong`, it repeats the key idea (`explain`) and asks again without the option already tried. No points are at stake.

Lessons exist only for the bank's course (`REVIEW_BANK_COURSE_ID`). When Gemini is available, open topics go to the backend with `mode: 'teach'` (the prompt's TEACH MODE, chapter 5).

## 3.13 `rhythm.ts` — the rhythm week

**`weekRhythm(sessions, activity, now)`** — the current week, Monday to Sunday, as seven `RhythmDay { weekday (0 = Monday), date, active, today, future }`. A day is `active` if FARO recorded a session **or** Canvas recorded course activity that day. Days after today are `future`, not "missed".

**`activeDays(week)`** — how many active days the week has.

The store exposes `week` (derived from the sessions and `snapshot.activity`). It feeds Home's rhythm tile (*"N/7 · active days this week"*), Progress's *Your rhythm* card and Impact's *"Studied N days this week"* line.

**Product rule:** flexible consistency. For someone who works, five days out of seven is a great week, and a gap on Wednesday breaks nothing. There is no streak to lose.
