
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SlidingBoardProps {
  initialData: string;
  size?: number;
  onUpdate: (progress: string) => void;
}

export function SlidingBoard({ initialData, size = 3, onUpdate }: SlidingBoardProps) {
  const [tiles, setTiles] = useState<number[]>([]);

  useEffect(() => {
    if (initialData) {
      const parsed = initialData.split(',').map(n => parseInt(n.trim(), 10));
      setTiles(parsed);
    }
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

  const gridStyle = {
    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
  };

  return (
    <div 
      className="grid gap-1 sm:gap-2 p-1 sm:p-4 bg-muted/30 rounded-xl sm:rounded-2xl glass violet-glow aspect-square w-full max-w-2xl mx-auto"
      style={gridStyle}
    >
      {tiles.map((tile, i) => (
        <div
          key={i}
          onClick={() => moveTile(i)}
          className={cn(
            "flex items-center justify-center font-headline font-bold rounded-lg transition-all duration-300 transform",
            tile === 0 ? "bg-transparent cursor-default" : "bg-card border border-primary/20 text-primary shadow-lg hover:scale-105 hover:bg-primary/20 hover:text-white cursor-pointer select-none active:scale-95",
            size === 3 ? "text-2xl sm:text-4xl h-full" : 
            size === 4 ? "text-xl sm:text-3xl h-full" :
            "text-sm sm:text-xl h-full"
          )}
        >
          {tile !== 0 && tile}
        </div>
      ))}
    </div>
  );
}
