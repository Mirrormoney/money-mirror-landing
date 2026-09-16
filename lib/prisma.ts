import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
const globalDb = globalThis as unknown as { prisma?: PrismaClient }
// Prisma connects on the first query, so builds do not open a connection.
export const prisma = globalDb.prisma ?? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.MIRROR_DATABASE_URL }) })
if (process.env.NODE_ENV !== 'production') globalDb.prisma = prisma
