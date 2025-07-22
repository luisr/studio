// src/components/dashboard/backlog-view.tsx
"use client";

import type { Project, Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMemo, useRef } from "react";
import { Badge } from "../ui/badge";
import { UserCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { ViewActions } from "./view-actions";
import { PRIORITY_CLASSES, PRIORITY_ORDER } from '@/lib/constants';

interface BacklogViewProps {
  project: Project;
}

export function BacklogView({ project }: BacklogViewProps) {
  const printableRef = useRef<HTMLDivElement>(null);
    
  const backlogTasks = useMemo(() => {
    return project.tasks
      .filter(task => task.status === 'A Fazer')
      .sort((a, b) => {
          const priorityA = PRIORITY_ORDER[a.priority || 'Média'];
          const priorityB = PRIORITY_ORDER[b.priority || 'Média'];
          return priorityA - priorityB;
      });
  }, [project.tasks]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between no-print">
        <div>
          <CardTitle>Backlog do Projeto</CardTitle>
          <CardDescription>
            Lista de todas as tarefas com status "A Fazer", priorizadas para planejamento.
          </CardDescription>
        </div>
        <ViewActions contentRef={printableRef} />
      </CardHeader>
      <CardContent className="printable" ref={printableRef}>
        <div className="printable-content">
          {backlogTasks.length > 0 ? (
            <div className="space-y-4">
              {backlogTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg shadow-sm">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{task.name}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserCircle className="h-4 w-4" />
                      <span>{task.assignee.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={PRIORITY_CLASSES[task.priority || 'Média']}>
                      {task.priority || 'Média'}
                    </Badge>
                     <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                   <div className="text-sm text-muted-foreground">
                                      {task.plannedHours}h
                                  </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>Horas Planejadas</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center bg-muted/50 rounded-lg">
              <h3 className="text-lg font-semibold">Backlog Vazio!</h3>
              <p className="text-muted-foreground">Não há tarefas com status "A Fazer" no momento.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}