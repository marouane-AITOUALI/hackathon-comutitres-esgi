import { apiRequest } from './api'
import type { AdminPayment } from '../types/payment'

export const regularizePayment = (id: string, note?: string) =>
  apiRequest<{ payment: AdminPayment }>(`/payments/${id}/regularize`, {
    method: 'POST',
    body: JSON.stringify({ note: note || 'Regularisation effectuee depuis le backoffice.' }),
  })
