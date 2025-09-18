// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

const providers = [];
if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

const handler = NextAuth({
  session: { strategy: "jwt" },   // switch to database later when DB is set
  providers,
  pages: { signIn: "/login" },
});

export { handler as GET, handler as POST };
