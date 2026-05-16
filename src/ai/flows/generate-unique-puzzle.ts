'use server';
/**
 * @fileOverview A Genkit flow to generate unique puzzles based on type and difficulty.
 *
 * - generateUniquePuzzle - A function that generates a unique puzzle.
 * - GenerateUniquePuzzleInput - The input type for the generateUniquePuzzle function.
 * - GenerateUniquePuzzleOutput - The return type for the generateUniquePuzzle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUniquePuzzleInputSchema = z.object({
  puzzleType: z.string().describe('The type of puzzle to generate (e.g., "Sudoku", "Sliding Puzzle", "Memory Grid").'),
  difficulty: z.string().describe('The desired difficulty level for the puzzle (e.g., "Easy", "Medium", "Hard", "Expert").'),
});
export type GenerateUniquePuzzleInput = z.infer<typeof GenerateUniquePuzzleInputSchema>;

const GenerateUniquePuzzleOutputSchema = z.object({
  puzzleData: z.string().describe('The generated puzzle data, formatted as a string appropriate for the puzzle type. For Sudoku, use "." for empty cells and numbers for filled cells, row by row. For Sliding Puzzle, use a comma-separated list of numbers for the initial state. For Memory Grids, provide a string representation of the grid layout with items.'),
  solution: z.string().describe('The complete solution to the generated puzzle, formatted as a string appropriate for the puzzle type.'),
  description: z.string().describe('A brief description of the generated puzzle, including its type and difficulty.'),
});
export type GenerateUniquePuzzleOutput = z.infer<typeof GenerateUniquePuzzleOutputSchema>;

export async function generateUniquePuzzle(input: GenerateUniquePuzzleInput): Promise<GenerateUniquePuzzleOutput> {
  return generateUniquePuzzleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateUniquePuzzlePrompt',
  input: {schema: GenerateUniquePuzzleInputSchema},
  output: {schema: GenerateUniquePuzzleOutputSchema},
  prompt: `You are an expert puzzle generator. Your task is to create a unique puzzle based on the provided type and difficulty.
  
  Generate a new {{{puzzleType}}} puzzle of {{{difficulty}}} difficulty.
  
  - For Sudoku, represent the puzzle data as a string where '.' denotes an empty cell and numbers '1-9' are filled cells, processed row by row (e.g., "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79"). The solution should follow the same format.
  - For Sliding Puzzles (e.g., 3x3 grid), represent the puzzle data as a comma-separated string of numbers, indicating the initial grid state (e.g., "1,2,3,4,5,6,0,7,8" where 0 is the empty space). The solution should be the solved state (e.g., "1,2,3,4,5,6,7,8,0").
  - For Memory Grids (e.g., 4x4 grid of pairs), represent the puzzle data as a string that describes the grid layout with distinct items at each position (e.g., "A,B,C,D,A,B,C,D,E,F,G,H,E,F,G,H" where matching letters are pairs). The solution should simply list all item pairs found.
  
  Ensure the puzzle is logically sound and has a single unique solution.

  Please provide the puzzle data, its solution, and a short description.`,
});

const generateUniquePuzzleFlow = ai.defineFlow(
  {
    name: 'generateUniquePuzzleFlow',
    inputSchema: GenerateUniquePuzzleInputSchema,
    outputSchema: GenerateUniquePuzzleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate puzzle output.');
    }
    return output;
  }
);
