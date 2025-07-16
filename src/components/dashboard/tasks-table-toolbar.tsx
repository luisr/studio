// src/components/dashboard/tasks-table-toolbar.tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronsDown, ChevronsUp, Copy, Move, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Task } from '@/lib/types';
import type { BulkAction } from '@/lib/types';

interface TasksTableToolbarProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  children?: React.ReactNode;
}

export function TasksTableToolbar({ onExpandAll, onCollapseAll, children }: TasksTableToolbarProps) {
  return (
    <div className="flex items-center justify-between p-2 border-b no-print">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExpandAll}>
          <ChevronsDown className="mr-2 h-4 w-4" />
          Expandir Tudo
        </Button>
        <Button variant="outline" size="sm" onClick={onCollapseAll}>
          <ChevronsUp className="mr-2 h-4 w-4" />
          Recolher Tudo
        </Button>
      </div>
      <div>{children}</div>
    </div>
  );
}


interface TasksTableBulkActionsToolbarProps {
  selectedCount: number;
  onBulkAction: (action: BulkAction, newParentId?: string | null) => void;
  allTasks: Task[];
  selectedTaskIds: Set<string>;
}

export function TasksTableBulkActionsToolbar({ selectedCount, onBulkAction, allTasks, selectedTaskIds }: TasksTableBulkActionsToolbarProps) {
    const [moveToParentId, setMoveToParentId] = useState<string | null>("root");
    const possibleParents = allTasks.filter(t => !selectedTaskIds.has(t.id));

    return (
        <div className='flex items-center justify-between p-2 border-b bg-primary/5 text-primary'>
            <span className='text-sm font-medium'>{selectedCount} tarefa(s) selecionada(s)</span>
            <div className='flex items-center gap-2'>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm"><Move className='mr-2' /> Mover</Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Mover Tarefas</AlertDialogTitle>
                            <AlertDialogDescription>
                                Selecione a nova tarefa pai para as tarefas selecionadas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Select onValueChange={setMoveToParentId} defaultValue="root">
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a tarefa pai" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="root">Nenhuma (Tornar tarefa raiz)</SelectItem>
                                {possibleParents.map(task => (
                                    <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onBulkAction('move', moveToParentId)}>Mover</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button variant="ghost" size="sm" onClick={() => onBulkAction('duplicate')}><Copy className='mr-2'/> Duplicar</Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className='mr-2' /> Excluir</Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Tarefas Selecionadas?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente as {selectedCount} tarefas selecionadas e suas subtarefas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onBulkAction('delete')}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
