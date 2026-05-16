
export interface GameSession {
  id: string;
  type: 'Sudoku' | 'Sliding Puzzle' | 'Memory Grid';
  difficulty: string;
  data: string;
  solution: string;
  userProgress: string;
  moves: number;
  startTime: number;
  lastPlayed: number;
  isCompleted?: boolean;
  timeSpent?: number; // in seconds
  earnedShards?: number;
}

export const STORAGE_KEY = 'enigma-nexus-sessions-v3';
export const USER_STATS_KEY = 'enigma-nexus-user-stats';

export interface UserStats {
  totalShards: number;
  puzzlesSolved: number;
}

export function saveSession(session: GameSession) {
  if (typeof window === 'undefined') return;
  const sessions = getAllSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getAllSessions(): GameSession[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function deleteSession(id: string) {
  if (typeof window === 'undefined') return;
  const sessions = getAllSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getUserStats(): UserStats {
  if (typeof window === 'undefined') return { totalShards: 0, puzzlesSolved: 0 };
  const stored = localStorage.getItem(USER_STATS_KEY);
  if (!stored) return { totalShards: 0, puzzlesSolved: 0 };
  try {
    return JSON.parse(stored);
  } catch {
    return { totalShards: 0, puzzlesSolved: 0 };
  }
}

export function addReward(shards: number) {
  if (typeof window === 'undefined') return;
  const stats = getUserStats();
  stats.totalShards += shards;
  stats.puzzlesSolved += 1;
  localStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
}

export function calculateReward(difficulty: string, timeSpent: number): number {
  const base = difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : difficulty === 'Hard' ? 250 : 500;
  // Bonus for speed (if solved under 5 mins for simple, 10 for expert)
  const timeBonus = Math.max(0, 100 - Math.floor(timeSpent / 10));
  return base + timeBonus;
}
