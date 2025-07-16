// src/components/dashboard/task-filters.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface TaskFiltersProps {
    tasks: Task[];
    onFilterChange: (filteredTasks: Task[]) => void;
}

const filterTasksRecursive = (tasks: Task[], searchTerm: string, statusFilter: string): Task[] => {
    let results: Task[] = [];
    
    for (const task of tasks) {
        const lowercasedTerm = searchTerm.toLowerCase();
        // A tarefa pode não ter nome se estiver mal formada.
        const matchesSearch = task.name ? task.name.toLowerCase().includes(lowercasedTerm) : false;
        const matchesStatus = statusFilter === "all" || task.status === statusFilter;

        let subTasks: Task[] = [];
        if (task.subTasks && task.subTasks.length > 0) {
            subTasks = filterTasksRecursive(task.subTasks, searchTerm, statusFilter);
        }

        if ((matchesSearch && matchesStatus) || subTasks.length > 0) {
            results.push({ ...task, subTasks });
        }
    }

    return results;
};

export function TaskFilters({ tasks, onFilterChange }: TaskFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const filtered = filterTasksRecursive(tasks, searchTerm, statusFilter);
    onFilterChange(filtered);

  }, [searchTerm, statusFilter, tasks, onFilterChange]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return (
    <div className="p-4 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por atividade..." 
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="md:col-span-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todos os Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="A Fazer">A Fazer</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="md:col-span-1">
                <Button variant="ghost" className="w-full" onClick={clearFilters}>Limpar Filtros</Button>
            </div>
        </div>
    </div>
  )
}
