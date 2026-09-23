import { XMLParser } from "fast-xml-parser";
import { CleanVideoItem } from "@/types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export async function fetchChannelVideosViaRSS(channelId: string): Promise<CleanVideoItem[]> {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache Next.js 1h
    });

    if (!response.ok) {
      console.warn(`Impossible de récupérer le flux RSS pour ${channelId}: status ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    const data = parser.parse(xmlText);

    const feed = data.feed;
    if (!feed || !feed.entry) {
      return [];
    }

    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

    return entries.map((entry: any) => {
      const videoId = entry["yt:videoId"] || entry.id?.replace("yt:video:", "");
      const mediaGroup = entry["media:group"];
      const thumbnail =
        mediaGroup?.["media:thumbnail"]?.["@_url"] ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        id: videoId,
        title: entry.title || "Sans titre",
        originalTitle: entry.title || "Sans titre",
        channelTitle: feed.title || entry.author?.name || "Chaîne",
        channelId: entry["yt:channelId"] || channelId,
        publishedAt: entry.published || new Date().toISOString(),
        thumbnailUrl: thumbnail,
        sourceType: "SUBSCRIPTION",
      };
    });
  } catch (error) {
    console.error(`Erreur lors de la lecture du flux RSS pour ${channelId}:`, error);
    return [];
  }
}
