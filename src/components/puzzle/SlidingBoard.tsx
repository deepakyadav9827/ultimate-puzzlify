
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SlidingBoardProps {
  initialData: string;
  onUpdate: (progress: string) => void;
}

export function SlidingBoard({ initialData, onUpdate }: SlidingBoardProps) {
  const [tiles, setTiles] = useState<number[]>([]);
  const size = 3;

  useEffect(() => {
    setTiles(initialData.split(',').map(Number));
  }, [initialData]);

  const moveTile = (index: number) => {
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    const isAdjacent = 
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      onUpdate(newTiles.join(','));
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-2xl neon-glow aspect-square w-full max-w-md mx-auto">
      {tiles.map((tile, i) => (
        <div
          key={i}
          onClick={() => moveTile(i)}
          className={cn(
            "flex items-center justify-center text-3xl font-bold rounded-xl transition-all duration-300 transform cursor-pointer",
            tile === 0 ? "bg-transparent cursor-default" : "bg-card border border-primary/20 text-primary shadow-lg hover:scale-105 hover:bg-primary hover:text-white"
          )}
        >
          {tile !== 0 && tile}
        </div>
      ))}
    </div>
  );
}
