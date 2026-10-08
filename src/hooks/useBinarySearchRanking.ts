import { useState, useCallback } from 'react';
import { TopicItem, ComparisonHistory } from '../types';

export interface BinarySearchState {
  isComparing: boolean;
  candidateItem: TopicItem | null;
  opponentItem: TopicItem | null;
  low: number;
  high: number;
  mid: number;
  stepNumber: number;
  totalEstimatedSteps: number;
  history: ComparisonHistory[];
}

export interface UseBinarySearchReturn {
  state: BinarySearchState;
  startInsertion: (candidate: TopicItem, currentList: TopicItem[]) => { immediateInsertedList?: TopicItem[]; insertedIndex?: number };
  recordChoice: (choice: 'candidate' | 'opponent', currentList: TopicItem[]) => { isFinished: boolean; updatedList?: TopicItem[]; insertedIndex?: number };
  undoStep: (currentList: TopicItem[]) => void;
  cancelInsertion: () => void;
}

/**
 * Pure TypeScript hook for interactive pairwise binary search insertion.
 * Computes exact insertion position in O(log n) user comparisons completely client-side.
 */
export function useBinarySearchRanking(): UseBinarySearchReturn {
  const [state, setState] = useState<BinarySearchState>({
    isComparing: false,
    candidateItem: null,
    opponentItem: null,
    low: 0,
    high: 0,
    mid: 0,
    stepNumber: 0,
    totalEstimatedSteps: 0,
    history: []
  });

  const startInsertion = useCallback((candidate: TopicItem, currentList: TopicItem[]) => {
    // If list is empty, candidate is automatically #1 with 0 comparisons
    if (currentList.length === 0) {
      setState({
        isComparing: false,
        candidateItem: null,
        opponentItem: null,
        low: 0,
        high: 0,
        mid: 0,
        stepNumber: 0,
        totalEstimatedSteps: 0,
        history: []
      });
      return {
        immediateInsertedList: [candidate],
        insertedIndex: 0
      };
    }

    const low = 0;
    const high = currentList.length - 1;
    const mid = Math.floor((low + high) / 2);
    const totalEstimatedSteps = Math.ceil(Math.log2(currentList.length + 1));

    setState({
      isComparing: true,
      candidateItem: candidate,
      opponentItem: currentList[mid],
      low,
      high,
      mid,
      stepNumber: 1,
      totalEstimatedSteps,
      history: []
    });

    return {};
  }, []);

  const recordChoice = useCallback((choice: 'candidate' | 'opponent', currentList: TopicItem[]) => {
    if (!state.isComparing || !state.candidateItem) {
      return { isFinished: false };
    }

    const { low, high, mid, stepNumber, candidateItem, history } = state;
    const newHistory: ComparisonHistory[] = [...history, { low, high, mid, choice }];

    let nextLow = low;
    let nextHigh = high;

    if (choice === 'candidate') {
      // Candidate is preferred over opponent at mid
      // In a 1-to-N ranked list (0 = best), candidate must be placed before or at mid
      nextHigh = mid - 1;
    } else {
      // Opponent is preferred over candidate
      // Candidate must be placed after mid
      nextLow = mid + 1;
    }

    // Binary search termination check
    if (nextLow > nextHigh) {
      const insertedIndex = nextLow;
      const updatedList = [...currentList];
      updatedList.splice(insertedIndex, 0, candidateItem);

      setState({
        isComparing: false,
        candidateItem: null,
        opponentItem: null,
        low: 0,
        high: 0,
        mid: 0,
        stepNumber: 0,
        totalEstimatedSteps: 0,
        history: []
      });

      return {
        isFinished: true,
        updatedList,
        insertedIndex
      };
    }

    // Continue binary search
    const nextMid = Math.floor((nextLow + nextHigh) / 2);
    setState(prev => ({
      ...prev,
      low: nextLow,
      high: nextHigh,
      mid: nextMid,
      opponentItem: currentList[nextMid],
      stepNumber: stepNumber + 1,
      history: newHistory
    }));

    return { isFinished: false };
  }, [state]);

  const undoStep = useCallback((currentList: TopicItem[]) => {
    if (state.history.length === 0) return;

    const newHistory = [...state.history];
    const lastStep = newHistory.pop();

    if (!lastStep) return;

    setState(prev => ({
      ...prev,
      low: lastStep.low,
      high: lastStep.high,
      mid: lastStep.mid,
      opponentItem: currentList[lastStep.mid],
      stepNumber: Math.max(1, prev.stepNumber - 1),
      history: newHistory
    }));
  }, [state]);

  const cancelInsertion = useCallback(() => {
    setState({
      isComparing: false,
      candidateItem: null,
      opponentItem: null,
      low: 0,
      high: 0,
      mid: 0,
      stepNumber: 0,
      totalEstimatedSteps: 0,
      history: []
    });
  }, []);

  return {
    state,
    startInsertion,
    recordChoice,
    undoStep,
    cancelInsertion
  };
}
