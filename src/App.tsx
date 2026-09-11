import { useState } from 'react'
import { Lighthouse } from '@/components/Lighthouse'
import { MomentumBadge } from '@/components/MomentumBadge'
import { JourneyView } from '@/views/JourneyView'
import { MentorView } from '@/views/MentorView'
import { PurposeView } from '@/views/PurposeView'
import { useStore } from '@/state/store'

type Tab = 'journey' | 'mentor' | 'purpose'

export default function App() {
  const { loading, purpose, friction } = useStore()
  const [tab, setTab] = useState<Tab>('journey')

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

  return (
    <div className="app">
      <header className="app__header">
        <div className="brand">
          <Lighthouse />
          <div>
            <div className="brand__name">FARO</div>
            <div className="brand__tag">No Game Over. Recalculate your route.</div>
          </div>
        </div>
        {friction && <MomentumBadge friction={friction} />}
      </header>

      <div className="app__body">
        {tab === 'journey' && <JourneyView onAskMentor={() => setTab('mentor')} />}
        {tab === 'mentor' && <MentorView />}
        {tab === 'purpose' && <PurposeView />}
      </div>

      <nav className="tabs">
        {([
          ['journey', 'Journey'],
          ['mentor', 'FARO'],
          ['purpose', 'Purpose'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            className={`tab${tab === id ? ' tab--active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
