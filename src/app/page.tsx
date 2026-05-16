
'use client';

import React, { useState, useEffect } from 'react';
import { generateUniquePuzzle } from '@/ai/flows/generate-unique-puzzle';
import { SudokuBoard } from '@/components/puzzle/SudokuBoard';
import { SlidingBoard } from '@/components/puzzle/SlidingBoard';
import { MemoryBoard } from '@/components/puzzle/MemoryBoard';
import { Game2048 } from '@/components/puzzle/Game2048';
import { TicTacToeAI } from '@/components/puzzle/TicTacToeAI';
import { HintMentor } from '@/components/puzzle/HintMentor';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Grid3X3, 
  Layers, 
  LayoutGrid, 
  Timer, 
  Trophy, 
  RotateCcw,
  Zap,
  Sparkles,
  Cpu,
  Activity,
  LogOut,
  ChevronRight,
  User,
  Hash,
  XCircle,
  Shapes,
  Gamepad2,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { GameSession, saveSession, getAllSessions, getUserStats, addReward, calculateReward, updateCloudStats, UserStats } from '@/lib/game-utils';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';

type View = 'hub' | 'play' | 'profile' | 'leaderboard';

export default function UltimatePuzzlify() {
  const { user } = useUser();
  const db = useFirestore();
  const [view, setView] = useState<View>('hub');
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ totalShards: 0, puzzlesSolved: 0 });
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pDiff, setPDiff] = useState<string>('Medium');
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    setSessions(getAllSessions());
    setUserStats(getUserStats());
  }, [view]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'play' && activeSession && !activeSession.isCompleted) {
      interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [view, activeSession]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  };

  const startNewGame = async (type: string) => {
    setLoading(true);
    try {
      const needsAI = ['Sudoku', 'Sliding Puzzle', 'Memory Grid'].includes(type);
      let data = "";
      let solution = "";
      
      if (needsAI) {
        const result = await generateUniquePuzzle({ puzzleType: type, difficulty: pDiff });
        data = result.puzzleData;
        solution = result.solution;
      }

      // Special handling for 2048 and TicTacToe which are logic-driven not data-driven
      if (type === '2048') solution = "WIN";
      if (type === 'TicTacToeAI') solution = "WIN";

      const newSession: GameSession = {
        id: Math.random().toString(36).substring(7),
        type: type as any,
        difficulty: pDiff,
        data,
        solution,
        userProgress: data,
        moves: 0,
        startTime: Date.now(),
        lastPlayed: Date.now(),
        timeSpent: 0,
        isCompleted: false
      };
      
      setActiveSession(newSession);
      setElapsedSeconds(0);
      setShowWin(false);
      setView('play');

      if (user && db) {
        saveSession(db, user.uid, newSession);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Connection Error", description: "The matrix rejected our sync request." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (progress: string, moveIncrement = 1) => {
    if (!activeSession || activeSession.isCompleted) return;
    
    const isNowCompleted = progress === activeSession.solution || progress === "WIN" || progress === "MATCHED";
    const updated: GameSession = { 
      ...activeSession, 
      userProgress: progress, 
      moves: activeSession.moves + moveIncrement,
      timeSpent: elapsedSeconds,
      isCompleted: isNowCompleted
    };
    
    if (isNowCompleted) {
      const reward = calculateReward(activeSession.difficulty, elapsedSeconds);
      addReward(reward);
      if (user && db) {
        updateCloudStats(db, user.uid, reward).then(stats => setUserStats(stats));
      }
      setShowWin(true);
      toast({ title: "Victory!", description: `Matrix Deciphered. +${reward} Shards.` });
    }

    setActiveSession(updated);
    if (user && db) {
      saveSession(db, user.uid, updated);
    }
  };

  const games = [
    { id: 'Sudoku', name: 'Sudoku', icon: Grid3X3, color: 'text-violet-400', category: 'Logic' },
    { id: 'Sliding Puzzle', name: 'Sliding Tiles', icon: Layers, color: 'text-pink-400', category: 'Logic' },
    { id: 'Memory Grid', name: 'Memory', icon: LayoutGrid, color: 'text-purple-400', category: 'Logic' },
    { id: '2048', name: '2048', icon: Hash, color: 'text-amber-400', category: 'Math' },
    { id: 'TicTacToeAI', name: 'Tic Tac Toe', icon: XCircle, color: 'text-cyan-400', category: 'Strategy' },
    { id: 'Math', name: 'Math Pulse', icon: Activity, color: 'text-emerald-400', category: 'Math', locked: true },
    { id: 'Word', name: 'Word Crypt', icon: Shapes, color: 'text-indigo-400', category: 'Strategy', locked: true },
  ];

  if (view === 'hub') {
    return (
      <div className="min-h-screen p-4 sm:p-8 md:p-12 max-w-7xl mx-auto space-y-8 sm:space-y-12">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="size-12 sm:size-16 rounded-2xl glass violet-glow flex items-center justify-center violet-pulse">
              <span className="text-2xl sm:text-3xl font-bold text-violet-400">UP</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-headline font-bold text-white tracking-tight">ULTIMATE PUZZLIFY</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-wide">PREMIUM MULTI PUZZLES</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="glass px-4 sm:px-6 py-2 sm:py-3 rounded-2xl flex items-center gap-3">
              <Zap className="text-violet-400 size-4 sm:size-5" />
              <span className="font-mono font-bold text-lg sm:text-xl">{userStats.totalShards}</span>
            </div>
            <Button variant="ghost" size="icon" className="glass size-10 sm:size-12 rounded-2xl" onClick={() => setView('profile')}>
              <User className="size-5 sm:size-6 text-violet-400" />
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-2 glass p-6 sm:p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
              <Sparkles className="size-32 text-violet-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-headline font-bold mb-3 sm:mb-4">Daily AI Challenge</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md">Solve today's unique pattern and earn double Shards. New challenges every 24 hours.</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button className="w-full sm:w-auto rounded-xl px-8 h-12 bg-violet-600 hover:bg-violet-500 violet-glow" onClick={() => startNewGame('Sudoku')}>
                Decipher Now
              </Button>
              <div className="text-xs sm:text-sm font-mono text-violet-400 bg-violet-400/10 px-4 py-2 rounded-lg border border-violet-400/20">
                REWARD: 500 SHARDS
              </div>
            </div>
          </div>
          <div className="glass p-6 sm:p-8 rounded-3xl flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Adaptive Protocol</h3>
              <Select value={pDiff} onValueChange={setPDiff}>
                <SelectTrigger className="bg-white/5 border-none h-12 sm:h-14 rounded-xl text-lg sm:text-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="Easy">Novice</SelectItem>
                  <SelectItem value="Medium">Adept</SelectItem>
                  <SelectItem value="Hard">Expert</SelectItem>
                  <SelectItem value="Expert">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground italic">Harder puzzles yield premium multipliers.</p>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-headline font-bold flex items-center gap-3 uppercase tracking-tighter">
              <Gamepad2 className="text-violet-400" /> Matrix Selection
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {games.map((g) => (
              <Card 
                key={g.id} 
                onClick={() => !g.locked && startNewGame(g.id)}
                className={cn(
                  "glass-card border-none rounded-3xl p-4 sm:p-6 group cursor-pointer relative transition-all active:scale-95",
                  g.locked && "opacity-50 grayscale"
                )}
              >
                {g.locked && <Lock className="absolute top-4 right-4 size-4 sm:size-5 text-muted-foreground" />}
                <div className={cn("size-10 sm:size-14 rounded-2xl glass mb-4 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform", g.color)}>
                  <g.icon className="size-6 sm:size-8" />
                </div>
                <CardTitle className="mb-1 text-sm sm:text-lg">{g.name}</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs uppercase tracking-widest">{g.category}</CardDescription>
                <ChevronRight className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 hidden sm:block" />
              </Card>
            ))}
          </div>
        </section>

        {loading && (
          <div className="fixed inset-0 z-[100] glass flex items-center justify-center animate-in fade-in duration-300">
            <div className="text-center p-6">
              <div className="size-20 sm:size-24 glass rounded-3xl mx-auto flex items-center justify-center violet-glow mb-8 animate-pulse">
                <Cpu className="size-10 sm:size-12 text-violet-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-headline font-bold text-gradient">WEAVING NEURAL MESH</h2>
              <p className="text-muted-foreground text-sm mt-2">Constructing logical pathways...</p>
              <div className="mt-6 flex gap-1 justify-center">
                {[1,2,3].map(i => <div key={i} className="size-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="glass sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('hub')} className="glass hover:bg-destructive/10 text-muted-foreground hover:text-destructive size-9 sm:size-10">
            <ArrowLeft className="size-4 sm:size-5" />
          </Button>
          <div className="block">
            <h2 className="text-sm sm:text-lg font-bold text-violet-400 uppercase tracking-tighter truncate max-w-[120px] sm:max-w-none">{activeSession?.type}</h2>
            <div className="flex gap-1 sm:gap-2 text-[8px] sm:text-[10px] uppercase font-bold text-muted-foreground">
              <span>{activeSession?.difficulty}</span>
              <span className="text-violet-400 hidden sm:inline">SYNCED</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 sm:gap-2 font-mono text-base sm:text-xl text-violet-400 font-bold">
              <Timer className="size-3 sm:size-4" /> {formatTime(elapsedSeconds)}
            </div>
            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-muted-foreground hidden sm:block">RUNTIME</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="font-mono text-base sm:text-xl text-primary font-bold">{activeSession?.moves}</div>
            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-muted-foreground hidden sm:block">OPERATIONS</span>
          </div>
          <Button variant="ghost" size="icon" className="glass size-8 sm:size-10" onClick={() => setElapsedSeconds(0)}>
            <RotateCcw className="size-3 sm:size-4" />
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {showWin && (
          <div className="fixed inset-0 z-[60] glass flex flex-col items-center justify-center animate-in zoom-in duration-500 p-6">
            <div className="glass p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] text-center violet-glow border-violet-400/30 max-w-md w-full">
              <Trophy className="size-16 sm:size-24 text-amber-400 mx-auto mb-4 sm:mb-6 animate-bounce" />
              <h2 className="text-3xl sm:text-4xl font-headline font-bold mb-2">MATRIX SOLVED</h2>
              <p className="text-violet-300 font-mono text-xl sm:text-2xl mb-6 sm:mb-8">+{calculateReward(activeSession?.difficulty || 'Easy', elapsedSeconds)} SHARDS</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button className="flex-1 h-12 sm:h-14 rounded-2xl glass hover:bg-white/10" onClick={() => setView('hub')}>BACK TO HUB</Button>
                <Button className="flex-1 h-12 sm:h-14 rounded-2xl bg-violet-600 hover:bg-violet-500" onClick={() => startNewGame(activeSession?.type || 'Sudoku')}>NEXT MATRIX</Button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-2xl glass p-4 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative overflow-auto max-h-[calc(100vh-140px)]">
          {activeSession?.type === 'Sudoku' && <SudokuBoard initialData={activeSession.data} userProgress={activeSession.userProgress} onUpdate={handleUpdate} />}
          {activeSession?.type === 'Sliding Puzzle' && <SlidingBoard initialData={activeSession.data} onUpdate={handleUpdate} />}
          {activeSession?.type === 'Memory Grid' && <MemoryBoard initialData={activeSession.data} onUpdate={handleUpdate} />}
          {activeSession?.type === '2048' && <Game2048 onUpdate={handleUpdate} />}
          {activeSession?.type === 'TicTacToeAI' && <TicTacToeAI onUpdate={handleUpdate} />}
        </div>
      </main>

      {activeSession && !activeSession.isCompleted && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
          <HintMentor puzzleType={activeSession.type} difficulty={activeSession.difficulty} gameState={activeSession.userProgress} />
        </div>
      )}
    </div>
  );
}
