import { migrate } from 'drizzle-orm/postgres-js/migrator'
import path from 'node:path'
import { closeDb, db, isDatabaseConfigured } from './client.js'

const migrationsFolder = process.env.DRIZZLE_MIGRATIONS_FOLDER ?? path.resolve(process.cwd(), 'drizzle')

async function runMigrations() {
  if (!isDatabaseConfigured || !db) {
    console.info('[db:migrate] DATABASE_URL absente, migrations ignorees.')
    return
  }

  await migrate(db, { migrationsFolder })
  console.info('[db:migrate] Migrations appliquees.')
}

runMigrations()
  .catch((error) => {
    console.error('[db:migrate] Echec des migrations.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
  })
