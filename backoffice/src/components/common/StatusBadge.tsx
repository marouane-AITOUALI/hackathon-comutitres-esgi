import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'

const labels: Record<string, string> = {
  draft: 'Brouillon',
  pending_documents: 'Documents attendus',
  pending_payment: 'Paiement attendu',
  pending_validation: 'A valider',
  accepted: 'Accepte',
  rejected: 'Refuse',
  suspended: 'Suspendu',
  cancelled: 'Annule',
  pending: 'En attente',
  analyzing: 'Analyse IA',
  validated: 'Valide',
  needs_manual_review: 'Revue manuelle',
  expired: 'Expire',
  paid: 'Paye',
  failed: 'Echec',
  info: 'Info',
  warning: 'Attention',
  error: 'Critique',
}

function colorFor(status: string): ChipProps['color'] {
  if (['accepted', 'validated', 'paid', 'regularized'].includes(status)) return 'success'
  if (['rejected', 'failed', 'expired', 'error'].includes(status)) return 'error'
  if (['pending', 'pending_documents', 'pending_payment', 'needs_manual_review', 'suspended', 'warning'].includes(status)) return 'warning'
  if (['pending_validation', 'analyzing', 'info'].includes(status)) return 'primary'
  return 'default'
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <Chip color={colorFor(status)} label={label ?? labels[status] ?? status} size="small" variant="filled" />
}
