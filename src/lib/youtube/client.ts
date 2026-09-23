import { CleanVideoItem } from "@/types";
import { cache } from "@/lib/cache/redis";

/**
 * Récupère les abonnements de l'utilisateur (Coût : 1 unité par page de 50)
 */
export async function getUserSubscriptions(accessToken: string): Promise<{ channelId: string; title: string }[]> {
  const cacheKey = `user_subs:${accessToken.slice(-10)}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      console.error("Erreur lors de la récupération des abonnements:", await res.text());
      return [];
    }

    const data = await res.json();
    const subs = (data.items || []).map((item: any) => ({
      channelId: item.snippet.resourceId.channelId,
      title: item.snippet.title,
    }));

    // Cache pendant 6 heures
    await cache.set(cacheKey, JSON.stringify(subs), 21600);
    return subs;
  } catch (error) {
    console.error("Exception getUserSubscriptions:", error);
    return [];
  }
}

/**
 * Récupère les dernières vidéos d'une chaîne via sa playlist Uploads (UU...)
 * Coût : 1 unité pour jusqu'à 50 vidéos (au lieu de 100 unités pour search.list)
 */
export async function getChannelUploads(channelId: string, accessToken?: string): Promise<CleanVideoItem[]> {
  const uploadsPlaylistId = "UU" + channelId.substring(2);
  const cacheKey = `channel_uploads:${uploadsPlaylistId}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const apiKey = process.env.YOUTUBE_API_SERVER_KEY;
  const url = accessToken
    ? `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10`
    : `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`;

  const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];

    const data = await res.json();
    const videos: CleanVideoItem[] = (data.items || []).map((pItem: any) => ({
      id: pItem.snippet.resourceId.videoId,
      title: pItem.snippet.title,
      originalTitle: pItem.snippet.title,
      channelTitle: pItem.snippet.channelTitle,
      channelId: pItem.snippet.channelId,
      publishedAt: pItem.snippet.publishedAt,
      thumbnailUrl:
        pItem.snippet.thumbnails?.medium?.url ||
        `https://i.ytimg.com/vi/${pItem.snippet.resourceId.videoId}/hqdefault.jpg`,
      sourceType: "SUBSCRIPTION" as const,
    }));

    await cache.set(cacheKey, JSON.stringify(videos), 3600); // 1h cache
    return videos;
  } catch (err) {
    console.error("Erreur getChannelUploads:", err);
    return [];
  }
}

/**
 * Recherche de sérendipité / découverte par mots-clés
 * Coût : 100 unités (fortement amorti par un cache de 12 heures)
 */
export async function searchSerendipityVideos(
  topicTitle: string,
  keywords: string[]
): Promise<CleanVideoItem[]> {
  const query = keywords.length > 0 ? keywords[Math.floor(Math.random() * keywords.length)] : topicTitle;
  const cacheKey = `serendipity_query:${encodeURIComponent(query.toLowerCase())}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const apiKey = process.env.YOUTUBE_API_SERVER_KEY;
  if (!apiKey) {
    console.warn("YOUTUBE_API_SERVER_KEY manquant pour searchSerendipityVideos.");
    return [];
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=15&relevanceLanguage=fr&key=${apiKey}`
    );

    if (!res.ok) {
      console.error("Erreur search.list YouTube:", await res.text());
      return [];
    }

    const data = await res.json();
    const videos: CleanVideoItem[] = (data.items || [])
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        originalTitle: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl:
          item.snippet.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
        sourceType: "SERENDIPITY" as const,
        topicPillar: topicTitle,
      }));

    // Cache pendant 12 heures pour économiser le quota
    await cache.set(cacheKey, JSON.stringify(videos), 43200);
    return videos;
  } catch (error) {
    console.error("Exception searchSerendipityVideos:", error);
    return [];
  }
}

/**
 * Récupère la durée précise des vidéos par lot (Coût : 1 unité pour 50 vidéos)
 */
export async function attachVideoDurations(videos: CleanVideoItem[], apiKey?: string): Promise<CleanVideoItem[]> {
  if (videos.length === 0) return videos;
  const key = apiKey || process.env.YOUTUBE_API_SERVER_KEY;
  if (!key) return videos;

  try {
    const ids = videos.map((v) => v.id).join(",");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${key}`
    );
    if (!res.ok) return videos;

    const data = await res.json();
    const durationMap = new Map<string, string>();
    for (const item of data.items || []) {
      durationMap.set(item.id, parseISO8601Duration(item.contentDetails?.duration));
    }

    return videos.map((v) => ({
      ...v,
      duration: durationMap.get(v.id) || "10:00",
    }));
  } catch (error) {
    return videos;
  }
}

function parseISO8601Duration(duration?: string): string {
  if (!duration) return "10:00";
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "10:00";
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;

  const paddedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  if (hours > 0) {
    const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}
