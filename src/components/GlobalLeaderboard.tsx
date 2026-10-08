import React, { useState, useEffect } from 'react';
import { Flame, Clock, RefreshCw, Zap, Award, Layers } from 'lucide-react';
import { TopicConfig, LeaderboardResponse } from '../types';
import { fetchLeaderboard } from '../services/api';

interface GlobalLeaderboardProps {
  topic: TopicConfig;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({ topic }) => {
  const [activeType, setActiveType] = useState<'lifetime' | 'daily' | 'weekly'>('lifetime');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggeringCron, setIsTriggeringCron] = useState(false);
  const [cronNotice, setCronNotice] = useState<string | null>(null);

  const loadData = async (type: 'lifetime' | 'daily' | 'weekly') => {
    setIsLoading(true);
    try {
      const res = await fetchLeaderboard(topic.id, type);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeType);
  }, [topic.id, activeType]);

  const handleTriggerCron = async () => {
    setIsTriggeringCron(true);
    setCronNotice(null);
    try {
      const res = await fetch(`/api/cron/run?type=${activeType}`, { method: 'POST' });
      if (res.ok) {
        setCronNotice(`Daily 12:00 PM UTC Cron aggregation simulated! Recalculated scores and refreshed KV.`);
        await loadData(activeType);
      } else {
        setCronNotice('Cron execution returned status: ' + res.status);
      }
    } catch (e: any) {
      setCronNotice('Cron triggered (or mock mode): ' + e.message);
    } finally {
      setIsTriggeringCron(false);
      setTimeout(() => setCronNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Header & Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <h2 className="text-xl font-bold text-white">
                Global Edge Leaderboard
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Cloudflare KV Cached
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pre-calculated once daily at 12:00 PM UTC via background Cron Workers. Zero real-time DB load.
            </p>
          </div>

          {/* Type Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start lg:self-auto">
            {(['lifetime', 'daily', 'weekly'] as const).map(type => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  activeType === type
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cost Optimization & Mathematical Formula Banner */}
        <div className="my-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Deterministic Batch Aggregation Formula:</span>
              </div>
              <p className="text-slate-400 font-mono text-[11px]">
                Score = (Total Times Selected × 10.0) ÷ (Average Rank Position + 1)
              </p>
            </div>

            {/* Test Cron Execution Button */}
            <button
              onClick={handleTriggerCron}
              disabled={isTriggeringCron}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition shrink-0 self-start sm:self-auto"
              title="Test the 12:00 PM UTC Cron job"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringCron ? 'animate-spin text-amber-400' : 'text-indigo-400'}`} />
              <span>{isTriggeringCron ? 'Running Cron...' : 'Trigger Cron Aggregation'}</span>
            </button>
          </div>

          {cronNotice && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-fade-in">
              {cronNotice}
            </div>
          )}
        </div>

        {/* Leaderboard Table / Cards */}
        {isLoading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Fetching pre-cached KV leaderboard snapshot...</p>
          </div>
        ) : !data || data.leaderboard.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No aggregation snapshot available yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add some items to your personal list and trigger the daily Cron calculation above to see the global scores computed!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-3">Global Rank</th>
                  <th className="py-3 px-3">Contender Name</th>
                  <th className="py-3 px-3 text-right">Aggregated Score</th>
                  <th className="py-3 px-3 text-right">Lists Including</th>
                  <th className="py-3 px-3 text-right">Avg User Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {data.leaderboard.map(item => {
                  const isTop1 = item.rank === 1;
                  const isTop2 = item.rank === 2;
                  const isTop3 = item.rank === 3;

                  return (
                    <tr
                      key={item.item_id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2 font-bold">
                          {isTop1 ? (
                            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-xs glow-gold">
                              #1
                            </span>
                          ) : isTop2 ? (
                            <span className="w-7 h-7 rounded-lg bg-slate-300/20 text-slate-200 border border-slate-300/40 flex items-center justify-center text-xs">
                              #2
                            </span>
                          ) : isTop3 ? (
                            <span className="w-7 h-7 rounded-lg bg-amber-700/20 text-amber-400 border border-amber-700/40 flex items-center justify-center text-xs">
                              #3
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center text-xs">
                              #{item.rank}
                            </span>
                          )}
                          {isTop1 && <Award className="w-4 h-4 text-amber-400" />}
                        </div>
                      </td>

                      {/* Contender Name */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-white group-hover:text-indigo-300 transition">
                          {item.name}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-mono font-bold text-indigo-400 text-base">
                          {item.score.toFixed(2)}
                        </span>
                      </td>

                      {/* Total Lists */}
                      <td className="py-3.5 px-3 text-right text-slate-400 font-mono text-xs">
                        {item.total_votes ?? 0}
                      </td>

                      {/* Avg Rank */}
                      <td className="py-3.5 px-3 text-right text-slate-400 font-mono text-xs">
                        {item.average_rank ? `#${item.average_rank.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Metadata Footer */}
        {data && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Snapshot Computed: {new Date(data.computed_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Edge Cache: {data.cached ? 'KV HIT' : 'WARMED'}</span>
              <span>•</span>
              <span>Sub-millisecond delivery</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
