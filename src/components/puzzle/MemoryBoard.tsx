
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MemoryBoardProps {
  initialData: string;
  onUpdate: (progress: string) => void;
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
        onUpdate(newSolved.join(','));
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 w-full max-w-md mx-auto aspect-square">
      {items.map((item, i) => {
        const isFlipped = flipped.includes(i) || solved.includes(i);
        return (
          <div
            key={i}
            onClick={() => handleClick(i)}
            className={cn(
              "relative w-full h-full cursor-pointer perspective-1000 transform transition-all duration-500",
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            )}
          >
            <div className="absolute inset-0 bg-secondary rounded-xl border border-primary/20 flex items-center justify-center text-primary/50 text-2xl font-bold backface-hidden">
              ?
            </div>
            <div className="absolute inset-0 bg-primary/20 border-2 border-primary rounded-xl flex items-center justify-center text-3xl [transform:rotateY(180deg)] backface-hidden">
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
}
