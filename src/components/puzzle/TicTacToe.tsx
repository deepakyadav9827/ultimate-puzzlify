
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Circle } from 'lucide-react';

interface TicTacToeAIProps {
  onUpdate: (progress: string, moves?: number) => void;
}

export function TicTacToeAI({ onUpdate }: TicTacToeAIProps) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return squares.includes(null) ? null : 'Draw';
  };

  const handleClick = (i: number) => {
  if (board[i] || calculateWinner(board)) return;

  const newBoard = [...board];

  newBoard[i] = isXNext ? 'X' : 'O';

  setBoard(newBoard);

  const winner = calculateWinner(newBoard);

  if (winner === 'X') {
    onUpdate("WIN");
    return;
  }

  if (winner === 'O') {
    onUpdate("WIN");
    return;
  }

  if (winner === 'Draw') {
    onUpdate("DRAW");
    return;
  }

  setIsXNext(!isXNext);
};

return (
  <>
    <div className="text-center text-primary font-bold text-xl mb-4">
      Turn: {isXNext ? "❌ Player X" : "⭕ Player O"}
    </div>

    <div className="grid grid-cols-3 gap-4 aspect-square w-full max-w-sm mx-auto p-4 glass rounded-[2rem]">
      {board.map((val, i) => (
        <div
          key={i}
          onClick={() => handleClick(i)}
          className="glass rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors border-white/5 h-full w-full aspect-square"
        >
          {val === 'X' && <X className="size-12 text-violet-400" />}
          {val === 'O' && <Circle className="size-12 text-pink-400" />}
        </div>
      ))}
    </div>
  </>
);
}
