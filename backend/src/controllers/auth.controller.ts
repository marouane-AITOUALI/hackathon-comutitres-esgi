import type { RequestHandler } from 'express'
import { getUserById, loginUser, registerUser } from '../services/auth.service.js'
import { AppError } from '../utils/app-error.js'
export const register: RequestHandler = async (req, res) => { res.status(201).json(await registerUser(req.body)) }
export const login: RequestHandler = async (req, res) => { res.json(await loginUser(req.body)) }
export const me: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json({ user: await getUserById(req.auth.sub) })
}
