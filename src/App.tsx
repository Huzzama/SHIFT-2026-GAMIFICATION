import { useState } from 'react'
import { Icon, type IconName } from '@/components/Icon'
import { LangToggle } from '@/components/LangToggle'
import { MomentumBadge } from '@/components/MomentumBadge'
import { PointsToast } from '@/components/PointsToast'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Wordmark } from '@/components/Wordmark'
import { DashboardView } from '@/views/DashboardView'
import { JourneyView } from '@/views/JourneyView'
import { CommunityView } from '@/views/CommunityView'
import { MentorView } from '@/views/MentorView'
import { ProfileView } from '@/views/ProfileView'
import { ProgressView } from '@/views/ProgressView'
import { PurposeView } from '@/views/PurposeView'
import { RecoveryView } from '@/views/RecoveryView'
import { RewardsView } from '@/views/RewardsView'
import { useStore } from '@/state/store'
import type { LifeState } from '@/types'

/**
 * Six places, and that is the whole product.
 *
 * Recovery and Purpose are deliberately not tabs. Recovery appears when the
 * journey needs it, reached from Home; Purpose is set once and revisited
 * rarely. Keeping them out of the bar is what stops FARO from becoming another
 * app with sections to manage. Rewards joins the bar because it holds a
 * balance the student will want to check on its own, the way Progress does,
 * and Community because isolation is its own kind of friction - a student who
 * feels alone will not find their way out of it through a contextual card.
 *
 * One layout, two shapes: bottom tabs in the ~400px side panel, the dark-teal
 * sidebar from the brand sheet when the page is wide (dev server, projector).
 */
type Tab = 'home' | 'journey' | 'mentor' | 'community' | 'rewards' | 'progress'
type View = Tab | 'recovery' | 'purpose' | 'profile'

/**
 * FARO is raised above the other tabs because it is the part that connects
 * the rest: it notices the friction, it explains, it sends the student to
 * Recovery or Community. Where am I and where am I going sit before it; the
 * people, the payoff and the record of what was built come after.
 */
const TABS: { id: Tab; icon: IconName }[] = [
  { id: 'home', icon: 'home' },
  { id: 'journey', icon: 'route' },
  { id: 'mentor', icon: 'lighthouse' },
  { id: 'community', icon: 'user' },
  { id: 'rewards', icon: 'gift' },
  { id: 'progress', icon: 'chart' },
]

export default function App() {
  const { loading, loadError, reload, purpose, friction, setLifeState, t } = useStore()
  const [view, setView] = useState<View>('home')
  const [profileAuthorId, setProfileAuthorId] = useState('me')

  const openRecovery = (state?: LifeState) => {
    if (state) setLifeState(state)
    setView('recovery')
  }

  const openProfile = (authorId: string) => {
    setProfileAuthorId(authorId)
    setView('profile')
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

  // The backend could not answer. Say so and offer a retry; never render a
  // course out of nothing.
  if (loadError) {
    return (
      <div className="shell">
        <div className="main">
          <div className="app__body">
            <div className="card">
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>{t.shell.loadError}</p>
              <code className="muted" style={{ display: 'block', margin: '10px 0 14px', fontSize: 'var(--text-xs)' }}>
                {loadError}
              </code>
              <button className="btn" onClick={reload}>
                {t.shell.retry}
              </button>
            </div>
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

  const tab: Tab | null = view === 'recovery' || view === 'purpose' || view === 'profile' ? null : view

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
              className={`navitem${tab === id ? ' navitem--active' : ''}${id === 'mentor' ? ' navitem--faro' : ''}`}
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

        {(view === 'recovery' || view === 'purpose' || view === 'profile') && (
          <button
            className="backbar"
            onClick={() => setView(view === 'profile' ? 'community' : 'home')}
          >
            <Icon name="arrow" size={16} className="flip" />
            {view === 'recovery'
              ? t.shell.back.recovery
              : view === 'purpose'
                ? t.shell.back.purpose
                : t.shell.back.profile}
          </button>
        )}

        <PointsToast />

        <div className="app__body">
          {view === 'home' && (
            <DashboardView
              onAskMentor={() => setView('mentor')}
              onOpenRecovery={openRecovery}
              onOpenJourney={() => setView('journey')}
              onOpenProgress={() => setView('progress')}
              onOpenPurpose={() => setView('purpose')}
              onOpenCommunity={() => setView('community')}
            />
          )}
          {view === 'journey' && (
            <JourneyView onAskMentor={() => setView('mentor')} onOpenCommunity={() => setView('community')} />
          )}
          {view === 'community' && (
            <CommunityView
              onAskMentor={() => setView('mentor')}
              onOpenRecovery={() => setView('recovery')}
              onOpenProfile={openProfile}
            />
          )}
          {view === 'mentor' && <MentorView />}
          {view === 'rewards' && <RewardsView onOpenJourney={() => setView('journey')} />}
          {view === 'progress' && (
            <ProgressView
              onOpenJourney={() => setView('journey')}
              onEditPurpose={() => setView('purpose')}
              onOpenProfile={() => openProfile('me')}
            />
          )}
          {view === 'profile' && (
            <ProfileView authorId={profileAuthorId} onBack={() => setView('community')} />
          )}
          {view === 'recovery' && (
            <RecoveryView
              onAskMentor={() => setView('mentor')}
              onGoHome={() => setView('home')}
              onOpenJourney={() => setView('journey')}
              onOpenCommunity={() => setView('community')}
            />
          )}
          {view === 'purpose' && <PurposeView />}
        </div>

        <nav className="tabs">
          {TABS.map(({ id, icon }) => (
            <button
              key={id}
              className={`tab${tab === id ? ' tab--active' : ''}${id === 'mentor' ? ' tab--faro' : ''}`}
              onClick={() => setView(id)}
            >
              {id === 'mentor' ? (
                <span className="tab__beacon">
                  <Icon name={icon} size={24} stroke={2} />
                </span>
              ) : (
                <Icon name={icon} size={22} stroke={tab === id ? 2.2 : 1.8} />
              )}
              {t.shell.nav[id]}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
