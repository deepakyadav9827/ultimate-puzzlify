
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

export const STORAGE_KEY = 'ultimate-puzzlify-v1';
export const USER_STATS_KEY = 'up-user-stats-v1';

export interface UserStats {
  totalShards: number;
  puzzlesSolved: number;
}

export function saveSession(session: GameSession) {
  if (typeof window === 'undefined') return;
  const sessions = getAllSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) sessions[index] = session;
  else sessions.push(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getAllSessions(): GameSession[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

export function getUserStats(): UserStats {
  if (typeof window === 'undefined') return { totalShards: 0, puzzlesSolved: 0 };
  const stored = localStorage.getItem(USER_STATS_KEY);
  if (!stored) return { totalShards: 0, puzzlesSolved: 0 };
  try { return JSON.parse(stored); } catch { return { totalShards: 0, puzzlesSolved: 0 }; }
}

export function addReward(shards: number) {
  if (typeof window === 'undefined') return;
  const stats = getUserStats();
  stats.totalShards += shards;
  stats.puzzlesSolved += 1;
  localStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
}

export function calculateReward(diff: string, time: number): number {
  const base = diff === 'Easy' ? 50 : diff === 'Medium' ? 120 : diff === 'Hard' ? 300 : 750;
  const timeBonus = Math.max(0, 100 - Math.floor(time / 10));
  return base + timeBonus;
}
