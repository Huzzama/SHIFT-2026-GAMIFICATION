/**
 * Community participation state.
 *
 * Kept separate from the main store on purpose. The store holds the student's
 * relationship with their *course*; this holds their relationship with other
 * people. They meet in exactly one place - FARO Points - and the direction of
 * that dependency is one-way: the store reads `useCommunityPoints()`, and
 * nothing here ever reads the store. That is why this provider sits above it
 * in `main.tsx`.
 *
 * Only what the student themselves did is stored. Other people's posts,
 * reactions and presence come from the mock service and are never written to
 * from here, the same way a real client would not own the server's rows.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { mockPosts } from '@/data/community.mock'
import { communityPoints } from '@/lib/community'
import { readValue, writeValue } from './storage'
import type { CommunityPost, PostKind, ReactionKind } from '@/types'

/** Everything the student has done in Community, and nothing about anyone else. */
interface Participation {
  /** Reactions this student added, per post. */
  reactions: Record<string, ReactionKind[]>
  /** Questions, tips and learnings this student shared. */
  posts: CommunityPost[]
  /** Answers this student wrote, keyed by the post they answered. */
  answers: Record<string, { text: string; at: string; helpful: number }>
  /** Comment ids this student marked useful. */
  markedHelpful: string[]
  completedRoomSessions: number
  roomMinutes: number
  /** Activities this student contributed to the running community mission. */
  missionContributions: number
}

const empty: Participation = {
  reactions: {},
  posts: [],
  answers: {},
  markedHelpful: [],
  completedRoomSessions: 0,
  roomMinutes: 0,
  missionContributions: 0,
}

interface CommunityValue extends Participation {
  /** Mock feed plus whatever this student posted, newest of theirs first. */
  allPosts: CommunityPost[]
  /** Peers who marked this student's answers useful. Drives recognition. */
  helpfulMarksReceived: number
  points: number
  react: (postId: string, kind: ReactionKind) => void
  share: (kind: PostKind, title: string, text: string, ctx: { courseName?: string; moduleName?: string }) => void
  answer: (postId: string, text: string) => void
  markHelpful: (commentId: string) => void
  /** Simulated peer feedback - see `RecoveryView`-style honesty note below. */
  recordHelpfulMarks: (postId: string, marks: number) => void
  completeRoom: (minutes: number) => void
  reset: () => void
}

const Ctx = createContext<CommunityValue | null>(null)

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Participation>(empty)

  useEffect(() => {
    let alive = true
    void (async () => {
      const saved = await readValue<Participation>('community')
      if (alive && saved) setP({ ...empty, ...saved })
    })()
    return () => {
      alive = false
    }
  }, [])

  const update = useCallback((fn: (prev: Participation) => Participation) => {
    setP((prev) => {
      const next = fn(prev)
      void writeValue('community', next)
      return next
    })
  }, [])

  const react = useCallback(
    (postId: string, kind: ReactionKind) => {
      update((prev) => {
        const mine = prev.reactions[postId] ?? []
        const next = mine.includes(kind)
          ? mine.filter((k) => k !== kind)
          : [...mine, kind]
        return { ...prev, reactions: { ...prev.reactions, [postId]: next } }
      })
    },
    [update],
  )

  const share = useCallback(
    (
      kind: PostKind,
      title: string,
      text: string,
      ctx: { courseName?: string; moduleName?: string },
    ) => {
      update((prev) => ({
        ...prev,
        posts: [
          {
            id: `mine-${Date.now()}`,
            kind,
            authorId: 'me',
            title: title || undefined,
            text,
            courseName: ctx.courseName,
            moduleName: ctx.moduleName,
            at: new Date().toISOString(),
            reactions: { like: 0, applause: 0, useful: 0, motivating: 0, support: 0 },
            comments: [],
          },
          ...prev.posts,
        ],
      }))
    },
    [update],
  )

  const answer = useCallback(
    (postId: string, text: string) => {
      update((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [postId]: { text, at: new Date().toISOString(), helpful: 0 },
        },
      }))
    },
    [update],
  )

  /**
   * Prototype only: stands in for peers marking an answer useful over the
   * following hours. Real marks come from the Community Service; nothing here
   * should ever ship as a way to manufacture your own credit.
   */
  const recordHelpfulMarks = useCallback(
    (postId: string, marks: number) => {
      update((prev) => {
        const a = prev.answers[postId]
        if (!a || a.helpful > 0) return prev
        return { ...prev, answers: { ...prev.answers, [postId]: { ...a, helpful: marks } } }
      })
    },
    [update],
  )

  const markHelpful = useCallback(
    (commentId: string) => {
      update((prev) =>
        prev.markedHelpful.includes(commentId)
          ? { ...prev, markedHelpful: prev.markedHelpful.filter((c) => c !== commentId) }
          : { ...prev, markedHelpful: [...prev.markedHelpful, commentId] },
      )
    },
    [update],
  )

  /** A completed session counts toward the mission; joining a room does not. */
  const completeRoom = useCallback(
    (minutes: number) => {
      update((prev) => ({
        ...prev,
        completedRoomSessions: prev.completedRoomSessions + 1,
        roomMinutes: prev.roomMinutes + minutes,
        missionContributions: prev.missionContributions + 1,
      }))
    },
    [update],
  )

  const reset = useCallback(() => update(() => empty), [update])

  const helpfulMarksReceived = useMemo(
    () => Object.values(p.answers).reduce((s, a) => s + a.helpful, 0),
    [p.answers],
  )

  const allPosts = useMemo(() => [...p.posts, ...mockPosts], [p.posts])

  const points = useMemo(
    () =>
      communityPoints({
        helpfulMarksReceived,
        completedRoomSessions: p.completedRoomSessions,
      }),
    [helpfulMarksReceived, p.completedRoomSessions],
  )

  const value: CommunityValue = {
    ...p,
    allPosts,
    helpfulMarksReceived,
    points,
    react,
    share,
    answer,
    markHelpful,
    recordHelpfulMarks,
    completeRoom,
    reset,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCommunity(): CommunityValue {
  const ctx = useContext<CommunityValue | null>(Ctx)
  if (!ctx) throw new Error('useCommunity must be used inside <CommunityProvider>')
  return ctx
}

/**
 * Just the points, for the store's single FARO Points balance.
 *
 * Returns 0 when the provider is absent so the store never depends on
 * Community being mounted.
 */
export function useCommunityPoints(): number {
  return useContext<CommunityValue | null>(Ctx)?.points ?? 0
}
