// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectForm } from '@/components/dashboard/project-form';
import type { Project, User } from '@/lib/types';
import { defaultConfiguration } from '@/lib/data.bak';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Loader2, BrainCircuit } from 'lucide-react';
import { summarizeAllProjects, type SummarizeAllProjectsOutput } from '@/ai/flows/summarize-all-projects';
import { getProjects, getUsers, createProject } from '@/lib/supabase/service';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';


const calculateProgress = (project: Project): number => {
    if (project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(t => t.status === 'Concluído').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
}

export default function DashboardProjectsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SummarizeAllProjectsOutput | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [fetchedProjects, fetchedUsers] = await Promise.all([
        getProjects(),
        getUsers()
      ]);
      setProjects(fetchedProjects);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível buscar os projetos e usuários do sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllData();
  }, [toast]);

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'kpis' | 'actualCost' | 'configuration' | 'tasks' | 'team'> & { managerId: string }) => {
    const manager = users.find(u => u.id === projectData.managerId);
    if (!manager) {
        toast({ title: "Gerente não encontrado", variant: "destructive" });
        return;
    }

    const newProject: Omit<Project, 'id'> = {
      name: projectData.name,
      description: projectData.description,
      plannedStartDate: projectData.plannedStartDate,
      plannedEndDate: projectData.plannedEndDate,
      plannedBudget: projectData.plannedBudget,
      manager: manager,
      actualCost: 0,
      tasks: [],
      kpis: {},
      configuration: defaultConfiguration,
      team: [{ user: manager, role: 'Manager' }], // Manager is the first team member
    };
    try {
       await createProject(newProject);
       toast({
         title: "Projeto Criado!",
         description: `O projeto "${projectData.name}" foi criado com sucesso.`
       });
       // Refresh the list of projects
       await fetchAllData();
       setIsFormOpen(false);
    } catch (error) {
       console.error("Failed to create project:", error);
       toast({
         title: "Erro ao Criar Projeto",
         description: "Ocorreu um erro ao salvar o novo projeto. Tente novamente.",
         variant: "destructive"
       });
    }
  };
  
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
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
         <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral dos Projetos</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho de todos os seus projetos e obtenha insights estratégicos.</p>
        </div>
         {currentUser?.role === 'Admin' && (
            <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle />
                Novo Projeto
            </Button>
         )}
      </div>
      
      {currentUser?.role === 'Admin' && (
        <Card>
            <CardHeader>
            <CardTitle>Análise Consolidada do Portfólio</CardTitle>
            <CardDescription>
                Use IA para obter uma visão estratégica de todos os projetos em andamento.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <Button onClick={handleGenerateConsolidatedAnalysis} disabled={loadingAnalysis || projects.length === 0}>
                {loadingAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                {loadingAnalysis ? 'Analisando Portfólio...' : 'Gerar Análise com IA'}
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const progress = calculateProgress(project);
            return (
                <Card key={project.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2 h-10">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="text-sm font-semibold">Progresso</h4>
                            <span className="text-sm font-bold text-primary">{progress}%</span>
                        </div>
                        <Progress value={progress} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Equipe</h4>
                        <div className="flex -space-x-2 overflow-hidden">
                            {project.team.slice(0, 5).map((member) => (
                                <Avatar key={member.user.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                <AvatarImage src={member.user.avatar} alt={member.user.name} />
                                <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            ))}
                            {project.team.length > 5 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                                <span className="text-xs font-medium">+{project.team.length - 5}</span>
                            </div>
                            )}
                        </div>
                    </div>
                </CardContent>
                <div className="p-6 pt-0">
                    <Link href={`/dashboard/projects/${project.id}`} passHref>
                        <Button className="w-full">Acessar Painel</Button>
                    </Link>
                </div>
                </Card>
            )
          })}
        </div>
        
        {isFormOpen && (
            <ProjectForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleCreateProject}
            users={users}
            />
        )}
    </div>
  );
}
