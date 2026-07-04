'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [gameOver, setGameOver] = useState(false);
  const endTimeRef = useRef(0);

  // Parse initial tile data
  useEffect(() => {
    if (initialData) {
      const parsed = initialData.split(',').map(n => parseInt(n.trim(), 10));
      setTiles(parsed);
    }
  }, [initialData]);

  // Reset timer when size or puzzle changes
 useEffect(() => {
  let seconds = 180;

  if (difficulty === 'Easy') {
    seconds = 180;
  } else if (difficulty === 'Medium') {
    seconds = 150;
  } else if (difficulty === 'Hard') {
    seconds = 180;
  } else if (difficulty === 'Expert') {
    seconds = 420;
  }

  setTimeLeft(seconds);

  endTimeRef.current = Date.now() + seconds * 1000;

  setExtraTimeUsed(0);
  setGameOver(false);

}, [initialData, difficulty]);

  useEffect(() => {
  if (gameOver) return;

  const interval = setInterval(() => {
    const remaining = Math.max(
      0,
      Math.ceil((endTimeRef.current - Date.now()) / 1000)
    );

    setTimeLeft(remaining);

    if (remaining <= 0) {
      clearInterval(interval);
      setGameOver(true);
      onUpdate("FAILED");
    }
  }, 250);

  return () => clearInterval(interval);
}, [gameOver, onUpdate]);

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

  [newTiles[index], newTiles[emptyIndex]] =
    [newTiles[emptyIndex], newTiles[index]];

  setTiles(newTiles);

  const solved = newTiles.every((tile, index) => {
    if (index === newTiles.length - 1) {
      return tile === 0;
    }

    return tile === index + 1;
  });

  if (solved) {
  setGameOver(true);
  setTimeLeft(0); // optional
  onUpdate("WIN");
}
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
      {!gameOver && extraTimeUsed < 3 && (
        <Button
  onClick={async () => {
    try {

      await AdMob.prepareRewardVideoAd({
        adId: 'ca-app-pub-4087959609582329/3668765387',
        isTesting: false
      });

      await AdMob.showRewardVideoAd();

      endTimeRef.current += 30000;

setTimeLeft(
  Math.ceil((endTimeRef.current - Date.now()) / 1000)
);

setExtraTimeUsed(prev => prev + 1);


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