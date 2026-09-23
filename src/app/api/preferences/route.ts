import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({
        preferences: {
          serendipityRatio: 30,
          cleanTitles: true,
          minDurationMins: 3,
        },
      });
    }

    let prefs = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.userPreference.create({
        data: {
          userId,
          serendipityRatio: 30,
          cleanTitles: true,
        },
      });
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("Erreur GET preferences:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { serendipityRatio, cleanTitles } = body;

    const updated = await prisma.userPreference.upsert({
      where: { userId },
      update: {
        ...(serendipityRatio !== undefined && { serendipityRatio }),
        ...(cleanTitles !== undefined && { cleanTitles }),
      },
      create: {
        userId,
        serendipityRatio: serendipityRatio ?? 30,
        cleanTitles: cleanTitles ?? true,
      },
    });

    return NextResponse.json({ preferences: updated });
  } catch (error) {
    console.error("Erreur PATCH preferences:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
