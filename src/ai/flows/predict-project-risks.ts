// src/ai/flows/predict-project-risks.ts
'use server';

/**
 * @fileOverview Predicts potential project risks using historical data and current project parameters.
 *
 * - predictProjectRisks - A function that predicts project risks and suggests mitigation strategies.
 * - PredictProjectRisksInput - The input type for the predictProjectRisks function.
 * - PredictProjectRisksOutput - The return type for the predictProjectRisks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictProjectRisksInputSchema = z.object({
  projectData: z
    .string()
    .describe('The current project data, including KPIs, status, and change history.'),
  historicalProjectData: z
    .string()
    .describe('Historical data from similar projects, including outcomes and change justifications.'),
});
export type PredictProjectRisksInput = z.infer<typeof PredictProjectRisksInputSchema>;

const PredictProjectRisksOutputSchema = z.object({
  risks: z
    .string()
    .describe('A list of potential risks identified by the AI.'),
  mitigationStrategies: z
    .string()
    .describe('Suggested mitigation strategies for each identified risk.'),
});
export type PredictProjectRisksOutput = z.infer<typeof PredictProjectRisksOutputSchema>;

export async function predictProjectRisks(input: PredictProjectRisksInput): Promise<PredictProjectRisksOutput> {
  return predictProjectRisksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictProjectRisksPrompt',
  input: {schema: PredictProjectRisksInputSchema},
  output: {schema: PredictProjectRisksOutputSchema},
  prompt: `You are an AI assistant that specializes in project risk prediction.

  Based on the current project data and historical data from similar projects, identify potential risks and suggest mitigation strategies.

Current Project Data: {{{projectData}}}
Historical Project Data: {{{historicalProjectData}}}


  Identify potential risks and suggest mitigation strategies based on the data provided.`,
});

const predictProjectRisksFlow = ai.defineFlow(
  {
    name: 'predictProjectRisksFlow',
    inputSchema: PredictProjectRisksInputSchema,
    outputSchema: PredictProjectRisksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
