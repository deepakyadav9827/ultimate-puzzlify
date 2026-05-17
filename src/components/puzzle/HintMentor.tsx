
'use client';

import React, { useState } from 'react';
import { provideStrategicHint } from '@/ai/flows/provide-strategic-hint';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HintMentorProps {
  puzzleType: string;
  difficulty: string;
  gameState: string;
}

export function HintMentor({ puzzleType, difficulty, gameState }: HintMentorProps) {
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getHint = async () => {
    if (loading) return;
    setLoading(true);
    setIsOpen(true);
    try {
      const result = await provideStrategicHint({ puzzleType, difficulty, gameState });
      setHint(result.hint);
    } catch (error) {
      setHint("Focus on the most constrained area to find the next logical step.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      {isOpen && (
        <div className="pointer-events-auto bg-card/90 border border-primary/20 p-4 rounded-2xl shadow-2xl glass backdrop-blur-2xl animate-in slide-in-from-bottom-5 duration-300 max-w-[280px] sm:max-w-md relative mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -top-2 -right-2 size-8 rounded-full glass border border-white/10 hover:bg-destructive/20"
            onClick={() => {
              setIsOpen(false);
              setHint(null);
            }}
          >
            <X className="size-4" />
          </Button>
          
          <div className="flex items-start gap-2 text-violet-400 mb-2 font-headline text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="size-4" />
            Neural Insight
          </div>
          
          {loading ? (
            <div className="flex items-center gap-3 py-2">
              <Loader2 className="animate-spin size-4 text-violet-400" />
              <span className="text-xs font-mono opacity-50">Decoding mesh...</span>
            </div>
          ) : (
            <p className="text-sm text-foreground/90 leading-relaxed italic">
              {hint || "Click the pulse to request a strategic hint from the AI Mentor."}
            </p>
          )}
        </div>
      )}
      
      <Button
        onClick={() => {
          if (isOpen && !loading) {
            setIsOpen(false);
            setHint(null);
          } else {
            getHint();
          }
        }}
        disabled={loading}
        className={cn(
          "pointer-events-auto size-14 rounded-full transition-all shadow-xl bg-violet-600 hover:bg-violet-500 violet-glow border-none active:scale-90",
          loading && "animate-pulse"
        )}
      >
        {loading ? (
          <Loader2 className="animate-spin size-6" />
        ) : (
          <Sparkles className={cn("size-6 transition-transform", isOpen && "rotate-45")} />
        )}
      </Button>
    </div>
  );
}
