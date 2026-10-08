import React from 'react';
import { Trophy, BarChart3 } from 'lucide-react';
import { TopicConfig } from '../types';

interface TopicBannerProps {
  topic: TopicConfig;
  activeView: 'personal' | 'leaderboard';
  onViewChange: (view: 'personal' | 'leaderboard') => void;
  userItemCount: number;
}

export const TopicBanner: React.FC<TopicBannerProps> = ({
  topic,
  activeView,
  onViewChange,
  userItemCount
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 mb-8 shadow-2xl">
      {/* Background Gradient Splash */}
      <div
        className={`absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br ${topic.accentGradient} opacity-15 blur-3xl pointer-events-none`}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {topic.badge}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-medium">
              Sub-Website Instance
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {topic.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl leading-relaxed">
            {topic.tagline}
          </p>
        </div>

        {/* View Switcher: My Ranking vs Global Leaderboard */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 self-start md:self-auto shadow-inner">
          <button
            onClick={() => onViewChange('personal')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeView === 'personal'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>My Personal List ({userItemCount})</span>
          </button>

          <button
            onClick={() => onViewChange('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeView === 'leaderboard'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-rose-400" />
            <span>Global Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
