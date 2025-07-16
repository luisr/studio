// src/components/dashboard/gantt-chart.tsx
"use client"

import React, { useMemo, useRef } from 'react';
import type { Project, Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { eachDayOfInterval, format, differenceInDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Save, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { ViewActions } from './view-actions';


interface GanttChartProps {
  project: Project;
  onSaveBaseline: () => void;
  onDeleteBaseline: () => void;
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

    taskMap.forEach(task => {
        if (task.parentId && taskMap.has(task.parentId)) {
            const parent = taskMap.get(task.parentId);
            if (parent) {
                parent.subTasks.push(task);
            }
        } else {
            rootTasks.push(task);
        }
    });
    return rootTasks;
};

const flattenNestedTasks = (tasks: Task[], level = 0): (Task & { level: number })[] => {
  let allTasks: (Task & { level: number })[] = [];
  for (const task of tasks) {
    allTasks.push({ ...task, level });
    const subTasks = (task as any).subTasks;
    if (subTasks && subTasks.length > 0) {
      allTasks = allTasks.concat(flattenNestedTasks(subTasks, level + 1));
    }
  }
  return allTasks;
};


export function GanttChart({ project, onSaveBaseline, onDeleteBaseline }: GanttChartProps) {
  const printableRef = useRef<HTMLDivElement>(null);
  
  const { tasks, startDate, endDate, totalDays, dateArray } = useMemo(() => {
    const nested = nestTasks(project.tasks);
    const flattened = flattenNestedTasks(nested);
    
    if (flattened.length === 0) {
      const now = new Date();
      return { tasks: [], startDate: now, endDate: now, totalDays: 1, dateArray: [now] };
    }

    const startDates = flattened.map(t => new Date(t.plannedStartDate));
    if(project.baselineSavedAt) {
      flattened.forEach(t => {
        if(t.baselineStartDate) startDates.push(new Date(t.baselineStartDate));
      });
    }

    const endDates = flattened.map(t => new Date(t.plannedEndDate));
     if(project.baselineSavedAt) {
      flattened.forEach(t => {
        if(t.baselineEndDate) endDates.push(new Date(t.baselineEndDate));
      });
    }
    
    const startDate = startOfDay(new Date(Math.min(...startDates.map(d => d.getTime()))));
    const endDate = startOfDay(new Date(Math.max(...endDates.map(d => d.getTime()))));
    
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const dateArray = eachDayOfInterval({ start: startDate, end: endDate });

    return { tasks: flattened, startDate, endDate, totalDays, dateArray };
  }, [project.tasks, project.baselineSavedAt]);

  const getTaskPosition = (taskStart: Date, taskEnd: Date) => {
    const startOffset = differenceInDays(taskStart, startDate);
    const duration = differenceInDays(taskEnd, taskStart) + 1;

    return {
      gridColumnStart: startOffset + 2, // +2 because of the task name column
      gridColumnEnd: startOffset + duration + 2,
    };
  };
  
  const todayIndex = useMemo(() => {
    return differenceInDays(startOfDay(new Date()), startDate);
  }, [startDate]);

  return (
    <Card>
      <CardHeader className='flex-row items-start justify-between'>
        <div>
          <CardTitle>Gráfico de Gantt</CardTitle>
          <CardDescription>
            {project.baselineSavedAt 
              ? `Cronograma visual do projeto. Linha de base salva em: ${format(new Date(project.baselineSavedAt), 'dd/MM/yyyy HH:mm')}`
              : "Cronograma visual das tarefas do projeto."
            }
          </CardDescription>
        </div>
        <div className='flex items-center gap-2 no-print'>
            <ViewActions contentRef={printableRef} />
            <Button onClick={onSaveBaseline} variant="outline" size="sm">
                <Save className='mr-2' />
                Salvar Linha de Base
            </Button>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={!project.baselineSavedAt}>
                        <Trash2 className='mr-2' />
                        Excluir Linha de Base
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Linha de Base?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta ação não pode ser desfeita. Isso removerá permanentemente os dados da linha de base salvos para este projeto.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteBaseline}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto printable" ref={printableRef}>
        <div className="relative inline-block min-w-full text-sm">
            <div 
              className="grid items-center"
              style={{
                  gridTemplateColumns: `minmax(300px, 1fr) repeat(${totalDays}, minmax(40px, 1fr))`,
                  gridAutoRows: '40px'
              }}
            >
                {/* Header da Lista de Tarefas */}
                <div className="sticky left-0 z-20 p-2 font-semibold bg-card border-r border-b">Atividade</div>
                
                {/* Header da Timeline */}
                {dateArray.map((date, index) => (
                    <div key={index} className="text-center p-2 border-b h-full flex flex-col justify-center">
                        <div className="text-xs text-muted-foreground">{format(date, 'EEE', { locale: ptBR })}</div>
                        <div>{format(date, 'd')}</div>
                    </div>
                ))}
            
                {/* Linha do "Hoje" */}
                {todayIndex >= 0 && todayIndex < totalDays && (
                  <div className="absolute top-0 bottom-0 row-span-full border-l-2 border-primary z-20" style={{ gridColumn: todayIndex + 2, marginLeft: '-1px'}}>
                      <div className="sticky top-0 -ml-4 text-xs font-bold text-primary bg-background px-1 rounded whitespace-nowrap">Hoje</div>
                  </div>
                )}
                
                {/* Lista de Tarefas e Barras */}
                {tasks.map((task, rowIndex) => {
                  const taskStart = startOfDay(new Date(task.plannedStartDate));
                  const taskEnd = startOfDay(new Date(task.plannedEndDate));
                  const position = getTaskPosition(taskStart, taskEnd);
                  const duration = differenceInDays(taskEnd, taskStart) + 1;
                  
                  const baselineStart = task.baselineStartDate ? startOfDay(new Date(task.baselineStartDate)) : null;
                  const baselineEnd = task.baselineEndDate ? startOfDay(new Date(task.baselineEndDate)) : null;
                  const baselinePosition = baselineStart && baselineEnd ? getTaskPosition(baselineStart, baselineEnd) : null;
                  const baselineDuration = baselineStart && baselineEnd ? differenceInDays(baselineEnd, baselineStart) + 1 : 0;

                  return (
                    <React.Fragment key={task.id}>
                        {/* Task Row Background */}
                        <div className="col-span-full h-full border-b" style={{ gridRow: rowIndex + 2 }}></div>
                        
                        {/* Task Name */}
                        <div 
                           className="sticky left-0 z-20 flex items-center p-2 bg-card border-r border-b whitespace-nowrap overflow-hidden text-ellipsis"
                           style={{ paddingLeft: `${1 + task.level * 1.5}rem`, gridRow: rowIndex + 2 }}
                        >
                          {task.name}
                        </div>
                        
                        {/* Grid cells for the row */}
                        {dateArray.map((_, colIndex) => (
                          <div key={colIndex} className="border-b h-full" style={{gridRow: rowIndex + 2, gridColumn: colIndex + 2}}></div>
                        ))}

                        {/* Baseline Bar */}
                        {baselinePosition && (
                            <div
                                className="h-2 rounded-full bg-muted-foreground/50 z-10 self-end mb-2"
                                style={{
                                    gridRow: rowIndex + 2,
                                    gridColumnStart: baselinePosition.gridColumnStart,
                                    gridColumnEnd: baselinePosition.gridColumnEnd,
                                }}
                            ></div>
                        )}
                        
                        {/* Task Bar */}
                         <div
                            className='h-full'
                             style={{
                                gridRow: rowIndex + 2,
                                gridColumnStart: position.gridColumnStart,
                                gridColumnEnd: position.gridColumnEnd
                             }}
                         >
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn("h-6 rounded-md flex items-center justify-center text-white text-xs overflow-hidden z-10 self-center", statusColors[task.status] || 'bg-gray-400')}
                                >
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-bold">{task.name}</p>
                                <p>Status: {task.status}</p>
                                <p>Início: {format(new Date(task.plannedStartDate), 'dd/MM/yyyy')}</p>
                                <p>Fim: {format(new Date(task.plannedEndDate), 'dd/MM/yyyy')}</p>
                                {baselineStart && baselineEnd && (
                                  <>
                                    <hr className='my-2' />
                                    <p className='text-muted-foreground'>Linha de Base:</p>
                                    <p className='text-muted-foreground'>Início: {format(baselineStart, 'dd/MM/yyyy')}</p>
                                    <p className='text-muted-foreground'>Fim: {format(baselineEnd, 'dd/MM/yyyy')}</p>
                                  </>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                    </React.Fragment>
                  );
                })}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
