// src/ai/flows/generate-lessons-learned.ts
'use server';

/**
 * @fileOverview Generates lessons learned from historical project data, focusing on change justifications and identifying patterns of delays and replanning.
 *
 * - generateLessonsLearned - A function that handles the generation of lessons learned.
 * - GenerateLessonsLearnedInput - The input type for the generateLessonsLearned function.
 * - GenerateLessonsLearnedOutput - The return type for the generateLessonsLearned function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLessonsLearnedInputSchema = z.object({
  projectData: z
    .string()
    .describe(
      'A string containing the historical project data, including KPIs, change history, and justifications for changes.'
    ),
});
export type GenerateLessonsLearnedInput = z.infer<typeof GenerateLessonsLearnedInputSchema>;

const GenerateLessonsLearnedOutputSchema = z.object({
  lessonsLearned: z
    .string()
    .describe(
      'A summary of lessons learned from the project, including patterns of delays, common causes, and recommended process improvements.'
    ),
});
export type GenerateLessonsLearnedOutput = z.infer<typeof GenerateLessonsLearnedOutputSchema>;

export async function generateLessonsLearned(
  input: GenerateLessonsLearnedInput
): Promise<GenerateLessonsLearnedOutput> {
  return generateLessonsLearnedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLessonsLearnedPrompt',
  input: {schema: GenerateLessonsLearnedInputSchema},
  output: {schema: GenerateLessonsLearnedOutputSchema},
  prompt: `Você é um gerente de projetos especialista encarregado de analisar dados históricos de projetos para gerar um relatório de lições aprendidas.
Sua resposta deve ser em português.

Analise os seguintes dados do projeto, focando nas justificativas de mudanças e identificando padrões de atrasos e replanejamentos. Extraia lições aprendidas concretas e recomende melhorias nos processos.

Dados do Projeto: {{{projectData}}}

Relatório de Lições Aprendidas:
`,
});

const generateLessonsLearnedFlow = ai.defineFlow(
  {
    name: 'generateLessonsLearnedFlow',
    inputSchema: GenerateLessonsLearnedInputSchema,
    outputSchema: GenerateLessonsLearnedOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
