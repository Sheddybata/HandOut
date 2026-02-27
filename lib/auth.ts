import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/users";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await findUserByEmail(credentials.email);
        if (user && (await bcrypt.compare(credentials.password, user.passwordHash))) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            school: user.school,
            phone: user.phone,
          };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", newUser: "/" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.school = (user as { school?: string }).school;
        token.phone = (user as { phone?: string }).phone;
        token.authProvider = "credentials";
      }
      token.authProvider = token.authProvider ?? "credentials";
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.school = token.school as string | undefined;
        session.user.phone = token.phone as string | undefined;
        session.user.authProvider = token.authProvider as "credentials" | undefined;
      }
      return session;
    },
  },
};
