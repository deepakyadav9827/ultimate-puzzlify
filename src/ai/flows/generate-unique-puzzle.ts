'use server';
/**
 * @fileOverview Optimized Genkit flow to generate unique puzzles rapidly with fallbacks.
 *
 * - generateUniquePuzzle - A function that generates a unique puzzle.
 * - GenerateUniquePuzzleInput - The input type for the generateUniquePuzzle function.
 * - GenerateUniquePuzzleOutput - The return type for the generateUniquePuzzle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUniquePuzzleInputSchema = z.object({
  puzzleType: z.string().describe('The type of puzzle to generate (e.g., "Sudoku", "Sliding Puzzle", "Memory Grid").'),
  difficulty: z.string().describe('The desired difficulty level (Easy, Medium, Hard, Expert).'),
});
export type GenerateUniquePuzzleInput = z.infer<typeof GenerateUniquePuzzleInputSchema>;

const GenerateUniquePuzzleOutputSchema = z.object({
  puzzleData: z.string().describe('Condensed puzzle state string.'),
  solution: z.string().describe('Condensed solution string.'),
  description: z.string().describe('Very brief description.'),
});
export type GenerateUniquePuzzleOutput = z.infer<typeof GenerateUniquePuzzleOutputSchema>;

export async function generateUniquePuzzle(input: GenerateUniquePuzzleInput): Promise<GenerateUniquePuzzleOutput> {
  return generateUniquePuzzleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateUniquePuzzlePrompt',
  input: {schema: GenerateUniquePuzzleInputSchema},
  output: {schema: GenerateUniquePuzzleOutputSchema},
  config: {
    temperature: 0.2,
  },
  prompt: `Act as a high-speed logic engine. Generate a unique {{{difficulty}}} {{{puzzleType}}} matrix.

STRICT OUTPUT RULES:
- Sudoku: 
    puzzleData: 81 chars, '.' for empty. 
    solution: 81 chars, the fully solved grid.
- Sliding Puzzle: 
    puzzleData: 9 comma-separated numbers (0-8) in a SHUFFLED but SOLVABLE order. 0 is empty.
    solution: ALWAYS exactly "1,2,3,4,5,6,7,8,0"
- Memory Grid: 
    puzzleData: 16 items (8 unique pairs), comma-separated. Emojis or symbols preferred.
    solution: ALWAYS exactly "MATCHED"

Ensure the solution is valid. If you cannot generate a unique one instantly, return a classic valid pattern.`,
});

const generateUniquePuzzleFlow = ai.defineFlow(
  {
    name: 'generateUniquePuzzleFlow',
    inputSchema: GenerateUniquePuzzleInputSchema,
    outputSchema: GenerateUniquePuzzleOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) throw new Error('Logic stream interrupted.');
      return output;
    } catch (error) {
      console.warn('AI Quota exceeded or failure. Returning robust fallback matrix.');
      // Fail-safe logic: Return high-quality static patterns based on type
      if (input.puzzleType === 'Sliding Puzzle') {
        return {
          puzzleData: "1,2,3,4,5,6,7,0,8",
          solution: "1,2,3,4,5,6,7,8,0",
          description: "Stable logic sequence restored."
        };
      }
      if (input.puzzleType === 'Memory Grid') {
        return {
          puzzleData: "🍎,🍌,🍒,🥑,🍎,🍌,🍒,🥑,⭐,🌙,☀️,☁️,⭐,🌙,☀️,☁️",
          solution: "MATCHED",
          description: "Classic pattern synchronization."
        };
      }
      return {
        puzzleData: "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
        solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
        description: "Pre-verified logic matrix."
      };
    }
  }
);
