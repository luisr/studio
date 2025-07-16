// src/app/dashboard/projects/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo } from "react";
import { projects as initialProjects } from "@/lib/data";
import type { Project, Task } from "@/lib/types";
import { notFound } from "next/navigation";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { TasksTable } from "@/components/dashboard/tasks-table";
import { CheckCircle, Clock, DollarSign, ListTodo, BarChart, AlertTriangle, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TaskFilters } from "@/components/dashboard/task-filters";

export default function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    const currentProject = initialProjects.find((p) => p.id === params.id);
    if (currentProject) {
      setProject(currentProject);
      setFilteredTasks(currentProject.tasks);
    }
  }, [params.id]);
  
  if (!project) {
    // Renderiza um estado de carregamento ou esqueleto para evitar chamar notFound em re-renderizações no lado do cliente.
    // Por enquanto, retornar null impedirá a renderização até que o projeto seja encontrado.
    // notFound() deve ser idealmente chamado a partir de componentes do servidor ou durante a renderização inicial do servidor.
    return null; 
  }

  const handleTaskUpdate = (updatedTasks: Task[]) => {
    if(project) {
      const newProjectState = {...project, tasks: updatedTasks};
      setProject(newProjectState);
      // O componente de filtro lidará com a filtragem deste novo estado.
    }
  };

  const calculateTotalProgress = (tasks: Task[]): number => {
    if (tasks.length === 0) return 0;
    
    const totalWeightedProgress = tasks.reduce((acc, task) => {
        const progress = task.status === 'Concluído' ? 100 : 0; // Progresso simples
        return acc + (progress * (task.plannedHours || 1));
    }, 0);

    const totalHours = tasks.reduce((acc, task) => acc + (task.plannedHours || 1), 0);
    
    if (totalHours === 0) return 0;

    return Math.round(totalWeightedProgress / totalHours);
  };
  
  const projectKPIs = useMemo(() => {
    if (!project) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        overallProgress: '0%',
        plannedBudget: 0,
        actualCost: 0,
        costVariance: 0,
        spi: '0.00',
        cpi: '0.00',
      };
    }
    const tasks = project.tasks;
    const completedTasks = tasks.filter(t => t.status === 'Concluído').length;
    
    // Cálculo simplificado de SPI/CPI
    const totalPlannedHours = tasks.reduce((sum, t) => sum + t.plannedHours, 0);
    const totalActualHours = tasks.reduce((sum, t) => sum + t.actualHours, 0);
    const earnedValue = calculateTotalProgress(tasks) / 100 * totalPlannedHours;
    
    const spi = totalPlannedHours > 0 ? (earnedValue / totalPlannedHours) : 1;
    const cpi = totalActualHours > 0 ? (earnedValue / totalActualHours) : 1;
    
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks,
      overallProgress: `${calculateTotalProgress(tasks)}%`,
      plannedBudget: project.plannedBudget,
      actualCost: project.actualCost,
      costVariance: project.plannedBudget - project.actualCost,
      spi: spi.toFixed(2),
      cpi: cpi.toFixed(2),
    }

  }, [project]);


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ProjectHeader project={project} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total de Atividades" value={projectKPIs.totalTasks} icon={ListTodo} color="blue" />
          <KpiCard title="Atividades Concluídas" value={projectKPIs.completedTasks} icon={CheckCircle} color="green" />
          <KpiCard title="Conclusão Geral" value={projectKPIs.overallProgress} icon={BarChart} color="purple" />
          <KpiCard title="Custo Planejado" value={formatCurrency(projectKPIs.plannedBudget)} icon={DollarSign} color="blue" />
          <KpiCard title="Custo Real" value={formatCurrency(projectKPIs.actualCost)} icon={DollarSign} color="orange" />
          <KpiCard title="Desvio de Custo" value={formatCurrency(projectKPIs.costVariance)} icon={AlertTriangle} color={projectKPIs.costVariance < 0 ? "red" : "green"} />
          <KpiCard title="SPI (Desempenho de Prazo)" value={projectKPIs.spi} icon={Clock} color={parseFloat(projectKPIs.spi) < 1 ? "red" : "green"} />
          <KpiCard title="CPI (Desempenho de Custo)" value={projectKPIs.cpi} icon={Target} color={parseFloat(projectKPIs.cpi) < 1 ? "red" : "green"} />
        </div>
        
        <Tabs defaultValue="tabela">
          <div className="flex justify-between items-end">
            <TabsList>
              <TabsTrigger value="tabela">Tabela</TabsTrigger>
              <TabsTrigger value="gantt" disabled>Gantt</TabsTrigger>
              <TabsTrigger value="kanban" disabled>Kanban</TabsTrigger>
              <TabsTrigger value="graficos" disabled>Gráficos</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="tabela">
            <Card>
              <CardContent className="p-0">
                 <TaskFilters tasks={project.tasks} onFilterChange={setFilteredTasks} />
                 <TasksTable tasks={filteredTasks} allTasks={project.tasks} onTasksChange={handleTaskUpdate} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
