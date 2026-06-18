import type { DocumentStatus, PaymentStatus, SubscriptionStatus, SubscriptionWorkflowState } from '../types'

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  draft: 'Brouillon',
  pending_documents: 'Documents attendus',
  pending_payment: 'Paiement attendu',
  pending_validation: 'En validation',
  accepted: 'Validé',
  rejected: 'Refusé',
  cancelled: 'Annulé',
  suspended: 'Suspendu',
}

export const workflowStateLabels: Record<SubscriptionWorkflowState, string> = {
  documents_required: 'Documents requis',
  payment_required: 'Paiement requis',
  ready_to_submit: 'Prêt à envoyer',
  under_review: 'En validation',
  needs_action: 'Action requise',
  approved: 'Validé',
  rejected: 'Refusé',
  cancelled: 'Annulé',
  suspended: 'Suspendu',
}

export const documentStatusLabels: Record<DocumentStatus, string> = {
  pending: 'En attente',
  analyzing: 'Analyse en cours',
  validated: 'Validé',
  rejected: 'Refusé',
  needs_manual_review: 'Revue manuelle',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  simulated: 'Simulation',
  pending: 'En attente',
  accepted: 'Accepté',
  rejected: 'Refusé',
  cancelled: 'Annulé',
  regularized: 'Régularisé',
}
