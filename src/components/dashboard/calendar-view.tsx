// src/components/dashboard/calendar-view.tsx
"use client";

import React, { useState, useMemo, useRef } from 'react';
import type { Project, Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { eachDayOfInterval, format, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ViewActions } from './view-actions';

interface CalendarViewProps {
  project: Project;
  onEditTask: (task: Task) => void;
}

const priorityClasses: { [key: string]: string } = {
  'Alta': 'border-red-500/50 bg-red-500/10 text-red-700',
  'Média': 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700',
  'Baixa': 'border-blue-500/50 bg-blue-500/10 text-blue-700',
};

export function CalendarView({ project, onEditTask }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const printableRef = useRef<HTMLDivElement>(null);
  
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    project.tasks.forEach(task => {
      const interval = eachDayOfInterval({
        start: new Date(task.plannedStartDate),
        end: new Date(task.plannedEndDate)
      });
      interval.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const tasksOnDay = map.get(dayKey) || [];
        map.set(dayKey, [...tasksOnDay, task]);
      });
    });
    return map;
  }, [project.tasks]);

  const tasksForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    const dayKey = format(selectedDate, 'yyyy-MM-dd');
    return tasksByDate.get(dayKey) || [];
  }, [selectedDate, tasksByDate]);

  const taskDays = useMemo(() => Array.from(tasksByDate.keys()), [tasksByDate]);
  
  const statusColorMap = useMemo(() => {
    return project.configuration.statuses.reduce((acc, status) => {
        acc[status.name] = status.color;
        return acc;
    }, {} as Record<string, string>);
  }, [project.configuration.statuses]);
  

  const DayWithTasks = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const tasksOnDay = tasksByDate.get(dayKey) || [];
    if (tasksOnDay.length === 0) return null;

    return (
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-0.5">
        {tasksOnDay.slice(0, 3).map(task => (
           <div
            key={task.id}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusColorMap[task.status] || '#808080' }}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between no-print">
         <div>
            <CardTitle>Calendário do Projeto</CardTitle>
            <CardDescription>
                Visão geral das tarefas agendadas. Clique em um dia para ver os detalhes.
            </CardDescription>
         </div>
         <ViewActions contentRef={printableRef} />
      </CardHeader>
      <CardContent className="printable" ref={printableRef}>
        <div className="printable-content grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="p-0"
              locale={ptBR}
              modifiers={{ taskDays: taskDays.map(d => new Date(d + 'T00:00:00')) }}
              modifiersClassNames={{ taskDays: 'bg-accent/50' }}
              components={{
                  DayContent: (props) => (
                    <>
                      <span className="relative z-10">{props.date.getDate()}</span>
                      {DayWithTasks(props.date)}
                    </>
                  )
              }}
            />
          </div>
          <div className="lg:col-span-1 border-l pl-8">
            <h3 className="text-lg font-semibold mb-4">
              {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : 'Selecione uma data'}
            </h3>
            <ScrollArea className="h-96">
                <div className="space-y-4 pr-4">
                    {tasksForSelectedDay.length > 0 ? (
                        tasksForSelectedDay.map(task => (
                            <div key={task.id} className="p-3 border rounded-lg shadow-sm cursor-pointer hover:bg-muted/50" onClick={() => onEditTask(task)}>
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-sm">{task.name}</p>
                                    <Badge variant="outline" className={priorityClasses[task.priority || 'Média']}>
                                        {task.priority || 'Média'}
                                    </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                    Responsável: {task.assignee.name}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center pt-10">Nenhuma tarefa para este dia.</p>
                    )}
                </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
