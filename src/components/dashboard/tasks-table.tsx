// src/components/dashboard/tasks-table.tsx
"use client";

import React, { useState } from 'react';
import type { Task } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, GripVertical, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TasksTableProps {
  tasks: Task[];
  allTasks: Task[]; // All tasks for context
  onTasksChange: (tasks: Task[]) => void;
}

const statusClasses: { [key: string]: string } = {
  'Concluído': 'bg-green-100 text-green-800 border-green-200',
  'Em Andamento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'A Fazer': 'bg-gray-100 text-gray-800 border-gray-200',
  'Bloqueado': 'bg-red-100 text-red-800 border-red-200',
};

const priorityClasses: { [key: string]: string } = {
  'Alta': 'bg-red-500/20 text-red-700',
  'Média': 'bg-yellow-500/20 text-yellow-700',
  'Baixa': 'bg-blue-500/20 text-blue-700',
};

const findTaskAndParent = (tasks: Task[], taskId: string): { task: Task | null; parent: Task | null } => {
    for (const task of tasks) {
        if (task.id === taskId) return { task, parent: null };
        if (task.subTasks) {
            for (const subTask of task.subTasks) {
                if (subTask.id === taskId) return { task: subTask, parent: task };
                // Add deeper recursion if needed
            }
        }
    }
    return { task: null, parent: null };
};


export function TasksTable({ tasks, allTasks, onTasksChange }: TasksTableProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetTaskId: string) => {
    e.preventDefault();
    const sourceTaskId = e.dataTransfer.getData("taskId");
    setDraggedTaskId(null);

    if (sourceTaskId === targetTaskId) return;

    // Deep clone to avoid direct state mutation
    let newTasks = JSON.parse(JSON.stringify(allTasks));

    // Find source task and its parent to remove it from its original location
    let sourceTask: Task | null = null;
    let sourceParent: Task[] | null = newTasks;
    
    const findAndRemove = (currentTasks: Task[], id: string): Task | null => {
        for (let i = 0; i < currentTasks.length; i++) {
            if (currentTasks[i].id === id) {
                const [task] = currentTasks.splice(i, 1);
                return task;
            }
            if (currentTasks[i].subTasks) {
                const found = findAndRemove(currentTasks[i].subTasks!, id);
                if (found) return found;
            }
        }
        return null;
    };
    
    sourceTask = findAndRemove(newTasks, sourceTaskId);

    if (!sourceTask) return;

    // Find target task to add the source task as a subtask
    let targetTask: Task | null = null;
    const findTarget = (currentTasks: Task[], id: string) => {
        for (const task of currentTasks) {
            if (task.id === id) return task;
            if (task.subTasks) {
                const found = findTarget(task.subTasks, id);
                if (found) return found;
            }
        }
        return null;
    };

    targetTask = findTarget(newTasks, targetTaskId);
    
    if (targetTask) {
        if (!targetTask.subTasks) {
            targetTask.subTasks = [];
        }
        targetTask.subTasks.push(sourceTask);
        onTasksChange(newTasks);
    }
  };

  const calculateSPI = (task: Task) => {
      // Simplified SPI: (Planned duration) / (Actual duration up to now)
      // This is not a standard formula, but a placeholder for demonstration
      if (task.status === 'Concluído' && task.actualEndDate && task.actualStartDate) {
          const plannedDuration = new Date(task.plannedEndDate).getTime() - new Date(task.plannedStartDate).getTime();
          const actualDuration = new Date(task.actualEndDate).getTime() - new Date(task.actualStartDate).getTime();
          return (plannedDuration / actualDuration).toFixed(2);
      }
      return 'N/A';
  }

  const calculateCPI = (task: Task) => {
      // Simplified CPI: (Planned hours) / (Actual hours)
      if (task.actualHours > 0) {
          return (task.plannedHours / task.actualHours).toFixed(2);
      }
      if (task.status === 'Concluído' && task.actualHours === 0) return (1).toFixed(2);
      return 'N/A';
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  const renderTask = (task: Task, level: number = 0) => {
    const isSubtask = level > 0;
    const spi = calculateSPI(task);
    const cpi = calculateCPI(task);

    return (
      <React.Fragment key={task.id}>
        <TableRow
          draggable
          onDragStart={(e) => handleDragStart(e, task.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, task.id)}
          className={cn(
            "cursor-grab",
            draggedTaskId === task.id ? "opacity-50" : "opacity-100",
            isSubtask ? "bg-muted/50" : ""
          )}
        >
          <TableCell className="font-medium">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {isSubtask && <CornerDownRight className="h-4 w-4 text-muted-foreground" />}
              <span>{task.name}</span>
            </div>
          </TableCell>
          <TableCell>{task.assignee.name}</TableCell>
          <TableCell>
            <Badge variant="outline" className={cn("font-normal", statusClasses[task.status] || statusClasses['A Fazer'])}>{task.status}</Badge>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className={cn("font-normal", priorityClasses['Média'])}>Média</Badge>
          </TableCell>
          <TableCell>{formatDate(task.plannedEndDate)}</TableCell>
          <TableCell className={cn(cpi !== 'N/A' && parseFloat(cpi) < 1 ? 'text-red-600' : 'text-green-600')}>{cpi}</TableCell>
          <TableCell className={cn(spi !== 'N/A' && parseFloat(spi) < 1 ? 'text-red-600' : 'text-green-600')}>{spi}</TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {task.subTasks && task.subTasks.map(subTask => renderTask(subTask, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Atividade</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Data Fim Plan.</TableHead>
            <TableHead>CPI</TableHead>
            <TableHead>SPI</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => renderTask(task))}
        </TableBody>
      </Table>
    </div>
  );
}
