export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

const SIZE = 9;

export function createEmptyBoard(): number[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function shuffle(array: number[]): number[] {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function isValid(
  board: number[][],
  row: number,
  col: number,
  num: number
): boolean {

  // Row
  for (let x = 0; x < SIZE; x++) {
    if (board[row][x] === num) return false;
  }

  // Column
  for (let y = 0; y < SIZE; y++) {
    if (board[y][col] === num) return false;
  }

  // 3x3 Box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[startRow + r][startCol + c] === num) {
        return false;
      }
    }
  }

  return true;
}

export function fillBoard(board: number[][]): boolean {

  for (let row = 0; row < SIZE; row++) {

    for (let col = 0; col < SIZE; col++) {

      if (board[row][col] === 0) {

        const numbers = shuffle([1,2,3,4,5,6,7,8,9]);

        for (const num of numbers) {

          if (isValid(board,row,col,num)) {

            board[row][col] = num;

            if (fillBoard(board)) {
              return true;
            }

            board[row][col] = 0;

          }

        }

        return false;

      }

    }

  }

  return true;
}

function copyBoard(board: number[][]): number[][] {
  return board.map(row => [...row]);
}

export function generateSolvedBoard(): number[][] {
  const board = createEmptyBoard();
  fillBoard(board);
  return board;
}

function getCellsToRemove(difficulty: Difficulty): number {
  switch (difficulty) {
    case "Easy":
      return 30; // 51 clues (Very Easy)

    case "Medium":
      return 40; // 41 clues (Normal)

    case "Hard":
      return 48; // 33 clues (Hard)

    case "Expert":
      return 54; // 27 clues (Expert)

    default:
      return 40;
  }
}

function removeNumbers(
  solvedBoard: number[][],
  difficulty: Difficulty
): number[][] {

  const puzzle = copyBoard(solvedBoard);

  let cellsToRemove = getCellsToRemove(difficulty);

  while (cellsToRemove > 0) {

    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (puzzle[row][col] !== 0) {

      puzzle[row][col] = 0;

      cellsToRemove--;

    }

  }

  return puzzle;
}

function boardToString(board: number[][]): string {

  return board
    .flat()
    .map(v => (v === 0 ? "." : v.toString()))
    .join("");

}

export function generateSudoku(difficulty: Difficulty) {

  const solvedBoard = generateSolvedBoard();

  const puzzleBoard = removeNumbers(
    solvedBoard,
    difficulty
  );

  return {

    puzzle: boardToString(puzzleBoard),

    solution: boardToString(solvedBoard)

  };

}