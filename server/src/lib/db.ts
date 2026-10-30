import { Pool } from 'pg'

let pool: Pool | undefined

// DigitalOcean managed Postgres signs its certificate with its own CA, so the
// CA must be supplied for the connection to verify. pg lets `sslmode` in the
// URL override the `ssl` option, so it is stripped and SSL is configured here.
export function getPool(): Pool {
  if (pool) return pool
  const databaseUrl = process.env.DATABASE_URL
  const ca = process.env.DATABASE_CA_CERT
  if (!databaseUrl) throw new Error('Missing DATABASE_URL environment variable')
  if (!ca) throw new Error('Missing DATABASE_CA_CERT environment variable')
  const url = new URL(databaseUrl)
  url.searchParams.delete('sslmode')
  // pg waits forever for a connection by default, so an unreachable database
  // (e.g. trusted sources not updated) would hang each request for minutes.
  pool = new Pool({ connectionString: url.toString(), ssl: { ca }, connectionTimeoutMillis: 5000 })
  return pool
}
