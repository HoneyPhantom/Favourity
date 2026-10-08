import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { TopicBanner } from './components/TopicBanner';
import { PersonalRankList } from './components/PersonalRankList';
import { GlobalLeaderboard } from './components/GlobalLeaderboard';
import { BinarySearchModal } from './components/BinarySearchModal';
import { getDefaultTopic, getTopicById } from './config/topics';
import { TopicConfig, TopicItem } from './types';
import { useBinarySearchRanking } from './hooks/useBinarySearchRanking';
import { getStoredUserTopicList, persistUserTopicList, clearStoredUserTopicList } from './utils/storage';
import { queueAnonymousSync } from './services/api';
import { Cpu, Database, HardDrive, Shield } from 'lucide-react';

export const App: React.FC = () => {
  // Topic state: initialize from URL hash or default
  const [currentTopic, setCurrentTopic] = useState<TopicConfig>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.replace('#', '');
      const found = getTopicById(hashId);
      if (found) return found;
    }
    return getDefaultTopic();
  });

  const [activeView, setActiveView] = useState<'personal' | 'leaderboard'>('personal');
  const [userRankedItems, setUserRankedItems] = useState<TopicItem[]>(() => {
    return getStoredUserTopicList(currentTopic.id);
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Binary search hook
  const {
    state: binaryState,
    startInsertion,
    recordChoice,
    undoStep,
    cancelInsertion
  } = useBinarySearchRanking();

  // Reload user list whenever active topic changes
  useEffect(() => {
    const stored = getStoredUserTopicList(currentTopic.id);
    setUserRankedItems(stored);
    cancelInsertion();
    if (typeof window !== 'undefined') {
      window.location.hash = currentTopic.id;
    }
  }, [currentTopic.id, cancelInsertion]);

  // Handle topic change
  const handleSelectTopic = (topic: TopicConfig) => {
    setCurrentTopic(topic);
    setActiveView('personal');
  };

  // Trigger confetti effect on insertion completion
  const triggerSuccessConfetti = () => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981']
      });
    } catch (e) {
      // Ignore if canvas-confetti is not loaded
    }
  };

  // Start binary search insertion
  const handleStartInsertion = (candidate: TopicItem) => {
    const result = startInsertion(candidate, userRankedItems);
    if (result.immediateInsertedList) {
      const nextList = result.immediateInsertedList;
      setUserRankedItems(nextList);
      persistUserTopicList(currentTopic.id, nextList);
      queueAnonymousSync(currentTopic.id, nextList, setSyncStatus);
      triggerSuccessConfetti();
    }
  };

  // User chooses an option during binary search
  const handleBinaryChoice = (choice: 'candidate' | 'opponent') => {
    const result = recordChoice(choice, userRankedItems);
    if (result.isFinished && result.updatedList) {
      const nextList = result.updatedList;
      setUserRankedItems(nextList);
      persistUserTopicList(currentTopic.id, nextList);
      queueAnonymousSync(currentTopic.id, nextList, setSyncStatus);
      triggerSuccessConfetti();
    }
  };

  const handleUndoBinary = () => {
    undoStep(userRankedItems);
  };

  // Reorder: Move Up
  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    const nextList = [...userRankedItems];
    const temp = nextList[index];
    nextList[index] = nextList[index - 1];
    nextList[index - 1] = temp;

    setUserRankedItems(nextList);
    persistUserTopicList(currentTopic.id, nextList);
    queueAnonymousSync(currentTopic.id, nextList, setSyncStatus);
  }, [currentTopic.id, userRankedItems]);

  // Reorder: Move Down
  const handleMoveDown = useCallback((index: number) => {
    if (index >= userRankedItems.length - 1) return;
    const nextList = [...userRankedItems];
    const temp = nextList[index];
    nextList[index] = nextList[index + 1];
    nextList[index + 1] = temp;

    setUserRankedItems(nextList);
    persistUserTopicList(currentTopic.id, nextList);
    queueAnonymousSync(currentTopic.id, nextList, setSyncStatus);
  }, [currentTopic.id, userRankedItems]);

  // Remove Item
  const handleRemoveItem = useCallback((index: number) => {
    const nextList = userRankedItems.filter((_, i) => i !== index);
    setUserRankedItems(nextList);
    persistUserTopicList(currentTopic.id, nextList);
    queueAnonymousSync(currentTopic.id, nextList, setSyncStatus);
  }, [currentTopic.id, userRankedItems]);

  // Clear Entire List
  const handleClearList = useCallback(() => {
    if (!window.confirm(`Are you sure you want to reset your ${currentTopic.name} ranking?`)) {
      return;
    }
    clearStoredUserTopicList(currentTopic.id);
    setUserRankedItems([]);
    queueAnonymousSync(currentTopic.id, [], setSyncStatus);
  }, [currentTopic]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Header & Sub-site navigation */}
      <Header
        currentTopic={currentTopic}
        onSelectTopic={handleSelectTopic}
        syncStatus={syncStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TopicBanner
          topic={currentTopic}
          activeView={activeView}
          onViewChange={setActiveView}
          userItemCount={userRankedItems.length}
        />

        {activeView === 'personal' ? (
          <PersonalRankList
            topic={currentTopic}
            userRankedItems={userRankedItems}
            onStartInsertion={handleStartInsertion}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onRemoveItem={handleRemoveItem}
            onClearList={handleClearList}
          />
        ) : (
          <GlobalLeaderboard topic={currentTopic} />
        )}
      </main>

      {/* Interactive Binary Search Modal */}
      <BinarySearchModal
        state={binaryState}
        onChoose={handleBinaryChoice}
        onUndo={handleUndoBinary}
        onCancel={cancelInsertion}
        topicName={currentTopic.name}
      />

      {/* Architecture & Cost Optimization Footer */}
      <footer className="mt-20 border-t border-slate-900 bg-slate-950/90 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>O(log n) Client Engine</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                All pairwise comparisons run purely in browser TypeScript. Zero server CPU, 0 network requests per comparison question.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Zero-PII Privacy</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                User lists reside safely in localStorage. Syncs use an anonymous random cryptographic device hash without cookies or trackers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Database className="w-4 h-4 text-sky-400" />
                <span>Cloudflare D1 & KV</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                D1 SQLite handles throttled UPSERT raw list syncs. Cloudflare KV serves pre-computed leaderboard static payloads at the edge.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HardDrive className="w-4 h-4 text-pink-400" />
                <span>Daily Cron Workers</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Zero on-the-fly SQL aggregation per page visit. Background crons run at 12:00 PM UTC to stay strictly under Cloudflare free tier thresholds.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400">
              © {new Date().getFullYear()} Favourity Umbrella Platform. Architected for Cloudflare Pages, Workers, D1 & KV.
            </p>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span>Cloudflare Free Tier Compliant</span>
              <span>•</span>
              <span>&lt;100,000 req/day target</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
