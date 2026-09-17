import { useStore } from '@/state/store'
import type { Lang } from '@/types'

const LANGS: Lang[] = ['es', 'en']

export function LangToggle({ onDark = false }: { onDark?: boolean }) {
  const { lang, setLang, t } = useStore()
  return (
    <div className={`langs${onDark ? ' langs--onDark' : ''}`} role="group" aria-label={t.shell.language}>
      {LANGS.map((l) => (
        <button
          key={l}
          className={`langs__opt${lang === l ? ' langs__opt--on' : ''}`}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
