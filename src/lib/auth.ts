import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail } from "@/repositories/user";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        const user = await findUserByEmail(session.user.email);
        if (!user) return session;
        session.user = JSON.parse(JSON.stringify(user));
      }
      return session
    }
  }
};