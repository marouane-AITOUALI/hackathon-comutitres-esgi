import type { OfferRecommendation, OnboardingAnswer, OnboardingDraft, OnboardingResponse, RecommendationResponse } from '../types'
import { apiRequest } from './api'

export const ONBOARDING_KEY = 'comutitres_onboarding'
export const RECOMMENDATION_KEY = 'comutitres_recommendation'

export function saveRecommendationResult(rec: OfferRecommendation) {
  localStorage.setItem(RECOMMENDATION_KEY, JSON.stringify(rec))
}

export function getRecommendationResult(): OfferRecommendation | null {
  try {
    const raw = localStorage.getItem(RECOMMENDATION_KEY)
    return raw ? (JSON.parse(raw) as OfferRecommendation) : null
  } catch {
    return null
  }
}

export function clearRecommendationResult() {
  localStorage.removeItem(RECOMMENDATION_KEY)
}

export function getOnboardingDraft(): OnboardingDraft {
  try {
    return JSON.parse(localStorage.getItem(ONBOARDING_KEY) ?? '{}') as OnboardingDraft
  } catch {
    return {}
  }
}

export function saveOnboardingDraft(values: OnboardingDraft) {
  const draft = { ...getOnboardingDraft(), ...values }
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(draft))
  return draft
}

export function clearOnboardingDraft() {
  localStorage.removeItem(ONBOARDING_KEY)
}

export function calculateAge(birthDate: string) {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1
  return age
}

export const createOnboarding = (answer: OnboardingAnswer) =>
  apiRequest<OnboardingResponse>('/onboarding', {
    method: 'POST',
    body: JSON.stringify({
      subscriptionFor: answer.subscriptionFor,
      isBearerPayer: answer.isBearerPayer,
      currentStep: 'result',
      bearer: answer.bearer,
      payer: answer.isBearerPayer ? undefined : answer.payer,
      answers: {
        frequency: answer.frequency,
        planPreference: answer.planPreference,
        socialSituation: answer.socialSituation,
        support: answer.support,
        scholarship: answer.scholarship,
        solidarity: answer.solidarity,
        department: answer.department,
      },
    }),
  })

export const getRecommendation = (answer: OnboardingAnswer) =>
  apiRequest<RecommendationResponse>('/recommendations', {
    method: 'POST',
    body: JSON.stringify({
      age: calculateAge(answer.bearer.birthDate),
      status: answer.bearer.status,
      frequency: answer.frequency,
      planPreference: answer.planPreference,
      socialSituation: answer.socialSituation,
      support: answer.support,
      isBearerPayer: answer.isBearerPayer,
      scholarship: answer.scholarship,
      solidarity: answer.solidarity,
      department: answer.department || undefined,
    }),
  }).then((response) => response.recommendation)
