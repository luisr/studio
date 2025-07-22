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
import { Edit, Trash2, CornerDownRight, Target, ChevronRight, Columns, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { TasksTableToolbar, TasksTableBulkActionsToolbar } from './tasks-table-toolbar';
import { ViewActions } from './view-actions';
import { Checkbox } from '../ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Slider } from '../ui/slider';

interface TasksTableProps {
  tasks: Task[];
  project: Project;
  canEditTasks: boolean;
  onTasksChange: (tasks: Task[]) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onBulkAction: (action: BulkAction, taskIds: Set<string>, newParentId?: string | null) => void;
}

import { PRIORITY_CLASSES } from '@/lib/constants';
import { formatEffort } from '@/lib/utils/effort';
import { formatDate } from '@/lib/utils/date';

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

type ColumnVisibility = {
  [key: string]: boolean;
};

export function TasksTable({ tasks, project, canEditTasks, onTasksChange, onEditTask, onDeleteTask, onBulkAction }: TasksTableProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const printableRef = useRef<HTMLDivElement>(null);

  const defaultColumns = {
    assignee: true,
    status: true,
    priority: true,
    progress: true,
    plannedHours: true,
    plannedEndDate: true,
    cpi: false,
    spi: false,
  };

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    ...defaultColumns
  });


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
    if (!canEditTasks) return;
    e.dataTransfer.setData("taskId", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    if (!canEditTasks) return;
    e.preventDefault(); 
  };
  
  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetTaskId: string) => {
    if (!canEditTasks) return;
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
  
  const handleProgressChange = (taskId: string, newProgress: number[]) => {
      if (!canEditTasks) return;
      
      const updatedTasks = project.tasks.map(task => {
          if (task.id === taskId) {
              const completedStatus = project.configuration.statuses.find(s => s.isCompleted);
              const status = newProgress[0] === 100 && completedStatus ? completedStatus.name : task.status;
              return { ...task, progress: newProgress[0], status };
          }
          return task;
      });
      onTasksChange(updatedTasks);
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
  
  const renderTask = (task: Task, level: number = 0) => {
    const isExpanded = expandedRows.has(task.id);
    const hasSubtasks = task.subTasks && task.subTasks.length > 0;
    const isSelected = selectedRows.has(task.id);
    const spi = calculateSPI(task);
    const cpi = calculateCPI(task);

    return (
      <React.Fragment key={task.id}>
        <TableRow
          draggable={canEditTasks}
          onDragStart={(e) => handleDragStart(e, task.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, task.id)}
          className={cn(
            canEditTasks && "cursor-grab",
            draggedTaskId === task.id ? "opacity-50" : "opacity-100",
            level > 0 ? "bg-muted/50" : ""
          )}
          data-state={isSelected ? "selected" : undefined}
        >
          <TableCell className="font-medium">
             <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              {canEditTasks && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectRow(task.id, !!checked)}
                  className="mr-2"
                />
              )}
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
          {columnVisibility.assignee && <TableCell>{task.assignee.name}</TableCell>}
          {columnVisibility.status && <TableCell>
            <Badge variant="outline" style={{ 
                backgroundColor: `${statusColorMap[task.status]}33`, // 20% opacity
                color: statusColorMap[task.status],
                borderColor: `${statusColorMap[task.status]}80` // 50% opacity
             }}>
                {task.status}
            </Badge>
          </TableCell>}
          {columnVisibility.priority && <TableCell>
            <Badge variant="outline" className={cn("font-normal", PRIORITY_CLASSES[task.priority || 'Média'])}>{task.priority || 'Média'}</Badge>
          </TableCell>}
          {columnVisibility.progress && (
            <TableCell>
              <div className="flex items-center gap-2">
                <Slider
                  value={[task.progress || 0]}
                  onValueChange={(value) => handleProgressChange(task.id, value)}
                  max={100}
                  step={5}
                  className="w-24"
                  disabled={!canEditTasks}
                />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {task.progress || 0}%
                </span>
              </div>
            </TableCell>
          )}
          {columnVisibility.plannedHours && <TableCell>
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>{formatEffort(task.plannedHours)}</TooltipTrigger>
                    <TooltipContent><p>{task.plannedHours} horas</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </TableCell>}
          {columnVisibility.plannedEndDate && <TableCell>{formatDate(task.plannedEndDate)}</TableCell>}
          {columnVisibility.cpi && <TableCell className={cn(cpi !== 'N/A' && parseFloat(cpi) < 1 ? 'text-red-600' : 'text-green-600')}>{cpi}</TableCell>}
          {columnVisibility.spi && <TableCell className={cn(spi !== 'N/A' && parseFloat(spi) < 1 ? 'text-red-600' : 'text-green-600')}>{spi}</TableCell>}
          {project.configuration.customFieldDefinitions?.map(fieldDef => {
              if (!columnVisibility[fieldDef.id] && columnVisibility[fieldDef.id] !== undefined) return null;
              
              let cellContent: React.ReactNode = task.customFields?.[fieldDef.id] ?? '-';
              if (fieldDef.type === 'date') {
                  cellContent = formatDate(task.customFields?.[fieldDef.id] as string);
              }

              return (
                <TableCell key={fieldDef.id}>
                    {cellContent}
                </TableCell>
              )
          })}
          <TableCell className='no-print'>
            <div className="flex gap-1">
              {canEditTasks && (
                <>
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
                </>
              )}
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
      {selectedRows.size > 0 && canEditTasks ? (
        <TasksTableBulkActionsToolbar 
          selectedCount={selectedRows.size}
          onBulkAction={handleBulkActionWrapper}
          allTasks={project.tasks}
          selectedTaskIds={selectedRows}
        />
      ) : (
       <TasksTableToolbar onExpandAll={expandAll} onCollapseAll={collapseAll}>
           <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Columns className="mr-2 h-4 w-4" />
                        Colunas
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Exibir/Ocultar Colunas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(defaultColumns).map(([key, value]) => (
                        <DropdownMenuCheckboxItem
                            key={key}
                            className="capitalize"
                            checked={columnVisibility[key]}
                            onCheckedChange={checked => setColumnVisibility(prev => ({ ...prev, [key]: !!checked }))}
                        >
                            {key.replace(/([A-Z])/g, ' $1')}
                        </DropdownMenuCheckboxItem>
                    ))}
                     {project.configuration.customFieldDefinitions && project.configuration.customFieldDefinitions.length > 0 && <DropdownMenuSeparator />}
                     {project.configuration.customFieldDefinitions?.map(def => (
                         <DropdownMenuCheckboxItem
                            key={def.id}
                            checked={columnVisibility[def.id] !== false} // Show by default
                            onCheckedChange={value => setColumnVisibility(prev => ({ ...prev, [def.id]: !!value }))}
                        >
                            {def.name}
                        </DropdownMenuCheckboxItem>
                     ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <ViewActions contentRef={printableRef} />
          </div>
       </TasksTableToolbar>
      )}
       <div className="overflow-x-auto printable" ref={printableRef}>
        <div className="printable-content">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">
                  <div className="flex items-center">
                    {canEditTasks && (
                      <Checkbox
                          checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                          onCheckedChange={handleSelectAll}
                          className="mr-2"
                      />
                    )}
                    Atividade
                  </div>
                </TableHead>
                {columnVisibility.assignee && <TableHead>Responsável</TableHead>}
                {columnVisibility.status && <TableHead>Status</TableHead>}
                {columnVisibility.priority && <TableHead>Prioridade</TableHead>}
                {columnVisibility.progress && <TableHead className="w-[150px]">Progresso</TableHead>}
                {columnVisibility.plannedHours && <TableHead>Esforço Plan.</TableHead>}
                {columnVisibility.plannedEndDate && <TableHead>Data Fim Plan.</TableHead>}
                {columnVisibility.cpi && <TableHead>CPI</TableHead>}
                {columnVisibility.spi && <TableHead>SPI</TableHead>}
                {project.configuration.customFieldDefinitions?.map(fieldDef => (
                   columnVisibility[fieldDef.id] !== false && <TableHead key={fieldDef.id}>{fieldDef.name}</TableHead>
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
