/**
 * Preference/cache storage only.
 *
 * Uses chrome.storage.local inside the extension and falls back to
 * localStorage during `npm run dev`. FARO state that must survive a device
 * change belongs in the backend, not here - this layer is cache and
 * preferences, exactly as the architecture calls for.
 */
const KEY_PREFIX = 'faro:'

const hasChromeStorage = () =>
  typeof chrome !== 'undefined' && Boolean(chrome?.storage?.local)

export async function readValue<T>(key: string): Promise<T | null> {
  const k = KEY_PREFIX + key
  try {
    if (hasChromeStorage()) {
      const out = await chrome.storage.local.get(k)
      return (out[k] as T) ?? null
    }
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export async function writeValue<T>(key: string, value: T): Promise<void> {
  const k = KEY_PREFIX + key
  try {
    if (hasChromeStorage()) {
      await chrome.storage.local.set({ [k]: value })
      return
    }
    localStorage.setItem(k, JSON.stringify(value))
  } catch {
    /* storage can be unavailable; FARO still works for this session */
  }
}

export async function clearAll(): Promise<void> {
  try {
    if (hasChromeStorage()) {
      await chrome.storage.local.clear()
      return
    }
    Object.keys(localStorage)
      .filter((k) => k.startsWith(KEY_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
