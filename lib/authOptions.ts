import type { NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [EmailProvider({ server: process.env.EMAIL_SERVER!, from: process.env.EMAIL_FROM! })],
  pages: { signIn: "/login" },
}
