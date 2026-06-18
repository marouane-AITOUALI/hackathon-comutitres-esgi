import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'
import { AppError } from '../utils/app-error.js'

export const AVATARS_BUCKET = 'user-avatars'
export const DOCUMENTS_BUCKET = 'subscription-documents'

const signedUrlTtlSeconds = 60 * 15
export const DOCUMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024
export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024

export const DOCUMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const

export const AVATAR_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

const documentMimeTypes = new Set<string>(DOCUMENT_ALLOWED_MIME_TYPES)
const avatarMimeTypes = new Set<string>(AVATAR_ALLOWED_MIME_TYPES)

let storageClient: SupabaseClient | null = null

export interface UploadedFileMetadata {
  bucket: string
  path: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
}

function requireStorageClient() {
  if (storageClient) return storageClient
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new AppError(500, 'Configuration Supabase Storage manquante cote serveur.')
  }

  storageClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return storageClient
}

function hasStorageConfiguration() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey)
}

function safeOriginalFilename(value: string) {
  const basename = value.split(/[\\/]/).filter(Boolean).at(-1) ?? 'fichier'
  return basename.normalize('NFKC').replace(/[^\w.\- ]/g, '_').slice(0, 180) || 'fichier'
}

function extensionFor(file: Express.Multer.File) {
  const originalExtension = safeOriginalFilename(file.originalname).split('.').at(-1)?.toLowerCase()
  if (originalExtension && /^[a-z0-9]{2,5}$/.test(originalExtension)) return `.${originalExtension}`
  if (file.mimetype === 'application/pdf') return '.pdf'
  if (file.mimetype === 'image/jpeg') return '.jpg'
  if (file.mimetype === 'image/png') return '.png'
  if (file.mimetype === 'image/webp') return '.webp'
  if (file.mimetype === 'image/heic') return '.heic'
  return ''
}

function assertFile(file: Express.Multer.File | undefined, allowedMimeTypes: Set<string>, maxSizeBytes: number) {
  if (!file) throw new AppError(400, 'Aucun fichier fourni.')
  if (!allowedMimeTypes.has(file.mimetype)) throw new AppError(400, 'Format de fichier non autorise.')
  if (file.size <= 0) throw new AppError(400, 'Le fichier est vide.')
  if (file.size > maxSizeBytes) throw new AppError(413, 'Le fichier depasse la taille autorisee.')
}

async function uploadBuffer(bucket: string, path: string, file: Express.Multer.File) {
  const { error } = await requireStorageClient()
    .storage
    .from(bucket)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (error) throw new AppError(502, "Le fichier n'a pas pu etre stocke.", error.message)
}

export async function uploadAvatarFile(userId: string, file: Express.Multer.File): Promise<UploadedFileMetadata> {
  assertFile(file, avatarMimeTypes, AVATAR_MAX_SIZE_BYTES)
  const path = `users/${userId}/${randomUUID()}${extensionFor(file)}`
  await uploadBuffer(AVATARS_BUCKET, path, file)

  return {
    bucket: AVATARS_BUCKET,
    path,
    originalFilename: safeOriginalFilename(file.originalname),
    mimeType: file.mimetype,
    sizeBytes: file.size,
  }
}

export async function uploadSubscriptionDocumentFile(
  userId: string,
  subscriptionId: string,
  type: string,
  file: Express.Multer.File,
): Promise<UploadedFileMetadata> {
  assertFile(file, documentMimeTypes, DOCUMENT_MAX_SIZE_BYTES)
  const path = `users/${userId}/subscriptions/${subscriptionId}/${type}/${randomUUID()}${extensionFor(file)}`
  await uploadBuffer(DOCUMENTS_BUCKET, path, file)

  return {
    bucket: DOCUMENTS_BUCKET,
    path,
    originalFilename: safeOriginalFilename(file.originalname),
    mimeType: file.mimetype,
    sizeBytes: file.size,
  }
}

export async function createPrivateSignedUrl(bucket: string | null | undefined, path: string | null | undefined) {
  if (!bucket || !path) return null
  if (!hasStorageConfiguration()) return null
  const { data, error } = await requireStorageClient().storage.from(bucket).createSignedUrl(path, signedUrlTtlSeconds)
  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes('not found') || message.includes('introuvable')) return null
    throw new AppError(502, "L'URL securisee du fichier n'a pas pu etre generee.", error.message)
  }
  return data.signedUrl
}

export async function removePrivateObject(bucket: string | null | undefined, path: string | null | undefined) {
  if (!bucket || !path) return
  if (!hasStorageConfiguration()) return
  const { error } = await requireStorageClient().storage.from(bucket).remove([path])
  if (error) throw new AppError(502, "L'ancien fichier n'a pas pu etre supprime.", error.message)
}
