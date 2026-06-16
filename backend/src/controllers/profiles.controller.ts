import type { RequestHandler } from 'express'
import { z } from 'zod'
import { AppError } from '../utils/app-error.js'
import { createProfile, deleteProfile, getProfile, getProfileLifecycle, listProfiles, updateProfile } from '../services/profiles.service.js'

const profileId = (value: string) => z.uuid().parse(value)

export const indexProfiles: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await listProfiles(req.auth.sub))
}

export const storeProfile: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.status(201).json(await createProfile(req.auth.sub, req.body))
}

export const showProfile: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await getProfile(req.auth.sub, profileId(req.params.id)))
}

export const updateProfileController: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await updateProfile(req.auth.sub, profileId(req.params.id), req.body))
}

export const destroyProfile: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await deleteProfile(req.auth.sub, profileId(req.params.id)))
}

export const profileLifecycle: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await getProfileLifecycle(req.auth.sub, profileId(req.params.id)))
}