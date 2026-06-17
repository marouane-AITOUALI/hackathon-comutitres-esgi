import type { AuthUser } from '../types'
import { apiRequest } from './api'

export interface UserAvatarResponse {
  avatar: {
    id: string
    ownerId: string
    storagePath: string
    originalFilename: string
    mimeType: string
    sizeBytes: number
    status: string
    createdAt: string
    updatedAt: string
  } | null
  avatarUrl: string | null
}

export const getMyAvatar = () => apiRequest<UserAvatarResponse>('/users/me/avatar')

export const replaceMyAvatar = (file: File) => {
  const formData = new FormData()
  formData.set('file', file)
  return apiRequest<UserAvatarResponse>('/users/me/avatar', {
    method: 'PUT',
    body: formData,
  })
}

export const deleteMyAvatar = () =>
  apiRequest<{ deleted: boolean }>('/users/me/avatar', {
    method: 'DELETE',
  })

export function userWithAvatar(user: AuthUser, avatarUrl: string | null): AuthUser {
  return { ...user, avatarUrl }
}
