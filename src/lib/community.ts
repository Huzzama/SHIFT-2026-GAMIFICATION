/**
 * Community logic — presence without pressure.
 *
 * The most important function in this file is `rankFeed`, and the most
 * important thing about it is what it does *not* read: reaction counts.
 *
 * A feed scored by reactions becomes a popularity contest, then an engagement
 * loop, then the thing FARO promised not to build. So relevance here is
 * decided by need and context only - is this about your course, your module,
 * is someone stuck and still unanswered, how fresh is it. A post with forty
 * reactions and a post with none rank identically if they are equally
 * relevant to you.
 *
 * The second rule: nothing in this file can produce a ranking of students.
 * There is no leaderboard function because there is no leaderboard.
 */
import type {
  CommunityAchievement,
  CommunityAchievementId,
  CommunityMission,
  CommunityPost,
  PostKind,
  ReactionKind,
  Reactions,
  SosNeed,
} from '@/types'

const HOUR = 60 * 60 * 1000

/**
 * How much each kind of post deserves to be near the top.
 *
 * Someone stuck outranks someone celebrating. That ordering is the whole
 * argument: a community whose front page is other people's wins is a worse
 * place to arrive when you are struggling.
 */
const KIND_WEIGHT: Record<PostKind, number> = {
  help: 5,
  question: 4,
  learning: 3,
  tip: 3,
  resource: 3,
  recognition: 2,
  achievement: 2,
  milestone: 1.5,
  activity: 1,
}

export interface FeedContext {
  courseName: string | null
  moduleName: string | null
}

export function rankFeed(posts: CommunityPost[], ctx: FeedContext): CommunityPost[] {
  const score = (p: CommunityPost) => {
    let s = KIND_WEIGHT[p.kind]
    if (ctx.courseName && p.courseName === ctx.courseName) s += 3
    if (ctx.moduleName && p.moduleName === ctx.moduleName) s += 2

    // An unanswered classmate is the one thing that should climb, not fall.
    if ((p.kind === 'help' || p.kind === 'question') && p.comments.length === 0) s += 3

    // Gentle recency: a day old costs about one point. Never a hard cutoff -
    // a good answer from last week is still a good answer.
    const hours = (Date.now() - new Date(p.at).getTime()) / HOUR
    s -= Math.min(4, hours / 24)
    return s
  }
  return [...posts].sort((a, b) => score(b) - score(a))
}

export const reactionOrder: ReactionKind[] = [
  'like',
  'applause',
  'useful',
  'motivating',
  'support',
]

export const reactionEmoji: Record<ReactionKind, string> = {
  like: '❤️',
  applause: '👏',
  useful: '💡',
  motivating: '🔥',
  support: '🤝',
}

/**
 * Which reactions to offer on a given post.
 *
 * A help request does not need applause; it needs "I'm with you" and "this
 * helped". Offering the right verbs is cheaper than moderating the wrong ones.
 */
export function reactionsFor(kind: PostKind): ReactionKind[] {
  if (kind === 'help') return ['support', 'useful', 'like']
  if (kind === 'question') return ['useful', 'support', 'like']
  if (kind === 'recognition') return ['support', 'motivating', 'applause']
  if (kind === 'achievement' || kind === 'milestone')
    return ['applause', 'motivating', 'like']
  return ['useful', 'like', 'motivating']
}

/** The counts the student sees: the mock totals plus their own reaction. */
export function totalsWithMine(base: Reactions, mine: ReactionKind[]): Reactions {
  const out = { ...base }
  for (const k of mine) out[k] = (out[k] ?? 0) + 1
  return out
}

/* ------------------------------------------------------------- mission */

export function missionPercent(m: CommunityMission, myContributions: number): number {
  const done = m.progress + myContributions
  return Math.min(100, Math.round((done / m.target) * 100))
}

export const missionComplete = (m: CommunityMission, mine: number) =>
  m.progress + mine >= m.target

/* --------------------------------------------------- contribution points */

