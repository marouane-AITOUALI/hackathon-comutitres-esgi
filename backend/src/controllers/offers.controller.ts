import type { RequestHandler } from 'express'
import { compareOffers, getOfferByCode, getOfferConditions, getOfferRequiredDocuments, listOffers } from '../services/offers.service.js'
import { compareOffersQuerySchema, listOffersQuerySchema, offerCodeParamsSchema } from '../validation/offer.schemas.js'

export const getOffers: RequestHandler = async (req, res) => {
  const query = listOffersQuerySchema.parse(req.query)
  res.json({ offers: await listOffers(query) })
}

export const getOffer: RequestHandler = async (req, res) => {
  const { code } = offerCodeParamsSchema.parse(req.params)
  res.json({ offer: await getOfferByCode(code) })
}

export const getRequiredDocuments: RequestHandler = async (req, res) => {
  const { code } = offerCodeParamsSchema.parse(req.params)
  res.json(await getOfferRequiredDocuments(code))
}

export const getConditions: RequestHandler = async (req, res) => {
  const { code } = offerCodeParamsSchema.parse(req.params)
  res.json(await getOfferConditions(code))
}

export const compare: RequestHandler = async (req, res) => {
  const query = compareOffersQuerySchema.parse(req.query)
  res.json(await compareOffers(query))
}
