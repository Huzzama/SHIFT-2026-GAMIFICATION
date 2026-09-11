import { useState } from 'react'
import { Lighthouse } from '@/components/Lighthouse'
import { MomentumBadge } from '@/components/MomentumBadge'
import { DashboardView } from '@/views/DashboardView'
import { JourneyView } from '@/views/JourneyView'
import { MentorView } from '@/views/MentorView'
import { ProgressView } from '@/views/ProgressView'
import { PurposeView } from '@/views/PurposeView'
import { RecoveryView } from '@/views/RecoveryView'
import { useStore } from '@/state/store'
import type { LifeState } from '@/types'

/**
 * Four places, and that is the whole product.
 *
 * Recovery and Purpose are deliberately not tabs. Recovery appears when the
 * journey needs it, reached from Home; Purpose is set once and revisited
 * rarely. Keeping them out of the bar is what stops FARO from becoming another
 * app with sections to manage.
 */
type Tab = 'home' | 'journey' | 'mentor' | 'progress'
type View = Tab | 'recovery' | 'purpose'

export default function App() {
  const { loading, purpose, friction, setLifeState } = useStore()
  const [view, setView] = useState<View>('home')

  const openRecovery = (state?: LifeState) => {
    if (state) setLifeState(state)
    setView('recovery')
  }

  if (loading) {
    return (
      <div className="app">
        <div className="app__body">
          <p className="muted">Finding your position…</p>
        </div>
      </div>
    )
  }

  // No purpose yet: onboarding is the whole app until there is a destination.
  if (!purpose) {
    return (
      <div className="app">
        <header className="app__header">
          <div className="brand">
            <Lighthouse />
            <div>
              <div className="brand__name">FARO</div>
              <div className="brand__tag">Hard to quit. Easy to return.</div>
            </div>
          </div>
        </header>
        <div className="app__body">
          <PurposeView />
        </div>
      </div>
    )
  }

  const tab: Tab | null =
    view === 'recovery' || view === 'purpose' ? null : view

  return (
    <div className="app">
      <header className="app__header">
        <button className="brand brand--button" onClick={() => setView('home')}>
          <Lighthouse />
          <div style={{ textAlign: 'left' }}>
            <div className="brand__name">FARO</div>
            <div className="brand__tag">No Game Over. Recalculate your route.</div>
          </div>
        </button>
        {friction && <MomentumBadge friction={friction} />}
      </header>

      {(view === 'recovery' || view === 'purpose') && (
        <button className="backbar" onClick={() => setView('home')}>
          ← {view === 'recovery' ? 'Recovery' : 'Your purpose'}
        </button>
      )}

      <div className="app__body">
        {view === 'home' && (
          <DashboardView
            onAskMentor={() => setView('mentor')}
            onOpenRecovery={openRecovery}
            onOpenJourney={() => setView('journey')}
          />
        )}
        {view === 'journey' && <JourneyView onAskMentor={() => setView('mentor')} />}
        {view === 'mentor' && <MentorView />}
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
          />
        )}
        {view === 'purpose' && <PurposeView />}
      </div>

      <nav className="tabs">
        {([
          ['home', 'Home'],
          ['journey', 'Journey'],
          ['mentor', 'FARO'],
          ['progress', 'Progress'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            className={`tab${tab === id ? ' tab--active' : ''}`}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
