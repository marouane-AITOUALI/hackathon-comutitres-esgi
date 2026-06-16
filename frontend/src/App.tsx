import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingNeedsPage } from './pages/OnboardingNeedsPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { OnboardingProfilePage } from './pages/OnboardingProfilePage'
import { OnboardingResultPage } from './pages/OnboardingResultPage'
import { RegisterPage } from './pages/RegisterPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AppLayout />}>
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="onboarding/profile" element={<OnboardingProfilePage />} />
          <Route path="onboarding/needs" element={<OnboardingNeedsPage />} />
          <Route path="onboarding/result" element={<OnboardingResultPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}

export default App
