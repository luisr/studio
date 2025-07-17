// src/components/dashboard/ai-analysis-tab.tsx
"use client";

import { useState, useRef } from "react";
import type { Project, Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { summarizeProjectStatus } from "@/ai/flows/summarize-project-status";
import { predictProjectRisks } from "@/ai/flows/predict-project-risks";
import { generateLessonsLearned } from "@/ai/flows/generate-lessons-learned";
import { analyzeCriticalPath } from "@/ai/flows/analyze-critical-path";
import { Loader2, Sparkles, AlertTriangle, GraduationCap, Network } from "lucide-react";
import { ViewActions } from "./view-actions";
import { Separator } from "../ui/separator";

const LoadingState = () => (
    <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Analisando dados e gerando insights...</p>
    </div>
);

// Componente para formatar a resposta da IA
const FormattedResponse = ({ text }: { text: string }) => {
    const items = text.split('\n').filter(line => line.trim() !== '');
    if (items.length <= 1) {
        return <p>{text}</p>;
    }
    return (
        <ul className="list-disc space-y-2 pl-5">
            {items.map((item, index) => (
                <li key={index} className="pl-2">{item.replace(/^- /, '')}</li>
            ))}
        </ul>
    );
};

const ResultDisplay = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="prose prose-sm max-w-none dark:prose-invert rounded-lg border bg-muted/20 p-4">
        <h4 className="mt-0 font-semibold text-foreground">{title}</h4>
        {children}
    </div>
);

