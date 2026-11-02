// Applies src/db/schema.sql to the database in DATABASE_URL, without importing
// anything. Every statement is idempotent, and it runs in its own short
// transaction, so it's safe to run repeatedly and against the live database.
//
//   npx tsc && node --env-file=.env dist/scripts/applySchema.js
import { readFileSync } from 'fs'
import { join } from 'path'
import { getPool } from '../lib/db'

async function main(): Promise<void> {
  try {
    await getPool().query(readFileSync(join(__dirname, '../../src/db/schema.sql'), 'utf8'))
    console.log('Schema applied')
  } finally {
    await getPool().end()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
