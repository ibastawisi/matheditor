import { User, prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import { findUserByEmail, updateUser } from "@/repositories/user";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async signIn({ user, account, profile }) {
      const existingUser = await findUserByEmail(user.email!);
      if (!existingUser) return true;
      if (existingUser.emailVerified) return true;
      await updateUser(existingUser.id, {
        name: user.name!,
        image: user.image,
        emailVerified: new Date(),
      });
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = await findUserByEmail(session.user.email);
        if (!user) return session;
        session.user = user;
      }
      return session
    }
  }
};