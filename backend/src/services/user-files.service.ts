import { eq } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { userAvatars } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import { createPrivateSignedUrl, removePrivateObject, uploadAvatarFile } from './storage.service.js'

const avatarSelection = {
  id: userAvatars.id,
  ownerId: userAvatars.ownerId,
  storageBucket: userAvatars.storageBucket,
  storagePath: userAvatars.storagePath,
  originalFilename: userAvatars.originalFilename,
  mimeType: userAvatars.mimeType,
  sizeBytes: userAvatars.sizeBytes,
  status: userAvatars.status,
  createdAt: userAvatars.createdAt,
  updatedAt: userAvatars.updatedAt,
}

type AvatarRow = typeof userAvatars.$inferSelect

async function publicAvatar(avatar: AvatarRow) {
  return {
    avatar,
    avatarUrl: await createPrivateSignedUrl(avatar.storageBucket, avatar.storagePath),
  }
}

export async function getUserAvatar(userId: string) {
  const [avatar] = await requireDb()
    .select(avatarSelection)
    .from(userAvatars)
    .where(eq(userAvatars.ownerId, userId))
    .limit(1)

  return avatar ? publicAvatar(avatar) : { avatar: null, avatarUrl: null }
}

export async function replaceUserAvatar(userId: string, file: Express.Multer.File | undefined) {
  if (!file) throw new AppError(400, 'Aucun fichier fourni.')

  const database = requireDb()
  const [current] = await database
    .select(avatarSelection)
    .from(userAvatars)
    .where(eq(userAvatars.ownerId, userId))
    .limit(1)

  const uploaded = await uploadAvatarFile(userId, file)

  try {
    const values = {
      ownerId: userId,
      storageBucket: uploaded.bucket,
      storagePath: uploaded.path,
      originalFilename: uploaded.originalFilename,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
      status: 'active',
      updatedAt: new Date(),
    }

    const [avatar] = current
      ? await database.update(userAvatars).set(values).where(eq(userAvatars.ownerId, userId)).returning(avatarSelection)
      : await database.insert(userAvatars).values(values).returning(avatarSelection)

    if (!avatar) throw new AppError(500, "L'avatar n'a pas pu etre enregistre.")

    if (current?.storagePath && current.storagePath !== uploaded.path) {
      await removePrivateObject(current.storageBucket, current.storagePath)
    }

    return publicAvatar(avatar)
  } catch (error) {
    await removePrivateObject(uploaded.bucket, uploaded.path)
    throw error
  }
}

export async function deleteUserAvatar(userId: string) {
  const database = requireDb()
  const [current] = await database
    .select(avatarSelection)
    .from(userAvatars)
    .where(eq(userAvatars.ownerId, userId))
    .limit(1)

  if (!current) return { deleted: false }

  await database.delete(userAvatars).where(eq(userAvatars.ownerId, userId))
  await removePrivateObject(current.storageBucket, current.storagePath)
  return { deleted: true }
}
