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
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
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
  ChevronRight,
  User,
  Hash,
  XCircle,
  Gamepad2,
  Lock,
  ArrowLeft,
  Search,
  TrendingUp,
  Skull,
  RefreshCw
} from 'lucide-react';
import { GameSession, saveSession, getAllSessions, getUserStats, updateCloudStats, UserStats, calculateReward } from '@/lib/game-utils';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';

type View = 'hub' | 'play' | 'profile' | 'leaderboard';

const FALLBACK_PUZZLES: Record<string, any> = {
  'Sudoku': [
    { data: "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79", solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179" },
    { data: ".94...13..............76..2.8..1.....32.........2...6.....8.4......6...3.7.4.9...", solution: "294358137618243597357917642485716239932584716761329485123895674849762351576431928" }
  ],
  'Sliding Puzzle': [
    { data: "1,2,3,4,5,6,7,0,8", solution: "1,2,3,4,5,6,7,8,0" },
    { data: "4,1,2,7,5,3,0,8,6", solution: "1,2,3,4,5,6,7,8,0" },
    { data: "8,6,7,2,5,4,3,0,1", solution: "1,2,3,4,5,6,7,8,0" }
  ],
  'Memory Grid': [
    { data: "🍎,🍌,🍎,🍌,🍒,🥑,🍒,🥑,⭐,🌙,⭐,🌙,☀️,☁️,☀️,☁️", solution: "MATCHED" },
    { data: "🐱,🐶,🐱,🐶,🦊,🐰,🦊,🐰,🦁,🐯,🦁,🐯,🐼,🐨,🐼,🐨", solution: "MATCHED" }
  ]
};

export default function UltimatePuzzlify() {
  const { user } = useUser();
  const db = useFirestore();
  const [view, setView] = useState<View>('hub');
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ totalShards: 0, puzzlesSolved: 0 });
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pDiff, setPDiff] = useState<string>('Medium');
  const [showWin, setShowWin] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    setUserStats(getUserStats());
  }, [view]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'play' && activeSession && !activeSession.isCompleted && !showGameOver && !showWin) {
      interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [view, activeSession, showGameOver, showWin]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  };

  const startNewGame = async (type: string) => {
    setLoading(true);
    setShowWin(false);
    setShowGameOver(false);
    
    // Reset session briefly to force component remount and clear state
    setActiveSession(null);

    try {
      const needsAI = ['Sudoku', 'Sliding Puzzle', 'Memory Grid'].includes(type);
      let data = "";
      let solution = "";
      
      if (needsAI) {
        try {
          const result = await Promise.race([
            generateUniquePuzzle({ puzzleType: type, difficulty: pDiff }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
          ]);
          data = result.puzzleData;
          solution = result.solution;
        } catch (aiError) {
          console.warn("Using local fallback bank for variety");
          const bank = FALLBACK_PUZZLES[type] || FALLBACK_PUZZLES['Sudoku'];
          const fallback = bank[Math.floor(Math.random() * bank.length)];
          data = fallback.data;
          solution = fallback.solution;
        }
      }

      const newSession: GameSession = {
        id: Math.random().toString(36).substring(7),
        type: type as any,
        difficulty: pDiff,
        data,
        solution: solution || "WIN",
        userProgress: data,
        moves: 0,
        startTime: Date.now(),
        lastPlayed: Date.now(),
        timeSpent: 0,
        isCompleted: false
      };
      
      setActiveSession(newSession);
      setElapsedSeconds(0);
      setView('play');

      if (user && db) {
        saveSession(db, user.uid, newSession);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Protocol Failed", description: "Logical thread initialization failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (progress: string, moveIncrement = 1) => {
    if (!activeSession || activeSession.isCompleted) return;
    
    if (progress === "LOSE") {
      setShowGameOver(true);
      return;
    }

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
      if (user && db) {
        updateCloudStats(db, user.uid, reward).then(stats => setUserStats(stats));
      }
      setShowWin(true);
    }

    setActiveSession(updated);
    if (user && db) {
      saveSession(db, user.uid, updated);
    }
  };

  const categories = [
    {
      title: "Core Logic",
      games: [
        { id: 'Sudoku', name: 'Sudoku', icon: Grid3X3, color: 'text-violet-400' },
        { id: 'Sliding Puzzle', name: 'Sliding Tiles', icon: Layers, color: 'text-pink-400' },
        { id: 'Memory Grid', name: 'Memory Grid', icon: LayoutGrid, color: 'text-purple-400' },
      ]
    },
    {
      title: "Tactical & Math",
      games: [
        { id: '2048', name: '2048', icon: Hash, color: 'text-amber-400' },
        { id: 'TicTacToeAI', name: 'Tic Tac Toe', icon: XCircle, color: 'text-cyan-400' },
      ]
    }
  ];

  if (view === 'hub') {
    return (
      <div className="min-h-screen p-4 sm:p-8 md:p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="size-16 rounded-2xl glass violet-glow flex items-center justify-center violet-pulse">
              <span className="text-3xl font-headline font-bold text-violet-400">UP</span>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-headline font-bold text-white tracking-tighter">ULTIMATE PUZZLIFY</h1>
              <p className="game-status-label">Premium Multi Puzzles</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3 flex-1 md:flex-none">
              <Zap className="text-violet-400 size-5" />
              <span className="font-mono font-bold text-xl">{userStats.totalShards}</span>
            </div>
            <Button variant="ghost" size="icon" className="glass size-12 rounded-2xl" onClick={() => setView('profile')}>
              <User className="size-6 text-violet-400" />
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 glass border-none p-8 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
              <Sparkles className="size-48 text-violet-400" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-violet-400 mb-4">
                <TrendingUp className="size-5" />
                <span className="game-status-label">Protocol Active</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-headline font-bold mb-4">Neural Weaving</h2>
              <p className="text-muted-foreground mb-8 max-w-md">Generate unique logical threads daily. Master the mesh to earn premium shards.</p>
              <Button className="rounded-xl px-10 h-14 bg-violet-600 hover:bg-violet-500 violet-glow text-lg font-headline font-bold uppercase tracking-widest" onClick={() => startNewGame('Sudoku')}>
                Initialize Today
              </Button>
            </div>
          </Card>

          <Card className="glass border-none p-8 rounded-[2rem] flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="size-4 text-violet-400" />
                <h3 className="game-status-label">Difficulty Protocol</h3>
              </div>
              <Select value={pDiff} onValueChange={setPDiff}>
                <SelectTrigger className="bg-white/5 border-none h-16 rounded-2xl text-xl font-headline font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="Easy" className="font-headline">Novice</SelectItem>
                  <SelectItem value="Medium" className="font-headline">Adept</SelectItem>
                  <SelectItem value="Hard" className="font-headline">Expert</SelectItem>
                  <SelectItem value="Expert" className="font-headline">Grandmaster</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between game-status-label">
                <span>Progress Matrix</span>
                <span className="text-violet-400">{userStats.puzzlesSolved} SOLVED</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-600 rounded-full" style={{ width: `${Math.min(100, (userStats.puzzlesSolved / 10) * 100)}%` }} />
              </div>
            </div>
          </Card>
        </section>

        {categories.map((cat, idx) => (
          <section key={idx} className="space-y-6">
            <h2 className="text-2xl font-headline font-bold flex items-center gap-3 uppercase tracking-tighter">
              {idx === 0 ? <Gamepad2 className="text-violet-400" /> : <Search className="text-pink-400" />}
              {cat.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.games.map((g) => (
                <Card 
                  key={g.id} 
                  onClick={() => startNewGame(g.id)}
                  className="glass-card border-none rounded-[2rem] p-8 group cursor-pointer relative transition-all active:scale-95"
                >
                  <div className={cn("size-14 rounded-2xl glass mb-6 flex items-center justify-center group-hover:scale-110 transition-transform", g.color)}>
                    <g.icon className="size-8" />
                  </div>
                  <CardTitle className="text-xl font-headline mb-1 uppercase tracking-wider">{g.name}</CardTitle>
                  <CardDescription className="game-status-label opacity-60">
                    Neural Thread
                  </CardDescription>
                  <ChevronRight className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                </Card>
              ))}
            </div>
          </section>
        ))}

        {loading && (
          <div className="fixed inset-0 z-[100] glass flex items-center justify-center animate-in fade-in duration-500 backdrop-blur-3xl">
            <div className="text-center p-8">
              <div className="size-24 glass rounded-3xl mx-auto flex items-center justify-center violet-glow mb-8 animate-pulse">
                <Cpu className="size-12 text-violet-400" />
              </div>
              <h2 className="game-title">WEAVING NEURAL MESH</h2>
              <p className="game-status-label mt-4">Initializing Logic Protocol...</p>
              <div className="mt-8 flex gap-2 justify-center">
                {[1,2,3,4].map(i => <div key={i} className="size-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col animate-in fade-in duration-500">
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('hub')} className="glass hover:bg-destructive/10 text-muted-foreground hover:text-destructive size-10">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-lg font-headline font-bold text-violet-400 uppercase tracking-tighter">{activeSession?.type}</h2>
            <div className="flex gap-2 game-status-label">
              <span>{activeSession?.difficulty}</span>
              <span className="text-violet-400">SYNCED</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end hidden sm:flex">
            <div className="flex items-center gap-2 font-mono text-xl text-violet-400 font-bold">
              <Timer className="size-4" /> {formatTime(elapsedSeconds)}
            </div>
            <span className="game-status-label">RUNTIME</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="font-mono text-xl text-primary font-bold">{activeSession?.moves}</div>
            <span className="game-status-label">OPERATIONS</span>
          </div>
          <Button variant="ghost" size="icon" className="glass size-10 hover:text-violet-400 transition-colors" onClick={() => startNewGame(activeSession?.type || 'Sudoku')}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {showWin && (
          <div className="fixed inset-0 z-[60] glass flex flex-col items-center justify-center animate-in zoom-in duration-500 p-6 backdrop-blur-3xl">
            <div className="glass p-12 rounded-[3rem] text-center violet-glow border-violet-400/30 max-w-xl w-full">
              <div className="size-32 rounded-full glass mx-auto mb-8 flex items-center justify-center violet-pulse">
                <Trophy className="size-16 text-amber-400" />
              </div>
              <h2 className="game-title mb-2">MATRIX SOLVED</h2>
              <p className="game-status-label mb-8">Logic Synchronized Successfully</p>
              <div className="text-violet-300 font-mono text-4xl mb-12 font-bold">
                +{calculateReward(activeSession?.difficulty || 'Easy', elapsedSeconds)} SHARDS
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1 h-16 rounded-2xl glass hover:bg-white/10 text-lg font-headline font-bold uppercase tracking-widest" onClick={() => setView('hub')}>BACK TO HUB</Button>
                <Button className="flex-1 h-16 rounded-2xl bg-violet-600 hover:bg-violet-500 violet-glow text-lg font-headline font-bold uppercase tracking-widest" onClick={() => startNewGame(activeSession?.type || 'Sudoku')}>NEXT MATRIX</Button>
              </div>
            </div>
          </div>
        )}

        {showGameOver && (
          <div className="fixed inset-0 z-[60] glass flex flex-col items-center justify-center animate-in fade-in duration-500 p-6 backdrop-blur-3xl">
            <div className="glass p-12 rounded-[3rem] text-center border-destructive/30 max-w-xl w-full">
              <div className="size-32 rounded-full glass border-destructive/50 mx-auto mb-8 flex items-center justify-center">
                <Skull className="size-16 text-destructive" />
              </div>
              <h2 className="game-over-title mb-2">PROTOCOL FAILED</h2>
              <p className="game-status-label text-destructive mb-12">Neural Thread Disconnected</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1 h-16 rounded-2xl glass hover:bg-white/10 text-lg font-headline font-bold uppercase tracking-widest" onClick={() => setView('hub')}>BACK TO HUB</Button>
                <Button className="flex-1 h-16 rounded-2xl bg-destructive hover:bg-destructive/80 text-lg font-headline font-bold uppercase tracking-widest flex items-center justify-center gap-2" onClick={() => startNewGame(activeSession?.type || 'Sudoku')}>
                  <RefreshCw className="size-5" /> RETRY PROTOCOL
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-2xl glass p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-auto max-h-[calc(100vh-140px)]">
          {activeSession && activeSession.type === 'Sudoku' && <SudokuBoard key={activeSession.id} initialData={activeSession.data} userProgress={activeSession.userProgress} onUpdate={handleUpdate} />}
          {activeSession && activeSession.type === 'Sliding Puzzle' && <SlidingBoard key={activeSession.id} initialData={activeSession.data} onUpdate={handleUpdate} />}
          {activeSession && activeSession.type === 'Memory Grid' && <MemoryBoard key={activeSession.id} initialData={activeSession.data} onUpdate={handleUpdate} />}
          {activeSession && activeSession.type === '2048' && <Game2048 key={activeSession.id} onUpdate={handleUpdate} />}
          {activeSession && activeSession.type === 'TicTacToeAI' && <TicTacToeAI key={activeSession.id} onUpdate={handleUpdate} />}
        </div>
      </main>

      {activeSession && !activeSession.isCompleted && !showGameOver && !showWin && (
        <HintMentor puzzleType={activeSession.type} difficulty={activeSession.difficulty} gameState={activeSession.userProgress} />
      )}
    </div>
  );
}
