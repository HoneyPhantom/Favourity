import { SyncPayload, LeaderboardResponse, TopicItem } from '../types';
import { getOrCreateUserHash } from '../utils/storage';

const API_BASE = '/api';

// In-memory debounce timers per topic
const syncTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/**
 * Throttled/Debounced anonymous list sync to Cloudflare Workers.
 * Delays network requests by 1500ms to consolidate rapid binary search insertions.
 */
export function queueAnonymousSync(
  topicId: string,
  items: TopicItem[],
  onStatusChange?: (status: 'idle' | 'syncing' | 'synced' | 'error') => void
): void {
  if (syncTimers[topicId]) {
    clearTimeout(syncTimers[topicId]);
  }

  onStatusChange?.('syncing');

  syncTimers[topicId] = setTimeout(async () => {
    try {
      const userHash = getOrCreateUserHash();
      const payload: SyncPayload = {
        user_hash: userHash,
        topic_id: topicId,
        items: items.map((item, index) => ({
          item_id: item.id,
          rank: index + 1 // 1-indexed rank
        }))
      };

      const response = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      onStatusChange?.('synced');
      // Reset back to idle after 2.5s
      setTimeout(() => onStatusChange?.('idle'), 2500);
    } catch (err) {
      console.warn('[Favourity Sync] Background sync warning:', err);
      onStatusChange?.('error');
      setTimeout(() => onStatusChange?.('idle'), 3000);
    }
  }, 1500);
}

/**
 * Fetches pre-computed global leaderboard from Cloudflare KV edge cache.
 */
export async function fetchLeaderboard(
  topicId: string,
  type: 'daily' | 'weekly' | 'lifetime' = 'lifetime'
): Promise<LeaderboardResponse> {
  try {
    const res = await fetch(`${API_BASE}/leaderboard/${topicId}?type=${type}`);
    if (!res.ok) {
      throw new Error(`Leaderboard fetch failed: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`[Favourity Leaderboard] Failed to fetch leaderboard for ${topicId}:`, error);
    // Graceful fallback for offline / mock
    return {
      topic_id: topicId,
      type,
      computed_at: new Date().toISOString(),
      cached: false,
      leaderboard: []
    };
  }
}
