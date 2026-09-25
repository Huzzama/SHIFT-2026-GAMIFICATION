# 6. FARO Mentor

The **FARO** tab. A chat, but not a generic chatbot: it only knows about your course and is built to guide you, not to do the work for you. It asks more than it tells, speaks calmly and does not cheerlead.

## Who is answering

The bottom of the screen always says which of the two mentors is answering you. FARO checks every time you open the Mentor: it asks FARO's server whether it has Gemini configured (sending nothing about you).

- **Local mentor** — *"Local mentor: no AI model, nothing leaves your device."* It answers in your browser, with fixed rules. It is the one that answers if FARO's server is unavailable or has no Gemini, or if your institution kept it that way.
- **Gemini** — *"Answers by Gemini, through FARO's server. It sees your course progress and your goal — never who you are."* Only if FARO's server has Gemini configured. Messages written by Gemini carry a **violet ring** on FARO's avatar.

If Gemini cannot answer at that moment, the local mentor answers and says so at the end of the message: *"Gemini could not answer just now, so the local mentor did."* You are never left without a reply.

## How it opens

**If something changed** (your journey needs attention or you have been away 3 days or more), FARO starts by asking, not by showing what is pending:

> *"I noticed something changed. Your last step was N days ago — that is okay, your progress is saved. Want to figure it out together? What happened?"*

Below it, the six *Life happened* options. Each one leads somewhere different:

| You pick | FARO answers |
|---|---|
| **I have less time** | A 10-minute Focus session, with its steps. |
| **I'm overwhelmed** | One thing only: the shortest step, with **Not today** one tap away. |
| **I don't understand the material** | Opens **Teach me**. |
| **I lost my routine** | **Way back**: the 3 review cards and one step of 10 minutes or less. |
| **I need a break** | *"Take your time. Your progress is saved and nothing expires while you rest. I will be here when you are ready."* And it turns the pause on. |
| **I'm ready to continue** | Your next step, with a button to start it. |

**If you are on track**, it opens by quoting your destination and your progress — *"Your destination: “…”. You are N% of the way. What do you need today?"* — with the four modes as buttons.

These moments (the check-in, the minutes, the steps, the points) are computed from your real data, on your device. **A model never makes them up.**

## The four modes

At the top, in a bar:

- **Focus** — asks how much time you have (**5 / 10 / 15 / 30 min**) and builds a session that fits, with the same rule as *How much time do you have?* on Home: review first if you are coming back, then steps in route order.
- **Way back** — no backlog: the three review questions from one module (about 3 minutes) and one step of 10 minutes or less. If there are no cards today, just the step.
- **Teach me** — explains a topic and checks that it clicked (see below).
- **Plan my weekend** — asks how much time you have on **Saturday** and then **Sunday** (*Not that day*, 30, 45, 60 or 90 min) and proposes a plan smaller than your time, on purpose. **Keep this plan** puts it on Home, in the *Your plan* card; **Change it** asks again.

## Teach me

The loop is always the same: **brief explanation → one question → your answer → FARO adapts.**

**Without Gemini**, the lessons come from the demo course's review bank, per module (modules you have already worked on first). You pick a topic and FARO:

1. Explains it briefly and asks a question with options.
2. **If you are right:** a second, slightly different question, or, if there are no more, it suggests applying it to your next step.
3. **If you are wrong:** it repeats the key idea and asks again, **without the option you already tried**. There is no way to lose, and no points are at stake.

For other courses there are no short lessons yet; FARO says so and asks for the exact term or step that is not landing.

**With Gemini**, you write the topic in your own words (or tap a suggested one) and Gemini follows the same loop: it explains in at most three sentences, with an everyday example, asks exactly one question, evaluates your answer and adapts.

## Questions about your points

If you ask about points, rewards or TecmiRewards, the answer comes from the Impact rules, not from a model:

> *"You are X points away from your next TecmiRewards milestone ($200 MXN). If you like, I can show you a realistic way to get there."*

If you tap **Show me a realistic way**:

> *"Finishing the next N steps (that closes M modules) gets you there — about K minutes in total, on the days you choose. No rush."*

Only guaranteed points count (activities and modules), never bonuses you might not earn. It never tells you to "study now".

## Typing freely

You can also type whatever you want. With the local mentor, it understands questions about: what to do now, being behind, having little time, not understanding something, not feeling like it, and planning. When you do not feel like it, it reminds you of your own destination: *"When you set your destination you wrote: “…”. Let us do just ten minutes…"*. With Gemini, the conversation is open, under the same rules.

Below many replies there are **follow-up chips**: tapping them sends that question without typing it.

## The voice

A small menu, **Voice**: **Direct**, **Encouraging**, **Detailed**, **Friendly**, **Challenge me**.

It changes how it talks to you, never what it can do. "Challenge me" will not give you answers that "Encouraging" refuses; it just sounds different. The academic and safety rules are the same across all five voices.

## What it knows about you — exactly

This is the complete list of the context, and it is built in a single file of the code:

- The course name
- Your progress percentage
- Your next activity and how long it takes
- Your goal and your destination sentence
- The minutes you said you have
- Your momentum and your internal friction state
- The voice and language you chose

**With Gemini**, alongside that context go your message and the last 8 turns of this conversation, always through FARO's server, never directly from your browser. The server filters the context again and does not store the conversation.

**What it never receives:** your name, your email, your photo, your bio, your Canvas identifiers, your grades, your conversations from other sessions. If a piece of data is not built in that file, the mentor never sees it. It is not a written policy: it is the only way it can receive data.

The conversation lives only in FARO's memory while you use it.

## What it will not do

If you ask it to solve graded work, it refuses — and offers to break it into steps, explain the concept or review your reasoning. That refusal is the same across the five voices, and with Gemini the server gives it without even asking the model.

It also does not label you ("at risk", "falling behind"), does not count your overdue work and does not promise extensions or grades: those belong to your institution.

At the bottom of the screen is the note that says so without small print.
