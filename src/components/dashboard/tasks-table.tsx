// src/components/dashboard/tasks-table.tsx
"use client";

import React, { useState, useEffect } from 'react';
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
import { Edit, Trash2, GripVertical, CornerDownRight, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { TasksTableToolbar } from './tasks-table-toolbar';

interface TasksTableProps {
  tasks: Task[];
  allTasks: Task[]; // All tasks for context
  onTasksChange: (tasks: Task[]) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
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

const getAllTaskIdsWithSubtasks = (tasks: Task[]): string[] => {
  let ids: string[] = [];
  for (const task of tasks) {
    if (task.subTasks && task.subTasks.length > 0) {
      ids.push(task.id);
      ids = ids.concat(getAllTaskIdsWithSubtasks(task.subTasks));
    }
  }
  return ids;
};

export function TasksTable({ tasks, allTasks, onTasksChange, onEditTask, onDeleteTask }: TasksTableProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Expand all by default
  useEffect(() => {
    const allParentIds = getAllTaskIdsWithSubtasks(tasks);
    setExpandedRows(new Set(allParentIds));
  }, [tasks]);


  const handleToggleExpand = (taskId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allParentIds = getAllTaskIdsWithSubtasks(tasks);
    setExpandedRows(new Set(allParentIds));
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault(); 
  };
  
  const flattenTasks = (tasksToFlatten: Task[]): Task[] => {
    let flatList: Task[] = [];
    for (const task of tasksToFlatten) {
        flatList.push(task);
        if (task.subTasks) {
            flatList = flatList.concat(flattenTasks(task.subTasks));
        }
    }
    return flatList;
  }

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetTaskId: string) => {
    e.preventDefault();
    const sourceTaskId = e.dataTransfer.getData("taskId");
    setDraggedTaskId(null);

    if (sourceTaskId === targetTaskId) return;

    // Use a flat list of all tasks for easier manipulation
    let newTasks = flattenTasks(allTasks);

    // Find the source task and update its parentId
    const sourceTaskIndex = newTasks.findIndex(t => t.id === sourceTaskId);
    if (sourceTaskIndex > -1) {
        newTasks[sourceTaskIndex].parentId = targetTaskId;
    }
    
    onTasksChange(newTasks);
  };

  const calculateSPI = (task: Task) => {
      if (task.status === 'Concluído' && task.actualEndDate && task.actualStartDate) {
          const plannedDuration = new Date(task.plannedEndDate).getTime() - new Date(task.plannedStartDate).getTime();
          const actualDuration = new Date(task.actualEndDate).getTime() - new Date(task.actualStartDate).getTime();
          if(actualDuration === 0) return (1).toFixed(2);
          return (plannedDuration / actualDuration).toFixed(2);
      }
      return 'N/A';
  }

  const calculateCPI = (task: Task) => {
      if (task.actualHours > 0) {
          return (task.plannedHours / task.actualHours).toFixed(2);
      }
      if (task.status === 'Concluído' && task.actualHours === 0) return (1).toFixed(2);
      return 'N/A';
  }
  
  const formatDate = (dateString: string) => {
    if(!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  const renderTask = (task: Task, level: number = 0) => {
    const isExpanded = expandedRows.has(task.id);
    const hasSubtasks = task.subTasks && task.subTasks.length > 0;
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
            level > 0 ? "bg-muted/50" : ""
          )}
        >
          <TableCell className="font-medium">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              {hasSubtasks ? (
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleExpand(task.id)}>
                   <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
                 </Button>
              ) : (
                <span className="w-6 h-6 inline-block" /> // Placeholder for alignment
              )}
              {level > 0 && <CornerDownRight className="h-4 w-4 text-muted-foreground -ml-2" />}
              {task.isMilestone && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Target className="h-4 w-4 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Este é um marco do projeto.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              )}
              <span>{task.name}</span>
            </div>
          </TableCell>
          <TableCell>{task.assignee.name}</TableCell>
          <TableCell>
            <Badge variant="outline" className={cn("font-normal", statusClasses[task.status] || statusClasses['A Fazer'])}>{task.status}</Badge>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className={cn("font-normal", priorityClasses[task.priority || 'Média'])}>{task.priority || 'Média'}</Badge>
          </TableCell>
          <TableCell>{formatDate(task.plannedEndDate)}</TableCell>
          <TableCell className={cn(cpi !== 'N/A' && parseFloat(cpi) < 1 ? 'text-red-600' : 'text-green-600')}>{cpi}</TableCell>
          <TableCell className={cn(spi !== 'N/A' && parseFloat(spi) < 1 ? 'text-red-600' : 'text-green-600')}>{spi}</TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditTask(task)}>
                <Edit className="h-4 w-4" />
              </Button>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente a tarefa "{task.name}" e todas as suas subtarefas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteTask(task.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </div>
          </TableCell>
        </TableRow>
        {isExpanded && hasSubtasks && task.subTasks.map(subTask => renderTask(subTask, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
       <TasksTableToolbar onExpandAll={expandAll} onCollapseAll={collapseAll} />
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
