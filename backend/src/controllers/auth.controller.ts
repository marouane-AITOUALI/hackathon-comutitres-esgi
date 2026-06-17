import type { RequestHandler } from 'express'
import { getUserById, loginUser, registerUser, registerUserWithOnboarding, updateCurrentUser } from '../services/auth.service.js'
import { clearAuthCookie, setAuthCookie } from '../utils/auth-cookie.js'
import { AppError } from '../utils/app-error.js'

export const register: RequestHandler = async (req, res) => {
  const session = await registerUser(req.body)
  setAuthCookie(res, session.token)
  res.status(201).json(session)
}

export const registerWithOnboarding: RequestHandler = async (req, res) => {
  const session = await registerUserWithOnboarding(req.body)
  setAuthCookie(res, session.token)
  res.status(201).json(session)
}

export const login: RequestHandler = async (req, res) => {
  const session = await loginUser(req.body)
  setAuthCookie(res, session.token)
  res.json(session)
}

export const me: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await getUserById(req.auth.sub))
}

export const updateMe: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await updateCurrentUser(req.auth.sub, req.body))
}

export const logout: RequestHandler = async (_req, res) => {
  clearAuthCookie(res)
  res.status(204).send()
}
