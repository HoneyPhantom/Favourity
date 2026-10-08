import React, { useEffect } from 'react';
import { Sparkles, ArrowLeft, X, CheckCircle2, Zap, HelpCircle } from 'lucide-react';
import { BinarySearchState } from '../hooks/useBinarySearchRanking';

interface BinarySearchModalProps {
  state: BinarySearchState;
  onChoose: (choice: 'candidate' | 'opponent') => void;
  onUndo: () => void;
  onCancel: () => void;
  topicName: string;
}

export const BinarySearchModal: React.FC<BinarySearchModalProps> = ({
  state,
  onChoose,
  onUndo,
  onCancel,
  topicName
}) => {
  const { isComparing, candidateItem, opponentItem, stepNumber, totalEstimatedSteps, history } = state;

  // Keyboard shortcut listener for rapid comparison
  useEffect(() => {
    if (!isComparing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === 'ArrowLeft') {
        e.preventDefault();
        onChoose('candidate');
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        e.preventDefault();
        onChoose('opponent');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComparing, onChoose, onUndo, onCancel]);

  if (!isComparing || !candidateItem || !opponentItem) {
    return null;
  }

  const progressPercent = Math.min(100, Math.round((stepNumber / Math.max(1, totalEstimatedSteps)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 animate-slide-up">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Pairwise Comparison Engine
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                  O(log n)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ranking into {topicName} • Pure client-side binary search
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cancel insertion"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step & Progress Bar */}
        <div className="py-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1 font-medium text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              Comparison #{stepNumber} of ~{totalEstimatedSteps}
            </span>
            <span className="font-mono text-slate-500">
              Range: [{state.low} .. {state.high}] (Mid: {state.mid})
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* The Decision Prompt */}
        <div className="text-center py-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Which do you prefer?
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pick one to pinpoint the exact ranking position without manual dragging
          </p>
        </div>

        {/* Pairwise Option Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {/* Card A: Candidate Item */}
          <button
            onClick={() => onChoose('candidate')}
            className="group relative flex flex-col justify-between text-left p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-indigo-950/30 to-slate-900 border-2 border-indigo-500/40 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 active:scale-[0.98]"
          >
            <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Key 1 / ←
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                {candidateItem.category || 'New Contender'}
              </span>
              <h4 className="text-lg font-bold text-white group-hover:text-indigo-200 transition mt-1">
                {candidateItem.name}
              </h4>
              {candidateItem.description && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  {candidateItem.description}
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300 group-hover:underline">
                I prefer this
              </span>
              <CheckCircle2 className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition" />
            </div>
          </button>

          {/* Card B: Opponent Item */}
          <button
            onClick={() => onChoose('opponent')}
            className="group relative flex flex-col justify-between text-left p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-purple-950/30 to-slate-900 border-2 border-purple-500/40 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-200 active:scale-[0.98]"
          >
            <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Key 2 / →
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                {opponentItem.category || `Rank #${state.mid + 1}`}
              </span>
              <h4 className="text-lg font-bold text-white group-hover:text-purple-200 transition mt-1">
                {opponentItem.name}
              </h4>
              {opponentItem.description && (
                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  {opponentItem.description}
                </p>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300 group-hover:underline">
                I prefer this
              </span>
              <CheckCircle2 className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
            </div>
          </button>
        </div>

        {/* Footer Actions: Undo & Keyboard hints */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={onUndo}
            disabled={history.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              history.length > 0
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Undo Choice (Ctrl+Z)</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tip: Use number keys 1 / 2 or arrow keys</span>
          </div>
        </div>
      </div>
    </div>
  );
};
