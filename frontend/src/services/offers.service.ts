import type { OfferSummary, OffersResponse } from '../types'
import { apiRequest } from './api'

export const listOffers = () => apiRequest<OffersResponse>('/offers').then(({ offers }) => offers)

export const getOfferByCode = (code: string) =>
  apiRequest<{ offer: OfferSummary }>(`/offers/${code}`).then(({ offer }) => offer)