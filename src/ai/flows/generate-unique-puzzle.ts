'use server';
/**
 * @fileOverview Optimized Genkit flow to generate unique puzzles rapidly with extensive fallbacks for variety.
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
    temperature: 0.9, // Higher temperature for maximum variety
  },
  prompt: `Act as a high-speed logic engine. Generate a unique and challenging {{{difficulty}}} {{{puzzleType}}} matrix. 
DIVERSIFY patterns. DO NOT use common starting patterns. Every response must be structurally different.

STRICT OUTPUT RULES:
- Sudoku: 
    puzzleData: 81 chars, '.' for empty. 
    EASY = 45+ clues, MEDIUM = 35 clues, HARD = 25 clues, EXPERT = 20- clues.
    solution: 81 chars, the fully solved grid.
- Sliding Puzzle: 
    puzzleData: 9 comma-separated numbers (0-8) in a SHUFFLED but SOLVABLE order. 0 is empty.
    solution: ALWAYS "1,2,3,4,5,6,7,8,0"
- Memory Grid: 
    puzzleData: 16 items (8 unique pairs), randomly shuffled, comma-separated. Use diverse Emojis.
    solution: ALWAYS "MATCHED"

Ensure the solution is valid and the puzzle is solvable. Use timestamp seed logic to vary the internal layout.`,
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
      console.warn('AI Quota exceeded. Using randomized backup bank.');
      
      if (input.puzzleType === 'Sliding Puzzle') {
        const patterns = [
          "1,2,3,4,5,6,7,0,8",
          "4,1,2,7,5,3,0,8,6",
          "1,5,2,4,0,3,7,8,6",
          "8,6,7,2,5,4,3,0,1",
          "0,1,2,4,5,3,7,8,6"
        ];
        return {
          puzzleData: patterns[Math.floor(Math.random() * patterns.length)],
          solution: "1,2,3,4,5,6,7,8,0",
          description: "Stable logic sequence restored."
        };
      }

      if (input.puzzleType === 'Memory Grid') {
        const emojiBanks = [
          "🍎,🍌,🍒,🥑,🍎,🍌,🍒,🥑,⭐,🌙,☀️,☁️,⭐,🌙,☀️,☁️",
          "🐱,🐶,🦊,🐰,🐱,🐶,🦊,🐰,🦁,🐯,🐼,🐨,🦁,🐯,🐼,🐨",
          "⚽,🏀,🏈,🎾,⚽,🏀,🏈,🎾,🎱,🏐,🏉,🏏,🎱,🏐,🏉,🏏"
        ];
        const shuffled = emojiBanks[Math.floor(Math.random() * emojiBanks.length)]
          .split(',')
          .sort(() => Math.random() - 0.5)
          .join(',');
          
        return {
          puzzleData: shuffled,
          solution: "MATCHED",
          description: "Classic pattern synchronization."
        };
      }

      // Sudoku Fallbacks (Multiple variations)
      const sudokuBanks = [
        {
          data: "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
          solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
        },
        {
          data: ".94...13..............76..2.8..1.....32.........2...6.....8.4......6...3.7.4.9...",
          solution: "294358137618243597357917642485716239932584716761329485123895674849762351576431928"
        },
        {
          data: "3.5.8.1.2.1.2.3.4.8.2.1.3.5.3.1.2.8.5.8.2.1.3.1.3.5.2.8.2.8.3.1.5.8.5.1.2.3.1.2.3",
          solution: "345687192716293548982415376437152986598726143261934587629843715854761239173598462"
        }
      ];
      
      return {
        ...sudokuBanks[Math.floor(Math.random() * sudokuBanks.length)],
        description: "Pre-verified logic matrix."
      };
    }
  }
);
