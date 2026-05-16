'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SudokuBoardProps {
  initialData: string;
  userProgress: string;
  onUpdate: (progress: string, moves?: number) => void;
}

export function SudokuBoard({ initialData, userProgress, onUpdate }: SudokuBoardProps) {
  const [grid, setGrid] = useState<string[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  useEffect(() => {
    const displayGrid = initialData.split('').map((char, i) => {
      if (char !== '.') return char;
      return userProgress[i] === '.' ? '.' : userProgress[i];
    });
    setGrid(displayGrid);
  }, [initialData, userProgress]);

  const handleCellClick = (index: number) => {
    if (initialData[index] === '.') {
      setSelectedCell(index);
    } else {
      setSelectedCell(null);
    }
  };

  const handleInput = useCallback((val: string) => {
    if (selectedCell === null) return;
    if (grid[selectedCell] === val) return;

    const newGrid = [...grid];
    newGrid[selectedCell] = val;
    setGrid(newGrid);
    onUpdate(newGrid.join(''), 1);
  }, [selectedCell, grid, onUpdate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCell === null) return;
      if (e.key >= '1' && e.key <= '9') {
        handleInput(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
        handleInput('.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, handleInput]);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      <div className="grid grid-cols-9 gap-[1px] bg-border p-[2px] rounded-lg overflow-hidden neon-glow aspect-square w-full">
        {grid.map((cell, i) => {
          const isFixed = initialData[i] !== '.';
          const isSelected = selectedCell === i;
          const row = Math.floor(i / 9);
          const col = i % 9;
          
          const isSubgridRight = (col + 1) % 3 === 0 && col !== 8;
          const isSubgridBottom = (row + 1) % 3 === 0 && row !== 8;

          return (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              className={cn(
                "flex items-center justify-center bg-card text-lg font-medium cursor-pointer transition-all hover:bg-muted relative select-none h-full",
                isFixed ? "text-primary/60 font-bold bg-secondary/20" : "text-foreground",
                isSelected && "bg-primary/20 ring-2 ring-primary inset-0 z-10",
                isSubgridRight && "border-r-[3px] border-r-primary/40",
                isSubgridBottom && "border-b-[3px] border-b-primary/40"
              )}
            >
              {cell === '.' ? '' : cell}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-2 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C'].map((val) => (
          <Button
            key={val}
            variant="outline"
            className={cn(
              "h-12 text-xl font-bold border-primary/10 hover:bg-primary/10",
              val === 'C' && "text-destructive hover:bg-destructive/10 border-destructive/10"
            )}
            onClick={() => handleInput(val === 'C' ? '.' : val.toString())}
          >
            {val}
          </Button>
        ))}
      </div>
    </div>
  );
}
