
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MemoryBoardProps {
  initialData: string;
  onUpdate: (progress: string, moves?: number) => void;
}

export function MemoryBoard({ initialData, onUpdate }: MemoryBoardProps) {
  const [items, setItems] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);

  useEffect(() => {
    setItems(initialData.split(','));
  }, [initialData]);

  const handleClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (items[first] === items[second]) {
        const newSolved = [...solved, first, second];
        setSolved(newSolved);
        setFlipped([]);
        // Memory puzzle is "solved" when all indices are in solved array
        // We report completion by returning the original initialData as progress 
        // if solved.length matches items.length
        if (newSolved.length === items.length) {
          onUpdate(initialData, 1);
        } else {
          onUpdate(newSolved.join(','), 1);
        }
      } else {
        setTimeout(() => setFlipped([]), 800);
        onUpdate(solved.join(','), 1);
      }
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 w-full max-w-md mx-auto aspect-square">
      {items.map((item, i) => {
        const isFlipped = flipped.includes(i) || solved.includes(i);
        const isMatched = solved.includes(i);
        
        return (
          <div
            key={i}
            onClick={() => handleClick(i)}
            className={cn(
              "relative w-full h-full cursor-pointer transition-all duration-500 [transform-style:preserve-3d]",
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            )}
          >
            {/* Front */}
            <div className={cn(
              "absolute inset-0 bg-secondary rounded-xl border border-primary/20 flex items-center justify-center text-primary/30 text-2xl font-bold [backface-visibility:hidden] hover:border-primary/50",
              isMatched && "opacity-50"
            )}>
              ?
            </div>
            {/* Back */}
            <div className={cn(
              "absolute inset-0 bg-primary/10 border-2 border-primary rounded-xl flex items-center justify-center text-3xl [backface-visibility:hidden] [transform:rotateY(180deg)]",
              isMatched && "border-accent bg-accent/10 text-accent"
            )}>
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
}
