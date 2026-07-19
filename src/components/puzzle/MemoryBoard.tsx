
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AdManager } from "@/lib/ad-manager";

interface MemoryBoardProps {
  initialData: string;
  size?: number;
  difficulty?: string;
  onUpdate: (progress: string, moves?: number) => void;
}

export function MemoryBoard({
  initialData,
  size = 4,
  difficulty = 'Easy',
  onUpdate
}: MemoryBoardProps) {

  const [items, setItems] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [movesLeft, setMovesLeft] = useState(35);
  const [extraMovesUsed, setExtraMovesUsed] = useState(0);
  
  useEffect(() => {
    if (initialData) {
      if (difficulty === 'Easy') {
  setMovesLeft(20);
} else if (difficulty === 'Medium') {
  setMovesLeft(18);
} else if (difficulty === 'Hard') {
  setMovesLeft(16);
} else if (difficulty === 'Expert') {
  setMovesLeft(38);
}

      setExtraMovesUsed(0);
      setItems(initialData.split(','));
      setSolved([]);
      setFlipped([]);
    }
  }, [initialData, difficulty]);
   useEffect(() => {
  console.log("Size:", size);
  console.log("Items:", items.length);
}, [items, size]);

  const handleClick = (index: number) => {
    if (
  movesLeft <= 0 ||
  flipped.length >= 2 ||
  flipped.includes(index) ||
  solved.includes(index)
) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;

      const remainingMoves = movesLeft - 1;
       setMovesLeft(remainingMoves);       
      
      if (items[first] === items[second]) {
        const newSolved = [...solved, first, second];
        setSolved(newSolved);
        setFlipped([]);
        
        if (newSolved.length === items.length) {
          onUpdate("MATCHED", 1);
        } else {
          onUpdate(`progress-${newSolved.length}`, 1);
        }
      } else {

  if (remainingMoves <= 0) {
    setFlipped([]);
    onUpdate("FAILED", 0);
    return;
  }

  setTimeout(() => {
    setFlipped([]);
  }, 800);

  onUpdate(`fail-${Date.now()}`, 1);
}
    }
  };

  const gridStyle = {
    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
  };

  return (
  <>
    <div className="mb-4 flex justify-between items-center text-primary font-bold">
      <span>Moves Left: {movesLeft}</span>
      <span>Extra Uses: {extraMovesUsed}/3</span>
    </div>

    <div
      className={cn(
        "grid w-full max-w-2xl mx-auto aspect-square p-1 sm:p-2",
        size === 6 ? "gap-1 sm:gap-2" : "gap-2 sm:gap-4"
      )}
      style={gridStyle}
    >
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
              <div className={cn(
                "absolute inset-0 bg-secondary rounded-lg sm:rounded-xl border border-primary/20 flex items-center justify-center text-primary/30 font-bold backface-hidden group-hover:border-primary/50 transition-colors",
                size === 6 ? "text-sm sm:text-xl" : "text-xl sm:text-4xl",
                isMatched && "opacity-0 pointer-events-none"
              )}>
                ?
              </div>
              
              <div className={cn(
                "absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg sm:rounded-xl flex items-center justify-center backface-hidden rotate-y-180",
                size === 6 ? "text-lg sm:text-2xl" : "text-3xl sm:text-5xl",
                isMatched && "border-accent bg-accent/10 text-accent neon-glow"
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
      `}
      </style>
</div>

{extraMovesUsed < 3 && (
  <Button
  onClick={async () => {
    try {

      await AdManager.showReward();
      
      setMovesLeft(prev => prev + 4);
      setExtraMovesUsed(prev => prev + 1);

    } catch (e) {

      console.log('Extra moves reward ad failed');

    }
  }}
  className="mt-4 w-full"
>
  🎥 +4 MOVES
</Button>
)}

</>
);
}
