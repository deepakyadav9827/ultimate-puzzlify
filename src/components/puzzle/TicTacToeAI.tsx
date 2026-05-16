
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

  const minimax = (squares: (string | null)[], depth: number, isMaximizing: boolean): number => {
    const winner = calculateWinner(squares);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (winner === 'Draw') return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          best = Math.max(best, minimax(squares, depth + 1, false));
          squares[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          best = Math.min(best, minimax(squares, depth + 1, true));
          squares[i] = null;
        }
      }
      return best;
    }
  };

  const makeAIMove = (currentBoard: (string | null)[]) => {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        currentBoard[i] = 'O';
        let score = minimax(currentBoard, 0, false);
        currentBoard[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    if (move !== -1) {
      const newBoard = [...currentBoard];
      newBoard[move] = 'O';
      setBoard(newBoard);
      const winner = calculateWinner(newBoard);
      if (winner === 'O') {
        onUpdate("LOSE");
      } else if (winner === 'Draw') {
        onUpdate("LOSE"); // Draw is a failure against professional logic
      }
      onUpdate(newBoard.join(','), 1);
      setIsXNext(true);
    }
  };

  const handleClick = (i: number) => {
    if (board[i] || calculateWinner(board) || !isXNext) return;
    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
    
    const winner = calculateWinner(newBoard);
    if (winner === 'X') {
      onUpdate("WIN");
    } else if (winner === 'Draw') {
      onUpdate("LOSE");
    } else {
      setTimeout(() => makeAIMove(newBoard), 500);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 aspect-square w-full max-w-sm mx-auto p-4 glass rounded-[2rem]">
      {board.map((val, i) => (
        <div key={i} onClick={() => handleClick(i)} className="glass rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors border-white/5 h-full w-full aspect-square">
          {val === 'X' && <X className="size-12 text-violet-400" />}
          {val === 'O' && <Circle className="size-12 text-pink-400" />}
        </div>
      ))}
    </div>
  );
}
