import type { RequestHandler } from 'express'
import { getUserTimeline } from '../services/lifecycle.service.js'
import { deleteUserAvatar, getUserAvatar, replaceUserAvatar } from '../services/user-files.service.js'
import { AppError } from '../utils/app-error.js'
import { timelineUserParamsSchema } from '../validation/renewal.schemas.js'

export const timeline: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  const { id } = timelineUserParamsSchema.parse(req.params)
  res.json(await getUserTimeline(req.auth.sub, req.auth.role, id))
}

export const avatar: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await getUserAvatar(req.auth.sub))
}

export const uploadAvatar: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.status(201).json(await replaceUserAvatar(req.auth.sub, req.file))
}

export const removeAvatar: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await deleteUserAvatar(req.auth.sub))
}
