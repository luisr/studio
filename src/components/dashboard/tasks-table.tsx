// src/components/dashboard/tasks-table.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Project, Task, BulkAction } from "@/lib/types";
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
import { Edit, Trash2, CornerDownRight, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { TasksTableToolbar, TasksTableBulkActionsToolbar } from './tasks-table-toolbar';
import { ViewActions } from './view-actions';
import { Checkbox } from '../ui/checkbox';

interface TasksTableProps {
  tasks: Task[];
  project: Project;
  onTasksChange: (tasks: Task[]) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onBulkAction: (action: BulkAction, taskIds: Set<string>, newParentId?: string | null) => void;
}

const priorityClasses: { [key: string]: string } = {
  'Alta': 'bg-red-500/20 text-red-700',
  'Média': 'bg-yellow-500/20 text-yellow-700',
  'Baixa': 'bg-blue-500/20 text-blue-700',
};

const getAllTaskIdsWithSubtasks = (tasks: Task[]): string[] => {
  let ids: string[] = [];
  for (const task of tasks) {
    ids.push(task.id);
    if (task.subTasks && task.subTasks.length > 0) {
      ids = ids.concat(getAllTaskIdsWithSubtasks(task.subTasks));
    }
  }
  return ids;
};

const formatEffort = (hours: number): string => {
    if (typeof hours !== 'number' || isNaN(hours)) return '-';

    const months = hours / 160;
    if (months >= 1 && months % 1 === 0) return `${months} mes${months > 1 ? 'es' : ''}`;

    const weeks = hours / 40;
    if (weeks >= 1 && weeks % 1 === 0) return `${weeks} sem`;

    const days = hours / 8;
    if (days >= 1 && days % 1 === 0) return `${days}d`;
    
    return `${hours}h`;
}

export function TasksTable({ tasks, project, onTasksChange, onEditTask, onDeleteTask, onBulkAction }: TasksTableProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const printableRef = useRef<HTMLDivElement>(null);

  const statusColorMap = useMemo(() => {
    return project.configuration.statuses.reduce((acc, status) => {
        acc[status.name] = status.color;
        return acc;
    }, {} as Record<string, string>);
  }, [project.configuration.statuses]);


  // Expand all by default and reset selection when tasks change
  useEffect(() => {
    const allParentIds = getAllTaskIdsWithSubtasks(tasks);
    setExpandedRows(new Set(allParentIds));
    setSelectedRows(new Set());
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
  
  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetTaskId: string) => {
    e.preventDefault();
    const sourceTaskId = e.dataTransfer.getData("taskId");
    setDraggedTaskId(null);

    if (sourceTaskId === targetTaskId) return;

    let newTasks = [...project.tasks];

    const sourceTaskIndex = newTasks.findIndex(t => t.id === sourceTaskId);
    if (sourceTaskIndex > -1) {
        newTasks[sourceTaskIndex].parentId = targetTaskId;
    }
    
    onTasksChange(newTasks);
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedRows(new Set(getAllTaskIdsWithSubtasks(tasks)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (taskId: string, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    const taskAndSubtaskIds = getAllTaskIdsWithSubtasks(
        project.tasks.filter(t => t.id === taskId)
    );

    if (checked) {
        taskAndSubtaskIds.forEach(id => newSelectedRows.add(id));
    } else {
        taskAndSubtaskIds.forEach(id => newSelectedRows.delete(id));
    }
    setSelectedRows(newSelectedRows);
  };

  const isAllSelected = selectedRows.size > 0 && selectedRows.size === getAllTaskIdsWithSubtasks(tasks).length;
  const isSomeSelected = selectedRows.size > 0 && !isAllSelected;

  const calculateSPI = (task: Task) => {
      const completedStatus = project.configuration.statuses.find(s => s.isCompleted);
      if (completedStatus && task.status === completedStatus.name && task.actualEndDate && task.actualStartDate) {
          const plannedDuration = new Date(task.plannedEndDate).getTime() - new Date(task.plannedStartDate).getTime();
          const actualDuration = new Date(task.actualEndDate).getTime() - new Date(task.actualStartDate).getTime();
          if(actualDuration === 0) return (1).toFixed(2);
          return (plannedDuration / actualDuration).toFixed(2);
      }
      return 'N/A';
  }

  const calculateCPI = (task: Task) => {
      const completedStatus = project.configuration.statuses.find(s => s.isCompleted);
      if (task.actualHours > 0) {
          return (task.plannedHours / task.actualHours).toFixed(2);
      }
      if (completedStatus && task.status === completedStatus.name && task.actualHours === 0) return (1).toFixed(2);
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
    const isSelected = selectedRows.has(task.id);
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
          data-state={isSelected ? "selected" : undefined}
        >
          <TableCell className="font-medium">
             <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleSelectRow(task.id, !!checked)}
                className="mr-2"
              />
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
            <Badge variant="outline" style={{ 
                backgroundColor: `${statusColorMap[task.status]}33`, // 20% opacity
                color: statusColorMap[task.status],
                borderColor: `${statusColorMap[task.status]}80` // 50% opacity
             }}>
                {task.status}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className={cn("font-normal", priorityClasses[task.priority || 'Média'])}>{task.priority || 'Média'}</Badge>
          </TableCell>
          <TableCell>
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>{formatEffort(task.plannedHours)}</TooltipTrigger>
                    <TooltipContent><p>{task.plannedHours} horas</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </TableCell>
          <TableCell>{formatDate(task.plannedEndDate)}</TableCell>
          <TableCell className={cn(cpi !== 'N/A' && parseFloat(cpi) < 1 ? 'text-red-600' : 'text-green-600')}>{cpi}</TableCell>
          <TableCell className={cn(spi !== 'N/A' && parseFloat(spi) < 1 ? 'text-red-600' : 'text-green-600')}>{spi}</TableCell>
          {project.configuration.customFieldDefinitions?.map(fieldDef => (
             <TableCell key={fieldDef.id}>
                {task.customFields?.[fieldDef.id] ?? '-'}
             </TableCell>
          ))}
          <TableCell className='no-print'>
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

  const handleBulkActionWrapper = (action: BulkAction, newParentId?: string | null) => {
    onBulkAction(action, selectedRows, newParentId);
    setSelectedRows(new Set());
  };

  return (
    <div className="w-full">
      {selectedRows.size > 0 ? (
        <TasksTableBulkActionsToolbar 
          selectedCount={selectedRows.size}
          onBulkAction={handleBulkActionWrapper}
          allTasks={project.tasks}
          selectedTaskIds={selectedRows}
        />
      ) : (
       <TasksTableToolbar onExpandAll={expandAll} onCollapseAll={collapseAll}>
          <ViewActions contentRef={printableRef} />
       </TasksTableToolbar>
      )}
       <div className="overflow-x-auto printable" ref={printableRef}>
        <div className="printable-content">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">
                  <div className="flex items-center">
                    <Checkbox
                        checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                        className="mr-2"
                    />
                    Atividade
                  </div>
                </TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Esforço Plan.</TableHead>
                <TableHead>Data Fim Plan.</TableHead>
                <TableHead>CPI</TableHead>
                <TableHead>SPI</TableHead>
                {project.configuration.customFieldDefinitions?.map(fieldDef => (
                    <TableHead key={fieldDef.id}>{fieldDef.name}</TableHead>
                ))}
                <TableHead className='no-print'>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length > 0 ? (
                tasks.map(task => renderTask(task))
              ) : (
                <TableRow>
                  <TableCell colSpan={10 + (project.configuration.customFieldDefinitions?.length || 0)} className="h-24 text-center">
                    Nenhuma tarefa encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
       </div>
    </div>
  );
}
