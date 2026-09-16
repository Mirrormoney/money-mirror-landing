import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
const derive = promisify(scrypt)
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const key = await derive(password, salt, 64) as Buffer
  return `scrypt:${salt}:${key.toString('hex')}`
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hex] = stored.split(':')
  if (algorithm !== 'scrypt' || !salt || !hex || hex.length !== 128) return false
  const key = await derive(password, salt, 64) as Buffer
  return timingSafeEqual(new Uint8Array(key), new Uint8Array(Buffer.from(hex, 'hex')))
}
export function validPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128
}
