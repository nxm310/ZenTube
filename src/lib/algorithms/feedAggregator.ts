import { prisma } from "@/lib/prisma";
import { CleanVideoItem } from "@/types";
import { fetchChannelVideosViaRSS } from "@/lib/youtube/rss";
import { getUserSubscriptions, getChannelUploads, searchSerendipityVideos, attachVideoDurations } from "@/lib/youtube/client";

/**
 * Nettoie un titre de vidéo pour atténuer le clickbait :
 * - Retire les cris en TOUT MAJUSCULES
 * - Réduit les ponctuations excessives (!!!, ???)
 */
export function sanitizeTitle(title: string): string {
  let clean = title.trim();

  const words = clean.split(/\s+/);
  const uppercaseWords = words.filter((w) => w.length > 2 && w === w.toUpperCase());
  if (words.length > 0 && uppercaseWords.length / words.length > 0.5) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }

  clean = clean.replace(/!{2,}/g, " !").replace(/\?{2,}/g, " ?");
  return clean;
}

/**
 * Récupère les vidéos "J'aime" de l'utilisateur depuis son compte YouTube
 * (Les vidéos aimées sur YouTube font partie des vidéos déjà visionnées)
 */
async function fetchUserLikedVideoIds(accessToken: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=LL&maxResults=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean);
  } catch (e) {
    return [];
  }
}

export async function generateSmartFeed(userId: string, accessToken?: string): Promise<CleanVideoItem[]> {
  const now = new Date();

  // 1. Récupération des préférences utilisateur, piliers actifs et historique des vidéos vues en base
  let preferences: any = null;
  let activeTopics: any[] = [];
  let watchedVideos: any[] = [];

  try {
    const res = await Promise.all([
      prisma.userPreference.findUnique({ where: { userId } }).catch(() => null),
      prisma.topicPillar.findMany({
        where: {
          userId,
          OR: [{ pausedUntil: null }, { pausedUntil: { lte: now } }],
        },
        orderBy: { weight: "desc" },
      }).catch(() => []),
      prisma.watchedVideo.findMany({
        where: { userId },
        select: { youtubeId: true },
      }).catch(() => []),
    ]);
    preferences = res[0];
    activeTopics = res[1];
    watchedVideos = res[2];
  } catch (e) {
    console.warn("Base de données non disponible, utilisation du mode autonome:", e);
  }

  const watchedSet = new Set(watchedVideos.map((w) => w.youtubeId));

  // 2. Synchronisation de l'historique YouTube : ajout des vidéos "J'aime" de son compte YouTube
  if (accessToken) {
    const likedIds = await fetchUserLikedVideoIds(accessToken);
    for (const id of likedIds) {
      watchedSet.add(id);
    }
  }

  const serendipityRatio = preferences?.serendipityRatio ?? 30; // 0% à 100%
  const cleanTitlesEnabled = preferences?.cleanTitles ?? true;

  const targetFeedSize = 30;
  const serendipityTarget = Math.round((targetFeedSize * serendipityRatio) / 100);
  const subscriptionTarget = targetFeedSize - serendipityTarget;

  // 3. Récupération des vidéos des abonnements (zéro quota via RSS)
  let familiarVideos: CleanVideoItem[] = [];

  if (accessToken) {
    const subscriptions = await getUserSubscriptions(accessToken);
    const channelsToQuery = subscriptions.slice(0, 12);
    const rssPromises = channelsToQuery.map((sub) =>
      fetchChannelVideosViaRSS(sub.channelId).catch(() => [])
    );
    const rssResults = await Promise.all(rssPromises);
    familiarVideos = rssResults.flat();

    // Fallback playlist Uploads UU... si pas assez de vidéos
    if (familiarVideos.length < subscriptionTarget && channelsToQuery.length > 0) {
      const fallbackPromises = channelsToQuery.slice(0, 4).map((sub) =>
        getChannelUploads(sub.channelId, accessToken).catch(() => [])
      );
      const fallbackResults = await Promise.all(fallbackPromises);
      familiarVideos = [...familiarVideos, ...fallbackResults.flat()];
    }
  }

  // 4. Récupération des vidéos de découverte / sérendipité
  let discoveryVideos: CleanVideoItem[] = [];
  if (activeTopics.length > 0) {
    const topicsToSample = activeTopics.slice(0, 3);
    const searchPromises = topicsToSample.map((topic) =>
      searchSerendipityVideos(topic.title, topic.keywords).catch(() => [])
    );
    const searchResults = await Promise.all(searchPromises);
    discoveryVideos = searchResults.flat();
  }

  // 5. Assemblage et marquage "isWatched"
  const pool: CleanVideoItem[] = [
    ...familiarVideos.map((v) => ({ ...v, sourceType: "SUBSCRIPTION" as const })),
    ...discoveryVideos.map((v) => ({ ...v, sourceType: "SERENDIPITY" as const })),
  ];

  const candidateFeed: CleanVideoItem[] = [];
  const channelCountMap = new Map<string, number>();

  for (const video of pool) {
    // Plafond par chaîne (max 2 vidéos de la même chaîne)
    const count = channelCountMap.get(video.channelId) || 0;
    if (count >= 2) continue;

    // Dé-clickbaiting
    const processedTitle = cleanTitlesEnabled ? sanitizeTitle(video.title) : video.title;

    // Vérification du statut déjà vu
    const isWatched = watchedSet.has(video.id);

    candidateFeed.push({
      ...video,
      title: processedTitle,
      originalTitle: video.title,
      isWatched,
    });

    channelCountMap.set(video.channelId, count + 1);

    if (candidateFeed.length >= targetFeedSize) break;
  }

  // Attachement de la durée des vidéos
  const feedWithDurations = await attachVideoDurations(candidateFeed);

  // Tri : vidéos non vues en priorité, puis ordre chronologique de diffusion
  return feedWithDurations.sort((a, b) => {
    if (a.isWatched !== b.isWatched) {
      return a.isWatched ? 1 : -1;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}
