import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { users } from '../db/schema.js'
import type { PublicUser } from '../types/auth.js'
import type { LoginInput, RegisterInput } from '../validation/auth.schemas.js'
import { AppError } from '../utils/app-error.js'
import { createAuthToken } from '../utils/jwt.js'

const selection = { id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, role: users.role }
const session = (user: PublicUser) => ({ user, token: createAuthToken({ sub: user.id, email: user.email, role: user.role }) })

export async function registerUser(input: RegisterInput) {
  const database = requireDb()
  const [existing] = await database.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1)
  if (existing) throw new AppError(409, 'Un compte existe deja avec cette adresse email.')
  const [user] = await database.insert(users).values({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    rgpdConsent: input.rgpdConsent,
    rgpdConsentedAt: new Date(),
  }).returning(selection)
  if (!user) throw new AppError(500, "Le compte n'a pas pu etre cree.")
  return session(user)
}

export async function loginUser(input: LoginInput) {
  const database = requireDb()
  const [user] = await database.select({ ...selection, passwordHash: users.passwordHash }).from(users).where(eq(users.email, input.email)).limit(1)
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new AppError(401, 'Email ou mot de passe incorrect.')
  const { passwordHash: _passwordHash, ...publicUser } = user
  return session(publicUser)
}

export async function getUserById(id: string) {
  const [user] = await requireDb().select(selection).from(users).where(eq(users.id, id)).limit(1)
  if (!user) throw new AppError(404, 'Utilisateur introuvable.')
  return user
}
