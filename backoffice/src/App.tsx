import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminLayout } from './components/layout/AdminLayout'
import { AuditLogsPage } from './pages/AuditLogsPage'
import { CommunicationsPage } from './pages/CommunicationsPage'
import { DashboardPage } from './pages/DashboardPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { LoginPage } from './pages/LoginPage'
import { OffersPage } from './pages/OffersPage'
import { SubscriptionDetailPage } from './pages/SubscriptionDetailPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { SupportAlertsPage } from './pages/SupportAlertsPage'
import { UsersPage } from './pages/UsersPage'

function App() {
  return (
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
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/communications" element={<CommunicationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  )
}

export default App
