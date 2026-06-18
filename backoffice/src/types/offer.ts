export interface AdminOffer {
  id: string
  code: string
  name: string
  description?: string | null
  target: string
  requiredDocuments: string[]
  priceCents: number
  monthlyInstallmentCount: number | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface OfferPayload {
  code: string
  name: string
  description?: string
  target: string
  requiredDocuments: string[]
  priceCents: number
  monthlyInstallmentCount: number | null
  isActive: boolean
}
