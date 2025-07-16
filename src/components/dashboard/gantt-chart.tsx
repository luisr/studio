// src/components/dashboard/gantt-chart.tsx
"use client"

import React, { useMemo } from 'react';
import type { Project, Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { eachDayOfInterval, format, differenceInDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';

interface GanttChartProps {
  project: Project;
}

const statusColors: { [key: string]: string } = {
  'A Fazer': 'bg-gray-400',
  'Em Andamento': 'bg-blue-500',
  'Concluído': 'bg-green-500',
  'Bloqueado': 'bg-red-500',
};

const nestTasks = (tasks: Task[]): Task[] => {
    const taskMap: Map<string, Task & { subTasks: Task[] }> = new Map();
    tasks.forEach(t => taskMap.set(t.id, { ...t, subTasks: [] }));
    const rootTasks: (Task & { subTasks: Task[] })[] = [];
    tasks.forEach(task => {
        const currentTask = taskMap.get(task.id);
        if (!currentTask) return;
        if (task.parentId && taskMap.has(task.parentId)) {
            const parent = taskMap.get(task.parentId);
            if(parent) parent.subTasks.push(currentTask);
        } else {
            rootTasks.push(currentTask);
        }
    });
    return rootTasks;
};

const flattenNestedTasks = (tasks: Task[], level = 0): (Task & { level: number })[] => {
  let allTasks: (Task & { level: number })[] = [];
  for (const task of tasks) {
    allTasks.push({ ...task, level });
    if (task.subTasks && task.subTasks.length > 0) {
      allTasks = allTasks.concat(flattenNestedTasks(task.subTasks, level + 1));
    }
  }
  return allTasks;
};


export function GanttChart({ project }: GanttChartProps) {
  const { tasks, startDate, endDate, totalDays, dateArray } = useMemo(() => {
    const tasks = flattenNestedTasks(nestTasks(project.tasks));
    
    if (tasks.length === 0) {
      const now = new Date();
      return { tasks: [], startDate: now, endDate: now, totalDays: 1, dateArray: [now] };
    }

    const startDates = tasks.map(t => new Date(t.plannedStartDate));
    const endDates = tasks.map(t => new Date(t.plannedEndDate));
    
    const startDate = startOfDay(new Date(Math.min(...startDates.map(d => d.getTime()))));
    const endDate = startOfDay(new Date(Math.max(...endDates.map(d => d.getTime()))));
    
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const dateArray = eachDayOfInterval({ start: startDate, end: endDate });

    return { tasks, startDate, endDate, totalDays, dateArray };
  }, [project.tasks]);

  const getTaskPosition = (task: Task) => {
    const taskStart = startOfDay(new Date(task.plannedStartDate));
    const taskEnd = startOfDay(new Date(task.plannedEndDate));
    const startOffset = differenceInDays(taskStart, startDate);
    const duration = differenceInDays(taskEnd, taskStart) + 1;

    return {
      gridColumnStart: startOffset + 1,
      gridColumnEnd: startOffset + duration + 1,
    };
  };

  const todayIndex = useMemo(() => {
    return differenceInDays(startOfDay(new Date()), startDate) + 1;
  }, [startDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gráfico de Gantt</CardTitle>
        <CardDescription>Cronograma visual das tarefas do projeto.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="relative inline-block min-w-full">
            <div 
              className="grid gap-y-1"
              style={{
                  gridTemplateColumns: `300px repeat(${totalDays}, minmax(40px, 1fr))`,
              }}
            >
                {/* Header da Lista de Tarefas */}
                <div className="sticky left-0 z-10 p-2 font-semibold bg-card border-r border-b">Atividade</div>
                
                {/* Header da Timeline */}
                {dateArray.map((date, index) => (
                    <div key={index} className="text-center p-2 border-b">
                        <div className="text-xs text-muted-foreground">{format(date, 'EEE', { locale: ptBR })}</div>
                        <div>{format(date, 'd')}</div>
                    </div>
                ))}

                {/* Linha do "Hoje" */}
                {todayIndex > 0 && todayIndex <= totalDays && (
                    <div className="absolute top-0 bottom-0 border-l-2 border-primary z-20" style={{ gridColumn: todayIndex + 1, left: `calc(300px + ${(todayIndex - 1)} * 40px + ${(todayIndex -1)} * 0.25rem)`}}>
                      <div className="absolute -top-5 -ml-4 text-xs font-bold text-primary bg-background px-1 rounded">Hoje</div>
                    </div>
                )}
                
                {/* Lista de Tarefas e Barras */}
                {tasks.map((task, rowIndex) => (
                    <React.Fragment key={task.id}>
                        {/* Nome da Tarefa */}
                        <div 
                           className="sticky left-0 z-10 flex items-center p-2 bg-card border-r whitespace-nowrap overflow-hidden text-ellipsis"
                           style={{ paddingLeft: `${1 + task.level * 1.5}rem` }}
                        >
                          {task.name}
                        </div>
                        
                        {/* Barra da Tarefa */}
                         <div className="col-span-full -ml-[300px] h-full" style={{ gridRow: rowIndex + 2, gridColumn: `2 / span ${totalDays}`}}>
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn("h-8 rounded-md flex items-center justify-center text-white text-xs overflow-hidden", statusColors[task.status] || 'bg-gray-400')}
                                  style={{
                                    gridColumnStart: getTaskPosition(task).gridColumnStart,
                                    gridColumnEnd: getTaskPosition(task).gridColumnEnd,
                                    marginLeft: `calc(${(getTaskPosition(task).gridColumnStart - 1)} * (40px + 0.25rem))`, // 40px width + 1rem gap
                                    width: `calc(${differenceInDays(new Date(task.plannedEndDate), new Date(task.plannedStartDate)) + 1} * (40px + 0.25rem) - 0.25rem)`
                                  }}
                                >
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-bold">{task.name}</p>
                                <p>Status: {task.status}</p>
                                <p>Início: {format(new Date(task.plannedStartDate), 'dd/MM/yyyy')}</p>
                                <p>Fim: {format(new Date(task.plannedEndDate), 'dd/MM/yyyy')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
