'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateUniquePuzzle } from '@/ai/flows/generate-unique-puzzle';
import { SudokuBoard } from '@/components/puzzle/SudokuBoard';
import { SlidingBoard } from '@/components/puzzle/SlidingBoard';
import { MemoryBoard } from '@/components/puzzle/MemoryBoard';
import { HintMentor } from '@/components/puzzle/HintMentor';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Grid3X3, 
  Layers, 
  LayoutGrid, 
  Timer, 
  Trophy, 
  ArrowLeft, 
  Plus, 
  LogOut, 
  RotateCcw,
  CheckCircle2,
  PlayCircle,
  Zap,
  Star,
  Sparkles,
  Cpu,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { GameSession, saveSession, getAllSessions, deleteSession, getUserStats, addReward, calculateReward, UserStats } from '@/lib/game-utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { toast } from '@/hooks/use-toast';

type View = 'hub' | 'play' | 'analytics';

export default function EnigmaNexus() {
  const [view, setView] = useState<View>('hub');
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ totalShards: 0, puzzlesSolved: 0 });
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generator Config
  const [pDiff, setPDiff] = useState<string>('Medium');
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastReward, setLastReward] = useState(0);

  useEffect(() => {
    setSessions(getAllSessions());
    setUserStats(getUserStats());
  }, [view]);

  // Timer logic
  useEffect(() => {
    if (view === 'play' && activeSession && !activeSession.isCompleted) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, activeSession]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
  };

  const startNewGame = async (type: string) => {
    setLoading(true);
    try {
      const result = await generateUniquePuzzle({ puzzleType: type, difficulty: pDiff });
      const newSession: GameSession = {
        id: Math.random().toString(36).substr(2, 9),
        type: type as any,
        difficulty: pDiff,
        data: result.puzzleData,
        solution: result.solution,
        userProgress: result.puzzleData,
        moves: 0,
        startTime: Date.now(),
        lastPlayed: Date.now(),
        timeSpent: 0,
        isCompleted: false
      };
      saveSession(newSession);
      setActiveSession(newSession);
      setElapsedSeconds(0);
      setShowCelebration(false);
      setView('play');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Logic Stream Failure",
        description: "The AI weaver encountered a logical knot. Re-initializing...",
      });
    } finally {
      setLoading(false);
    }
  };

  const resumeGame = (session: GameSession) => {
    setActiveSession(session);
    setElapsedSeconds(session.timeSpent || 0);
    setShowCelebration(session.isCompleted || false);
    setView('play');
  };

  const handleUpdate = (progress: string, moveIncrement = 1) => {
    if (!activeSession || activeSession.isCompleted) return;
    
    const isNowCompleted = progress === activeSession.solution;
    
    const updated: GameSession = { 
      ...activeSession, 
      userProgress: progress, 
      lastPlayed: Date.now(),
      moves: activeSession.moves + moveIncrement,
      timeSpent: elapsedSeconds,
      isCompleted: isNowCompleted
    };
    
    if (isNowCompleted) {
      const reward = calculateReward(activeSession.difficulty, elapsedSeconds);
      updated.earnedShards = reward;
      setLastReward(reward);
      addReward(reward);
      setShowCelebration(true);
      toast({
        title: "Matrix Synchronized!",
        description: `Successfully woven pattern. Reward: ${reward} Shards.`,
      });
    }

    setActiveSession(updated);
    saveSession(updated);
  };

  const resetPuzzle = () => {
    if (!activeSession) return;
    const updated = { ...activeSession, userProgress: activeSession.data, moves: 0, timeSpent: 0, isCompleted: false };
    setActiveSession(updated);
    setElapsedSeconds(0);
    setShowCelebration(false);
    saveSession(updated);
  };

  const exitToHub = () => {
    if (activeSession) {
      saveSession({ ...activeSession, timeSpent: elapsedSeconds });
    }
    setView('hub');
  };

  const hubPuzzles = [
    { id: 'Sudoku', name: 'Sudoku', icon: Grid3X3, desc: '9x9 Number Logic Grid', image: PlaceHolderImages?.[0], color: 'text-primary' },
    { id: 'Sliding Puzzle', name: 'Sliding Tiles', icon: Layers, desc: '3x3 Kinetic Reordering', image: PlaceHolderImages?.[1], color: 'text-accent' },
    { id: 'Memory Grid', name: 'Memory Grid', icon: LayoutGrid, desc: '4x4 Pattern Matching', image: PlaceHolderImages?.[2], color: 'text-yellow-400' },
  ];

  if (view === 'hub') {
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 p-4 sm:p-8">
        <header className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center neon-glow">
              <Brain className="text-white size-8" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold tracking-tight text-primary">ENIGMA NEXUS</h1>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Cognitive Hub</p>
                <div className="flex items-center gap-1 bg-accent/20 text-accent px-2 py-0.5 rounded-full text-xs font-bold border border-accent/30">
                  <Zap className="size-3" /> {userStats.totalShards} SHARDS
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center bg-card/50 px-4 py-1 rounded-xl border border-primary/10">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Complexity</span>
              <Select value={pDiff} onValueChange={setPDiff}>
                <SelectTrigger className="h-8 border-none bg-transparent font-bold focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setView('analytics')} className="gap-2 border-primary/20 hover:bg-primary/10 h-auto py-2">
              <Trophy className="size-4 text-accent" /> Achievement
            </Button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto space-y-16">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-headline flex items-center gap-3">
                <Sparkles className="text-primary size-6" /> Available Matrices
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Select a logic pattern to begin synchronization.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {hubPuzzles.map((p) => (
                <Card 
                  key={p.id} 
                  className="group relative overflow-hidden border-primary/10 transition-all hover:border-primary/40 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer bg-card/50"
                  onClick={() => startNewGame(p.id)}
                >
                  <div className="h-48 relative bg-muted">
                    {p.image && (
                      <Image 
                        src={p.image.imageUrl} 
                        alt={p.name} 
                        fill 
                        className="object-cover opacity-40 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110" 
                        data-ai-hint={p.image.imageHint}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-primary text-white p-4 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                        <PlayCircle className="size-10" />
                      </div>
                    </div>
                  </div>
                  <CardHeader className="relative -mt-12 backdrop-blur-sm bg-background/40">
                    <div className={cn(
                      "size-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-2xl bg-secondary",
                      p.color
                    )}>
                      <p.icon className="size-8" />
                    </div>
                    <CardTitle className="font-headline text-xl">{p.name}</CardTitle>
                    <CardDescription>{p.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          {sessions.length > 0 && (
            <section className="bg-card/20 p-8 rounded-3xl border border-primary/5">
              <h2 className="text-2xl font-headline mb-8 flex items-center gap-3">
                <Activity className="text-accent size-6" /> Active Sessions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.sort((a,b) => b.lastPlayed - a.lastPlayed).map((s) => (
                  <div 
                    key={s.id} 
                    className={cn(
                      "flex flex-col p-5 bg-card border rounded-2xl transition-all group relative",
                      s.isCompleted ? "border-accent/20 bg-accent/5" : "border-primary/10 hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                        s.isCompleted ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                      )}>
                        {s.isCompleted ? "Solved" : "Active"}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                          setSessions(getAllSessions());
                        }}
                      >
                        ×
                      </Button>
                    </div>
                    
                    <div className="flex-1 cursor-pointer" onClick={() => resumeGame(s)}>
                      <p className="font-bold text-lg mb-1">{s.type}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1"><Star className="size-3" /> {s.difficulty}</span>
                        <span className="flex items-center gap-1"><Layers className="size-3" /> {s.moves} moves</span>
                      </div>
                      
                      <Button className="w-full bg-secondary hover:bg-primary hover:text-white transition-colors gap-2">
                        {s.isCompleted ? "Review Results" : "Continue"} <PlayCircle className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
        
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="text-center relative max-w-sm px-6">
              <div className="size-32 mx-auto relative mb-10">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="size-12 text-primary animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-3xl font-headline font-bold text-primary tracking-tight">NEURAL WEAVING</h3>
                <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground font-mono flex items-center justify-center gap-2">
                    <Activity className="size-3 text-accent" /> SYNTHESIZING {pDiff.toUpperCase()} MATRIX
                  </p>
                  <p className="text-[10px] text-primary/60 font-bold tracking-widest uppercase">Initializing Cognitive Node...</p>
                </div>
              </div>
              
              {/* Decorative scan lines */}
              <div className="absolute -inset-10 pointer-events-none overflow-hidden opacity-20">
                <div className="h-1 w-full bg-primary/30 blur-sm animate-[scan_3s_linear_infinite]" />
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(400%); }
          }
        `}</style>
      </div>
    );
  }

  if (view === 'analytics') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full">
           <Button variant="ghost" className="mb-8 gap-2 text-muted-foreground hover:text-primary" onClick={() => setView('hub')}>
              <ArrowLeft className="size-4" /> Return to Hub
           </Button>
           <h1 className="text-4xl font-headline font-bold mb-4">Cognitive Evolution</h1>
           <div className="flex gap-4 mb-12">
             <div className="bg-accent/20 border border-accent/30 p-6 rounded-2xl flex items-center gap-4 flex-1">
                <Zap className="size-10 text-accent" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Shards</p>
                  <p className="text-3xl font-bold font-mono">{userStats.totalShards}</p>
                </div>
             </div>
             <div className="bg-primary/20 border border-primary/30 p-6 rounded-2xl flex items-center gap-4 flex-1">
                <ShieldCheck className="size-10 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Matrices Solved</p>
                  <p className="text-3xl font-bold font-mono">{userStats.puzzlesSolved}</p>
                </div>
             </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="bg-card/50 border-primary/20 backdrop-blur-md">
               <CardHeader><CardTitle>Total Solving Time</CardTitle></CardHeader>
               <CardContent className="h-64 flex items-center justify-center text-muted-foreground italic border-t border-primary/5">
                 Metrics calculation in progress...
               </CardContent>
             </Card>
             <Card className="bg-card/50 border-primary/20 backdrop-blur-md">
               <CardHeader><CardTitle>Move Efficiency</CardTitle></CardHeader>
               <CardContent className="h-64 flex items-center justify-center text-muted-foreground italic border-t border-primary/5">
                 Heuristics loading...
               </CardContent>
             </Card>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="p-4 sm:p-6 border-b border-primary/5 flex items-center justify-between backdrop-blur-sm sticky top-0 z-40 bg-background/80">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={exitToHub} className="hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="size-5" />
          </Button>
          <div className="hidden sm:block">
            <h2 className="text-lg font-headline font-bold text-primary">{activeSession?.type}</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{activeSession?.difficulty} Protocol</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 text-accent font-mono font-bold">
               <Timer className="size-4" />
               {formatTime(elapsedSeconds)}
             </div>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Elapsed</p>
          </div>
          
          <div className="h-8 w-px bg-primary/10" />

          <div className="flex flex-col items-end">
             <div className="text-primary font-mono font-bold">
               {activeSession?.moves || 0}
             </div>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Moves</p>
          </div>

          <Button variant="outline" size="icon" onClick={resetPuzzle} className="ml-2 border-primary/10 hover:bg-primary/5">
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-primary/5 blur-[120px] rounded-full -z-10" />

        {showCelebration && (
          <div className="mb-8 text-center animate-in fade-in zoom-in slide-in-from-top-10 duration-700 z-10">
             <div className="inline-flex flex-col items-center gap-2 bg-accent/20 text-accent px-10 py-6 rounded-[2rem] border-2 border-accent/40 shadow-[0_0_50px_rgba(189,74,52,0.3)] mb-4 backdrop-blur-md">
               <div className="flex items-center gap-3 text-3xl font-headline font-bold">
                 <Trophy className="size-8" /> LOGIC REWARD
               </div>
               <p className="text-accent/80 font-mono text-xl">+{activeSession?.earnedShards || lastReward} NEXUS SHARDS</p>
               <div className="flex gap-1 mt-2">
                 {[1,2,3,4,5].map(i => <Star key={i} className="size-4 fill-accent" />)}
               </div>
             </div>
             <div className="flex justify-center gap-4">
                <Button onClick={exitToHub} variant="outline" className="border-accent/20 hover:bg-accent/10">Return to Hub</Button>
                <Button onClick={() => startNewGame(activeSession?.type || 'Sudoku')} className="bg-accent text-white hover:bg-accent/90">Next Matrix</Button>
             </div>
          </div>
        )}

        <div className={cn(
          "w-full max-w-2xl bg-card/40 border border-primary/10 rounded-3xl p-6 sm:p-12 shadow-2xl backdrop-blur-sm transition-all duration-700 relative",
          showCelebration ? "border-accent/40 shadow-accent/20 scale-105" : "hover:border-primary/30"
        )}>
          {activeSession?.type === 'Sudoku' && (
            <SudokuBoard 
              initialData={activeSession.data} 
              userProgress={activeSession.userProgress}
              onUpdate={handleUpdate}
            />
          )}
          {activeSession?.type === 'Sliding Puzzle' && (
            <SlidingBoard 
              initialData={activeSession.data}
              onUpdate={handleUpdate}
            />
          )}
          {activeSession?.type === 'Memory Grid' && (
            <MemoryBoard 
              initialData={activeSession.data}
              onUpdate={handleUpdate}
            />
          )}
        </div>
      </main>

      {activeSession && !activeSession.isCompleted && (
        <HintMentor 
          puzzleType={activeSession.type} 
          difficulty={activeSession.difficulty} 
          gameState={activeSession.userProgress}
        />
      )}
    </div>
  );
}
