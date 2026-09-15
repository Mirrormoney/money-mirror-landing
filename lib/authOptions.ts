import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Apple from 'next-auth/providers/apple'
import Email from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import { verifyPassword } from './password'
import { limit } from './http'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login', error: '/login', verifyRequest: '/login?sent=1' },
  providers: [
    Credentials({
      name: 'Email and password',
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(credentials, request) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password
        if (!email || !password || password.length > 128 || email.length > 254) return null
        try {
          const ip = String(request.headers?.['x-forwarded-for'] ?? 'unknown').split(',')[0]
          await limit(`login-ip:${ip}`, 30, 900)
          await limit(`login-email:${email}`, 10, 900)
          const user = await prisma.user.findUnique({ where: { email } })
          // Equal-cost work for unknown accounts prevents a useful timing oracle.
          const dummy = 'scrypt:00000000000000000000000000000000:' + '0'.repeat(128)
          const valid = await verifyPassword(password, user?.passwordHash ?? dummy)
          if (!user || !user.passwordHash || !valid) return null
          return { id: user.id, email: user.email, name: user.name, image: user.image }
        } catch { return null }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : []),
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET ? [Apple({ clientId: process.env.APPLE_CLIENT_ID, clientSecret: process.env.APPLE_CLIENT_SECRET })] : []),
    ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM ? [Email({ server: process.env.EMAIL_SERVER, from: process.env.EMAIL_FROM })] : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        const account = await prisma.user.findUnique({ where: { id: user.id }, select: { sessionVersion: true } })
        token.version = account?.sessionVersion ?? 0
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ''
        session.user.version = typeof token.version === 'number' ? token.version : 0
      }
      return session
    },
  },
}