/**
 * Points for contribution, never for activity volume.
 *
 * Note what is absent: posting earns nothing. Asking a question earns nothing.
 * Entering a study room earns nothing. Points attach to a *completed* room
 * session and to an answer other people marked useful - the two things that
 * are hard to fake and actually helped someone.
 */
export const communityPointsConfig = {
  /** Per peer who marked one of your answers useful. */
  POINTS_PER_HELPFUL_MARK: 5,
  /** For finishing a study-room session, not for joining one. */
  POINTS_PER_COMPLETED_ROOM: 20,
}

export function communityPoints(state: {
  helpfulMarksReceived: number
  completedRoomSessions: number
}): number {
  return (
    state.helpfulMarksReceived * communityPointsConfig.POINTS_PER_HELPFUL_MARK +
    state.completedRoomSessions * communityPointsConfig.POINTS_PER_COMPLETED_ROOM
  )
}

/* -------------------------------------------------------- recognitions */

const RECOGNITION_ORDER: CommunityAchievementId[] = [
  'helpful_peer',
  'knowledge_sharer',
  'community_builder',
  'study_companion',
  'community_comeback',
]

/**
 * Five, like the resilience achievements - and earned the same way: by having
 * actually helped someone, not by being liked.
 */
/**
 * The inputs `evaluateCommunityAchievements` needs, built from live state.
 *
 * Pulled out so `CommunityView` and `ProfileView` compute recognitions the
 * same way instead of each re-deriving it. `awayGap` comes from the main
 * store, not from here - this file still never imports it, the caller does.
 */
export function communityRecognitionState(
  community: {
    answers: Record<string, unknown>
    helpfulMarksReceived: number
    posts: unknown[]
    completedRoomSessions: number
  },
  awayGap: number,
) {
  return {
    answersGiven: Object.keys(community.answers).length,
    helpfulMarksReceived: community.helpfulMarksReceived,
    postsShared: community.posts.length,
    completedRoomSessions: community.completedRoomSessions,
    cameBackAndParticipated:
      awayGap >= 3 &&
      (community.completedRoomSessions > 0 ||
        community.posts.length > 0 ||
        Object.keys(community.answers).length > 0),
  }
}

export function evaluateCommunityAchievements(
  state: {
    answersGiven: number
    helpfulMarksReceived: number
    postsShared: number
    completedRoomSessions: number
    cameBackAndParticipated: boolean
  },
  copy: Record<CommunityAchievementId, { title: string; description: string; hint: string }>,
): CommunityAchievement[] {
  const earned: Record<CommunityAchievementId, boolean> = {
    helpful_peer: state.helpfulMarksReceived >= 3,
    knowledge_sharer: state.postsShared >= 2,
    community_builder: state.answersGiven >= 3,
    study_companion: state.completedRoomSessions >= 2,
    community_comeback: state.cameBackAndParticipated,
  }
  return RECOGNITION_ORDER.map((id) => ({ id, ...copy[id], earned: earned[id] }))
}

/* ----------------------------------------------------------------- SOS */

/**
 * The whole point of SOS, and of Community's place in FARO.
 *
 * Three kinds of stuck, three different systems. FARO does not answer every
 * difficulty the same way, and it does not send a student to Community when
 * what they needed was a plan or an explanation. Community is the right answer
 * to isolation - not to everything.
 */
export const sosRouting: Record<SosNeed, 'mentor' | 'recovery' | 'community'> = {
  topic: 'mentor',
  time: 'recovery',
  people: 'community',
}

export const sosOrder: SosNeed[] = ['topic', 'time', 'people']

/** Posts worth showing someone who said they do not understand the topic. */
export function relatedToTopic(posts: CommunityPost[], moduleName: string | null) {
  return posts.filter(
    (p) =>
      (p.kind === 'question' || p.kind === 'learning' || p.kind === 'tip') &&
      (!moduleName || p.moduleName === moduleName || !p.moduleName),
  )
}
