import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CircularProgress, Stack } from '@mui/material'
import { useAccessibility } from './accessibility/useAccessibility'
import { DocumentTranslationBridge } from './i18n/DocumentTranslationBridge'
import { AppLayout } from './components/AppLayout'
import { ClientLayout } from './components/ClientLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { UmamiAnalytics } from './observability/UmamiAnalytics'
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage').then((module) => ({ default: module.DocumentsPage })))
const FooterInfoPage = lazy(() => import('./pages/FooterInfoPage').then((module) => ({ default: module.FooterInfoPage })))
const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const MobileAppPage = lazy(() => import('./pages/MobileAppPage').then((module) => ({ default: module.MobileAppPage })))
const OnboardingChatPage = lazy(() => import('./pages/OnboardingChatPage').then((module) => ({ default: module.OnboardingChatPage })))
const OffersPage = lazy(() => import('./pages/OffersPage').then((module) => ({ default: module.OffersPage })))
const PaiementsPage = lazy(() => import('./pages/PaiementsPage').then((module) => ({ default: module.PaiementsPage })))
const PaymentDetailPage = lazy(() => import('./pages/PaymentDetailPage').then((module) => ({ default: module.PaymentDetailPage })))
const PaymentFormPage = lazy(() => import('./pages/PaymentFormPage').then((module) => ({ default: module.PaymentFormPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const SubscriptionDetailPage = lazy(() => import('./pages/SubscriptionDetailPage').then((module) => ({ default: module.SubscriptionDetailPage })))
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage').then((module) => ({ default: module.SubscriptionsPage })))
const SupportPage = lazy(() => import('./pages/SupportPage').then((module) => ({ default: module.SupportPage })))

function PageLoader() {
  return <Stack sx={{ minHeight: 240, placeItems: 'center' }}><CircularProgress aria-label="Chargement de la page" /></Stack>
}

function App() {
  const { language } = useAccessibility()

  return (
    <>
      <UmamiAnalytics />
      <DocumentTranslationBridge />
      <a className="skip-link" href="#main-content">
        {language === 'fr' ? 'Aller au contenu principal' : 'Skip to main content'}
      </a>
      <Suspense fallback={<PageLoader />}>
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
          <Route path="paiements/nouveau" element={<PaymentFormPage />} />
          <Route path="paiements/:id" element={<PaymentDetailPage />} />
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
      </Suspense>
    </>
  )
}

export default App
