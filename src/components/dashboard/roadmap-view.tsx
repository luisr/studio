// src/components/dashboard/roadmap-view.tsx
"use client";

import type { Project, Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMemo, useRef } from "react";
import { getQuarter, format, startOfQuarter, endOfQuarter, eachQuarterOfInterval, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Target } from "lucide-react";
import { ViewActions } from "./view-actions";

interface RoadmapViewProps {
  project: Project;
}

export function RoadmapView({ project }: RoadmapViewProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const { quarters, milestonesByQuarter } = useMemo(() => {
    const milestones = project.tasks.filter(task => task.isMilestone);
    if (milestones.length === 0) {
        return { quarters: [], milestonesByQuarter: new Map() };
    }

    const startDates = milestones.map(m => new Date(m.plannedStartDate));
    const endDates = milestones.map(m => new Date(m.plannedEndDate));

    const projectStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    const projectEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
    
    const interval = {
        start: startOfYear(projectStart),
        end: endOfYear(projectEnd)
    }

    const quarters = eachQuarterOfInterval(interval);

    const milestonesByQuarter = new Map<Date, Task[]>();

    quarters.forEach(q => {
        const quarterInterval = { start: startOfQuarter(q), end: endOfQuarter(q) };
        const milestonesInQuarter = milestones.filter(m => 
            isWithinInterval(new Date(m.plannedEndDate), quarterInterval)
        );
        if (milestonesInQuarter.length > 0) {
           milestonesByQuarter.set(q, milestonesInQuarter);
        }
    });

    return { quarters, milestonesByQuarter };
  }, [project.tasks]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between no-print">
        <div>
          <CardTitle>Roadmap do Projeto</CardTitle>
          <CardDescription>
            Uma visão de alto nível dos principais marcos (milestones) do projeto ao longo do tempo.
          </CardDescription>
        </div>
        <ViewActions contentRef={printableRef} />
      </CardHeader>
      <CardContent className="overflow-x-auto printable" ref={printableRef}>
        <div className="printable-content">
          <div className="flex gap-6">
            {quarters.map((quarter, index) => {
              const milestones = milestonesByQuarter.get(quarter);
              if (!milestones || milestones.length === 0) return null;

              return (
                <div key={index} className="flex-1 min-w-[250px]">
                  <div className="p-2 mb-4 text-center border-b-2">
                    <h3 className="font-semibold text-lg">{`${format(quarter, 'QQQ', { locale: ptBR })}`}</h3>
                    <p className="text-sm text-muted-foreground">{format(quarter, 'yyyy')}</p>
                  </div>
                  <div className="space-y-3">
                    {milestones.map(milestone => (
                      <div key={milestone.id} className="p-3 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-primary" />
                          <div className="flex flex-col">
                             <span className="font-medium text-sm">{milestone.name}</span>
                             <span className="text-xs text-muted-foreground">
                              Previsto para: {format(new Date(milestone.plannedEndDate), 'dd/MM/yyyy')}
                             </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          {milestonesByQuarter.size === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-muted/50 rounded-lg">
                  <h3 className="text-lg font-semibold">Nenhum Marco Definido</h3>
                  <p className="text-muted-foreground">Adicione marcos às suas tarefas para visualizá-los aqui.</p>
              </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
