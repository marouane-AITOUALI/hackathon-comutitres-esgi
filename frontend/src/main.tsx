import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AccessibilityProvider } from './accessibility/AccessibilityContext'
import { AuthProvider } from './hooks/AuthProvider'
import { NotificationsProvider } from './hooks/NotificationsProvider'
import { AppThemeProvider } from './styles/AppThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityProvider>
      <AppThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <NotificationsProvider>
              <App />
            </NotificationsProvider>
          </BrowserRouter>
        </AuthProvider>
      </AppThemeProvider>
    </AccessibilityProvider>
  </StrictMode>,
)
