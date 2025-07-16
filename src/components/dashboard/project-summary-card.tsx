// src/components/dashboard/project-summary-card.tsx
"use client";

import type { Project } from "@/lib/types";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMemo } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import { Progress } from "../ui/progress";
import { format } from "date-fns";

export function ProjectSummaryCard({ project }: { project: Project }) {
  const {
    progress,
    statusData,
    costVariance,
    scheduleVariance,
  } = useMemo(() => {
    const totalTasks = project.tasks.length;
    if (totalTasks === 0) {
      return {
        progress: 0,
        statusData: [],
        costVariance: project.plannedBudget,
        scheduleVariance: 0,
      };
    }

    const completedStatusName = project.configuration.statuses.find(s => s.isCompleted)?.name;
    const completedTasks = project.tasks.filter((t) => t.status === completedStatusName).length;
    const progress = Math.round((completedTasks / totalTasks) * 100);

    const statusCounts = project.configuration.statuses.reduce((acc, status) => {
        acc[status.name] = { count: 0, color: status.color };
        return acc;
    }, {} as { [key: string]: { count: number, color: string } });

    project.tasks.forEach(task => {
      if (statusCounts[task.status]) {
        statusCounts[task.status].count++;
      }
    });
    
    const statusData = Object.entries(statusCounts)
        .map(([name, { count, color }]) => ({ name, value: count, fill: color }))
        .filter(item => item.value > 0);

    const costVariance = project.plannedBudget - project.actualCost;

    const projectEndDate = new Date(project.plannedEndDate);
    const today = new Date();
    const projectStartDate = new Date(project.plannedStartDate);
    const totalDuration = (projectEndDate.getTime() - projectStartDate.getTime());
    const elapsedDuration = (today.getTime() - projectStartDate.getTime());
    const expectedProgress = totalDuration > 0 ? Math.round((elapsedDuration / totalDuration) * 100) : 0;
    const scheduleVariance = progress - (expectedProgress > 100 ? 100 : expectedProgress) ;


    return { progress, statusData, costVariance, scheduleVariance };
  }, [project]);

  return (
    <AccordionItem value={project.id} className="border-b-0">
      <Card>
        <AccordionTrigger className="p-6 hover:no-underline">
          <div className="flex flex-col items-start text-left">
             <h3 className="text-lg font-semibold">{project.name}</h3>
             <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
          </div>
        </AccordionTrigger>
        <AccordionContent>
            <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Coluna 1: KPIs e Progresso */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Progresso Geral</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="text-3xl font-bold">{progress}%</div>
                             <Progress value={progress} className="mt-2" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Métricas Principais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Desvio de Custo</span>
                                <span className={costVariance < 0 ? 'text-red-500' : 'text-green-500'}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(costVariance)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Desvio de Prazo</span>
                                 <span className={scheduleVariance < 0 ? 'text-red-500' : 'text-green-500'}>
                                    {scheduleVariance > 0 ? '+' : ''}{scheduleVariance}%
                                 </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Prazo Final</span>
                                <span>{format(new Date(project.plannedEndDate), 'dd/MM/yyyy')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Coluna 2: Gráfico de Status */}
                <div className="md:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-base">Distribuição de Tarefas por Status</CardTitle>
                            <CardDescription>Visão geral do andamento das tarefas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ChartContainer config={{}} className="h-[250px] w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                </Pie>
                            </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}
