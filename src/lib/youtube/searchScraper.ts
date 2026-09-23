import { OneShotVideo } from "@/types";

/**
 * Effectue une recherche réelle sur YouTube en temps réel.
 * Supporte le tri natif YouTube (date de mise en ligne, vues, pertinence).
 */
export async function searchYouTubeReal(
  query: string,
  sortBy: "date" | "relevance" | "views" = "relevance"
): Promise<OneShotVideo[]> {
  try {
    let spParam = "EgIQAQ%253D%253D"; // Par défaut : vidéo uniquement, tri pertinence

    if (sortBy === "date") {
      spParam = "CAISAhAB"; // Vidéo uniquement, tri par date d'upload (du plus récent au plus ancien)
    } else if (sortBy === "views") {
      spParam = "CAMSAhAB"; // Vidéo uniquement, tri par nombre de vues
    }

    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=${spParam}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`Erreur HTTP lors de la recherche YouTube: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Recherche de la variable ytInitialData dans le HTML
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (!match || !match[1]) {
      console.warn("ytInitialData non trouvé dans la réponse YouTube");
      return [];
    }

    const data = JSON.parse(match[1]);
    const sections =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    const videos: OneShotVideo[] = [];

    for (const section of sections) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        if (item.videoRenderer) {
          const v = item.videoRenderer;
          const videoId = v.videoId;
          if (!videoId) continue;

          const title =
            v.title?.runs?.[0]?.text ||
            v.title?.accessibility?.accessibilityData?.label ||
            "Vidéo sans titre";

          const channelTitle =
            v.ownerText?.runs?.[0]?.text ||
            v.shortBylineText?.runs?.[0]?.text ||
            "Chaîne YouTube";

          const thumbnails = v.thumbnail?.thumbnails || [];
          const bestThumb =
            thumbnails[thumbnails.length - 1]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          const publishedAt = v.publishedTimeText?.simpleText;

          videos.push({
            id: videoId,
            title,
            channelTitle,
            thumbnailUrl: bestThumb,
            publishedAt,
          });
        }
      }
    }

    return videos;
  } catch (error) {
    console.error("Exception searchYouTubeReal:", error);
    return [];
  }
}
