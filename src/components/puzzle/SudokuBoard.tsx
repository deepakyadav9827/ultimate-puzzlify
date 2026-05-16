
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SudokuBoardProps {
  initialData: string;
  userProgress: string;
  onUpdate: (progress: string) => void;
}

export function SudokuBoard({ initialData, userProgress, onUpdate }: SudokuBoardProps) {
  const [grid, setGrid] = useState<string[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  useEffect(() => {
    // Merge initial fixed numbers with user progress
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

  const handleInput = (val: string) => {
    if (selectedCell === null) return;
    const newGrid = [...grid];
    newGrid[selectedCell] = val;
    setGrid(newGrid);
    onUpdate(newGrid.join(''));
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      <div className="grid grid-cols-9 gap-[1px] bg-border p-1 rounded-lg overflow-hidden neon-glow aspect-square w-full">
        {grid.map((cell, i) => {
          const isFixed = initialData[i] !== '.';
          const isSelected = selectedCell === i;
          const row = Math.floor(i / 9);
          const col = i % 9;
          
          // Subgrid styling
          const isSubgridRight = (col + 1) % 3 === 0 && col !== 8;
          const isSubgridBottom = (row + 1) % 3 === 0 && row !== 8;

          return (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              className={cn(
                "flex items-center justify-center bg-card text-lg font-medium cursor-pointer transition-all hover:bg-muted relative",
                isFixed ? "text-primary/60" : "text-foreground",
                isSelected && "bg-primary/20 ring-2 ring-primary inset-0 z-10",
                isSubgridRight && "border-r-2 border-r-primary/20",
                isSubgridBottom && "border-b-2 border-b-primary/20"
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
            className="h-12 text-xl font-bold"
            onClick={() => handleInput(val === 'C' ? '.' : val.toString())}
          >
            {val}
          </Button>
        ))}
      </div>
    </div>
  );
}
