import { Router } from 'express'
import { compare, getConditions, getOffer, getOffers, getRequiredDocuments } from '../controllers/offers.controller.js'

export const offersRouter = Router()

offersRouter.get('/', getOffers)
offersRouter.get('/compare', compare)
offersRouter.get('/:code', getOffer)
offersRouter.get('/:code/conditions', getConditions)
offersRouter.get('/:code/required-documents', getRequiredDocuments)
