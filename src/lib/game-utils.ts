
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
}

export const STORAGE_KEY = 'enigma-nexus-sessions';

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
