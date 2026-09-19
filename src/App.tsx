import { useState } from 'react'
import { Icon, type IconName } from '@/components/Icon'
import { LangToggle } from '@/components/LangToggle'
import { MomentumBadge } from '@/components/MomentumBadge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Wordmark } from '@/components/Wordmark'
import { DashboardView } from '@/views/DashboardView'
import { JourneyView } from '@/views/JourneyView'
import { MentorView } from '@/views/MentorView'
import { ProgressView } from '@/views/ProgressView'
import { PurposeView } from '@/views/PurposeView'
import { RecoveryView } from '@/views/RecoveryView'
import { RewardsView } from '@/views/RewardsView'
import { useStore } from '@/state/store'
import type { LifeState } from '@/types'

/**
 * Five places, and that is the whole product.
 *
 * Recovery and Purpose are deliberately not tabs. Recovery appears when the
 * journey needs it, reached from Home; Purpose is set once and revisited
 * rarely. Keeping them out of the bar is what stops FARO from becoming another
 * app with sections to manage. Rewards joins the bar because it holds a
 * balance the student will want to check on its own, the way Progress does.
 *
 * One layout, two shapes: bottom tabs in the ~400px side panel, the dark-teal
 * sidebar from the brand sheet when the page is wide (dev server, projector).
 */
type Tab = 'home' | 'journey' | 'mentor' | 'rewards' | 'progress'
type View = Tab | 'recovery' | 'purpose'

const TABS: { id: Tab; icon: IconName }[] = [
  { id: 'home', icon: 'home' },
  { id: 'journey', icon: 'route' },
  { id: 'mentor', icon: 'lighthouse' },
  { id: 'rewards', icon: 'gift' },
  { id: 'progress', icon: 'chart' },
]

export default function App() {
  const { loading, purpose, friction, setLifeState, t } = useStore()
  const [view, setView] = useState<View>('home')

  const openRecovery = (state?: LifeState) => {
    if (state) setLifeState(state)
    setView('recovery')
  }

  if (loading) {
    return (
      <div className="shell">
        <div className="main">
          <div className="app__body">
            <p className="muted">{t.shell.loading}</p>
          </div>
        </div>
      </div>
    )
  }

  // No purpose yet: onboarding is the whole app until there is a destination.
  if (!purpose) {
    return (
      <div className="shell">
        <div className="main">
          <header className="topbar">
            <div className="brand" style={{ color: 'var(--text-1)' }}>
              <Wordmark size={22} taglineText={t.shell.tagline} />
            </div>
            <LangToggle />
          </header>
          <div className="app__body">
            <PurposeView />
          </div>
        </div>
      </div>
    )
  }

  const tab: Tab | null = view === 'recovery' || view === 'purpose' ? null : view

  return (
    <div className="shell">
      <aside className="sidebar">
        <button className="brand brand--light" onClick={() => setView('home')}>
          <Wordmark size={26} taglineText={t.shell.tagline} />
        </button>
        <nav className="sidebar__nav">
          {TABS.map(({ id, icon }) => (
            <button
              key={id}
              className={`navitem${tab === id ? ' navitem--active' : ''}`}
              onClick={() => setView(id)}
            >
              <Icon name={icon} size={20} />
              {t.shell.nav[id]}
            </button>
          ))}
        </nav>
        <div className="sidebar__foot">
          {friction && <MomentumBadge friction={friction} onDark />}
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <LangToggle onDark />
            <ThemeToggle onDark />
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.55)' }}>
            {t.shell.noGameOver}
          </span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="brand" style={{ color: 'var(--text-1)' }} onClick={() => setView('home')}>
            <Wordmark size={22} taglineText={t.shell.tagline} />
          </button>
          <div className="topbar__right">
            {friction && <MomentumBadge friction={friction} />}
            <LangToggle />
            <ThemeToggle />
          </div>
        </header>

        {(view === 'recovery' || view === 'purpose') && (
          <button className="backbar" onClick={() => setView('home')}>
            <Icon name="arrow" size={16} className="flip" />
            {view === 'recovery' ? t.shell.back.recovery : t.shell.back.purpose}
          </button>
        )}

        <div className="app__body">
          {view === 'home' && (
            <DashboardView
              onAskMentor={() => setView('mentor')}
              onOpenRecovery={openRecovery}
              onOpenJourney={() => setView('journey')}
              onOpenProgress={() => setView('progress')}
              onOpenPurpose={() => setView('purpose')}
            />
          )}
          {view === 'journey' && <JourneyView onAskMentor={() => setView('mentor')} />}
          {view === 'mentor' && <MentorView />}
          {view === 'rewards' && <RewardsView />}
          {view === 'progress' && (
            <ProgressView
              onOpenJourney={() => setView('journey')}
              onEditPurpose={() => setView('purpose')}
            />
          )}
          {view === 'recovery' && (
            <RecoveryView
              onAskMentor={() => setView('mentor')}
              onGoHome={() => setView('home')}
              onOpenJourney={() => setView('journey')}
            />
          )}
          {view === 'purpose' && <PurposeView />}
        </div>

        <nav className="tabs">
          {TABS.map(({ id, icon }) => (
            <button
              key={id}
              className={`tab${tab === id ? ' tab--active' : ''}`}
              onClick={() => setView(id)}
            >
              <Icon name={icon} size={22} stroke={tab === id ? 2.2 : 1.8} />
              {t.shell.nav[id]}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
