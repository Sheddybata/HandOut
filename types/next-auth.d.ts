import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      school?: string;
      phone?: string;
      authProvider?: "credentials";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    school?: string;
    phone?: string;
    authProvider?: "credentials";
  }
}
