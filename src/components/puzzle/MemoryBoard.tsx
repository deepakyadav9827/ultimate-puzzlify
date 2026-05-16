'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MemoryBoardProps {
  initialData: string;
  userProgress?: string;
  onUpdate: (progress: string, moves?: number) => void;
}

export function MemoryBoard({ initialData, onUpdate }: MemoryBoardProps) {
  const [items, setItems] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);

  useEffect(() => {
    if (initialData) {
      setItems(initialData.split(','));
      setSolved([]);
      setFlipped([]);
    }
  }, [initialData]);

  const handleClick = (index: number) => {
    // Prevent clicking if 2 are already flipped, or card is already flipped/solved
    if (flipped.length >= 2 || flipped.includes(index) || solved.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      
      if (items[first] === items[second]) {
        // It's a match!
        const newSolved = [...solved, first, second];
        setSolved(newSolved);
        setFlipped([]);
        
        // If all are matched, send the "MATCHED" signal to complete the game
        if (newSolved.length === items.length) {
          onUpdate("MATCHED", 1);
        } else {
          // Send back a non-matching progress string to record the move
          onUpdate(`progress-${newSolved.length}`, 1);
        }
      } else {
        // No match: flip back after delay
        setTimeout(() => {
          setFlipped([]);
        }, 800);
        onUpdate(`fail-${Date.now()}`, 1);
      }
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full max-w-md mx-auto aspect-square p-2">
      {items.map((item, i) => {
        const isFlipped = flipped.includes(i) || solved.includes(i);
        const isMatched = solved.includes(i);
        
        return (
          <div
            key={i}
            onClick={() => handleClick(i)}
            className="relative w-full h-full cursor-pointer perspective-1000 group"
          >
            <div className={cn(
              "relative w-full h-full transition-all duration-500 transform-gpu preserve-3d",
              isFlipped ? "rotate-y-180" : ""
            )}>
              {/* Front (Hidden) */}
              <div className={cn(
                "absolute inset-0 bg-secondary rounded-xl border border-primary/20 flex items-center justify-center text-primary/30 text-xl sm:text-2xl font-bold backface-hidden group-hover:border-primary/50 transition-colors",
                isMatched && "opacity-0 pointer-events-none"
              )}>
                ?
              </div>
              
              {/* Back (Revealed) */}
              <div className={cn(
                "absolute inset-0 bg-primary/10 border-2 border-primary rounded-xl flex items-center justify-center text-2xl sm:text-4xl backface-hidden rotate-y-180",
                isMatched && "border-accent bg-accent/10 text-accent"
              )}>
                {item}
              </div>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
