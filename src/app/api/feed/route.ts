import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateSmartFeed } from "@/lib/algorithms/feedAggregator";
import { CleanVideoItem } from "@/types";

export const dynamic = "force-dynamic";

// Exemple de fallback pour les utilisateurs en mode démo / sans compte connecté
const DEMO_FALLBACK_FEED: CleanVideoItem[] = [
  {
    id: "kJQP7kiw5Fk",
    title: "Comprendre les architectures distribuées modernes",
    originalTitle: "Comprendre les ARCHITECTURES DISTRIBUÉES modernes !!!",
    channelTitle: "Tech Architecture Insights",
    channelId: "UC_demo_tech",
    publishedAt: new Date().toISOString(),
    duration: "18:24",
    thumbnailUrl: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    sourceType: "SERENDIPITY",
    topicPillar: "Architecture Logicielle",
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Les mystères des trous noirs supermassifs expliqués",
    originalTitle: "LES MYSTÈRES INCROYABLES DES TROUS NOIRS SUPERMASSIFS !",
    channelTitle: "Astronomie Quotidienne",
    channelId: "UC_demo_astro",
    publishedAt: new Date().toISOString(),
    duration: "24:10",
    thumbnailUrl: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    sourceType: "SERENDIPITY",
    topicPillar: "Astronomie & Espace",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "Lofi Beats pour session de concentration & code",
    originalTitle: "Lofi Beats to relax/study to",
    channelTitle: "Lofi Girl",
    channelId: "UCSJ4gkVC6NrvII8umztf0Ow",
    publishedAt: new Date().toISOString(),
    duration: "45:00",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    sourceType: "SUBSCRIPTION",
  },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      // Retourne le flux de démonstration si non connecté
      return NextResponse.json({
        feed: DEMO_FALLBACK_FEED,
        isDemo: true,
      });
    }

    const userId = (session.user as any).id;
    const accessToken = (session as any).accessToken;

    const feed = await generateSmartFeed(userId, accessToken);

    return NextResponse.json({
      feed: feed.length > 0 ? feed : DEMO_FALLBACK_FEED,
      isDemo: feed.length === 0,
    });
  } catch (error) {
    console.error("Erreur API Feed:", error);
    return NextResponse.json(
      { error: "Impossible de générer le flux", feed: DEMO_FALLBACK_FEED },
      { status: 500 }
    );
  }
}
