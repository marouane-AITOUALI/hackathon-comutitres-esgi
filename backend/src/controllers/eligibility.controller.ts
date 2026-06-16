import type { RequestHandler } from 'express'
import {
  checkAmethystEligibility,
  checkScholarshipEligibility,
  checkSeniorEligibility,
  checkTstEligibility,
  explainEligibility,
  getEligibilityRules,
} from '../services/eligibility.service.js'

export const checkTst: RequestHandler = async (req, res) => {
  res.json({ success: true, eligibility: await checkTstEligibility(req.body) })
}

export const checkScholarship: RequestHandler = async (req, res) => {
  res.json({ success: true, eligibility: await checkScholarshipEligibility(req.body) })
}

export const checkSenior: RequestHandler = async (req, res) => {
  res.json({ success: true, eligibility: await checkSeniorEligibility(req.body) })
}

export const checkAmethyst: RequestHandler = async (req, res) => {
  res.json({ success: true, eligibility: await checkAmethystEligibility(req.body) })
}

export const listEligibilityRules: RequestHandler = async (_req, res) => {
  res.json({ success: true, rules: getEligibilityRules() })
}

export const explainEligibilityController: RequestHandler = async (req, res) => {
  res.json({ success: true, explanation: await explainEligibility(req.body) })
}
