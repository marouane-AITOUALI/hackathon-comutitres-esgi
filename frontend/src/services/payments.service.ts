import type { PaymentSummary } from '../types'
import { apiRequest } from './api'

export const simulatePayment = (payload: { subscriptionId: string; paymentMode?: 'one_time' | 'monthly' | 'weekly' | 'usage' }) =>
  apiRequest<{ simulation: { amountCents: number; feesCents: number; totalCents: number; currency: string; warnings: string[] }; payment: PaymentSummary | null }>('/payments/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const createDirectPayment = (payload: { subscriptionId: string; cardToken?: string; simulateFailure?: boolean }) =>
  apiRequest<{ payment: PaymentSummary }>('/payments/direct', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const createMandatePayment = (payload: { subscriptionId: string; holderName: string; ibanLast4: string; mandateAccepted: boolean }) =>
  apiRequest<{ payment: PaymentSummary }>('/payments/mandate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const getPayment = (id: string) =>
  apiRequest<{ payment: PaymentSummary }>(`/payments/${id}`)

export const cancelPayment = (id: string) =>
  apiRequest<{ payment: PaymentSummary }>(`/payments/${id}/cancel`, {
    method: 'POST',
  })

export const regularizePayment = (id: string, note?: string) =>
  apiRequest<{ payment: PaymentSummary }>(`/payments/${id}/regularize`, {
    method: 'POST',
    body: JSON.stringify({ note: note ?? 'Regularisation depuis l espace client.' }),
  })
