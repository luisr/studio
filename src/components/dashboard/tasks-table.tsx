"use client";

import type { Task } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, AlertCircle } from "lucide-react";
import { ChangeHistoryDialog } from "./change-history-dialog";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TasksTableProps {
  tasks: Task[];
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  'A Fazer': 'secondary',
  'Em Andamento': 'default',
  'Concluído': 'outline',
  'Bloqueado': 'destructive'
};

const TaskRow = ({ task, level }: { task: Task, level: number }) => {
  const plan_end = new Date(task.plannedEndDate);
  const actual_end = task.actualEndDate ? new Date(task.actualEndDate) : new Date();
  const scheduleVariance = Math.round((plan_end.getTime() - actual_end.getTime()) / (1000 * 3600 * 24));

  return (
    <>
      <TableRow>
        <TableCell style={{ paddingLeft: `${level * 24 + 16}px` }}>
          <div className="flex items-center gap-2">
             {task.isCritical && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tarefa Crítica</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <span className="font-medium">{task.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${task.assignee.id}`} />
              <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{task.assignee.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={statusVariant[task.status]}>{task.status}</Badge>
        </TableCell>
        <TableCell>
          {new Date(task.plannedStartDate).toLocaleDateString()} → {new Date(task.plannedEndDate).toLocaleDateString()}
        </TableCell>
        <TableCell>
          {task.actualStartDate ? `${new Date(task.actualStartDate).toLocaleDateString()} → ${task.actualEndDate ? new Date(task.actualEndDate).toLocaleDateString() : 'Hoje'}` : 'N/A'}
        </TableCell>
        <TableCell className={cn(
          "font-medium",
          scheduleVariance < 0 ? "text-destructive" : "text-green-600"
        )}>
          {scheduleVariance > 0 ? `+${scheduleVariance}` : scheduleVariance} dias
        </TableCell>
        <TableCell>
          <ChangeHistoryDialog 
            history={task.changeHistory}
            trigger={
              <Button variant="ghost" size="icon" disabled={task.changeHistory.length === 0}>
                <History className="h-4 w-4" />
              </Button>
            }
          />
        </TableCell>
      </TableRow>
      {task.subTasks?.map((subTask) => (
        <TaskRow key={subTask.id} task={subTask} level={level + 1} />
      ))}
    </>
  )
}

export function TasksTable({ tasks }: TasksTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Tarefa</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Planejado</TableHead>
            <TableHead>Real</TableHead>
            <TableHead>Variação</TableHead>
            <TableHead>Histórico</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} level={0} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
