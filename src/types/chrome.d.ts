/**
 * Minimal Chrome extension typings.
 *
 * FARO touches two Chrome APIs and nothing else, so we declare exactly those
 * instead of pulling in the whole @types/chrome package. Keeping this surface
 * small is also a standing reminder of how little the extension may do.
 */
declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys: string | string[] | null): Promise<Record<string, unknown>>
      set(items: Record<string, unknown>): Promise<void>
      clear(): Promise<void>
    }
    const local: StorageArea
  }

  namespace sidePanel {
    function setPanelBehavior(behavior: { openPanelOnActionClick: boolean }): Promise<void>
  }
}
