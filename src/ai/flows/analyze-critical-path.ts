// src/ai/flows/analyze-critical-path.ts
'use server';

/**
 * @fileOverview Analyzes the project's tasks to determine the critical path.
 *
 * - analyzeCriticalPath - A function that handles the critical path analysis.
 * - AnalyzeCriticalPathInput - The input type for the function.
 * - AnalyzeCriticalPathOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Task } from '@/lib/types';

const AnalyzeCriticalPathInputSchema = z.object({
  tasksJson: z.string().describe('A JSON string representing the list of project tasks, including id, dependencies, and plannedHours.'),
});
export type AnalyzeCriticalPathInput = z.infer<typeof AnalyzeCriticalPathInputSchema>;

const AnalyzeCriticalPathOutputSchema = z.object({
  criticalPath: z.array(z.string()).describe('An array of task IDs that form the critical path.'),
  explanation: z.string().describe('A brief explanation of the critical path and its importance.'),
});
export type AnalyzeCriticalPathOutput = z.infer<typeof AnalyzeCriticalPathOutputSchema>;

export async function analyzeCriticalPath(
  input: { tasks: Task[] }
): Promise<AnalyzeCriticalPathOutput> {
  const simplifiedTasks = input.tasks.map(t => ({
      id: t.id,
      name: t.name,
      plannedHours: t.plannedHours,
      dependencies: t.dependencies,
  }));

  const augmentedInput = {
    tasksJson: JSON.stringify(simplifiedTasks, null, 2),
  };
  return analyzeCriticalPathFlow(augmentedInput);
}

const prompt = ai.definePrompt({
  name: 'analyzeCriticalPathPrompt',
  input: {schema: AnalyzeCriticalPathInputSchema},
  output: {schema: AnalyzeCriticalPathOutputSchema},
  prompt: `Você é um gerente de projetos sênior especialista em análise de caminho crítico (CPM - Critical Path Method).
Sua tarefa é analisar uma lista de tarefas do projeto e determinar o caminho crítico. A resposta deve ser em português.

O caminho crítico é a sequência de tarefas que determina a duração total do projeto. Qualquer atraso em uma tarefa do caminho crítico atrasará o projeto inteiro.

Analise o seguinte JSON de tarefas:
\`\`\`json
{{{tasksJson}}}
\`\`\`

Com base nestes dados:
1.  Calcule o caminho crítico do projeto.
2.  Retorne um array contendo apenas os IDs das tarefas que estão no caminho crítico, na ordem correta.
3.  Forneça uma breve explicação sobre o que é o caminho crítico encontrado e por que ele é importante para este projeto.
`,
});

const analyzeCriticalPathFlow = ai.defineFlow(
  {
    name: 'analyzeCriticalPathFlow',
    inputSchema: AnalyzeCriticalPathInputSchema,
    outputSchema: AnalyzeCriticalPathOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
