// Type definitions for Favourity Platform

export interface TopicItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
}

export interface TopicConfig {
  id: string;
  name: string;
  tagline: string;
  iconName: string;
  badge: string;
  accentGradient: string;
  description: string;
  items: TopicItem[];
}

export interface UserRankedItem {
  itemId: string;
  name: string;
  rank: number; // 1-indexed (1 is top favourite)
  addedAt: string;
}

export interface UserTopicList {
  topicId: string;
  items: UserRankedItem[];
  updatedAt: string;
}

export interface ComparisonStep {
  candidateItem: TopicItem;
  opponentItem: TopicItem;
  low: number;
  high: number;
  mid: number;
  stepNumber: number;
  totalEstimatedSteps: number;
}

export interface ComparisonHistory {
  low: number;
  high: number;
  mid: number;
  choice: 'candidate' | 'opponent';
}

export interface SyncPayload {
  user_hash: string;
  topic_id: string;
  items: Array<{
    item_id: string;
    rank: number;
  }>;
}

export interface LeaderboardEntry {
  topic_id: string;
  item_id: string;
  name: string;
  score: number;
  rank: number;
  total_votes?: number;
  average_rank?: number;
}

export interface LeaderboardResponse {
  topic_id: string;
  type: 'daily' | 'weekly' | 'lifetime';
  computed_at: string;
  cached: boolean;
  leaderboard: LeaderboardEntry[];
}
