import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { CommunityProvider } from '@/state/community'
import { StoreProvider } from '@/state/store'
import { ThemeProvider } from '@/state/theme'
import './styles/global.css'
import './styles/views.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <CommunityProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </CommunityProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
