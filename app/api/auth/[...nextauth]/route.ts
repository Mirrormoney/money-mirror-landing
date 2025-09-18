import NextAuth from "next-auth"
import EmailProvider from "next-auth/providers/email"
const handler = NextAuth({
  session: { strategy: "jwt" },
  providers: [EmailProvider({ server: process.env.EMAIL_SERVER!, from: process.env.EMAIL_FROM! })],
  pages: { signIn: "/login" },
})
export { handler as GET, handler as POST }
