'use server';
/**
 * @fileOverview A flow that provides a consolidated analysis of multiple projects.
 * 
 * - summarizeAllProjects - A function that generates a high-level summary, identifies cross-project risks, and provides strategic recommendations.
 * - SummarizeAllProjectsInput - The input type for the function.
 * - SummarizeAllProjectsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Project } from '@/lib/types';

const SummarizeAllProjectsInputSchema = z.object({
  projects: z.custom<Project[]>(),
  projectsJson: z.string().describe('An array of project objects to be analyzed, formatted as a JSON string.'),
});
export type SummarizeAllProjectsInput = z.infer<typeof SummarizeAllProjectsInputSchema>;

const SummarizeAllProjectsOutputSchema = z.object({
  overallStatus: z.string().describe('A high-level summary of the overall status of the project portfolio.'),
  crossProjectRisks: z.string().describe('A summary of identified risks that may impact multiple projects or arise from their interactions.'),
  strategicRecommendations: z.string().describe('Actionable strategic recommendations for managing the project portfolio.'),
});
export type SummarizeAllProjectsOutput = z.infer<typeof SummarizeAllProjectsOutputSchema>;

export async function summarizeAllProjects(
  input: { projects: Project[] }
): Promise<SummarizeAllProjectsOutput> {
  // Augment the input with the stringified JSON for the prompt
  const augmentedInput = {
    ...input,
    projectsJson: JSON.stringify(input.projects, null, 2),
  };
  return summarizeAllProjectsFlow(augmentedInput);
}

const prompt = ai.definePrompt({
  name: 'summarizeAllProjectsPrompt',
  input: {schema: SummarizeAllProjectsInputSchema},
  output: {schema: SummarizeAllProjectsOutputSchema},
  prompt: `Você é um Diretor de Portfólio de Projetos (PPM) experiente. Sua tarefa é analisar os dados de múltiplos projetos e fornecer uma análise consolidada e estratégica. A resposta deve ser em português.

Analise o seguinte conjunto de projetos:
\`\`\`json
{{{projectsJson}}}
\`\`\`

Com base nos dados fornecidos:
1.  **Visão Geral do Status do Portfólio:** Forneça um resumo executivo sobre a saúde geral do portfólio. Destaque sucessos, pontos de atenção e o progresso geral em relação aos objetivos.
2.  **Riscos entre Projetos:** Identifique riscos que afetam mais de um projeto ou que surgem da interação entre eles (ex: dependências de recursos, sobreposição de prazos, problemas sistêmicos).
3.  **Recomendações Estratégicas:** Ofereça recomendações acionáveis de alto nível para otimizar o desempenho do portfólio. Pense em realocação de recursos, ajustes de prioridade, ou melhorias de processo.

Sua resposta deve ser concisa, estratégica e focada em fornecer valor para a tomada de decisão gerencial.
`,
});

const summarizeAllProjectsFlow = ai.defineFlow(
  {
    name: 'summarizeAllProjectsFlow',
    inputSchema: SummarizeAllProjectsInputSchema,
    outputSchema: SummarizeAllProjectsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
