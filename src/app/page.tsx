
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
  PlayCircle
} from 'lucide-react';
import { GameSession, saveSession, getAllSessions, deleteSession } from '@/lib/game-utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { toast } from '@/hooks/use-toast';

type View = 'hub' | 'play' | 'analytics';

export default function EnigmaNexus() {
  const [view, setView] = useState<View>('hub');
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generator Config
  const [pType, setPType] = useState<string>('Sudoku');
  const [pDiff, setPDiff] = useState<string>('Medium');

  useEffect(() => {
    setSessions(getAllSessions());
  }, []);

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

  const startNewGame = async () => {
    setLoading(true);
    try {
      const result = await generateUniquePuzzle({ puzzleType: pType, difficulty: pDiff });
      const newSession: GameSession = {
        id: Math.random().toString(36).substr(2, 9),
        type: pType as any,
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
      setSessions(getAllSessions());
      setView('play');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Matrix Generation Failed",
        description: "The AI weaver encountered a logical knot. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const resumeGame = (session: GameSession) => {
    setActiveSession(session);
    setElapsedSeconds(session.timeSpent || 0);
    setView('play');
  };

  const handleUpdate = (progress: string, moveIncrement = 1) => {
    if (!activeSession) return;
    
    const isNowCompleted = progress === activeSession.solution;
    
    const updated: GameSession = { 
      ...activeSession, 
      userProgress: progress, 
      lastPlayed: Date.now(),
      moves: activeSession.moves + moveIncrement,
      timeSpent: elapsedSeconds,
      isCompleted: isNowCompleted || activeSession.isCompleted
    };
    
    setActiveSession(updated);
    saveSession(updated);

    if (isNowCompleted && !activeSession.isCompleted) {
      toast({
        title: "Logic Pattern Synchronized!",
        description: `Puzzle completed in ${formatTime(elapsedSeconds)} with ${updated.moves} moves.`,
      });
    }
  };

  const resetPuzzle = () => {
    if (!activeSession) return;
    const updated = { ...activeSession, userProgress: activeSession.data, moves: 0, timeSpent: 0, isCompleted: false };
    setActiveSession(updated);
    setElapsedSeconds(0);
    saveSession(updated);
  };

  const exitToHub = () => {
    if (activeSession) {
      saveSession({ ...activeSession, timeSpent: elapsedSeconds });
    }
    setSessions(getAllSessions());
    setView('hub');
  };

  const hubPuzzles = [
    { id: 'Sudoku', name: 'Sudoku', icon: Grid3X3, desc: '9x9 Number Logic Grid', image: PlaceHolderImages?.[0] },
    { id: 'Sliding Puzzle', name: 'Sliding Tiles', icon: Layers, desc: '3x3 Kinetic Reordering', image: PlaceHolderImages?.[1] },
    { id: 'Memory Grid', name: 'Memory Grid', icon: LayoutGrid, desc: '4x4 Pattern Matching', image: PlaceHolderImages?.[2] },
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
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Cognitive Logic Hub</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setView('analytics')} className="gap-2 border-primary/20 hover:bg-primary/10">
              <Trophy className="size-4 text-accent" /> Achievement Data
            </Button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto">
          <section className="mb-16">
            <h2 className="text-2xl font-headline mb-8 flex items-center gap-3">
              <Plus className="text-primary size-6" /> Initialize New Matrix
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hubPuzzles.map((p) => (
                <Card 
                  key={p.id} 
                  className={cn(
                    "group relative overflow-hidden border-primary/10 transition-all hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer",
                    pType === p.id ? "ring-2 ring-primary bg-primary/5 shadow-lg" : "bg-card/50"
                  )}
                  onClick={() => setPType(p.id)}
                >
                  <div className="h-40 relative bg-muted">
                    {p.image && (
                      <Image 
                        src={p.image.imageUrl} 
                        alt={p.name} 
                        fill 
                        className="object-cover opacity-40 group-hover:opacity-60 transition-opacity" 
                        data-ai-hint={p.image.imageHint}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  </div>
                  <CardHeader className="relative -mt-10">
                    <div className={cn(
                      "size-12 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 shadow-lg",
                      pType === p.id ? "bg-primary text-white" : "bg-secondary text-primary"
                    )}>
                      <p.icon className="size-6" />
                    </div>
                    <CardTitle className="font-headline">{p.name}</CardTitle>
                    <CardDescription>{p.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-6 rounded-2xl border border-primary/10 backdrop-blur-sm">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-lg">Logical Difficulty</p>
                <p className="text-sm text-muted-foreground">Adjust the AI Weaver's complexity parameters.</p>
              </div>
              <Select value={pDiff} onValueChange={setPDiff}>
                <SelectTrigger className="w-full sm:w-48 bg-card border-primary/20">
                  <SelectValue placeholder="Select Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy (Beginner)</SelectItem>
                  <SelectItem value="Medium">Medium (Skilled)</SelectItem>
                  <SelectItem value="Hard">Hard (Expert)</SelectItem>
                  <SelectItem value="Expert">Expert (Grandmaster)</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={startNewGame} 
                disabled={loading}
                className="w-full sm:w-auto h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg neon-glow transition-all active:scale-95"
              >
                {loading ? "Woven Logic..." : "CONSTRUCT MATRIX"}
              </Button>
            </div>
          </section>

          {sessions.length > 0 && (
            <section>
              <h2 className="text-2xl font-headline mb-8 flex items-center gap-3">
                <Timer className="text-accent size-6" /> Residual Sessions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.sort((a,b) => b.lastPlayed - a.lastPlayed).map((s) => (
                  <div 
                    key={s.id} 
                    className="flex items-center justify-between p-4 bg-card border border-primary/5 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => resumeGame(s)}>
                      <div className={cn(
                        "size-10 rounded-lg flex items-center justify-center font-bold",
                        s.isCompleted ? "bg-accent/20 text-accent" : "bg-secondary text-primary"
                      )}>
                        {s.isCompleted ? <CheckCircle2 className="size-5" /> : <PlayCircle className="size-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.type}</p>
                        <p className="text-xs text-muted-foreground">{s.difficulty} • {s.moves} moves</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.id);
                        setSessions(getAllSessions());
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
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
           <p className="text-muted-foreground mb-12">Performance metrics across your session history.</p>
           
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
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{activeSession?.difficulty} Complexity</p>
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

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {activeSession?.isCompleted && (
          <div className="mb-8 text-center animate-in fade-in zoom-in duration-500">
             <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-6 py-2 rounded-full border border-accent/30 font-bold mb-2">
               <CheckCircle2 className="size-5" /> Logic Synchronized
             </div>
             <p className="text-muted-foreground">Pattern fully solved. You may continue to refine or exit.</p>
          </div>
        )}

        <div className={cn(
          "w-full max-w-2xl bg-card/40 border border-primary/10 rounded-3xl p-6 sm:p-12 shadow-2xl backdrop-blur-sm transition-all duration-500",
          activeSession?.isCompleted && "border-accent/40 shadow-accent/5"
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
