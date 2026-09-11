/**
 * FARO Mentor service.
 *
 * The contract the UI depends on is `MentorService`. The prototype ships
 * `LocalMentorService` - deterministic, offline, no API key - so the flow can
 * be demoed and tested. `HttpMentorService` is the real path: POST /api/mentor
 * with nothing but a `MentorContext`, and the backend owns the model call,
 * the tools and the guardrails.
 *
 * Guardrail that holds in both: the mentor guides, it does not produce graded
 * work. Style changes the voice, never the rules.
 */
import type { MentorContext, MentorMessage, MentorStyle } from '@/types'

export interface MentorReply {
  text: string
  suggestions?: string[]
}

export interface MentorService {
  send(input: {
    message: string
    context: MentorContext
    history: MentorMessage[]
  }): Promise<MentorReply>
}

/* ------------------------------------------------------------- guardrails */

const DO_IT_FOR_ME =
  /\b(write|do|solve|answer|complete|submit|finish)\b.{0,30}\b(my|the)\b.{0,20}\b(quiz|exam|test|assignment|essay|homework|report|reflection)\b/i

const REFUSAL =
  'I will not write graded work for you - that is yours, and it is the part that actually teaches you. What I can do is break it into steps, check your reasoning, or explain the part that is stuck. Where do you want to start?'

/* ------------------------------------------------------------------ voice */

const openers: Record<MentorStyle, (c: MentorContext) => string> = {
  direct: () => '',
  encouraging: (c) => (c.momentum < 60 ? 'You came back, and that is the hard part. ' : 'Good - you are moving. '),
  detailed: () => '',
  friendly: () => 'Hey. ',
  challenge: () => 'Alright, let us push a little. ',
}

const closers: Record<MentorStyle, string> = {
  direct: '',
  encouraging: ' You are closer than it feels.',
  detailed: '',
  friendly: ' I am here if it gets messy.',
  challenge: ' Can you get it done before you close this tab?',
}

function voice(style: MentorStyle, ctx: MentorContext, body: string): string {
  return `${openers[style](ctx)}${body}${closers[style]}`.trim()
}

/* ------------------------------------------------------------ local mentor */

type Intent = 'next' | 'behind' | 'no_time' | 'explain' | 'unmotivated' | 'plan' | 'other'

function detectIntent(message: string): Intent {
  const m = message.toLowerCase()
  if (/\b(next|what should i do|where do i start|start)\b/.test(m)) return 'next'
  if (/\b(behind|catch up|missed|late|lost)\b/.test(m)) return 'behind'
  if (/\b(no time|busy|only \d+ ?min|10 minutes|short on time)\b/.test(m)) return 'no_time'
  if (/\b(explain|understand|confused|what is|how does|don'?t get)\b/.test(m)) return 'explain'
  if (/\b(motivat|tired|give up|quit|why bother|pointless)\b/.test(m)) return 'unmotivated'
  if (/\b(plan|schedule|organi[sz]e|week)\b/.test(m)) return 'plan'
  return 'other'
}

function destinationLine(c: MentorContext): string {
  return c.destination ? ` You said this course is how you get to: ${c.destination}.` : ''
}

export class LocalMentorService implements MentorService {
  async send({ message, context }: { message: string; context: MentorContext; history: MentorMessage[] }): Promise<MentorReply> {
    await new Promise((r) => setTimeout(r, 350))

    if (DO_IT_FOR_ME.test(message)) {
      return { text: REFUSAL, suggestions: ['Break it into steps', 'Explain the concept', 'Check my reasoning'] }
    }

    const next = context.next_activity
    const mins = context.estimated_time ?? context.available_time

    switch (detectIntent(message)) {
      case 'next':
        return {
          text: voice(
            context.style,
            context,
            next
              ? `Do this one thing: ${next}. About ${mins} minutes. Nothing else on the list matters until that is done.`
              : 'You are clear for now - nothing is waiting on you. Rest counts too.',
          ),
          suggestions: ['I only have 10 minutes', 'Help me focus', 'Why this one?'],
        }

      case 'behind':
        return {
          text: voice(
            context.style,
            context,
            `You are not starting over - you are at ${context.progress}% and that does not expire. We are not catching everything up today. Today is one small step: ${next ?? 'a short review'}, about ${Math.min(10, mins)} minutes. Then we recalculate the rest of the route.`,
          ),
          suggestions: ['Show me the recovery route', 'Start the comeback mission', 'I have less time than before'],
        }

      case 'no_time':
        return {
          text: voice(
            context.style,
            context,
            `Ten minutes is enough to stay in the course. Open ${next ?? 'the current module'}, read or do the first part only, and stop. Finishing is not the goal today - not breaking the thread is.`,
          ),
          suggestions: ['Start a 10-minute session', 'What can I skip?', 'Plan my week'],
        }

      case 'explain':
        return {
          text: voice(
            context.style,
            context,
            `Tell me the specific piece that is not landing - a term, a step, or a question you got wrong - and I will walk you through it with an example from ${context.course}. I will not hand you the answer to graded work, but I will make sure you can get there yourself.`,
          ),
          suggestions: ['Give me an example', 'Explain it simply', 'Quiz me on it'],
        }

      case 'unmotivated':
        return {
          text: voice(
            context.style,
            context,
            `That is allowed, and it is not a sign you should stop.${destinationLine(context)} You do not have to feel motivated to do ten minutes. Pick the smallest thing - ${next ?? 'one short review'} - and let momentum come after the action, not before it.`,
          ),
          suggestions: ['Give me a 10-minute mission', 'I need a break', 'Remind me why I started'],
        }

      case 'plan':
        return {
          text: voice(
            context.style,
            context,
            `With about ${context.available_time} minutes on a normal day: two short sessions this week beats one long one you never schedule. Session one: ${next ?? 'the current step'}. Session two: review what you just did for ten minutes. That is the whole plan - small enough that life cannot break it.`,
          ),
          suggestions: ['Show my journey', 'Make it smaller', 'What if I miss a day?'],
        }

      default:
        return {
          text: voice(
            context.style,
            context,
            `I am here for ${context.course}. I can point you at the next step, explain something that is not clicking, help you plan around a short week, or build a way back if you have been away.`,
          ),
          suggestions: ['What should I do next?', 'I am behind', 'Explain something'],
        }
    }
  }
}

/** Real implementation, for when the FARO backend exists. */
export class HttpMentorService implements MentorService {
  constructor(private baseUrl: string) {}

  async send(input: { message: string; context: MentorContext; history: MentorMessage[] }): Promise<MentorReply> {
    const res = await fetch(`${this.baseUrl}/api/mentor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Only the message and the bounded context leave the client.
      body: JSON.stringify({ message: input.message, context: input.context }),
    })
    if (!res.ok) throw new Error(`Mentor request failed: ${res.status}`)
    return (await res.json()) as MentorReply
  }
}

export const mentorService: MentorService = new LocalMentorService()
