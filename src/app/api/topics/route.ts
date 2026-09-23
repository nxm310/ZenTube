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
      // Piliers par défaut en mode découverte / non connecté
      return NextResponse.json({
        topics: [
          {
            id: "default-1",
            title: "Architecture Logicielle & Dev",
            keywords: ["nextjs", "distributed systems", "typescript"],
            weight: 1.0,
            pausedUntil: null,
          },
          {
            id: "default-2",
            title: "Astronomie & Exploration",
            keywords: ["james webb", "astrophysique", "trous noirs"],
            weight: 0.8,
            pausedUntil: null,
          },
          {
            id: "default-3",
            title: "Documentaires & Histoire",
            keywords: ["géopolitique", "histoire contemporaine"],
            weight: 0.6,
            pausedUntil: null,
          },
        ],
      });
    }

    const topics = await prisma.topicPillar.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Erreur GET topics:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const body = await req.json();
    const { title, keywords, weight } = body;

    if (!title) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    const newTopic = await prisma.topicPillar.create({
      data: {
        userId,
        title,
        keywords: keywords || [],
        weight: weight !== undefined ? parseFloat(weight) : 1.0,
      },
    });

    return NextResponse.json({ topic: newTopic });
  } catch (error) {
    console.error("Erreur POST topics:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    await prisma.topicPillar.deleteMany({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE topics:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
