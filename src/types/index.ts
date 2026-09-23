export type SourceType = "SUBSCRIPTION" | "SERENDIPITY";

export interface CleanVideoItem {
  id: string;
  title: string;
  originalTitle: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  duration?: string;
  thumbnailUrl: string;
  sourceType: SourceType;
  topicPillar?: string;
  isWatched?: boolean;
  category?: string;
}

export interface TopicPillarItem {
  id: string;
  title: string;
  keywords: string[];
  weight: number;
  pausedUntil: string | null;
}

export interface UserPreferencesData {
  serendipityRatio: number;
  cleanTitles: boolean;
  minDurationMins?: number | null;
  maxDurationMins?: number | null;
}

export interface OneShotVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt?: string;
}
