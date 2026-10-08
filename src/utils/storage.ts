import { TopicItem } from '../types';

const USER_HASH_KEY = 'favourity_user_hash';
const LIST_STORAGE_PREFIX = 'favourity_list_';

/**
 * Generates or retrieves a persistent anonymous cryptographic user hash from localStorage.
 * Guaranteed zero PII, anonymous device identifier.
 */
export function getOrCreateUserHash(): string {
  if (typeof window === 'undefined') return 'server_side_mock';

  let hash = localStorage.getItem(USER_HASH_KEY);
  if (!hash) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      hash = crypto.randomUUID();
    } else {
      hash = 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    localStorage.setItem(USER_HASH_KEY, hash);
  }
  return hash;
}

/**
 * Loads the user's private ordered ranked list for a given topic from localStorage.
 */
export function getStoredUserTopicList(topicId: string): TopicItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(`${LIST_STORAGE_PREFIX}${topicId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse local storage for topic ${topicId}:`, err);
    return [];
  }
}

/**
 * Persists the user's private ordered ranked list for a given topic to localStorage.
 */
export function persistUserTopicList(topicId: string, items: TopicItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`${LIST_STORAGE_PREFIX}${topicId}`, JSON.stringify(items));
  } catch (err) {
    console.error(`Failed to persist local storage for topic ${topicId}:`, err);
  }
}

/**
 * Clears the user's list for a given topic from localStorage.
 */
export function clearStoredUserTopicList(topicId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${LIST_STORAGE_PREFIX}${topicId}`);
}
