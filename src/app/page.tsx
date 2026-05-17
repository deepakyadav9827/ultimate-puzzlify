
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
  ArrowLeft,
  Search,
  TrendingUp,
  Skull,
  RefreshCw
} from 'lucide-react';
import { GameSession, saveSession, getUserStats, updateCloudStats, UserStats, calculateReward } from '@/lib/game-utils';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';

type View = 'hub' | 'play' | 'profile' | 'leaderboard';

function getSlidingShuffle(size: number) {
  const count = size * size;
  let arr = Array.from({ length: count }, (_, i) => (i + 1) % count);
  let emptyIdx = count - 1;
  for (let i = 0; i < 400; i++) {
    const row = Math.floor(emptyIdx / size);
    const col = emptyIdx % size;
    const neighbors = [];
    if (row > 0) neighbors.push(emptyIdx - size);
    if (row < size - 1) neighbors.push(emptyIdx + size);
    if (col > 0) neighbors.push(emptyIdx - 1);
    if (col < size - 1) neighbors.push(emptyIdx + 1);
    const target = neighbors[Math.floor(Math.random() * neighbors.length)];
    [arr[emptyIdx], arr[target]] = [arr[target], arr[emptyIdx]];
    emptyIdx = target;
  }
  return arr.join(',');
}

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
    setActiveSession(null);

    try {
      let data = "";
      let solution = "";
      let size = 3;

      if (type === 'Sliding Puzzle') {
        size = pDiff === 'Expert' ? 6 : pDiff === 'Hard' ? 4 : 3;
        solution = Array.from({ length: size * size }, (_, i) => (i + 1) % (size * size)).join(',');
      } else if (type === 'Memory Grid') {
        size = pDiff === 'Expert' ? 6 : 4;
        solution = "MATCHED";
      }

      const needsAI = ['Sudoku', 'Sliding Puzzle', 'Memory Grid'].includes(type);
      
      if (needsAI) {
        try {
          const result = await Promise.race([
            generateUniquePuzzle({ puzzleType: type, difficulty: pDiff }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
          ]);
          data = result.puzzleData;
          if (type !== 'Sliding Puzzle') solution = result.solution;
        } catch (aiError) {
          if (type === 'Sliding Puzzle') {
            data = getSlidingShuffle(size);
          } else if (type === 'Memory Grid') {
            const symbols = "🍎,🍌,🍒,🥑,⭐,🌙,☀️,☁️,🐱,🐶,🦊,🐰,🦁,🐯,🐼,🐨,🐷,🐸,🐙,🦋,🦄,🐉,🍦,🍕,🎮,🚀,🌈,💎,🍀,🔥,❄️,🎭,🎸,⚽,🛸,👻".split(',');
            const selectedCount = (size * size) / 2;
            const selected = symbols.sort(() => Math.random() - 0.5).slice(0, selectedCount);
            data = [...selected, ...selected].sort(() => Math.random() - 0.5).join(',');
            solution = "MATCHED";
          } else {
            const banks = [
                "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
                ".94...13..............76..2.8..1.....32.........2...6.....8.4......6...3.7.4.9...",
                "....7..2.8.......6.1.2.5...9.54....8.........3....85.1...3.2.8.4.......9.7..6...."
            ];
            data = banks[Math.floor(Math.random() * banks.length)];
            solution = "WIN";
          }
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
      } else {
        const stats = getUserStats();
        const updatedStats = { ...stats, totalShards: stats.totalShards + reward, puzzlesSolved: stats.puzzlesSolved + 1 };
        localStorage.setItem('up-user-stats-v1', JSON.stringify(updatedStats));
        setUserStats(updatedStats);
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
      <div className="min-h-screen p-4 sm:p-8 md:p-12 max-w-7xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-5">
            <div className="size-16 sm:size-20 rounded-2xl glass violet-glow flex items-center justify-center violet-pulse">
              <span className="text-3xl sm:text-4xl font-headline font-bold text-violet-400">UP</span>
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-headline font-bold text-white tracking-tighter">ULTIMATE PUZZLIFY</h1>
              <p className="game-status-label mt-1">Multi Puzzles Premium</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3 flex-1 md:flex-none justify-center md:justify-start">
              <Zap className="text-violet-400 size-5" />
              <span className="font-mono font-bold text-xl">{userStats.totalShards}</span>
            </div>
            <Button variant="ghost" size="icon" className="glass size-12 rounded-2xl" onClick={() => setView('profile')}>
              <User className="size-6 text-violet-400" />
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass border-none p-6 sm:p-10 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform hidden lg:block">
              <Sparkles className="size-48 text-violet-400" />
            </div>
            <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex items-center gap-2 text-violet-400 mb-4">
                <TrendingUp className="size-5" />
                <span className="game-status-label">Protocol Active</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-headline font-bold mb-4 tracking-tight">Neural Weaving</h2>
              <p className="text-muted-foreground mb-8 max-w-md text-lg">Generate unique logical threads daily. Master the mesh to earn premium shards.</p>
              <Button className="rounded-xl px-12 h-16 bg-violet-600 hover:bg-violet-500 violet-glow text-xl font-headline font-bold uppercase tracking-widest transition-all active:scale-95" onClick={() => startNewGame('Sudoku')}>
                Initialize Today
              </Button>
            </div>
          </Card>

          <Card className="glass border-none p-8 rounded-[2rem] flex flex-col justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4 justify-center lg:justify-start">
                <Activity className="size-4 text-violet-400" />
                <h3 className="game-status-label">Difficulty Protocol</h3>
              </div>
              <Select value={pDiff} onValueChange={setPDiff}>
                <SelectTrigger className="bg-white/5 border-none h-16 rounded-2xl text-xl font-headline font-bold focus:ring-2 focus:ring-violet-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  <SelectItem value="Easy" className="font-headline text-lg">Novice</SelectItem>
                  <SelectItem value="Medium" className="font-headline text-lg">Adept</SelectItem>
                  <SelectItem value="Hard" className="font-headline text-lg">Expert (4x4 Matrix)</SelectItem>
                  <SelectItem value="Expert" className="font-headline text-lg">Grandmaster (6x6 Matrix)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between game-status-label px-1">
                <span>Progress Matrix</span>
                <span className="text-violet-400">{userStats.puzzlesSolved} SOLVED</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (userStats.puzzlesSolved / 10) * 100)}%` }} />
              </div>
            </div>
          </Card>
        </section>

        {categories.map((cat, idx) => (
          <section key={idx} className="space-y-6">
            <h2 className="text-2xl font-headline font-bold flex items-center gap-3 uppercase tracking-tighter justify-center lg:justify-start">
              {idx === 0 ? <Gamepad2 className="text-violet-400 size-6" /> : <Search className="text-pink-400 size-6" />}
              {cat.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.games.map((g) => (
                <Card 
                  key={g.id} 
                  onClick={() => startNewGame(g.id)}
                  className="glass-card border-none rounded-[2rem] p-8 group cursor-pointer relative transition-all active:scale-95"
                >
                  <div className={cn("size-16 rounded-2xl glass mb-6 flex items-center justify-center group-hover:scale-110 transition-transform", g.color)}>
                    <g.icon className="size-10" />
                  </div>
                  <CardTitle className="text-2xl font-headline mb-1 uppercase tracking-wider">{g.name}</CardTitle>
                  <CardDescription className="game-status-label opacity-60">
                    Neural Thread
                  </CardDescription>
                  <ChevronRight className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all -translate-x-3 group-hover:translate-x-0 size-6" />
                </Card>
              ))}
            </div>
          </section>
        ))}

        {loading && (
          <div className="fixed inset-0 z-[100] glass flex items-center justify-center animate-in fade-in duration-500 backdrop-blur-3xl">
            <div className="text-center p-8 max-w-lg w-full">
              <div className="size-28 sm:size-32 glass rounded-3xl mx-auto flex items-center justify-center violet-glow mb-10 animate-pulse">
                <Cpu className="size-14 text-violet-400" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-headline font-bold text-gradient uppercase tracking-tighter">WEAVING NEURAL MESH</h2>
              <p className="game-status-label mt-6 text-lg">Initializing Logic Protocol...</p>
              <div className="mt-10 flex gap-3 justify-center">
                {[1,2,3,4].map(i => <div key={i} className="size-3 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const boardSize = activeSession?.type === 'Sliding Puzzle' 
    ? (activeSession?.difficulty === 'Expert' ? 6 : activeSession?.difficulty === 'Hard' ? 4 : 3)
    : (activeSession?.type === 'Memory Grid' ? (activeSession?.difficulty === 'Expert' ? 6 : 4) : 0);

  return (
    <div className="min-h-screen flex flex-col animate-in fade-in duration-500 bg-background overflow-x-hidden">
      <nav className="glass sticky top-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-between backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3 sm:gap-6">
          <Button variant="ghost" size="icon" onClick={() => setView('hub')} className="glass hover:bg-destructive/10 text-muted-foreground hover:text-destructive size-10 sm:size-12 rounded-xl">
            <ArrowLeft className="size-5 sm:size-6" />
          </Button>
          <div className="hidden sm:block">
            <h2 className="text-lg sm:text-2xl font-headline font-bold text-violet-400 uppercase tracking-tighter truncate max-w-[120px] sm:max-w-none">{activeSession?.type}</h2>
            <div className="flex gap-2 game-status-label text-[10px] sm:text-xs">
              <span>{activeSession?.difficulty}</span>
              <span className="text-violet-400">SYNCED</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-10">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 font-mono text-lg sm:text-2xl text-violet-400 font-bold">
              <Timer className="size-4 sm:size-5" /> {formatTime(elapsedSeconds)}
            </div>
            <span className="game-status-label text-[9px] sm:text-[10px]">RUNTIME</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="font-mono text-lg sm:text-2xl text-primary font-bold">{activeSession?.moves}</div>
            <span className="game-status-label text-[9px] sm:text-[10px]">OPS</span>
          </div>
          <Button variant="ghost" size="icon" className="glass size-10 sm:size-12 rounded-xl hover:text-violet-400 transition-colors" onClick={() => startNewGame(activeSession?.type || 'Sudoku')}>
            <RotateCcw className="size-5" />
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-10 relative">
        {showWin && (
          <div className="fixed inset-0 z-[60] glass flex flex-col items-center justify-center animate-in zoom-in duration-500 p-6 backdrop-blur-3xl">
            <div className="glass p-8 sm:p-16 rounded-[3rem] text-center violet-glow border-violet-400/30 max-w-xl w-full">
              <div className="size-24 sm:size-32 rounded-full glass mx-auto mb-8 flex items-center justify-center violet-pulse">
                <Trophy className="size-12 sm:size-16 text-amber-400" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-headline font-bold text-gradient mb-2 uppercase tracking-tighter">MATRIX SOLVED</h2>
              <p className="game-status-label mb-8 text-lg">Logic Synchronized Successfully</p>
              <div className="text-violet-300 font-mono text-4xl sm:text-6xl mb-12 font-bold tracking-tighter">
                +{calculateReward(activeSession?.difficulty || 'Easy', elapsedSeconds)} SHARDS
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1 h-16 rounded-2xl glass hover:bg-white/10 text-xl font-headline font-bold uppercase tracking-widest" onClick={() => setView('hub')}>BACK TO HUB</Button>
                <Button className="flex-1 h-16 rounded-2xl bg-violet-600 hover:bg-violet-500 violet-glow text-xl font-headline font-bold uppercase tracking-widest" onClick={() => startNewGame(activeSession?.type || 'Sudoku')}>NEXT MATRIX</Button>
              </div>
            </div>
          </div>
        )}

        {showGameOver && (
          <div className="fixed inset-0 z-[60] glass flex flex-col items-center justify-center animate-in fade-in duration-500 p-6 backdrop-blur-3xl">
            <div className="glass p-8 sm:p-16 rounded-[3rem] text-center border-destructive/30 max-w-xl w-full">
              <div className="size-24 sm:size-32 rounded-full glass border-destructive/50 mx-auto mb-8 flex items-center justify-center">
                <Skull className="size-12 sm:size-16 text-destructive" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-headline font-bold text-gradient-destructive mb-2 uppercase tracking-tighter">PROTOCOL FAILED</h2>
              <p className="game-status-label text-destructive mb-12 text-lg">Neural Thread Disconnected</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1 h-16 rounded-2xl glass hover:bg-white/10 text-xl font-headline font-bold uppercase tracking-widest" onClick={() => setView('hub')}>BACK TO HUB</Button>
                <Button className="flex-1 h-16 rounded-2xl bg-destructive hover:bg-destructive/80 text-xl font-headline font-bold uppercase tracking-widest flex items-center justify-center gap-3" onClick={() => startNewGame(activeSession?.type || 'Sudoku')}>
                  <RefreshCw className="size-6" /> RETRY PROTOCOL
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-4xl glass p-4 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative overflow-auto max-h-[calc(100vh-140px)] scrollbar-hide">
          {activeSession && activeSession.type === 'Sudoku' && <SudokuBoard key={activeSession.id} initialData={activeSession.data} userProgress={activeSession.userProgress} onUpdate={handleUpdate} />}
          {activeSession && activeSession.type === 'Sliding Puzzle' && <SlidingBoard key={activeSession.id} initialData={activeSession.data} size={boardSize} onUpdate={handleUpdate} />}
          {activeSession && activeSession.type === 'Memory Grid' && <MemoryBoard key={activeSession.id} initialData={activeSession.data} size={boardSize} onUpdate={handleUpdate} />}
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
