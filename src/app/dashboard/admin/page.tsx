// src/app/dashboard/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import type { Project, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { summarizeAllProjects, type SummarizeAllProjectsOutput } from '@/ai/flows/summarize-all-projects';
import { BrainCircuit, Loader2, Folder, User as UserIcon, CheckSquare, Settings } from "lucide-react";
import { KpiCard } from '@/components/dashboard/kpi-card';
import Link from 'next/link';
import { getProjects, getUsers } from '@/lib/supabase/service';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SummarizeAllProjectsOutput | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        try {
            const [fetchedProjects, fetchedUsers] = await Promise.all([
                getProjects(),
                getUsers(),
            ]);
            setProjects(fetchedProjects);
            setUsers(fetchedUsers);
        } catch (error) {
            toast({
                title: 'Erro ao carregar dados do admin',
                description: 'Não foi possível buscar os dados do sistema.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [toast]);


  const totalProjects = projects.length;
  const totalUsers = users.length;
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);

  const handleGenerateConsolidatedAnalysis = async () => {
    setLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const analysis = await summarizeAllProjects({ projects });
      setAnalysisResult(analysis);
    } catch (e) {
      console.error(e);
      setAnalysisError("Falha ao gerar a análise consolidada. Por favor, tente novamente.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  if (loading) {
    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
         <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel do Super Admin</h1>
          <p className="text-muted-foreground">Visão geral e gerenciamento de todo o sistema.</p>
        </div>
        <Link href="/dashboard/admin/settings">
            <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configurações do Sistema
            </Button>
        </Link>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Total de Projetos" value={totalProjects} icon={Folder} color="blue" />
          <KpiCard title="Total de Usuários" value={totalUsers} icon={UserIcon} color="purple" />
          <KpiCard title="Total de Tarefas" value={totalTasks} icon={CheckSquare} color="green" />
      </div>

      <Card>
          <CardHeader>
          <CardTitle>Análise Consolidada de Todos os Projetos</CardTitle>
          <CardDescription>
              Use IA para obter uma visão estratégica de todo o portfólio de projetos no sistema.
          </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          <Button onClick={handleGenerateConsolidatedAnalysis} disabled={loadingAnalysis}>
              {loadingAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
              {loadingAnalysis ? 'Analisando Portfólio...' : 'Gerar Análise Global com IA'}
          </Button>

          {loadingAnalysis && (
              <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-4 text-muted-foreground">A IA está analisando os dados de todos os projetos...</p>
              </div>
          )}

          {analysisError && <p className="text-destructive text-sm">{analysisError}</p>}
          
          {analysisResult && (
              <div className="prose prose-sm max-w-none dark:prose-invert space-y-4 pt-4 border-t mt-4">
              <div>
                  <h4 className="font-semibold text-foreground">Visão Geral do Portfólio</h4>
                  <p>{analysisResult.overallStatus}</p>
              </div>
              <div>
                  <h4 className="font-semibold text-foreground">Riscos entre Projetos</h4>
                  <p>{analysisResult.crossProjectRisks}</p>
              </div>
              <div>
                  <h4 className="font-semibold text-foreground">Recomendações Estratégicas</h4>
                  <p>{analysisResult.strategicRecommendations}</p>
              </div>
              </div>
          )}
          </CardContent>
      </Card>
    </div>
  );
}
