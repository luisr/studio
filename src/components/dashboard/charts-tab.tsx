// src/components/dashboard/charts-tab.tsx
"use client"

import { useMemo } from 'react';
import type { Project, Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend } from 'recharts';

interface ChartsTabProps {
  project: Project;
}

const statusColors: { [key: string]: string } = {
  'A Fazer': 'hsl(var(--chart-1))',
  'Em Andamento': 'hsl(var(--chart-2))',
  'Concluído': 'hsl(var(--chart-3))',
  'Bloqueado': 'hsl(var(--chart-4))',
};

export function ChartsTab({ project }: ChartsTabProps) {
  const hoursChartData = useMemo(() => {
    return project.tasks
      .filter(task => !task.parentId) // Apenas tarefas principais
      .map(task => ({
        name: task.name,
        planned: task.plannedHours,
        actual: task.actualHours,
      }));
  }, [project.tasks]);

  const statusChartData = useMemo(() => {
    const statusCounts: { [key: string]: number } = {
      'A Fazer': 0,
      'Em Andamento': 0,
      'Concluído': 0,
      'Bloqueado': 0,
    };

    project.tasks.forEach(task => {
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [project.tasks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Horas Planejadas vs. Reais</CardTitle>
          <CardDescription>Comparativo de horas para tarefas principais do projeto.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <BarChart data={hoursChartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 15) + '...'}/>
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="planned" fill="hsl(var(--chart-1))" name="Planejado" radius={4} />
              <Bar dataKey="actual" fill="hsl(var(--chart-2))" name="Real" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Tarefas por Status</CardTitle>
          <CardDescription>Visão geral do andamento das tarefas.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.name]} />
                ))}
              </Pie>
               <Legend />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
