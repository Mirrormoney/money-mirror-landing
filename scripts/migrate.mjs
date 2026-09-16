import { Client } from 'pg'
import { readdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import nextEnv from '@next/env'
nextEnv.loadEnvConfig(process.cwd(), true)
if (!process.env.MIRROR_DATABASE_URL) throw new Error('MIRROR_DATABASE_URL is required')
const client = new Client({ connectionString: process.env.MIRROR_DATABASE_URL })
try {
  await client.connect()
  await client.query('SELECT pg_advisory_lock(674429151)')
  await client.query('CREATE TABLE IF NOT EXISTS "_MirrorMigrations" (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())')
  const folders = (await readdir('prisma/migrations', { withFileTypes: true })).filter(f => f.isDirectory()).map(f => f.name).sort()
  for (const folder of folders) {
    const sql = await readFile(`prisma/migrations/${folder}/migration.sql`, 'utf8')
    const checksum = createHash('sha256').update(sql).digest('hex')
    const existing = await client.query('SELECT checksum FROM "_MirrorMigrations" WHERE name = $1', [folder])
    if (existing.rows.length) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration was modified: ${folder}`)
      continue
    }
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO "_MirrorMigrations" (name, checksum) VALUES ($1, $2)', [folder, checksum])
      await client.query('COMMIT')
      console.log(`Applied ${folder}`)
    } catch (error) { await client.query('ROLLBACK'); throw error }
  }
  console.log('Database is up to date.')
} catch (error) {
  console.error('Migration failed:', error.code ?? error.name)
  process.exitCode = 1
} finally { await client.end() }
