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
  prompt: `Você é um assistente de IA especializado em previsão de riscos de projetos. Sua resposta deve ser em português.

Com base nos dados atuais do projeto e em dados históricos de projetos similares, identifique riscos potenciais e sugira estratégias de mitigação.

Dados Atuais do Projeto: {{{projectData}}}
Dados Históricos de Projetos: {{{historicalProjectData}}}

Identifique riscos potenciais e sugira estratégias de mitigação com base nos dados fornecidos.`,
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
