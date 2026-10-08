import React from 'react';
import { Layers, ShieldCheck, RefreshCw, Sparkles, Cloud, Database } from 'lucide-react';
import { TOPICS_REGISTRY } from '../config/topics';
import { TopicConfig } from '../types';

interface HeaderProps {
  currentTopic: TopicConfig;
  onSelectTopic: (topic: TopicConfig) => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

export const Header: React.FC<HeaderProps> = ({
  currentTopic,
  onSelectTopic,
  syncStatus
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Favourity
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Umbrella Platform
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Modular Ranked Sub-Websites • O(log n) Pairwise Engine
              </p>
            </div>
          </div>

          {/* Sync Status & Cloudflare Badges */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Sync Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-300 font-medium hidden sm:inline">Syncing to Edge...</span>
                  <span className="text-amber-300 font-medium sm:hidden">Syncing</span>
                </>
              )}
              {syncStatus === 'synced' && (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-medium hidden sm:inline">Edge Synced (D1)</span>
                  <span className="text-emerald-300 font-medium sm:hidden">Synced</span>
                </>
              )}
              {syncStatus === 'idle' && (
                <>
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-slate-300 font-medium hidden sm:inline">Edge Ready</span>
                  <span className="text-slate-300 font-medium sm:hidden">Ready</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-300 font-medium">Offline / Local</span>
                </>
              )}
            </div>

            {/* Privacy Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero PII • Local First</span>
            </div>
          </div>
        </div>

        {/* Sub-Website Modular Topic Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none">
          <div className="flex items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
            <Layers className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Sub-Sites:
          </div>
          {TOPICS_REGISTRY.map(topic => {
            const isActive = currentTopic.id === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r text-white shadow-md shadow-indigo-500/10 font-semibold border border-indigo-400/40 ' + topic.accentGradient
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/40'
                }`}
              >
                <span>{topic.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-black/30 text-white' : 'bg-slate-700/60 text-slate-400'
                }`}>
                  {topic.items.length} items
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
