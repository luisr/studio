// src/app/dashboard/reports/page.tsx
"use client";

import { useState } from "react";
import { projects } from "@/lib/data";
import { Accordion } from "@/components/ui/accordion";
import { ProjectSummaryCard } from "@/components/dashboard/project-summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { summarizeAllProjects, type SummarizeAllProjectsOutput } from "@/ai/flows/summarize-all-projects";
import { BrainCircuit, Loader2 } from "lucide-react";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizeAllProjectsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateConsolidatedAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await summarizeAllProjects({ projects });
      setResult(analysis);
    } catch (e) {
      console.error(e);
      setError("Falha ao gerar a análise consolidada. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios Consolidados</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho de todos os seus projetos e obtenha insights estratégicos com IA.
          </p>
        </div>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Análise Consolidada com IA</CardTitle>
          <CardDescription>
            Obtenha uma visão geral e recomendações estratégicas para todo o seu portfólio de projetos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateConsolidatedAnalysis} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
            {loading ? 'Analisando Portfólio...' : 'Gerar Análise Consolidada'}
          </Button>

           {loading && (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">A IA está analisando os dados de todos os projetos...</p>
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
          
          {result && (
            <div className="prose prose-sm max-w-none dark:prose-invert space-y-4 pt-4">
               <div>
                  <h4 className="font-semibold text-foreground">Visão Geral do Portfólio</h4>
                  <p>{result.overallStatus}</p>
              </div>
               <div>
                  <h4 className="font-semibold text-foreground">Riscos entre Projetos</h4>
                  <p>{result.crossProjectRisks}</p>
              </div>
              <div>
                  <h4 className="font-semibold text-foreground">Recomendações Estratégicas</h4>
                  <p>{result.strategicRecommendations}</p>
              </div>
            </div>
          )}

        </CardContent>
      </Card>


      <Accordion type="single" collapsible className="w-full space-y-4">
        {projects.map((project) => (
           <ProjectSummaryCard key={project.id} project={project} />
        ))}
      </Accordion>
    </div>
  );
}
