
'use client';

import React, { useState } from 'react';
import { provideStrategicHint } from '@/ai/flows/provide-strategic-hint';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HintMentorProps {
  puzzleType: string;
  difficulty: string;
  gameState: string;
}

export function HintMentor({ puzzleType, difficulty, gameState }: HintMentorProps) {
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getHint = async () => {
    setLoading(true);
    try {
      const result = await provideStrategicHint({ puzzleType, difficulty, gameState });
      setHint(result.hint);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 max-w-xs sm:max-w-md">
      {hint && (
        <div className="bg-card border-2 border-accent/50 p-4 rounded-2xl shadow-2xl neon-glow animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-2 text-accent mb-2 font-headline text-sm font-bold uppercase tracking-wider">
            <MessageSquare className="size-4" />
            Mentor's Insight
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed italic">"{hint}"</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 h-8 text-xs hover:text-accent"
            onClick={() => setHint(null)}
          >
            Acknowledge
          </Button>
        </div>
      )}
      <Button
        onClick={getHint}
        disabled={loading}
        className={cn(
          "size-14 rounded-full neon-pulse transition-all shadow-xl bg-primary hover:scale-110 active:scale-95",
          loading && "animate-pulse"
        )}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="size-6" />}
      </Button>
    </div>
  );
}
