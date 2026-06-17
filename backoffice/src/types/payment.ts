export type PaymentStatus = 'simulated' | 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'regularized'
export type PaymentType = 'simulation' | 'direct' | 'mandate' | 'regularization'

export interface AdminPayment {
  id: string
  userId: string
  subscriptionId: string
  type: PaymentType
  status: PaymentStatus
  amountCents: number
  currency: string
  provider: string
  externalReference?: string | null
  metadata?: Record<string, unknown>
  processedAt?: string | null
  createdAt: string
  updatedAt: string
}
