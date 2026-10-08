/**
 * Favourity - Cloudflare Worker
 * Handles:
 * 1. POST /api/sync - Upserts private anonymous user lists to D1
 * 2. GET /api/leaderboard/:topic?type=weekly|lifetime - High-speed edge reads from Cloudflare KV
 * 3. Daily Cron Worker (0 12 * * *) - Batch calculates scores & refreshes KV
 * 4. Weekly Reset Cron Worker (0 0 * * 0) - Archives/resets weekly leaderboards
 * 5. Static Assets - Serves frontend SPA
 */

export interface Env {
  DB: D1Database;
  LEADERBOARD_KV: KVNamespace;
  ASSETS?: Fetcher;
}

interface SyncItem {
  item_id: string;
  rank: number;
}

interface SyncRequestBody {
  user_hash: string;
  topic_id: string;
  items: SyncItem[];
}

interface LeaderboardEntry {
  topic_id: string;
  item_id: string;
  name: string;
  score: number;
  rank: number;
  total_votes: number;
  average_rank: number;
}

const SELECTION_WEIGHT = 10.0;

// CORS headers for local dev & API access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. POST /api/sync
    if (url.pathname === '/api/sync' && request.method === 'POST') {
      return handleSync(request, env);
    }

    // 2. GET /api/leaderboard/:topic
    if (url.pathname.startsWith('/api/leaderboard/') && request.method === 'GET') {
      const topicId = url.pathname.replace('/api/leaderboard/', '').split('/')[0];
      const type = (url.searchParams.get('type') || 'lifetime') as 'daily' | 'weekly' | 'lifetime';
      return handleLeaderboard(topicId, type, env);
    }

    // 3. Manual Cron trigger for local testing / administration: POST /api/cron/run
    if (url.pathname === '/api/cron/run' && (request.method === 'POST' || request.method === 'GET')) {
      const cronType = url.searchParams.get('type') || 'daily';
      if (cronType === 'weekly') {
        await executeWeeklyReset(env);
      } else {
        await executeDailyAggregation(env);
      }
      return Response.json({ success: true, triggered: cronType, timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    // 4. GET /api/topics - Convenience endpoint to inspect available topics & items in D1
    if (url.pathname === '/api/topics' && request.method === 'GET') {
      return handleGetTopics(env);
    }

    // Forward non-API requests to static asset handler if present
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Favourity API is operational', {
      status: 200,
      headers: { 'Content-Type': 'text/plain', ...corsHeaders }
    });
  },

  /**
   * Cloudflare Cron Triggers:
   * - "0 12 * * *"  : Daily 12:00 PM UTC Aggregation
   * - "0 0 * * SUN" : Sunday 00:00 UTC Weekly Reset
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[Favourity Cron] Triggered cron expression: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`);

    if (event.cron === '0 0 * * SUN' || event.cron === '0 0 * * 0' || event.cron === '0 0 * * 1') {
      // Weekly reset
      ctx.waitUntil(executeWeeklyReset(env));
    } else {
      // Daily aggregation (default for "0 12 * * *" and any other cron)
      ctx.waitUntil(executeDailyAggregation(env));
    }
  }
};

/**
 * Handle POST /api/sync
 * Validates payload and performs UPSERT into Cloudflare D1
 */
