# 5. Data minimisation and retention

FARO's guiding principle for data is simple: **collect a piece of data not because it is technically possible, but because a specific feature needs it**. This chapter shows how that applies in each layer, and what happens to data over time.

## 5.1 Minimisation in the Canvas layer

Canvas returns far more than FARO uses. The integration layer discards what it does not need **at the moment of reading it**, not afterwards.

| What Canvas sends | What FARO keeps | What is discarded |
|---|---|---|
| Course object (dozens of fields) | id, name, code, start and end dates | Everything else: settings, permissions, image, etc. |
| Modules with items | id, name, position, state, item count, each item's `content_id` and whether it is completed | Page titles, external URLs, files |
| Assignments with submission | id, name, due date, points possible, and from the submission: date, state, score | Assignment description, rubric, attachments, instructor comments |
| Student activity | **Timestamps only.** The number of views per hour is removed. | View counts, visited URLs |
| `users/self` | The numeric id | Name, avatar, email, time zone |

**[code]** `src/data/canvas/raw.ts` declares only the fields that are read; `src/data/canvas/client.ts` does the mapping; `server/src/routes/launch.ts` keeps only `self.data.id`.

**Why the activity case matters:** "how many pages they viewed at 3 pm" is surveillance data. "When they last came in" is the only thing the friction engine needs. FARO keeps the second and destroys the first.

## 5.2 Minimisation in the AI mentor

The context the model receives is built in a single function and contains exactly these eleven fields:

```json
{
  "course": "Gestión de Proyectos",
  "progress": 44,
  "next_activity": "Caso de estudio: alcance",
  "estimated_time": 25,
  "student_goal": "career_growth",
  "destination": "Liderar mis propios proyectos",
  "available_time": 20,
  "momentum": 62,
  "friction_state": "FRICTION",
  "style": "encouraging",
  "language": "es"
}
```

No name, email, Canvas id, grades, history of other conversations or dropout-risk classification. The friction state is one of five intervention labels (`FLOWING`, `FRICTION`, `POSSIBLE_OVERWHELM`, `DISCONNECTION`, `RECOVERY`), not a score.

The only human-authored information is the **destination sentence**, which the student writes freely at onboarding. The example shown is *"Lead my own projects instead of just executing them"*, steering towards a goal, not personal data. In production this sentence must carry an explicit warning: *"do not include anything that identifies you"*. **[pending]**

**[code]** `src/lib/mentorContext.ts`, `src/types/index.ts` (`MentorContext` interface).

## 5.3 Minimisation in Community

Community is the part of FARO with the greatest temptation to collect social data, which is why it has the strictest rules, written into the types:

- **There is no follower field and no rank.** They are not hidden: they are not in the data model, so no function can compute them.
- **Presence is aggregate.** "23 students studying now" is a count. "Andrea has been at it for 37 minutes" never appears, and the `CoursePresence` type only admits numbers.
- **Classmates have no photo.** Only initials and a decorative colour. Only the student themselves can add an image to their avatar, downsized in their browser before being saved.
- **Reactions are shown separately**, never summed into a score.

**[code]** `src/types/index.ts`, comments on `CommunityAuthor` and `CoursePresence`.

## 5.4 Retention

| Data | Where | How long | How it is deleted |
|---|---|---|---|
| Course snapshot (from Canvas) | Browser memory | While FARO is open | Closing the tab or panel |
| Canvas request log | Browser memory, 30 entries | While FARO is open | Automatic; never persisted or sent |
| Purpose, preferences, sessions, profile | `chrome.storage.local` | Until the student deletes it | *Reset* button in Progress, or uninstalling the extension |
| Canvas token | `server/.env` + backend memory | Until rotation or revocation | Edit `.env` and restart; revoke in Canvas |
| Launch cache (course id, user id) | Backend memory | Until the process restarts | Restart |
| Backend logs | Standard output | Defined by the operator | Defined by the operator; they contain no personal data or query strings |

**Production [pending]:** once PostgreSQL exists, the proposal is:

- Study sessions, purpose and preferences: while the enrolment is active, plus 90 days to allow "returning" to a paused course; then automatic deletion.
- Mentor conversations: not stored beyond the session unless explicit consent is given to improve the product, in which case they are anonymised.
- Friction events and interventions: aggregated for pilot metrics, with the student id replaced by a pseudonymous id that only the institution can resolve.

## 5.5 What the student can see and control

- **Profile → Canvas** shows, live, every call FARO makes, with its path, status and latency. Transparency is not a document: it is a screen.
- **Profile → Canvas** shows the LTI scopes FARO refuses.
- **FARO Mentor** shows, at the bottom, the exact list of what the mentor knows and does not know.
- **Progress → Reset** wipes all of FARO's local state.
- Nothing in the profile is mandatory. FARO works fully without a name or photo.
