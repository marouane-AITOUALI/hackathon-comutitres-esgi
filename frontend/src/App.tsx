import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ClientLayout } from './components/ClientLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { FooterInfoPage } from './pages/FooterInfoPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MobileAppPage } from './pages/MobileAppPage'
import { OnboardingChatPage } from './pages/OnboardingChatPage'
import { OffersPage } from './pages/OffersPage'
import { PaiementsPage } from './pages/PaiementsPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { SubscriptionDetailPage } from './pages/SubscriptionDetailPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { SupportPage } from './pages/SupportPage'

function App() {
  return (
    <Routes>
      <Route path="auth/login" element={<LoginPage />} />
      <Route path="auth/register" element={<RegisterPage />} />
      <Route path="mobile-app" element={<MobileAppPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ClientLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="paiements" element={<PaiementsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="support" element={<SupportPage />} />
        </Route>
        <Route path="onboarding" element={<OnboardingChatPage />} />
        <Route path="onboarding/*" element={<Navigate replace to="/onboarding" />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="infos/:page" element={<FooterInfoPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}

export default App