async function handleSync(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as SyncRequestBody;

    if (!body || !body.user_hash || !body.topic_id || !Array.isArray(body.items)) {
      return Response.json(
        { error: 'Invalid payload. Must include user_hash, topic_id, and items array.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { user_hash, topic_id, items } = body;
    const compositeId = `${topic_id}:${user_hash}`;
    const rankDataJson = JSON.stringify(items);

    // Upsert into anonymous_lists
    await env.DB.prepare(
      `INSERT INTO anonymous_lists (id, user_hash, topic_id, rank_data, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         rank_data = excluded.rank_data,
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(compositeId, user_hash, topic_id, rankDataJson)
      .run();

    return Response.json(
      { success: true, id: compositeId, updated_at: new Date().toISOString() },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error: any) {
    console.error('[Favourity Sync Error]', error);
    return Response.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Handle GET /api/leaderboard/:topic?type=weekly|lifetime
 * High-speed retrieval directly from Cloudflare KV with aggressive edge caching
 */
async function handleLeaderboard(
  topicId: string,
  type: 'daily' | 'weekly' | 'lifetime',
  env: Env
): Promise<Response> {
  try {
    const kvKey = `leaderboard:${topicId}:${type}`;
    let cachedData = await env.LEADERBOARD_KV.get(kvKey, 'json');

    // If cache miss (e.g. freshly deployed before 12:00 PM UTC cron), calculate & warm KV
    if (!cachedData) {
      console.log(`[KV Cache Miss] Generating initial leaderboard for ${kvKey}`);
      const freshLeaderboard = await computeTopicLeaderboard(topicId, type, env);
      
      const payload = {
        topic_id: topicId,
        type,
        computed_at: new Date().toISOString(),
        cached: false,
        leaderboard: freshLeaderboard
      };

      // Warm KV for future calls (TTL 24 hours = 86400 seconds)
      await env.LEADERBOARD_KV.put(kvKey, JSON.stringify(payload), {
        expirationTtl: 86400
      });

      return Response.json(payload, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200',
          'X-Cache-Status': 'MISS'
        }
      });
    }

    return Response.json(cachedData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200',
        'X-Cache-Status': 'HIT'
      }
    });
  } catch (error: any) {
    console.error(`[Favourity Leaderboard Error for ${topicId}]`, error);
    return Response.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Convenience endpoint: GET /api/topics
 */
async function handleGetTopics(env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare('SELECT id, name, created_at FROM topics').all();
    return Response.json({ topics: results }, { headers: corsHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Computes leaderboard for a specific topic using the required ranking formula:
 * Score = (Total Times Selected * Selection Weight) / (Average Rank Position + 1)
 */
async function computeTopicLeaderboard(
  topicId: string,
  type: 'daily' | 'weekly' | 'lifetime',
  env: Env
): Promise<LeaderboardEntry[]> {
  // 1. Fetch item names for this topic from D1
  const itemsQuery = await env.DB.prepare('SELECT id, name FROM items WHERE topic_id = ?')
    .bind(topicId)
    .all<{ id: string; name: string }>();

  const itemMap = new Map<string, string>();
  for (const it of itemsQuery.results || []) {
    itemMap.set(it.id, it.name);
  }

  // 2. Fetch anonymous lists
  // If 'daily' or 'weekly', filter by updated_at if needed, or query all for lifetime
  let listsQuery;
  if (type === 'daily') {
    listsQuery = await env.DB.prepare(
      `SELECT rank_data FROM anonymous_lists 
       WHERE topic_id = ? AND updated_at >= datetime('now', '-1 day')`
    ).bind(topicId).all<{ rank_data: string }>();
  } else if (type === 'weekly') {
    listsQuery = await env.DB.prepare(
      `SELECT rank_data FROM anonymous_lists 
       WHERE topic_id = ? AND updated_at >= datetime('now', '-7 days')`
    ).bind(topicId).all<{ rank_data: string }>();
  } else {
    listsQuery = await env.DB.prepare(
      `SELECT rank_data FROM anonymous_lists WHERE topic_id = ?`
    ).bind(topicId).all<{ rank_data: string }>();
  }

  // Fallback to all lists if daily/weekly is empty
  let lists = listsQuery.results || [];
  if (lists.length === 0 && (type === 'daily' || type === 'weekly')) {
    const allQuery = await env.DB.prepare(
      `SELECT rank_data FROM anonymous_lists WHERE topic_id = ?`
    ).bind(topicId).all<{ rank_data: string }>();
    lists = allQuery.results || [];
  }

  // 3. Aggregate item stats
  const statsMap = new Map<string, { totalVotes: number; sumRanks: number }>();

  for (const row of lists) {
    try {
      const items: SyncItem[] = JSON.parse(row.rank_data);
      for (const item of items) {
        const existing = statsMap.get(item.item_id) || { totalVotes: 0, sumRanks: 0 };
        existing.totalVotes += 1;
        existing.sumRanks += item.rank;
        statsMap.set(item.item_id, existing);
      }
    } catch (e) {
      // Ignore corrupted row
    }
  }

  // 4. Calculate scores
  const entries: LeaderboardEntry[] = [];

  for (const [itemId, stats] of statsMap.entries()) {
    const avgRank = stats.sumRanks / stats.totalVotes;
    // Score = (Total Times Selected * Selection Weight) / (Average Rank Position + 1)
    const score = Number(((stats.totalVotes * SELECTION_WEIGHT) / (avgRank + 1)).toFixed(2));
    const itemName = itemMap.get(itemId) || itemId;

    entries.push({
      topic_id: topicId,
      item_id: itemId,
      name: itemName,
      score,
      rank: 0, // Assigned below after sort
      total_votes: stats.totalVotes,
      average_rank: Number(avgRank.toFixed(2))
    });
  }

  // Also include items with 0 votes if needed
  for (const [itemId, itemName] of itemMap.entries()) {
    if (!statsMap.has(itemId)) {
      entries.push({
        topic_id: topicId,
        item_id: itemId,
        name: itemName,
        score: 0,
        rank: 0,
        total_votes: 0,
        average_rank: 0
      });
    }
  }

  // 5. Sort descending by score, tie-break by lower average rank
  entries.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return (a.average_rank || 999) - (b.average_rank || 999);
  });

  // Assign ranks
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return entries;
}

/**
 * Executes Daily Global Aggregation (12:00 PM UTC - "0 12 * * *")
 * Recalculates scores, writes to D1 (leaderboards_daily, leaderboards_lifetime), and updates KV
 */
export async function executeDailyAggregation(env: Env): Promise<void> {
  console.log('[Favourity Cron] Starting Daily Aggregation Job at 12:00 PM UTC...');

  const topicsQuery = await env.DB.prepare('SELECT id FROM topics').all<{ id: string }>();
  const topics = topicsQuery.results || [];

  for (const topic of topics) {
    const topicId = topic.id;

    // Compute Daily & Lifetime
    const dailyEntries = await computeTopicLeaderboard(topicId, 'daily', env);
    const lifetimeEntries = await computeTopicLeaderboard(topicId, 'lifetime', env);

    // Write to D1 leaderboards_daily
    for (const entry of dailyEntries) {
      await env.DB.prepare(
        `INSERT INTO leaderboards_daily (topic_id, item_id, score, rank)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(topic_id, item_id) DO UPDATE SET
           score = excluded.score,
           rank = excluded.rank`
      )
        .bind(entry.topic_id, entry.item_id, entry.score, entry.rank)
        .run();
    }

    // Write to D1 leaderboards_lifetime
    for (const entry of lifetimeEntries) {
      await env.DB.prepare(
        `INSERT INTO leaderboards_lifetime (topic_id, item_id, score, rank)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(topic_id, item_id) DO UPDATE SET
           score = excluded.score,
           rank = excluded.rank`
      )
        .bind(entry.topic_id, entry.item_id, entry.score, entry.rank)
        .run();
    }

    // Write JSON dumps to Cloudflare KV with 24-hour expiration
    const dailyPayload = {
      topic_id: topicId,
      type: 'daily',
      computed_at: new Date().toISOString(),
      cached: true,
      leaderboard: dailyEntries
    };

    const lifetimePayload = {
      topic_id: topicId,
      type: 'lifetime',
      computed_at: new Date().toISOString(),
      cached: true,
      leaderboard: lifetimeEntries
    };

    await env.LEADERBOARD_KV.put(
      `leaderboard:${topicId}:daily`,
      JSON.stringify(dailyPayload),
      { expirationTtl: 86400 }
    );

    await env.LEADERBOARD_KV.put(
      `leaderboard:${topicId}:lifetime`,
      JSON.stringify(lifetimePayload),
      { expirationTtl: 86400 }
    );

    console.log(`[Favourity Cron] Successfully aggregated topic: ${topicId}`);
  }

  console.log('[Favourity Cron] Daily Aggregation Job finished successfully.');
}

/**
 * Executes Weekly Reset Cron Worker (Sunday 00:00 UTC - "0 0 * * 0")
 * Resets and refreshes weekly leaderboard dataset
 */
export async function executeWeeklyReset(env: Env): Promise<void> {
  console.log('[Favourity Cron] Executing Weekly Reset Job at Sunday 00:00 UTC...');

  const topicsQuery = await env.DB.prepare('SELECT id FROM topics').all<{ id: string }>();
  const topics = topicsQuery.results || [];

  for (const topic of topics) {
    const topicId = topic.id;
    const weeklyEntries = await computeTopicLeaderboard(topicId, 'weekly', env);

    const weeklyPayload = {
      topic_id: topicId,
      type: 'weekly',
      computed_at: new Date().toISOString(),
      cached: true,
      leaderboard: weeklyEntries
    };

    // Store refreshed weekly KV key
    await env.LEADERBOARD_KV.put(
      `leaderboard:${topicId}:weekly`,
      JSON.stringify(weeklyPayload),
      { expirationTtl: 604800 } // 7 days TTL
    );
  }

  console.log('[Favourity Cron] Weekly Reset Job finished successfully.');
}
