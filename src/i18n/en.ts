import type { Dict } from './es'

/** English copy, typed against the Spanish dictionary so no key can go missing. */
export const en: Dict = {
  shell: {
    tagline: 'Focus. Advance. Reward. Own.',
    promise: 'Hard to quit. Easy to return.',
    noGameOver: 'No Game Over. Recalculate your route.',
    loading: 'Finding your position…',
    nav: { home: 'Home', journey: 'Journey', mentor: 'FARO', rewards: 'Rewards', progress: 'Progress' },
    back: { recovery: 'Recovery', purpose: 'Your purpose' },
    momentum: 'momentum',
    momentumTitle: 'Your connection to the course',
    language: 'Language',
    theme: { light: 'Light', dark: 'Dark', system: 'Automatic' },
    themeTitle: 'Appearance',
  },

  pillars: {
    focus: { title: 'Focus', body: 'Set your destination and the time you really have.' },
    advance: { title: 'Advance', body: 'One next step. Never the whole list.' },
    reward: { title: 'Reward', body: 'Achievements for persisting, not for clicking.' },
    own: { title: 'Own', body: 'Talk to FARO and take control of your week.' },
  },

  home: {
    greeting: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
    heroSub: 'Every step counts. Here is your progress for today.',
    yourRoute: 'Your learning route',
    ofRoute: 'of the route',
    myCourses: 'My courses',
    courseProgress: 'Course progress',
    momentumCard: { label: 'Current momentum', strong: 'Strong momentum', building: 'Rebuilding momentum', low: 'Your progress is safe' },
    rhythmCard: {
      label: 'Learning rhythm',
      active: (n: number) => `${n} day${n === 1 ? '' : 's'} in a row`,
      waiting: 'Your rhythm is waiting for you',
    },
    achievementsCard: { label: 'You have', earned: (n: number) => `${n} ${n === 1 ? 'achievement' : 'achievements'}`, sub: 'for resilience' },
    mentorCard: { label: 'FARO Mentor', title: 'Ask FARO', sub: 'Guidance, not ready-made answers' },
    welcomeBack: { title: 'Welcome back.', body: 'Your progress is still here. Let us find a way back in that fits your week — no catching up required.', cta: 'Recalculate my route' },
    attention: { body: 'If something got in the way this week, tell FARO and the plan changes.', cta: 'Life happened' },
    nba: {
      eyebrow: 'Next best action',
      meta: (min: number, have: number) => `About ${min} minutes · you told us you have ${have}.`,
      start: 'Start this step',
      ask: 'Ask FARO',
      empty: 'Nothing is waiting for you right now. You have reached the end of the route.',
    },
    visit: {
      eyebrow: 'This visit',
      none: 'Nothing completed yet — one step is enough.',
      some: (n: number) => `${n} step${n === 1 ? '' : 's'} completed. That is how momentum comes back.`,
      seeRoute: 'See the route',
      lifeHappened: 'Life happened',
    },
    effort: { title: 'Your effort brings you closer', body: 'Keep going: the future you want is built online too.', bodyWithDest: (d: string) => `Keep going. Every session brings you closer to: ${d}` },
    harbor: {
      label: 'Safe harbor',
      title: 'You are on a planned pause.',
      body: 'Your progress is exactly where you left it. Nothing is expiring inside FARO, and there is no streak to lose. Come back when you are ready and the route will be waiting.',
      cta: "I'm ready to continue",
    },
  },

  journey: {
    loading: 'Loading your route…',
    recalc: { title: 'Recalculating your route…', body: 'Nothing is lost — the route below is reordered around where you actually are.' },
    eyebrow: 'Your journey',
    headingToward: 'Heading toward:',
    wayBack: { eyebrow: 'Your way back', body: 'You do not need to catch everything up. Three small sessions.' },
    theRoute: 'The route',
    when: { today: 'Today', tomorrow: 'Tomorrow', next_session: 'Next session' },
    stop: { done: 'Done', locked: 'Opens later', here: 'You are here', checkpoint: 'checkpoint', min: 'min' },
    due: {
      today: 'due today',
      in: (d: number) => `due in ${d} day${d === 1 ? '' : 's'}`,
      ago: (d: number) => `was due ${d} day${d === 1 ? '' : 's'} ago`,
    },
    nbaReason: {
      missed: 'This one reopens the route. Everything after it gets easier.',
      fits: 'It fits the time you have today and keeps your journey moving.',
      shortest: 'It is the shortest step available — start it and pause whenever you need.',
    },
    reconnect: 'Reconnect:',
  },

  mentor: {
    preparing: 'Getting your context ready…',
    styles: { direct: 'Direct', encouraging: 'Encouraging', detailed: 'Detailed', friendly: 'Friendly', challenge: 'Challenge me' },
    thinking: 'FARO is thinking…',
    placeholder: 'Ask FARO anything about this course…',
    send: 'Send',
    note: 'FARO guides your learning. It will not write graded work for you, and it only sees your course progress and the goal you set — never your personal data.',
    openAway: (p: number, c: string) => `Welcome back. Your progress is still here — ${p}% of ${c}, exactly where you left it. We are not catching everything up today. Want a ten-minute way back in?`,
    openFlow: (h: string, p: number, c: string) => `${h} You are at ${p}% of ${c}. What do you need?`,
    openAwaySuggest: ['Give me a 10-minute mission', 'I am behind', 'Plan my week'],
    openFlowSuggest: ['What should I do next?', 'Explain something', 'Plan my week'],
    error: 'I could not reach my side of things just now. Your progress is safe — try again in a moment.',
    refusal: 'I will not write graded work for you — that is yours, and it is the part that actually teaches you. What I can do is break it into steps, check your reasoning, or explain the part that is stuck. Where do you want to start?',
    refusalSuggest: ['Break it into steps', 'Explain the concept', 'Check my reasoning'],
    voice: {
      openers: {
        direct: () => '',
        encouraging: (low: boolean) => (low ? 'You came back, and that is the hard part. ' : 'Good — you are moving. '),
        detailed: () => '',
        friendly: () => 'Hey. ',
        challenge: () => 'Alright, let us push a little. ',
      },
      closers: {
        direct: '',
        encouraging: ' You are closer than it feels.',
        detailed: '',
        friendly: ' I am here if it gets messy.',
        challenge: ' Can you get it done before you close this tab?',
      },
    },
    replies: {
      next: (next: string | null, mins: number) =>
        next
          ? `Do this one thing: ${next}. About ${mins} minutes. Nothing else on the list matters until that is done.`
          : 'You are clear for now — nothing is waiting on you. Rest counts too.',
      nextSuggest: ['I only have 10 minutes', 'Help me focus', 'Why this one?'],
      behind: (progress: number, next: string | null, mins: number) =>
        `You are not starting over — you are at ${progress}% and that does not expire. We are not catching everything up today. Today is one small step: ${next ?? 'a short review'}, about ${mins} minutes. Then we recalculate the rest of the route.`,
      behindSuggest: ['Show me the recovery route', 'Start the comeback mission', 'I have less time than before'],
      noTime: (next: string | null) =>
        `Ten minutes is enough to stay in the course. Open ${next ?? 'the current module'}, read or do the first part only, and stop. Finishing is not the goal today — not breaking the thread is.`,
      noTimeSuggest: ['Start a 10-minute session', 'What can I skip?', 'Plan my week'],
      explain: (course: string) =>
        `Tell me the specific piece that is not landing — a term, a step, or a question you got wrong — and I will walk you through it with an example from ${course}. I will not hand you the answer to graded work, but I will make sure you can get there yourself.`,
      explainSuggest: ['Give me an example', 'Explain it simply', 'Quiz me on it'],
      unmotivated: (dest: string, next: string | null) =>
        `That is allowed, and it is not a sign you should stop.${dest ? ` You said this course is how you get to: ${dest}.` : ''} You do not have to feel motivated to do ten minutes. Pick the smallest thing — ${next ?? 'one short review'} — and let momentum come after the action, not before it.`,
      unmotivatedSuggest: ['Give me a 10-minute mission', 'I need a break', 'Remind me why I started'],
      plan: (available: number, next: string | null) =>
        `With about ${available} minutes on a normal day: two short sessions this week beats one long one you never schedule. Session one: ${next ?? 'the current step'}. Session two: review what you just did for ten minutes. That is the whole plan — small enough that life cannot break it.`,
      planSuggest: ['Show my journey', 'Make it smaller', 'What if I miss a day?'],
      other: (course: string) =>
        `I am here for ${course}. I can point you at the next step, explain something that is not clicking, help you plan around a short week, or build a way back if you have been away.`,
      otherSuggest: ['What should I do next?', 'I am behind', 'Explain something'],
    },
  },

  progress: {
    loading: 'Loading…',
    course: 'Course progress',
    ofRoute: 'of the route',
    modulesDone: 'modules done',
    momentum: 'momentum',
    modules: 'Modules',
    resilience: { eyebrow: 'Resilience', of: (a: number, b: number) => `${a} of ${b}`, body: 'These are not for finishing work on time. They are for continuing when it would have been easier to stop.' },
    sessions: { eyebrow: 'Study sessions in FARO', none: 'Nothing recorded yet. FARO counts the sessions you do from here, so this fills up as you go — starting with one step.', count: 'sessions', time: 'time invested' },
    destination: { label: 'Your destination', body: 'Every session above is a step toward this, including the ones that came after a gap. Tap to change where you are heading.' },
    fullRoute: 'See the full route',
  },

  recovery: {
    loading: 'Loading…',
    eyebrow: 'Life happened',
    body: 'Nothing you have done is lost, and there is nothing to make up before you can start again. Tell FARO what got in the way and the plan changes to match.',
    sizedTo: (m: number) => `Sessions sized to ${m} minutes from here on.`,
    mission: {
      flag: 'Comeback mission available',
      body: (m: number) => `You do not need to catch up today. Spend about ${m} minutes reconnecting with your course. That is the whole mission.`,
      start: 'Start the mission',
      doneFlag: 'Mission complete',
      doneTitle: 'You broke the inertia.',
      doneBody: (title: string, momentum: number) => `“${title}” is done, your momentum is back up to ${momentum}%, and the route has been recalculated around where you actually are.`,
      seeNext: 'See what is next',
    },
    wayBack: { eyebrow: 'Your way back', body: (m: number) => `Three small sessions, sized to the ${m} minutes you have. Not a backlog.` },
    note: 'FARO changes what it asks of you, never what your course requires. Deadlines, grades and extensions stay with your institution.',

    plan: {
      analyzing: 'Reviewing your progress…',
      recalculating: 'Recalculating your route…',
      welcome: {
        title: 'Welcome back',
        sub: 'Your progress is still here. FARO recalculated your route.',
        away: (d: number) => `You've been away for ${d} ${d === 1 ? 'day' : 'days'}.`,
      },
      situation: {
        eyebrow: 'Your current situation',
        days: (d: number) => `${d} ${d === 1 ? 'day' : 'days'}`,
        daysLabel: 'left in the period',
        workLabel: 'of remaining work',
        modules: (n: number) => `${n} ${n === 1 ? 'module' : 'modules'}`,
        modulesLabel: 'still to finish',
      },
      feasibility: {
        eyebrow: 'Feasibility',
        comfortable: {
          title: 'You can still finish',
          body: (min: number) => `Your course still fits inside the evaluation period at about ${min} min a day.`,
        },
        tight: {
          title: 'You can finish by raising the pace a little',
          body: (min: number, cap: number) => `Finishing everything asks for about ${min} min a day, above the ${cap} min you usually sustain. Reachable, but tight.`,
        },
        not_realistic: {
          title: 'Your original route is no longer realistic',
          body: (min: number) => `Completing everything that is left would take about ${min} min a day until the deadline. FARO is not going to tell you that will happen on its own.`,
        },
        unknown: {
          title: 'FARO needs more information',
          body: 'There is no deadline or enough history yet to build a reliable recovery route. We are not going to invent the numbers.',
        },
        required: (m: number) => `${m} min/day needed`,
        yours: (m: number) => `${m} min/day you sustain`,
        alternatives: {
          title: 'What can still be done',
          mandatory: 'Prioritise mandatory activities only',
          impact: 'Focus on what weighs most for completing the course',
          mentor: 'Talk to FARO Mentor about your options',
          realistic: 'Build a shorter, realistic plan',
        },
      },
      whatHappened: {
        eyebrow: 'What happened?',
        body: 'Optional. It shapes the plan — it is not used to judge you.',
      },
      time: {
        eyebrow: 'How much time do you have?',
        body: 'FARO plans around this. Be honest before ambitious.',
        perDay: (m: number) => `${m} min/day`,
        hour: '1 hour/day',
        varies: 'It changes every day',
        flexible: {
          title: 'Flexible route',
          min: (m: number) => `Minimum goal: ${m} min`,
          rec: (m: number) => `Recommended: ${m} min`,
          extra: 'Extra time: optional',
        },
      },
      strategies: {
        eyebrow: 'Route options',
        comfortable: 'Comfortable',
        balanced: 'Balanced',
        intensive: 'Intensive',
        body: (days: number, buffer: number) =>
          buffer > 0
            ? `Finish in ${days} ${days === 1 ? 'day' : 'days'}, with ${buffer} to spare before the deadline.`
            : `Finish right at the deadline, in ${days} ${days === 1 ? 'day' : 'days'}.`,
        notFeasible: (days: number) => `Would need ${days} days: that does not fit before the deadline.`,
        suggested: 'Suggested for you',
        suggestedWhy: (m: number) => `It is the closest to the ${m} min/day you already sustain.`,
      },
      route: {
        eyebrow: 'Your new route',
        today: 'Today',
        tomorrow: 'Tomorrow',
        day: (n: number) => `Day ${n}`,
        checkpoint: (name: string) => `Checkpoint · ${name}`,
        showAll: (n: number) => `See all ${n} days`,
        showLess: 'See less',
        overflow: (n: number) =>
          `${n} ${n === 1 ? 'activity falls' : 'activities fall'} outside the period at this pace. FARO does not hide them: raise your daily time or review them with the Mentor.`,
        updated: {
          title: 'Your route has been updated',
          body: (m: number) => `Your plan now uses ${m}-minute sessions.`,
        },
      },
      why: {
        title: 'Why FARO changed your route',
        days: (d: number) => `${d} days remaining until the deadline`,
        rhythm: (m: number) => `Your previous rhythm: ~${m} min/day`,
        pending: (n: number) => `${n} activities still pending`,
        duration: 'Estimated duration of each activity',
        deadlines: 'Course deadlines',
        note: 'Deterministic, checkable against the numbers above. FARO does not guess them.',
      },
      oneThing: {
        eyebrow: "Today's one thing",
        meta: (m: number) => `${m} minutes`,
        why: 'This is the most useful next step for your new route.',
        longer: (m: number) => `It is longer than your ${m} min sessions. Start it and pause whenever you need — moving counts, finishing it today does not.`,
        start: 'Start',
        none: 'Nothing left to schedule. You have reached the end of the route.',
      },
      done: {
        flag: 'Step complete',
        title: "Nice. You're back on route.",
        body: (title: string, momentum: number) =>
          `“${title}” is done and your momentum is back to ${momentum}%. Home, Journey and Progress already reflect the new plan.`,
        journey: 'Continue in Journey',
        home: 'Back to home',
      },
      recalcBtn: 'Recalculate route',
    },
    states: {
      less_time: 'I have less time',
      overwhelmed: "I'm overwhelmed",
      dont_understand: "I don't understand the material",
      lost_routine: 'I lost my routine',
      need_break: 'I need a break',
      ready: "I'm ready to continue",
    },
    interventions: {
      less_time: { headline: 'Then we make the sessions smaller.', body: 'Ten minutes still moves the route forward. FARO will size every next step to the time you actually have, not the time a syllabus assumed.', cta: 'Use 10-minute sessions' },
      overwhelmed: { headline: 'One thing. Not the list.', body: 'When everything feels due at once, the problem is usually the deciding, not the doing. FARO will hide the pile and show you a single step until this passes.', cta: 'Show me one step only' },
      dont_understand: { headline: 'Let us take the concept apart.', body: 'Not understanding something is information, not failure. FARO can explain it another way, give you a hint, or break it into smaller pieces.', cta: 'Ask FARO to explain' },
      lost_routine: { headline: 'Routines are rebuilt, not remembered.', body: 'You do not need to catch up today. One short session breaks the inertia, and the rhythm follows from there.', cta: 'Start a comeback mission' },
      need_break: { headline: 'Then take one, properly.', body: 'A planned pause is not the same as disappearing. Your progress stays exactly where it is, and FARO will be here with a route when you come back.', cta: 'Pause in safe harbor' },
      ready: { headline: 'Good. Let us pick the route back up.', body: 'Your progress is still here. FARO will point you at the one step that reopens the route.', cta: 'Continue the journey' },
    },
  },

  purpose: {
    step: (n: number) => `STEP ${n} OF 3`,
    goals: {
      career_growth: 'Career growth',
      better_income: 'Better income',
      career_change: 'Career change',
      promotion: 'A promotion',
      finish_degree: 'Finish my degree',
      personal_achievement: 'Personal achievement',
      personal_development: 'Personal development',
      other: 'Something else',
    },
    destination: { label: 'Your destination', timeEyebrow: 'Time you actually have', timeBody: 'FARO plans around this, not around an ideal week.', change: 'Change my destination' },
    q1: { title: 'Why are you studying?', body: 'There will be a week when you do not feel like opening this course. This is what FARO will remind you of.' },
    q2: { title: 'What would finishing this let you do?', body: 'In your own words. One line is enough.', placeholder: 'Lead my own projects instead of only executing them.' },
    q3: { title: 'How much time do you really have on a normal day?', body: 'Be honest rather than ambitious. Every plan FARO makes fits inside this.' },
    continue: 'Continue',
    back: 'Back',
    set: 'Set my destination',
    min: 'min',
  },

  friction: {
    FLOWING: 'You have a good rhythm going.',
    FRICTION: 'Your journey needs a little attention.',
    POSSIBLE_OVERWHELM: 'A lot has piled up. Let us take one step at a time.',
    DISCONNECTION: 'Your progress is still here, exactly where you left it.',
    RECOVERY: 'Welcome back. Let us pick the route up again.',
  },

  rewards: {
    eyebrow: 'Rewards',
    title: 'FARO Points',
    body: 'You earn points for what you actually do: finishing a step, completing a module, keeping your rhythm, and coming back after a pause. Nothing is charged up front, and nothing is lost if you stop.',
    balance: 'Current balance',
    breakdown: {
      title: 'Where they come from',
      activities: (n: number) => `Steps completed (${n})`,
      modules: (n: number) => `Modules finished (${n})`,
      rhythm: 'Sustained-rhythm bonuses',
      comeback: 'Comeback bonus',
    },
    comingSoon: {
      title: 'The rewards catalog comes later',
      body: 'For now your points really accrue, from real actions. Redeeming them is the next phase - there is nothing to spend them on yet.',
    },
  },

  achievements: {
    the_comeback: { title: 'The Comeback', description: 'You returned after a difficult stretch away.', hint: 'Earned by coming back and completing one step after time away.' },
    back_on_track: { title: 'Back on Track', description: 'You rebuilt a learning rhythm instead of starting over.', hint: 'Earned by completing two steps and bringing your momentum back up.' },
    weathered_the_storm: { title: 'Weathered the Storm', description: 'You kept moving during a week when work had piled up.', hint: 'Earned by completing a step while more than one item was still open.' },
    smart_session: { title: 'Smart Session', description: 'You finished a step inside the time you actually had.', hint: 'Earned by completing a step that fitted your available time.' },
    finisher: { title: 'Finisher', description: 'You completed the course.', hint: 'Earned at the end of the route.' },
  },
}
