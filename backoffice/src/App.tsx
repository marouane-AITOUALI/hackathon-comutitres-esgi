import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CircularProgress, Stack } from '@mui/material'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminLayout } from './components/layout/AdminLayout'
const CommunicationsPage = lazy(() => import('./pages/CommunicationsPage').then((module) => ({ default: module.CommunicationsPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage').then((module) => ({ default: module.DocumentsPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const OffersPage = lazy(() => import('./pages/OffersPage').then((module) => ({ default: module.OffersPage })))
const SubscriptionDetailPage = lazy(() => import('./pages/SubscriptionDetailPage').then((module) => ({ default: module.SubscriptionDetailPage })))
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage').then((module) => ({ default: module.SubscriptionsPage })))
const SupportAlertsPage = lazy(() => import('./pages/SupportAlertsPage').then((module) => ({ default: module.SupportAlertsPage })))
const UsersPage = lazy(() => import('./pages/UsersPage').then((module) => ({ default: module.UsersPage })))

function PageLoader() {
  return <Stack sx={{ minHeight: 240, placeItems: 'center' }}><CircularProgress aria-label="Chargement de la page" /></Stack>
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/support-alerts" element={<SupportAlertsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/communications" element={<CommunicationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
      </Routes>
    </Suspense>
  )
}

export default App
