import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { action, youtubeId, topicId, channelId } = body;

    if (!youtubeId || !action) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const userId = (session?.user as any)?.id;

    // Si utilisateur connecté, enregistrer en base
    if (userId) {
      // 1. Enregistrement de l'interaction
      await prisma.feedInteraction.create({
        data: {
          userId,
          youtubeId,
          topicId: topicId || null,
          type: action,
        },
      });

      // 2. Traitement spécifique par action
      if (action === "DISMISS" || action === "WATCH") {
        // Marquer comme vue
        await prisma.watchedVideo.upsert({
          where: {
            userId_youtubeId: { userId, youtubeId },
          },
          update: { watchedAt: new Date() },
          create: {
            userId,
            youtubeId,
            channelId: channelId || null,
            watchedAt: new Date(),
          },
        });
      } else if (action === "TOGGLE_WATCHED") {
        const existing = await prisma.watchedVideo.findUnique({
          where: { userId_youtubeId: { userId, youtubeId } },
        });

        if (existing) {
          await prisma.watchedVideo.delete({
            where: { userId_youtubeId: { userId, youtubeId } },
          });
          return NextResponse.json({ success: true, isWatched: false });
        } else {
          await prisma.watchedVideo.create({
            data: {
              userId,
              youtubeId,
              channelId: channelId || null,
              watchedAt: new Date(),
            },
          });
          return NextResponse.json({ success: true, isWatched: true });
        }
      } else if (action === "PAUSE_7D" && topicId) {
        // Mettre en pause le pilier pendant 7 jours
        const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.topicPillar.update({
          where: { id: topicId },
          data: { pausedUntil: sevenDaysLater },
        });
      }
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("Erreur API Interaction:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
