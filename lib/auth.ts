import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "./prisma";
import { resend } from "./resend";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      from: "Scrollr <noreply@scrollr.io>",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await resend.emails.send({
          from: "Scrollr <noreply@scrollr.io>",
          to: email,
          subject: "Sign in to Scrollr",
          html: `
            <div style="font-family: sans-serif; max-width: 460px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="font-size: 24px; font-weight: 700; color: #09090b; margin-bottom: 24px;">
                Scrollr
              </h1>
              <p style="font-size: 16px; color: #27272a; margin-bottom: 24px;">
                Click the button below to sign in to your account.
              </p>
              <a href="${url}" style="display: inline-block; background: #c8ff00; color: #000; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Sign in to Scrollr
              </a>
              <p style="font-size: 13px; color: #71717a; margin-top: 24px;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </div>
          `,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { username: true },
      });

      // If user exists but has no username, they need to complete registration
      // We still allow sign-in; the redirect happens in the jwt callback
      if (dbUser && !dbUser.username) {
        return true;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, username: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the user doesn't have a username yet, redirect to register
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
};

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string | null;
  }
}
