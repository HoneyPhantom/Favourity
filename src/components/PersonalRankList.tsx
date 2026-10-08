import React, { useState } from 'react';
import { Trophy, Plus, ChevronUp, ChevronDown, Trash2, Sparkles, PlusCircle } from 'lucide-react';
import { TopicConfig, TopicItem } from '../types';

interface PersonalRankListProps {
  topic: TopicConfig;
  userRankedItems: TopicItem[];
  onStartInsertion: (item: TopicItem) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemoveItem: (index: number) => void;
  onClearList: () => void;
}

export const PersonalRankList: React.FC<PersonalRankListProps> = ({
  topic,
  userRankedItems,
  onStartInsertion,
  onMoveUp,
  onMoveDown,
  onRemoveItem,
  onClearList
}) => {
  const [customItemName, setCustomItemName] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState('');

  // Unranked items from this topic catalog that aren't yet in the user's list
  const rankedIds = new Set(userRankedItems.map(i => i.id));
  const availableItems = topic.items.filter(item => !rankedIds.has(item.id));

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;

    const newItem: TopicItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: customItemName.trim(),
      category: customItemCategory.trim() || 'Custom',
      description: 'User added custom contender'
    };

    onStartInsertion(newItem);
    setCustomItemName('');
    setCustomItemCategory('');
  };

  return (
    <div className="space-y-8">
      {/* User's Ranked List Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">
                My Definitive Ranking
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {userRankedItems.length} {userRankedItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Private to your browser. Syncs anonymously to edge D1 database.
            </p>
          </div>

          {userRankedItems.length > 0 && (
            <button
              onClick={onClearList}
              className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 self-start sm:self-auto transition"
              title="Reset this list"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset My List
            </button>
          )}
        </div>

        {/* List Content */}
        {userRankedItems.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              Your {topic.name} list is empty
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              Pick a contender from the catalog below. The O(log n) pairwise binary search engine will find its exact rank in just a few quick questions!
            </p>
            {availableItems.length > 0 && (
              <button
                onClick={() => onStartInsertion(availableItems[0])}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium text-xs hover:shadow-lg hover:shadow-indigo-500/25 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Rank First Item: {availableItems[0].name}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 mt-2">
            {userRankedItems.map((item, index) => {
              const rank = index + 1;
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;

              let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
              if (isFirst) badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-gold';
              else if (isSecond) badgeColor = 'bg-slate-300/20 text-slate-200 border-slate-300/40';
              else if (isThird) badgeColor = 'bg-amber-700/20 text-amber-400 border-amber-700/40';

              return (
                <div
                  key={item.id}
                  className="py-3 sm:py-4 flex items-center justify-between gap-3 group hover:bg-slate-800/30 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${badgeColor}`}
                    >
                      #{rank}
                    </div>

                    {/* Item Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base text-white truncate">
                          {item.name}
                        </span>
                        {item.category && (
                          <span className="hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5 max-w-md">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Reorder & Remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onMoveUp(index)}
                      disabled={index === 0}
                      className={`p-1.5 rounded-lg transition ${
                        index === 0
                          ? 'text-slate-700 cursor-not-allowed'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Promote rank"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onMoveDown(index)}
                      disabled={index === userRankedItems.length - 1}
                      className={`p-1.5 rounded-lg transition ${
                        index === userRankedItems.length - 1
                          ? 'text-slate-700 cursor-not-allowed'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Demote rank"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition ml-1"
                      title="Remove from list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Contenders Catalog */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">
                Available Contenders to Rank
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select any item to insert it using client-side binary search
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono self-start sm:self-auto">
            {availableItems.length} remaining
          </span>
        </div>

        {availableItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            You have ranked all default contenders in this topic! You can add your own custom items below.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-6">
            {availableItems.map(item => (
              <div
                key={item.id}
                className="flex flex-col justify-between p-4 rounded-2xl bg-slate-850 bg-slate-800/40 border border-slate-700/60 hover:border-indigo-500/50 hover:bg-slate-800/70 transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {item.category || topic.name}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition">
                    {item.name}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onStartInsertion(item)}
                  className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 hover:border-indigo-500 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert into Ranking</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Contender Form */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
            <PlusCircle className="w-4 h-4 text-pink-400" />
            Add Custom Contender
          </h4>
          <form onSubmit={handleAddCustom} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customItemName}
              onChange={e => setCustomItemName(e.target.value)}
              placeholder="e.g. Grandma's Apple Pie / Christopher Nolan's Dunkirk"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={customItemCategory}
              onChange={e => setCustomItemCategory(e.target.value)}
              placeholder="Category (optional)"
              className="w-full sm:w-44 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!customItemName.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              Binary Insert
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
