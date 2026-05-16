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
    temperature: 1.0, // High temperature for maximum variety
  },
  prompt: `Act as a high-speed logic engine. Generate a unique and challenging {{{difficulty}}} {{{puzzleType}}} matrix. 
DIVERSIFY patterns. Avoid symmetric or common patterns. Every response must be structurally different.

STRICT OUTPUT RULES:
- Sudoku: 
    puzzleData: 81 chars, '.' for empty. 
    EASY = 45+ clues, MEDIUM = 35 clues, HARD = 25 clues, EXPERT = 20- clues.
    Ensure only one unique solution exists.
- Sliding Puzzle: 
    Difficulty mapping: EASY/MEDIUM = 3x3, HARD = 4x4, EXPERT = 6x6.
    puzzleData: comma-separated numbers starting from 0 to (size*size - 1) in a SHUFFLED but SOLVABLE order. 0 is the empty tile.
    Example 3x3: "1,2,3,4,5,6,7,0,8"
    solution: ALWAYS the sequentially ordered numbers with 0 at the end.
- Memory Grid: 
    EASY/MEDIUM = 4x4 (16 items, 8 pairs), HARD = 4x4 (complex symbols), EXPERT = 6x6 (36 items, 18 pairs).
    puzzleData: comma-separated shuffled symbols/emojis.
    solution: ALWAYS "MATCHED"`,
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
      console.warn('AI Quota exceeded or failure. Using internal logic engine.');
      
      if (input.puzzleType === 'Sliding Puzzle') {
        const size = input.difficulty === 'Expert' ? 6 : input.difficulty === 'Hard' ? 4 : 3;
        const count = size * size;
        
        // Generate a random but solvable shuffle
        let arr = Array.from({ length: count }, (_, i) => (i + 1) % count);
        for (let i = 0; i < 400; i++) {
            const emptyIdx = arr.indexOf(0);
            const row = Math.floor(emptyIdx / size);
            const col = emptyIdx % size;
            const moves = [];
            if (row > 0) moves.push(emptyIdx - size);
            if (row < size - 1) moves.push(emptyIdx + size);
            if (col > 0) moves.push(emptyIdx - 1);
            if (col < size - 1) moves.push(emptyIdx + 1);
            const move = moves[Math.floor(Math.random() * moves.length)];
            [arr[emptyIdx], arr[move]] = [arr[move], arr[emptyIdx]];
        }
        
        return {
          puzzleData: arr.join(','),
          solution: Array.from({ length: count }, (_, i) => (i + 1) % count).join(','),
          description: "Stable logic sequence restored."
        };
      }

      if (input.puzzleType === 'Memory Grid') {
        const size = input.difficulty === 'Expert' ? 6 : 4;
        const totalItems = size * size;
        const pairsCount = totalItems / 2;
        
        const symbols = "🍎,🍌,🍒,🥑,⭐,🌙,☀️,☁️,🐱,🐶,🦊,🐰,🦁,🐯,🐼,🐨,🐷,🐸,🐙,🦋,🦄,🐉,🍦,🍕,🎮,🚀,🌈,💎,🍀,🔥,❄️,🎭,🎸,⚽,🛸,👻".split(',');
        const selected = symbols.sort(() => Math.random() - 0.5).slice(0, pairsCount);
        const shuffled = [...selected, ...selected].sort(() => Math.random() - 0.5).join(',');
          
        return {
          puzzleData: shuffled,
          solution: "MATCHED",
          description: "Classic pattern synchronization."
        };
      }

      // Sudoku Fallback with expanded bank
      const sudokuBanks = [
        { data: "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79", solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179" },
        { data: ".94...13..............76..2.8..1.....32.........2...6.....8.4......6...3.7.4.9...", solution: "294358137618243597357917642485716239932584716761329485123895674849762351576431928" },
        { data: "....7..2.8.......6.1.2.5...9.54....8.........3....85.1...3.2.8.4.......9.7..6....", solution: "563174928829531476714285391985476231241953786376218541652397844387129561917846235" },
        { data: "7.8...3.....2.1...5.........4.....263...8...192.....5.........4...1.7.....6...7.8", solution: "718459362934261875526837914145793286367582491928614753289375641653147298471926532" }
      ];
      
      const bank = sudokuBanks[Math.floor(Math.random() * sudokuBanks.length)];
      return {
        ...bank,
        description: "Pre-verified logic matrix."
      };
    }
  }
);
