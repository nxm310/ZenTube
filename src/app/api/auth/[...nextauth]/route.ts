import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const handler = (req: NextRequest, ctx: any) => {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";

  // Si déployé sur Vercel, force automatiquement NEXTAUTH_URL sur le bon domaine actif
  if (host && !host.includes("localhost")) {
    process.env.NEXTAUTH_URL = `${proto}://${host}`;
  }

  return (NextAuth as any)(authOptions)(req, ctx);
};

export { handler as GET, handler as POST };
