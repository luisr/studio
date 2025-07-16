// src/components/dashboard/gantt-chart.tsx
"use client"

import React, { useMemo, useRef, useState } from 'react';
import type { Project, Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { eachDayOfInterval, format, differenceInDays, startOfDay, addDays, getWeek, getMonth, getYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Save, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { ViewActions } from './view-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type ZoomLevel = 'day' | 'week' | 'month';

interface GanttChartProps {
  project: Project;
  onSaveBaseline: () => void;
  onDeleteBaseline: () => void;
}

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
  const [zoom, setZoom] = useState<ZoomLevel>('day');

  const statusColorMap = useMemo(() => {
    return project.configuration.statuses.reduce((acc, status) => {
        acc[status.name] = status.color;
        return acc;
    }, {} as Record<string, string>);
  }, [project.configuration.statuses]);
  
  const { tasks, overallStartDate, overallEndDate } = useMemo(() => {
    const nested = nestTasks(project.tasks);
    const flattened = flattenNestedTasks(nested);
    
    if (flattened.length === 0) {
      const now = new Date();
      return { tasks: [], overallStartDate: now, overallEndDate: addDays(now, 30) };
    }

    const allDates = flattened.flatMap(t => [
      new Date(t.plannedStartDate),
      new Date(t.plannedEndDate),
      ...(t.baselineStartDate ? [new Date(t.baselineStartDate)] : []),
      ...(t.baselineEndDate ? [new Date(t.baselineEndDate)] : []),
    ]);
    
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    return { 
      tasks: flattened, 
      overallStartDate: startOfDay(minDate), 
      overallEndDate: startOfDay(maxDate),
    };
  }, [project.tasks, project.baselineSavedAt]);

  const timeHeader = useMemo(() => {
    const start = overallStartDate;
    const end = overallEndDate;
    if (!start || !end || !isFinite(start.getTime()) || !isFinite(end.getTime())) {
      return { top: [], bottom: [] };
    }

    switch (zoom) {
      case 'month':
        const months = eachMonthOfInterval({ start, end });
        return {
          top: months.map(m => ({
            label: format(m, 'yyyy'),
            span: eachMonthOfInterval({start: startOfMonth(m), end: endOfMonth(m)}).filter(
              innerM => getYear(innerM) === getYear(m)
            ).length
          })).filter((value, index, self) => self.findIndex(v => v.label === value.label) === index),
          bottom: months.map(m => ({ label: format(m, 'MMM', { locale: ptBR }), date: m })),
        };
      case 'week':
        const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        return {
          top: weeks.map(w => ({
            label: format(w, 'MMM yyyy', { locale: ptBR }),
            span: eachWeekOfInterval({start: startOfMonth(w), end: endOfMonth(w)}, {weekStartsOn:1}).length
          })).filter((value, index, self) => self.findIndex(v => v.label === value.label) === index),
          bottom: weeks.map(w => ({ label: `S${getWeek(w)}`, date: w })),
        };
      case 'day':
      default:
        const days = eachDayOfInterval({ start, end });
        return {
           top: days.map(d => ({
            label: format(d, 'MMM yyyy', { locale: ptBR }),
            span: differenceInDays(endOfMonth(d), startOfMonth(d)) + 1
          })).filter((value, index, self) => self.findIndex(v => v.label === value.label) === index),
          bottom: days.map(d => ({ label: format(d, 'd'), subLabel: format(d, 'EEE', { locale: ptBR }), date: d })),
        };
    }
  }, [overallStartDate, overallEndDate, zoom]);

  const todayIndex = useMemo(() => {
    if (!overallStartDate || !isFinite(overallStartDate.getTime())) return -1;
    const today = startOfDay(new Date());
    if (today < overallStartDate) return -1;

    switch (zoom) {
      case 'month':
        return Math.floor(differenceInDays(today, startOfMonth(overallStartDate)) / 30);
      case 'week':
        return Math.floor(differenceInDays(today, startOfWeek(overallStartDate, { weekStartsOn: 1 })) / 7);
      case 'day':
      default:
        return differenceInDays(today, overallStartDate);
    }
  }, [overallStartDate, zoom]);
  
  const cellWidth = zoom === 'day' ? 40 : zoom === 'week' ? 60 : 100;
  const totalColumns = timeHeader.bottom.length;
  
  if (totalColumns === 0) {
    return (
        <Card>
            <CardHeader className='flex-row items-start justify-between'>
                <div>
                    <CardTitle>Gráfico de Gantt</CardTitle>
                    <CardDescription>Sem dados para exibir.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                    Nenhuma tarefa para exibir no gráfico de Gantt.
                </div>
            </CardContent>
        </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className='flex-row items-start justify-between no-print'>
        <div>
          <CardTitle>Gráfico de Gantt</CardTitle>
          <CardDescription>
            {project.baselineSavedAt 
              ? `Cronograma visual do projeto. Linha de base salva em: ${format(new Date(project.baselineSavedAt), 'dd/MM/yyyy HH:mm')}`
              : "Cronograma visual das tarefas do projeto."
            }
          </CardDescription>
        </div>
        <div className='flex items-center gap-2'>
            <Select value={zoom} onValueChange={(v) => setZoom(v as ZoomLevel)}>
              <SelectTrigger className='w-[120px]'>
                <SelectValue placeholder="Zoom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
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
        <div className="relative inline-block min-w-full text-sm printable-content">
            <div 
              className="grid"
              style={{
                  gridTemplateColumns: `minmax(300px, 1fr) repeat(${totalColumns}, minmax(${cellWidth}px, 1fr))`,
                  gridAutoRows: 'min-content 40px'
              }}
            >
                {/* Header da Lista de Tarefas */}
                <div className="sticky left-0 z-30 p-2 font-semibold bg-card border-r border-b grid-rows-subgrid row-span-2">Atividade</div>
                
                {/* Header Superior da Timeline (Meses/Anos) */}
                {timeHeader.top.map((header, index) => (
                    <div key={index} className="text-center p-2 border-b h-full flex items-center justify-center font-semibold" style={{ gridColumn: `span ${header.span || 1}` }}>
                        {header.label}
                    </div>
                ))}
            
                {/* Header Inferior da Timeline (Dias/Semanas) */}
                {timeHeader.bottom.map((header, index) => (
                    <div key={index} className="text-center p-2 border-b border-r h-full flex flex-col justify-center">
                        <div className="text-xs text-muted-foreground">{header.subLabel}</div>
                        <div>{header.label}</div>
                    </div>
                ))}
            
                {/* Linha do "Hoje" */}
                {todayIndex >= 0 && todayIndex < totalColumns && (
                  <div className="absolute top-0 bottom-0 row-span-full border-l-2 border-red-500 z-20" style={{ left: `calc(300px + ${todayIndex * cellWidth}px)`, width: `${cellWidth}px`}}>
                      <div className="sticky top-0 -ml-4 text-xs font-bold text-red-500 bg-background px-1 rounded whitespace-nowrap">Hoje</div>
                  </div>
                )}
                
                {/* Grid de Fundo */}
                {tasks.map((task, rowIndex) => (
                  <React.Fragment key={`${task.id}-grid`}>
                     <div 
                        className='col-start-2 border-b'
                        style={{gridRow: rowIndex + 3, gridColumnEnd: totalColumns + 2}}
                      ></div>
                      {timeHeader.bottom.map((_, colIndex) => (
                        <div key={colIndex} className="border-b border-r h-full" style={{gridRow: rowIndex + 3, gridColumn: colIndex + 2}}></div>
                      ))}
                  </React.Fragment>
                ))}


                {/* Lista de Tarefas e Barras */}
                {tasks.map((task, rowIndex) => {
                  const taskStart = startOfDay(new Date(task.plannedStartDate));
                  const taskEnd = startOfDay(new Date(task.plannedEndDate));
                  
                  if (!isFinite(taskStart.getTime()) || !isFinite(taskEnd.getTime())) return null;

                  let barStart = 0;
                  let barDuration = 0;
                  
                  if (zoom === 'day') {
                      barStart = differenceInDays(taskStart, overallStartDate);
                      barDuration = differenceInDays(taskEnd, taskStart) + 1;
                  } else if (zoom === 'week') {
                      barStart = differenceInDays(startOfWeek(taskStart, { weekStartsOn: 1 }), startOfWeek(overallStartDate, { weekStartsOn: 1 })) / 7;
                      barDuration = (differenceInDays(taskEnd, taskStart) + 1) / 7;
                  } else { // month
                      barStart = (getYear(taskStart) - getYear(overallStartDate)) * 12 + getMonth(taskStart) - getMonth(overallStartDate);
                      barDuration = (differenceInDays(taskEnd, taskStart) + 1) / 30.44; // Average days in month
                  }
                  
                  const baselineStart = task.baselineStartDate ? startOfDay(new Date(task.baselineStartDate)) : null;
                  const baselineEnd = task.baselineEndDate ? startOfDay(new Date(task.baselineEndDate)) : null;
                  
                  let baselineBarStart = 0;
                  let baselineBarDuration = 0;
                  
                  if(baselineStart && baselineEnd && isFinite(baselineStart.getTime()) && isFinite(baselineEnd.getTime())){
                     if (zoom === 'day') {
                        baselineBarStart = differenceInDays(baselineStart, overallStartDate);
                        baselineBarDuration = differenceInDays(baselineEnd, baselineStart) + 1;
                     } else if (zoom === 'week') {
                        baselineBarStart = differenceInDays(startOfWeek(baselineStart, { weekStartsOn: 1 }), startOfWeek(overallStartDate, { weekStartsOn: 1 })) / 7;
                        baselineBarDuration = (differenceInDays(baselineEnd, baselineStart) + 1) / 7;
                     } else { // month
                        baselineBarStart = (getYear(baselineStart) - getYear(overallStartDate)) * 12 + getMonth(baselineStart) - getMonth(overallStartDate);
                        baselineBarDuration = (differenceInDays(baselineEnd, baselineStart) + 1) / 30.44; 
                     }
                  }


                  return (
                    <React.Fragment key={task.id}>
                        {/* Task Name */}
                        <div 
                           className="sticky left-0 z-20 flex items-center p-2 bg-card border-r border-b whitespace-nowrap overflow-hidden text-ellipsis"
                           style={{ paddingLeft: `${1 + task.level * 1.5}rem`, gridRow: rowIndex + 3, gridColumn: 1 }}
                        >
                          {task.name}
                        </div>
                        
                        <div
                            className='relative h-full'
                            style={{
                                gridRow: rowIndex + 3,
                                gridColumn: `2 / span ${totalColumns}`
                            }}
                         >
                          {/* Baseline Bar */}
                          {baselineStart && (
                              <div
                                  className="absolute h-2 rounded-full bg-muted-foreground/50 z-10 bottom-1"
                                  style={{
                                      left: `calc(${baselineBarStart / totalColumns * 100}% + 2px)`,
                                      width: `calc(${baselineBarDuration / totalColumns * 100}% - 4px)`
                                  }}
                              ></div>
                          )}
                          
                          {/* Task Bar */}
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                 <div
                                  className={cn("absolute h-6 rounded-md flex items-center justify-center text-white text-xs overflow-hidden z-10 self-center top-1/2 -translate-y-1/2")}
                                  style={{
                                      backgroundColor: statusColorMap[task.status] || '#808080',
                                      left: `calc(${barStart / totalColumns * 100}% + 2px)`,
                                      width: `calc(${barDuration / totalColumns * 100}% - 4px)`
                                  }}
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
