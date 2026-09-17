import { Icon, type IconName } from './Icon'
import { useTheme, type ThemeMode } from '@/state/theme'
import { useStore } from '@/state/store'

const MODES: { id: ThemeMode; icon: IconName }[] = [
  { id: 'light', icon: 'sun' },
  { id: 'dark', icon: 'moon' },
  { id: 'system', icon: 'laptop' },
]

/**
 * Same pill shape as the language toggle, on purpose - two small preference
 * switches that both live in the same corner of the shell.
 */
export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const { mode, setMode } = useTheme()
  const { t } = useStore()
  return (
    <div className={`langs${onDark ? ' langs--onDark' : ''}`} role="group" aria-label={t.shell.themeTitle}>
      {MODES.map(({ id, icon }) => (
        <button
          key={id}
          className={`langs__opt langs__opt--icon${mode === id ? ' langs__opt--on' : ''}`}
          onClick={() => setMode(id)}
          aria-pressed={mode === id}
          title={t.shell.theme[id]}
        >
          <Icon name={icon} size={14} />
        </button>
      ))}
    </div>
  )
}
