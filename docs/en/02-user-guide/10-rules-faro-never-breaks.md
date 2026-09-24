# 10. Rules FARO never breaks

These are not design preferences. They are limits written in the code, and any new feature has to respect them.

**1. There is no Game Over.** No system state kicks you out of the course, locks content for inactivity or erases progress. The worst possible scenario is *"recalculating your route"*.

**2. Progress is not lost.** Not for missing a day, not for missing three weeks. A day without study breaks nothing: the rhythm bonus stops *adding*; it never *subtracts*.

**3. We never show you a risk score.** Internally the system computes friction states to decide how to help you. You will never see "dropout risk: 87%". You will see "your route needs attention" and a concrete action.

**4. When you come back, we do not greet you with the debt.** Never "you have 14 overdue activities". First "welcome back, your progress is still here", then a route.

**5. FARO does not do your graded work.** The Mentor explains, gives hints, organises and accompanies. If you ask it to solve an exam or write your submission, it refuses and offers help so you can do it yourself.

**6. The Mentor sees only eleven fields.** Course, progress, next activity, estimated time, your declared goal, your destination in your words, available time, momentum, friction state, style and language. If your institution turned on Gemini, also your message and the last 8 turns of the conversation, through FARO's server. It does not see your name, your email, your grades, your photo or your full history. The screen always says who is answering.

**7. FARO does not write to Canvas.** The permission to submit grades exists in the LTI standard and we explicitly refuse it. Canvas is the academic source of truth; FARO only reads.

**8. FARO does not change dates or academic rules.** It can reorganise *your personal* study plan. The course deadlines are set by the institution and only it can move them.

**9. If you are not going to make it, we tell you.** The verdict "not realistic" exists on purpose. FARO would rather offer you the best possible scenario and a conversation with your instructor than promise something it cannot sustain.

**10. There are no leaderboards.** Community shows aggregate presence ("23 studying now"), never "Andrea has been at it for 37 minutes". The feed orders by usefulness for learning, not by reactions: a request for help weighs more than an achievement.

**11. No badge spam.** Five resilience achievements and five community recognitions. All require having persisted through something. None is earned by clicking.

**12. FARO must not become another burden.** If a feature makes the product heavier, slower, more confusing or more invasive without improving persistence, it is not implemented.

> **Hard to quit. Easy to return.**
> **No Game Over. Recalculate your route.**
