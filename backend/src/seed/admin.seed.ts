import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { closeDb, requireDb } from '../db/client.js'
import { users } from '../db/schema.js'

const adminConfig = {
  email: process.env.ADMIN_EMAIL ?? 'admin@comutitres.fr',
  password: process.env.ADMIN_PASSWORD ?? 'Admin123!',
  firstName: process.env.ADMIN_FIRST_NAME ?? 'Admin',
  lastName: process.env.ADMIN_LAST_NAME ?? 'Comutitres',
}

const publicUserSelection = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  role: users.role,
}

export async function seedAdmin() {
  const database = requireDb()
  const passwordHash = await bcrypt.hash(adminConfig.password, 12)
  const [existing] = await database.select({ id: users.id }).from(users).where(eq(users.email, adminConfig.email)).limit(1)

  if (existing) {
    const [updated] = await database
      .update(users)
      .set({
        firstName: adminConfig.firstName,
        lastName: adminConfig.lastName,
        passwordHash,
        role: 'admin',
        rgpdConsent: true,
        rgpdConsentedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning(publicUserSelection)

    if (!updated) throw new Error("L'admin n'a pas pu etre mis a jour.")
    return updated
  }

  const [created] = await database
    .insert(users)
    .values({
      firstName: adminConfig.firstName,
      lastName: adminConfig.lastName,
      email: adminConfig.email,
      passwordHash,
      role: 'admin',
      rgpdConsent: true,
      rgpdConsentedAt: new Date(),
    })
    .returning(publicUserSelection)

  if (!created) throw new Error("L'admin n'a pas pu etre cree.")
  return created
}

if (process.argv[1]?.endsWith('admin.seed.ts')) {
  try {
    const admin = await seedAdmin()
    console.log(`Admin pret : ${admin.email}`)
  } finally {
    await closeDb()
  }
}
