
'use client';

import { doc, setDoc, getDoc, collection, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface GameSession {
  id: string;
  type: 'Sudoku' | 'Sliding Puzzle' | 'Memory Grid' | '2048' | 'TicTacToeAI' | 'Math' | 'Word';
  difficulty: string;
  data: string;
  solution: string;
  userProgress: string;
  moves: number;
  startTime: number;
  lastPlayed: number;
  isCompleted?: boolean;
  timeSpent?: number;
  earnedShards?: number;
}

export interface UserStats {
  totalShards: number;
  puzzlesSolved: number;
  level?: number;
  achievements?: string[];
}

export const STORAGE_KEY = 'ultimate-puzzlify-v1';
export const STATS_KEY = 'up-user-stats-v1';

export function saveSession(db: Firestore, userId: string, session: GameSession) {
  const sessionRef = doc(db, 'sessions', session.id);
  
  const payload = {
    ...session,
    userId,
    timestamp: Date.now()
  };

  setDoc(sessionRef, payload, { merge: true })
    .catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: sessionRef.path,
        operation: 'write',
        requestResourceData: payload,
      });
      errorEmitter.emit('permission-error', permissionError);
    });

  // Local backup
  if (typeof window !== 'undefined') {
    const sessions = getAllSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx > -1) sessions[idx] = session;
    else sessions.push(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
}

export async function updateCloudStats(db: Firestore, userId: string, shards: number) {
  const userRef = doc(db, 'users', userId);
  
  try {
    const snap = await getDoc(userRef);
    let currentStats: UserStats = { totalShards: 0, puzzlesSolved: 0 };
    if (snap.exists()) {
      currentStats = snap.data() as UserStats;
    }

    const updatedStats = {
      totalShards: (currentStats.totalShards || 0) + shards,
      puzzlesSolved: (currentStats.puzzlesSolved || 0) + 1,
      lastLogin: new Date().toISOString()
    };

    setDoc(userRef, updatedStats, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updatedStats,
        }));
      });
    
    // Leaderboard entry
    const lbRef = doc(collection(db, 'leaderboard'));
    const lbData = {
      userId,
      userName: snap.data()?.displayName || 'Anonymous Player',
      score: updatedStats.totalShards,
      timestamp: Date.now()
    };
    
    setDoc(lbRef, lbData)
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: lbRef.path,
          operation: 'create',
          requestResourceData: lbData,
        }));
      });

    // Local sync
    if (typeof window !== 'undefined') {
      localStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
    }

    return updatedStats;
  } catch (err) {
    console.error("Failed to sync cloud stats", err);
    return getUserStats();
  }
}

export function addReward(shards: number) {
  if (typeof window === 'undefined') return;
  const stats = getUserStats();
  const updated = {
    ...stats,
    totalShards: stats.totalShards + shards,
    puzzlesSolved: stats.puzzlesSolved + 1
  };
  localStorage.setItem(STATS_KEY, JSON.stringify(updated));
}

export function calculateReward(diff: string, time: number): number {
  const base = diff === 'Easy' ? 50 : diff === 'Medium' ? 120 : diff === 'Hard' ? 300 : 750;
  const timeBonus = Math.max(0, 100 - Math.floor(time / 10));
  return base + timeBonus;
}

export function getAllSessions(): GameSession[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

export function getUserStats(): UserStats {
  if (typeof window === 'undefined') return { totalShards: 0, puzzlesSolved: 0 };
  const stored = localStorage.getItem(STATS_KEY);
  if (!stored) return { totalShards: 0, puzzlesSolved: 0 };
  try { return JSON.parse(stored); } catch { return { totalShards: 0, puzzlesSolved: 0 }; }
}
