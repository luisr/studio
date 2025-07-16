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
  prompt: `You are an expert project manager tasked with analyzing historical project data to generate a lessons learned report.

  Analyze the following project data, focusing on change justifications and identifying patterns of delays and replanning. Extract concrete lessons learned and recommend process improvements.

  Project Data: {{{projectData}}}

  Lessons Learned Report:
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