export function AiAnalysisTab({ project, onCriticalPathAnalyzed }: AiAnalysisTabProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: any }>({});
  const [error, setError] = useState<string | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  const handleSummarize = async () => {
    setLoading("summary");
    setError(null);
    try {
      const allChangeHistory = project.tasks.flatMap(t => t.changeHistory || []);
      const allRisks: string[] = []; // Se houver riscos no projeto, adicione-os aqui.
      const result = await summarizeProjectStatus({
        projectName: project.name,
        kpis: project.kpis,
        changeHistory: allChangeHistory,
        risks: allRisks,
      });
      setResults(prev => ({ ...prev, summary: result }));
    } catch (e) {
      setError("Falha ao gerar resumo. Tente novamente.");
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handlePredictRisks = async () => {
    setLoading("risks");
    setError(null);
    try {
      // Em um app real, `historicalProjectData` viria de um DB
      const historicalData = "Projeto similar anterior teve atraso de 20% no frontend devido a mudanças de escopo não documentadas.";
      const result = await predictProjectRisks({
        projectData: JSON.stringify(project),
        historicalProjectData: historicalData,
      });
      setResults(prev => ({ ...prev, risks: result }));
    } catch (e) {
      setError("Falha ao prever riscos. Tente novamente.");
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateLessons = async () => {
    setLoading("lessons");
    setError(null);
    try {
      const result = await generateLessonsLearned({
        projectData: JSON.stringify(project),
      });
      setResults(prev => ({ ...prev, lessons: result }));
    } catch (e) {
      setError("Falha ao gerar lições aprendidas. Tente novamente.");
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleAnalyzeCriticalPath = async () => {
    setLoading("criticalPath");
    setError(null);
    try {
      const result = await analyzeCriticalPath({ tasks: project.tasks });
      setResults(prev => ({ ...prev, criticalPath: result }));
      onCriticalPathAnalyzed(result.criticalPath);
    } catch (e) {
      setError("Falha ao analisar o caminho crítico. Tente novamente.");
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const getTaskName = (taskId: string) => project.tasks.find(t => t.id === taskId)?.name || 'Tarefa não encontrada';

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between no-print">
        <div>
          <CardTitle>Análise Preditiva e Insights com IA</CardTitle>
          <CardDescription>
            Use o poder da IA para obter resumos, prever riscos e aprender com os dados do seu projeto.
          </CardDescription>
        </div>
        <ViewActions contentRef={printableRef} />
      </CardHeader>
      <CardContent className="space-y-6 printable" ref={printableRef}>
        <div className="printable-content space-y-6">
          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          {/* Resumo do Status */}
          <div className="space-y-4">
              <div className="flex items-center gap-4 no-print">
                  <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full p-3">
                      <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                      <h3 className="text-lg font-semibold">Resumo do Status do Projeto</h3>
                      <p className="text-sm text-muted-foreground">Obtenha um resumo conciso da saúde atual do seu projeto.</p>
                  </div>
                  <Button onClick={handleSummarize} disabled={loading !== null} className="ml-auto">
                      {loading === "summary" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Gerar Resumo
                  </Button>
              </div>
            {loading === "summary" ? <LoadingState /> : results.summary && (
              <div className="space-y-4">
                  <ResultDisplay title="Sumário da IA">
                      <FormattedResponse text={results.summary.summary} />
                  </ResultDisplay>
                  <ResultDisplay title="Recomendações da IA">
                      <FormattedResponse text={results.summary.recommendations} />
                  </ResultDisplay>
              </div>
            )}
          </div>
          
          <Separator className="my-4 no-print" />

          {/* Previsão de Riscos */}
           <div className="space-y-4">
              <div className="flex items-center gap-4 no-print">
                  <div className="flex-shrink-0 bg-destructive/10 text-destructive rounded-full p-3">
                      <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                      <h3 className="text-lg font-semibold">Previsão de Riscos</h3>
                      <p className="text-sm text-muted-foreground">Identifique riscos potenciais antes que eles se tornem problemas.</p>
                  </div>
                  <Button onClick={handlePredictRisks} disabled={loading !== null} variant="destructive" className="ml-auto">
                      {loading === "risks" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                      Prever Riscos
                  </Button>
              </div>
            {loading === "risks" ? <LoadingState /> : results.risks && (
               <div className="space-y-4">
                  <ResultDisplay title="Riscos Potenciais">
                      <FormattedResponse text={results.risks.risks} />
                  </ResultDisplay>
                  <ResultDisplay title="Estratégias de Mitigação">
                      <FormattedResponse text={results.risks.mitigationStrategies} />
                  </ResultDisplay>
               </div>
            )}
          </div>
          
           <Separator className="my-4 no-print" />

          {/* Lições Aprendidas */}
          <div className="space-y-4">
              <div className="flex items-center gap-4 no-print">
                  <div className="flex-shrink-0 bg-purple-500/10 text-purple-600 rounded-full p-3">
                      <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                      <h3 className="text-lg font-semibold">Lições Aprendidas</h3>
                      <p className="text-sm text-muted-foreground">Gere um relatório de lições aprendidas para melhorar projetos futuros.</p>
                  </div>
                   <Button onClick={handleGenerateLessons} disabled={loading !== null} variant="secondary" className="ml-auto">
                      {loading === "lessons" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
                      Gerar Lições
                  </Button>
              </div>
            {loading === "lessons" ? <LoadingState /> : results.lessons && (
               <ResultDisplay title="Relatório de Lições Aprendidas">
                  <FormattedResponse text={results.lessons.lessonsLearned} />
              </ResultDisplay>
            )}
          </div>
          
           <Separator className="my-4 no-print" />

           {/* Análise de Caminho Crítico */}
          <div className="space-y-4">
              <div className="flex items-center gap-4 no-print">
                  <div className="flex-shrink-0 bg-orange-500/10 text-orange-600 rounded-full p-3">
                      <Network className="h-6 w-6" />
                  </div>
                  <div>
                      <h3 className="text-lg font-semibold">Análise de Caminho Crítico</h3>
                      <p className="text-sm text-muted-foreground">Identifique a sequência de tarefas que impacta diretamente o prazo final do projeto.</p>
                  </div>
                   <Button onClick={handleAnalyzeCriticalPath} disabled={loading !== null} className="ml-auto bg-orange-500 hover:bg-orange-600 text-white">
                      {loading === "criticalPath" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Network className="mr-2 h-4 w-4" />}
                      Analisar Caminho Crítico
                  </Button>
              </div>
            {loading === "criticalPath" ? <LoadingState /> : results.criticalPath && (
               <ResultDisplay title="Análise de Caminho Crítico da IA">
                    <div className="space-y-3">
                        <div>
                            <h5 className="font-semibold">Explicação</h5>
                            <p>{results.criticalPath.explanation}</p>
                        </div>
                        <div>
                            <h5 className="font-semibold">Caminho Crítico (Sequência de Tarefas)</h5>
                            <ol className="list-decimal list-inside space-y-1 mt-2">
                                {results.criticalPath.criticalPath.map((taskId: string) => (
                                <li key={taskId}>{getTaskName(taskId)}</li>
                                ))}
                            </ol>
                        </div>
                    </div>
              </ResultDisplay>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
