/**
 * Theme: light / dark / system.
 *
 * This is the foundation for the design system the big spec asks for - CSS
 * variables driving every colour, no hardcoded values in components - built
 * once, correctly, so named skins can extend it later without touching a
 * single view. For now it ships exactly two real themes plus "system".
 *
 * The resolved theme is written to `document.documentElement.dataset.theme`,
 * which is what `tokens.css` keys off (`:root[data-theme='dark']`). System
 * mode tracks the OS preference live, so it updates without a reload.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { readValue, writeValue } from './storage'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeValue {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

const prefersDark = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [systemDark, setSystemDark] = useState(prefersDark)

  // Load the saved preference once. Until then "system" is a safe default.
  useEffect(() => {
    let alive = true
    readValue<ThemeMode>('theme').then((saved) => {
      if (alive && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        setModeState(saved)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  // Track the OS preference live, so "system" never needs a reload.
  useEffect(() => {
    let mq: MediaQueryList | null = null
    try {
      mq = window.matchMedia('(prefers-color-scheme: dark)')
    } catch {
      return
    }
    const onChange = () => setSystemDark(mq!.matches)
    mq.addEventListener('change', onChange)
    return () => mq!.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: ResolvedTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  const setMode = (m: ThemeMode) => {
    setModeState(m)
    void writeValue('theme', m)
  }

  const value = useMemo(() => ({ mode, resolvedTheme, setMode }), [mode, resolvedTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
