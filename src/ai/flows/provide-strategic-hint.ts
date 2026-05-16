'use server';
/**
 * @fileOverview A Genkit flow for providing strategic hints with error resilience.
 *
 * - provideStrategicHint - A function that handles the generation of strategic hints.
 * - ProvideStrategicHintInput - The input type for the provideStrategicHint function.
 * - ProvideStrategicHintOutput - The return type for the provideStrategicHint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideStrategicHintInputSchema = z.object({
  puzzleType: z.string().describe('The type of puzzle the player is currently solving.'),
  gameState: z.string().describe('Current game board state.'),
  difficulty: z.string().describe('Current difficulty level.'),
});
export type ProvideStrategicHintInput = z.infer<typeof ProvideStrategicHintInputSchema>;

const ProvideStrategicHintOutputSchema = z.object({
  hint: z.string().describe('A subtle and strategic hint.'),
});
export type ProvideStrategicHintOutput = z.infer<typeof ProvideStrategicHintOutputSchema>;

export async function provideStrategicHint(input: ProvideStrategicHintInput): Promise<ProvideStrategicHintOutput> {
  return provideStrategicHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'strategicHintPrompt',
  input: {schema: ProvideStrategicHintInputSchema},
  output: {schema: ProvideStrategicHintOutputSchema},
  prompt: `You are an insightful AI mentor for Enigma Nexus.
Provide a subtle hint for a {{{difficulty}}} {{{puzzleType}}} puzzle.
GameState: {{{gameState}}}`,
});

const provideStrategicHintFlow = ai.defineFlow(
  {
    name: 'provideStrategicHintFlow',
    inputSchema: ProvideStrategicHintInputSchema,
    outputSchema: ProvideStrategicHintOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output) throw new Error('No hint generated');
      return output;
    } catch (error) {
      console.warn('Hint AI quota exceeded. Returning generic strategic insight.');
      return {
        hint: "Focus on the areas with the most information revealed to narrow down the remaining possibilities logically."
      };
    }
  }
);
