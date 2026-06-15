export type UserRole = 'user' | 'admin'
export interface AuthTokenPayload { sub: string; email: string; role: UserRole }
export interface PublicUser { id: string; firstName: string; lastName: string; email: string; role: UserRole }
