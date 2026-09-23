/**
 * Small facts about how the integration is behaving right now.
 *
 * Not course data and not a cache: flags the Canvas layer sets while it
 * works, so the Profile panel can say things like "activity is derived from
 * submissions because this account may not read analytics" instead of
 * letting a fallback pass silently as the real thing.
 */

export interface IntegrationStatus {
  /** True when the analytics endpoint refused this account and FARO used submission dates instead. */
  activityFallback: boolean
}

let state: IntegrationStatus = { activityFallback: false }
const listeners = new Set<(s: IntegrationStatus) => void>()

export const integrationStatus = {
  get: () => state,
  set(patch: Partial<IntegrationStatus>) {
    state = { ...state, ...patch }
    listeners.forEach((fn) => fn(state))
  },
  subscribe(fn: (s: IntegrationStatus) => void) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}
