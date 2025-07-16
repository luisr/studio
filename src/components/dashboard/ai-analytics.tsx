"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Project } from '@/lib/types';
import { summarizeProjectStatus } from '@/ai/flows/summarize-project-status';
import { predictProjectRisks } from '@/ai/flows/predict-project-risks';
import { generateLessonsLearned } from '@/ai/flows/generate-lessons-learned';

interface AiAnalyticsProps {
  project: Project;
}

const AiResultDisplay = ({ content }: { content: string }) => (
  <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap font-mono">
    {content}
  </div>
);

export function AiAnalytics({ project }: AiAnalyticsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({
    summary: '',
    risks: '',
    lessons: '',
  });

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      const { summary, recommendations } = await summarizeProjectStatus({
        projectName: project.name,
        kpis: project.kpis as Record<string, number>,
        changeHistory: project.tasks.flatMap(t => t.changeHistory),
        risks: project.tasks.filter(t => t.status === 'Bloqueado').map(t => `Task ${t.name} is blocked`),
      });
      setResults(prev => ({ ...prev, summary: `Resumo:\n${summary}\n\nRecomendações:\n${recommendations}` }));
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao gerar o resumo do projeto." });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredictRisks = async () => {
    setIsLoading(true);
    try {
      const { risks, mitigationStrategies } = await predictProjectRisks({
        projectData: JSON.stringify(project),
        historicalProjectData: "Projetos similares frequentemente atrasam na fase de integração de API e sofrem com escopo não planejado."
      });
      setResults(prev => ({ ...prev, risks: `Riscos Previstos:\n${risks}\n\nEstratégias de Mitigação:\n${mitigationStrategies}` }));
    } catch (error) {
      console.error("Error predicting risks:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao prever os riscos do projeto." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateLessons = async () => {
    setIsLoading(true);
    try {
      const { lessonsLearned } = await generateLessonsLearned({
        projectData: JSON.stringify(project),
      });
      setResults(prev => ({ ...prev, lessons: lessonsLearned }));
    } catch (error) {
      console.error("Error generating lessons learned:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao gerar lições aprendidas." });
    } finally {
      setIsLoading(false);
    }
  };

  const analysisActions: { [key: string]: { title: string, description: string, action: () => Promise<void>, result: string } } = {
    summary: {
      title: "Resumo do Projeto",
      description: "A IA irá analisar os KPIs, histórico de alterações e riscos para gerar um resumo executivo e recomendações.",
      action: handleGenerateSummary,
      result: results.summary,
    },
    risks: {
      title: "Previsão de Riscos",
      description: "Com base em dados históricos e no estado atual, a IA irá prever riscos potenciais e sugerir estratégias de mitigação.",
      action: handlePredictRisks,
      result: results.risks,
    },
    lessons: {
      title: "Lições Aprendidas",
      description: "Análise profunda do histórico do projeto para identificar padrões, causas de atrasos e gerar lições aprendidas.",
      action: handleGenerateLessons,
      result: results.lessons,
    },
  }

  const currentAnalysis = analysisActions[activeTab];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análises com IA</CardTitle>
        <CardDescription>Utilize a inteligência artificial para obter insights sobre seu projeto.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="risks">Riscos</TabsTrigger>
            <TabsTrigger value="lessons">Lições Aprendidas</TabsTrigger>
          </TabsList>
          <div className="pt-6">
            <h3 className="text-lg font-semibold">{currentAnalysis.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{currentAnalysis.description}</p>
            <Button onClick={currentAnalysis.action} disabled={isLoading} className="mt-4">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Gerar Análise
            </Button>
            {isLoading && activeTab === 'summary' && !results.summary && <AiResultDisplay content="Gerando resumo..." />}
            {isLoading && activeTab === 'risks' && !results.risks && <AiResultDisplay content="Prevendo riscos..." />}
            {isLoading && activeTab === 'lessons' && !results.lessons && <AiResultDisplay content="Gerando lições..." />}
            {currentAnalysis.result && <AiResultDisplay content={currentAnalysis.result} />}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
