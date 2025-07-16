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
  prompt: `Você é um assistente de gerenciamento de projetos de IA. Seu trabalho é resumir o status de um projeto e fornecer recomendações. A resposta deve ser em português.

  Nome do Projeto: {{{projectName}}}

  Indicadores Chave de Performance (KPIs):
  {{#each kpis}}
  - {{@key}}: {{this}}
  {{/each}}

  Histórico de Mudanças:
  {{#if changeHistory}}
    {{#each changeHistory}}
    - Campo: {{fieldChanged}}, Valor Antigo: {{oldValue}}, Novo Valor: {{newValue}}, Usuário: {{user}}, Timestamp: {{timestamp}}, Justificação: "{{justification}}"
    {{/each}}
  {{else}}
    Nenhuma mudança registrada.
  {{/if}}

  Riscos:
  {{#if risks}}
    {{#each risks}}
    - {{this}}
    {{/each}}
  {{else}}
    Nenhum risco identificado.
  {{/if}}

  Por favor, forneça um resumo conciso do status do projeto. Analise o progresso, os riscos e, mais importante, as informações do histórico de mudanças para identificar padrões, causas de atrasos ou estouros de orçamento. Com base nessa análise, forneça recomendações para abordar possíveis problemas e mitigar riscos. A resposta DEVE ser em português.
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
