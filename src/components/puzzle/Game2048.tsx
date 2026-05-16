
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Game2048Props {
  onUpdate: (progress: string, moves?: number) => void;
}

export function Game2048({ onUpdate }: Game2048Props) {
  const [grid, setGrid] = useState<number[][]>(() => {
    const empty = Array(4).fill(null).map(() => Array(4).fill(0));
    return addRandom(addRandom(empty));
  });

  function addRandom(board: number[][]) {
    const empty = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return board;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }

  const checkGameOver = (board: number[][]) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) return false;
        if (c < 3 && board[r][c] === board[r][c+1]) return false;
        if (r < 3 && board[r][c] === board[r+1][c]) return false;
      }
    }
    return true;
  };

  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    let moved = false;
    let newGrid = grid.map(row => [...row]);

    const rotate = (board: number[][]) => board[0].map((_, c) => board.map(r => r[c]).reverse());

    if (direction === 'up') newGrid = rotate(rotate(rotate(newGrid)));
    if (direction === 'down') newGrid = rotate(newGrid);
    if (direction === 'right') newGrid = newGrid.map(row => row.reverse());

    for (let r = 0; r < 4; r++) {
      let row = newGrid[r].filter(v => v !== 0);
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i+1]) {
          row[i] *= 2;
          row.splice(i+1, 1);
          moved = true;
          if (row[i] === 2048) {
            onUpdate("WIN");
            return;
          }
        }
      }
      while (row.length < 4) row.push(0);
      if (JSON.stringify(newGrid[r]) !== JSON.stringify(row)) moved = true;
      newGrid[r] = row;
    }

    if (direction === 'up') newGrid = rotate(newGrid);
    if (direction === 'down') newGrid = rotate(rotate(rotate(newGrid)));
    if (direction === 'right') newGrid = newGrid.map(row => row.reverse());

    if (moved) {
      const final = addRandom(newGrid);
      setGrid(final);
      onUpdate(final.flat().join(','), 1);
      if (checkGameOver(final)) {
        onUpdate("LOSE");
      }
    }
  }, [grid, onUpdate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move('up');
      if (e.key === 'ArrowDown') move('down');
      if (e.key === 'ArrowLeft') move('left');
      if (e.key === 'ArrowRight') move('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  const colors: Record<number, string> = {
    0: 'bg-white/5',
    2: 'bg-violet-900/40 text-violet-100',
    4: 'bg-violet-800/50 text-violet-100',
    8: 'bg-violet-700/60 text-violet-100',
    16: 'bg-violet-600/70 text-violet-100',
    32: 'bg-pink-600/70 text-pink-100',
    64: 'bg-pink-500/80 text-pink-100',
    128: 'bg-amber-600/70 text-amber-100 shadow-amber-500/20 shadow-lg',
    256: 'bg-amber-500/80 text-amber-100 shadow-amber-500/30 shadow-lg',
    512: 'bg-emerald-600/80 text-emerald-100 shadow-emerald-500/40 shadow-lg',
    1024: 'bg-emerald-500/90 text-emerald-100 shadow-emerald-500/50 shadow-xl',
    2048: 'bg-primary violet-glow text-white animate-pulse',
  };

  return (
    <div className="grid grid-cols-4 gap-3 p-4 glass rounded-[2rem] aspect-square w-full max-w-md mx-auto">
      {grid.flat().map((val, i) => (
        <div key={i} className={cn(
          "flex items-center justify-center text-2xl font-headline font-bold rounded-2xl transition-all duration-100",
          colors[val] || 'bg-primary'
        )}>
          {val !== 0 && val}
        </div>
      ))}
    </div>
  );
}
