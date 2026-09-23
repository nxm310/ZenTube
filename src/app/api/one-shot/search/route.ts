import { NextResponse } from "next/server";
import { searchYouTubeReal } from "@/lib/youtube/searchScraper";
import { OneShotVideo } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const sort = (searchParams.get("sort") as "date" | "relevance" | "views") || "relevance";

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Requête vide", videos: [] }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_SERVER_KEY;

    // Si une clé d'API serveur est fournie, on tente l'API officielle
    if (apiKey && apiKey.trim().length > 0) {
      try {
        const orderParam = sort === "date" ? "date" : sort === "views" ? "viewCount" : "relevance";
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
            query
          )}&type=video&order=${orderParam}&maxResults=20&relevanceLanguage=fr&key=${apiKey}`
        );

        if (res.ok) {
          const data = await res.json();
          const videos: OneShotVideo[] = (data.items || [])
            .filter((item: any) => item.id?.videoId)
            .map((item: any) => ({
              id: item.id.videoId,
              title: item.snippet.title,
              channelTitle: item.snippet.channelTitle,
              thumbnailUrl:
                item.snippet.thumbnails?.high?.url ||
                item.snippet.thumbnails?.medium?.url ||
                `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
              publishedAt: item.snippet.publishedAt,
            }));

          if (videos.length > 0) {
            return NextResponse.json({ videos, source: "official_api" });
          }
        }
      } catch (e) {
        console.warn("Échec API officielle, basculement vers le moteur réel:", e);
      }
    }

    // Recherche directe en temps réel sur YouTube avec support du tri
    const realVideos = await searchYouTubeReal(query, sort);

    return NextResponse.json({ videos: realVideos, source: "live_youtube" });
  } catch (error) {
    console.error("Exception OneShot Search:", error);
    return NextResponse.json({ error: "Erreur serveur", videos: [] }, { status: 500 });
  }
}
