import type { AdminDocument } from '../types/document'
import type { AdminPayment } from '../types/payment'
import type { AdminProfile, AdminSubscriptionItem } from '../types/subscription'

export const documentTypeLabels: Record<string, string> = {
  identity: "Piece d'identite",
  proof_of_address: 'Justificatif de domicile',
  eligibility: "Justificatif d'eligibilite",
  school_certificate: 'Certificat de scolarite',
  tax_notice: 'Avis fiscal',
  other: 'Autre document',
}

export const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  user: 'Utilisateur',
}

export function documentTypeLabel(type: string) {
  return documentTypeLabels[type] ?? type
}

export function profileName(profile: AdminProfile | null | undefined) {
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigne'
}

export function userName(user: AdminSubscriptionItem['user']) {
  return user ? `${user.firstName} ${user.lastName}` : 'Non renseigne'
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : 'Non renseigne'
}

export function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('fr-FR') : 'Non renseigne'
}

export function formatAmount(payment: AdminPayment) {
  return new Intl.NumberFormat('fr-FR', { currency: payment.currency, style: 'currency' }).format(payment.amountCents / 100)
}

export function hasDocumentIssue(row: AdminSubscriptionItem) {
  return row.documents.some((document) => ['pending', 'needs_manual_review', 'rejected', 'analyzing'].includes(document.status))
}

export function hasPaymentIssue(row: AdminSubscriptionItem) {
  return row.payments.some((payment) => ['rejected', 'cancelled'].includes(payment.status))
}

export function hasAcceptedPayment(row: AdminSubscriptionItem) {
  return row.payments.some((payment) => ['accepted', 'regularized'].includes(payment.status))
}

export function documentFileLabel(document: AdminDocument) {
  return document.originalFilename ?? document.fileUrl
}

export function documentConfidence(document: AdminDocument) {
  const result = document.analysisResult
  return result && typeof result === 'object' && 'confidence' in result && typeof result.confidence === 'number'
    ? `${result.confidence}%`
    : 'Non analysee'
}

export function documentWarnings(document: AdminDocument) {
  const result = document.analysisResult
  return result && typeof result === 'object' && 'warnings' in result && Array.isArray(result.warnings)
    ? result.warnings.join(' ')
    : ''
}

export function dossierPriority(row: AdminSubscriptionItem) {
  if (hasPaymentIssue(row) || row.subscription.status === 'rejected' || row.subscription.status === 'suspended') return 'high'
  if (hasDocumentIssue(row) || row.subscription.status === 'pending_documents') return 'medium'
  if (row.subscription.status === 'pending_validation' || row.subscription.status === 'pending_payment') return 'low'
  return 'none'
}
