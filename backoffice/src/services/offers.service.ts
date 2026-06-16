import { apiRequest } from './api'
import type { AdminOffer, OfferPayload } from '../types/offer'

export const getAdminOffers = () => apiRequest<{ offers: AdminOffer[] }>('/admin/offers')

export const createAdminOffer = (payload: OfferPayload) =>
  apiRequest<{ offer: AdminOffer }>('/admin/offers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateAdminOffer = (id: string, payload: Partial<OfferPayload>) =>
  apiRequest<{ offer: AdminOffer }>(`/admin/offers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
