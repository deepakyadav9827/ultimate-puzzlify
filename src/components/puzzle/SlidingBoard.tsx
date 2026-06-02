'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AdMob } from '@capacitor-community/admob';

interface SlidingBoardProps {
  initialData: string;
  size?: number;
  difficulty?: string;
  onUpdate: (progress: string) => void;
}

export function SlidingBoard({
  initialData,
  size = 3,
  difficulty = 'Easy',
  onUpdate
}: SlidingBoardProps) {
  const [tiles, setTiles] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(180);
  const [extraTimeUsed, setExtraTimeUsed] = useState(0);

  // Parse initial tile data
  useEffect(() => {
    if (initialData) {
      const parsed = initialData.split(',').map(n => parseInt(n.trim(), 10));
      setTiles(parsed);
    }
  }, [initialData]);

  // Reset timer when size or puzzle changes
  useEffect(() => {
     if (difficulty === 'Easy') {
  setTimeLeft(180);
} else if (difficulty === 'Medium') {
  setTimeLeft(150);
} else if (difficulty === 'Hard') {
  setTimeLeft(180);
} else if (difficulty === 'Expert') {
  setTimeLeft(420);
}

    setExtraTimeUsed(0);
  }, [initialData, difficulty]);

  // Countdown timer
  const handleUpdate = useCallback(onUpdate, [onUpdate]);
  useEffect(() => {
    if (timeLeft <= 0) {
      handleUpdate('FAILED');
      return;
    }

    const timer = setTimeout(() => {
  setTimeLeft(prev => prev - 1);
}, 1000);

return () => clearTimeout(timer);

  }, [timeLeft, handleUpdate]);

  const moveTile = (index: number) => {
    if (timeLeft <= 0) return;

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
    <>
      {/* Timer & extra uses row */}
      <div className="mb-4 flex justify-between items-center text-primary font-bold">
        <span>Time Left: {timeLeft}s</span>
        <span>Extra Uses: {extraTimeUsed}/3</span>
      </div>

      {/* ✅ Fixed: added the missing <div opening tag */}
      <div
        className="grid gap-1 sm:gap-2 p-1 sm:p-4 bg-muted/30 rounded-xl sm:rounded-2xl glass violet-glow aspect-square w-full max-w-2xl mx-auto"
        style={gridStyle}
      >
        {tiles.map((tile, i) => (
          <div
            key={i}
            onClick={() => moveTile(i)}
            className={cn(
              'flex items-center justify-center font-headline font-bold rounded-lg transition-all duration-300 transform',
              tile === 0
                ? 'bg-transparent cursor-default'
                : 'bg-card border border-primary/20 text-primary shadow-lg hover:scale-105 hover:bg-primary/20 hover:text-white cursor-pointer select-none active:scale-95',
              size === 3
                ? 'text-2xl sm:text-4xl h-full'
                : size === 4
                ? 'text-xl sm:text-3xl h-full'
                : 'text-sm sm:text-xl h-full'
            )}
          >
            {tile !== 0 && tile}
          </div>
        ))}
      </div>

      {/* +30 sec button */}
      {extraTimeUsed < 3 && (
        <Button
  onClick={async () => {
    try {

      await AdMob.prepareRewardVideoAd({
        adId: 'ca-app-pub-4087959609582329/3668765387',
        isTesting: false
      });

      await AdMob.showRewardVideoAd();

      setTimeLeft(prev => prev + 30);
      setExtraTimeUsed(prev => prev + 1);

    } catch (e) {

      console.log('Extra time reward ad failed');

    }
  }}
  className="mt-4 w-full"
>
  🎥 +30 SEC
</Button>
      )}
    </>
  );
}