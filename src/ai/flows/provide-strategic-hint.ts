'use server';
/**
 * @fileOverview A Genkit flow for providing strategic hints to players during a puzzle.
 *
 * - provideStrategicHint - A function that handles the generation of strategic hints.
 * - ProvideStrategicHintInput - The input type for the provideStrategicHint function.
 * - ProvideStrategicHintOutput - The return type for the provideStrategicHint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideStrategicHintInputSchema = z.object({
  puzzleType: z.string().describe('The type of puzzle the player is currently solving (e.g., Sudoku, Sliding Puzzle, Memory Grid).'),
  gameState: z.string().describe('A detailed string representation of the current game board state, including player progress.'),
  difficulty: z.string().describe('The current difficulty level of the puzzle (e.g., Easy, Medium, Hard, Expert).'),
});
export type ProvideStrategicHintInput = z.infer<typeof ProvideStrategicHintInputSchema>;

const ProvideStrategicHintOutputSchema = z.object({
  hint: z.string().describe('A subtle and strategic hint to guide the player without revealing the full solution.'),
});
export type ProvideStrategicHintOutput = z.infer<typeof ProvideStrategicHintOutputSchema>;

export async function provideStrategicHint(input: ProvideStrategicHintInput): Promise<ProvideStrategicHintOutput> {
  return provideStrategicHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'strategicHintPrompt',
  input: {schema: ProvideStrategicHintInputSchema},
  output: {schema: ProvideStrategicHintOutputSchema},
  prompt: `You are an insightful AI mentor for a puzzle game called Enigma Nexus.
Your goal is to provide a subtle, strategic hint to the player without giving away the full solution. The hint should guide them in the right direction based on their current progress and the puzzle type.

The player is currently solving a {{{puzzleType}}} puzzle at {{{difficulty}}} difficulty.
Here is the current game state:
{{{gameState}}}

Provide a strategic hint that helps the player make progress without directly solving it for them.`,
});

const provideStrategicHintFlow = ai.defineFlow(
  {
    name: 'provideStrategicHintFlow',
    inputSchema: ProvideStrategicHintInputSchema,
    outputSchema: ProvideStrategicHintOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
