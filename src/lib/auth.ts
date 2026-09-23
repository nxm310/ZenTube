import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const GOOGLE_YOUTUBE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

async function refreshGoogleAccessToken(token: any) {
  try {
    const url = "https://oauth2.googleapis.com/token";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();
    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in ?? 3600) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Erreur de rafraîchissement token Google OAuth:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// Vérifier si une vraie base distante est connectée
const isDatabaseAvailable = Boolean(
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.trim().length > 0 &&
  !process.env.DATABASE_URL.includes("localhost")
);

export const authOptions: NextAuthOptions = {
  // En production, si la base cloud n'est pas encore connectée, NextAuth fonctionne en mode JWT autonome sans crasher
  adapter: isDatabaseAvailable ? PrismaAdapter(prisma) : undefined,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "zentube-prod-secret-9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: GOOGLE_YOUTUBE_SCOPES,
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + (account.expires_at ?? 3600) * 1000,
          refreshToken: account.refresh_token,
          user: {
            id: user.id || token.sub,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        };
      }

      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number) - 60 * 1000) {
        return token;
      }

      return refreshGoogleAccessToken(token);
    },
    async session({ session, token }) {
      if (token?.user) {
        session.user = token.user as any;
      } else if (token?.sub) {
        (session.user as any) = { ...session.user, id: token.sub };
      }
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
