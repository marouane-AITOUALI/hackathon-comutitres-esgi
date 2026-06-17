import multer from 'multer'
import type { RequestHandler } from 'express'
import { AppError } from '../utils/app-error.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
})

function normalizeUploadError(error: unknown): never {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') throw new AppError(413, 'Le fichier depasse la taille autorisee.')
    throw new AppError(400, 'Le fichier envoye est invalide.')
  }
  throw error
}

export const singleFileUpload: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    try {
      normalizeUploadError(error)
    } catch (normalizedError) {
      next(normalizedError)
    }
  })
}
