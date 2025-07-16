'use server';

/**
 * @fileOverview Summarizes the current status of a project, including progress, risks, and potential issues.
 *
 * - summarizeProjectStatus - A function that handles the project summarization process.
 * - SummarizeProjectStatusInput - The input type for the summarizeProjectStatus function.
 * - SummarizeProjectStatusOutput - The return type for the summarizeProjectStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProjectStatusInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  kpis: z.record(z.string(), z.number()).describe('Key performance indicators for the project.'),
  changeHistory: z.array(z.object({
    fieldChanged: z.string(),
    oldValue: z.string(),
    newValue: z.string(),
    user: z.string(),
    timestamp: z.string(),
    justification: z.string(),
  })).describe('A list of changes made to the project, including who made the change, when, and why.'),
  risks: z.array(z.string()).describe('A list of identified risks for the project.'),
});
export type SummarizeProjectStatusInput = z.infer<typeof SummarizeProjectStatusInputSchema>;

const SummarizeProjectStatusOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the project status, including progress, risks, and potential issues.'),
  recommendations: z.string().describe('Recommendations for addressing potential issues and mitigating risks.'),
});
export type SummarizeProjectStatusOutput = z.infer<typeof SummarizeProjectStatusOutputSchema>;

export async function summarizeProjectStatus(input: SummarizeProjectStatusInput): Promise<SummarizeProjectStatusOutput> {
  return summarizeProjectStatusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeProjectStatusPrompt',
  input: {schema: SummarizeProjectStatusInputSchema},
  output: {schema: SummarizeProjectStatusOutputSchema},
  prompt: `You are an AI project management assistant.  Your job is to summarize the status of a project and provide recommendations.

  Project Name: {{{projectName}}}

  Key Performance Indicators:
  {{#each kpis}}
  - {{@key}}: {{this}}
  {{/each}}

  Change History:
  {{#each changeHistory}}
  - Field: {{fieldChanged}}, Old Value: {{oldValue}}, New Value: {{newValue}}, User: {{user}}, Timestamp: {{timestamp}}, Justification: {{justification}}
  {{/each}}

  Risks:
  {{#each risks}}
  - {{this}}
  {{/each}}

  Please provide a concise summary of the project status, including progress, risks, and potential issues.  Also, provide recommendations for addressing potential issues and mitigating risks.
  `,
});

const summarizeProjectStatusFlow = ai.defineFlow(
  {
    name: 'summarizeProjectStatusFlow',
    inputSchema: SummarizeProjectStatusInputSchema,
    outputSchema: SummarizeProjectStatusOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
