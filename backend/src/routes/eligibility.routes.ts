import { Router } from 'express'
import {
  checkAmethyst,
  checkScholarship,
  checkSenior,
  checkTst,
  explainEligibilityController,
  listEligibilityRules,
} from '../controllers/eligibility.controller.js'
import { validateBody } from '../middleware/validate.js'
import {
  amethystEligibilitySchema,
  explainEligibilitySchema,
  scholarshipEligibilitySchema,
  seniorEligibilitySchema,
  tstEligibilitySchema,
} from '../validation/eligibility.schemas.js'

export const eligibilityRouter = Router()

eligibilityRouter.post('/tst/check', validateBody(tstEligibilitySchema), checkTst)
eligibilityRouter.post('/scholarship/check', validateBody(scholarshipEligibilitySchema), checkScholarship)
eligibilityRouter.post('/senior/check', validateBody(seniorEligibilitySchema), checkSenior)
eligibilityRouter.post('/amethyst/check', validateBody(amethystEligibilitySchema), checkAmethyst)
eligibilityRouter.get('/rules', listEligibilityRules)
eligibilityRouter.post('/explain', validateBody(explainEligibilitySchema), explainEligibilityController)
