import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ClientLayout } from './components/ClientLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingNeedsPage } from './pages/OnboardingNeedsPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { OnboardingProfilePage } from './pages/OnboardingProfilePage'
import { OnboardingResultPage } from './pages/OnboardingResultPage'
import { OffersPage } from './pages/OffersPage'
import { PaiementsPage } from './pages/PaiementsPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { SupportPage } from './pages/SupportPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AppLayout />}>
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<ClientLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="paiements" element={<PaiementsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="support" element={<SupportPage />} />
        </Route>
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="onboarding/profile" element={<OnboardingProfilePage />} />
        <Route path="onboarding/needs" element={<OnboardingNeedsPage />} />
        <Route path="onboarding/result" element={<OnboardingResultPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}

export default App
