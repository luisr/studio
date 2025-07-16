// src/app/dashboard/projects/[id]/page.tsx
'use client';

import { useState, useEffect, useMemo, use } from "react";
import type { Project, Task } from "@/lib/types";
import { notFound } from "next/navigation";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { TasksTable } from "@/components/dashboard/tasks-table";
import { CheckCircle, Clock, DollarSign, ListTodo, BarChart, AlertTriangle, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TaskFilters } from "@/components/dashboard/task-filters";
import { projects as initialProjects } from "@/lib/data";
import { TaskForm } from "@/components/dashboard/task-form";

export default function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const resolvedParams = use(params);

  const [project, setProject] = useState<Project | undefined>(undefined);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    setIsClient(true);
    const currentProject = initialProjects.find((p) => p.id === resolvedParams.id);
    if (currentProject) {
      setProject(currentProject);
      setFilteredTasks(currentProject.tasks);
    } else {
      // Se nenhum projeto for encontrado, podemos tratar isso aqui
      // Por exemplo, redirecionar ou mostrar uma mensagem de não encontrado.
    }
  }, [resolvedParams.id]);

  if (!project && isClient) {
    notFound();
  }

  const handleTaskUpdate = (updatedTasks: Task[]) => {
    if(project) {
      const newProjectState = {...project, tasks: updatedTasks};
      setProject(newProjectState);
    }
  };
  
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'subTasks' | 'changeHistory'>) => {
    if (!project) return;

    let newTasks = [...project.tasks];
    
    if (editingTask) {
        // Lógica de atualização
        const updateTask = (tasks: Task[]): Task[] => {
            return tasks.map(t => {
                if (t.id === editingTask.id) {
                    return { ...t, ...editingTask, ...taskData };
                }
                if (t.subTasks) {
                    return { ...t, subTasks: updateTask(t.subTasks) };
                }
                return t;
            });
        };
        newTasks = updateTask(newTasks);
    } else {
        // Lógica de criação
        const newTask: Task = {
            ...taskData,
            id: `task-${Date.now()}`,
            subTasks: [],
            changeHistory: [],
            isCritical: false, // Default value
        };
        newTasks.push(newTask);
    }

    handleTaskUpdate(newTasks);
    setIsFormOpen(false);
    setEditingTask(null);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };
  
  const handleCreateTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  }

  const handleDeleteTask = (taskId: string) => {
    if (!project) return;

    const removeTask = (tasks: Task[], id: string): Task[] => {
        return tasks.filter(t => t.id !== id).map(t => {
            if (t.subTasks) {
                return { ...t, subTasks: removeTask(t.subTasks, id) };
            }
            return t;
        });
    };
    
    const newTasks = removeTask(project.tasks, taskId);
    handleTaskUpdate(newTasks);
  };

  const calculateTotalProgress = (tasks: Task[]): number => {
    if (!tasks || tasks.length === 0) return 0;
    
    const totalWeightedProgress = tasks.reduce((acc, task) => {
        const progress = task.status === 'Concluído' ? 100 : (task.subTasks && task.subTasks.length > 0 ? calculateTotalProgress(task.subTasks) : 0);
        return acc + (progress * (task.plannedHours || 1));
    }, 0);

    const totalHours = tasks.reduce((acc, task) => acc + (task.plannedHours || 1), 0);
    
    if (totalHours === 0) return 0;

    return Math.round(totalWeightedProgress / totalHours);
  };
  
  const projectKPIs = useMemo(() => {
    if (!project) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        overallProgress: '0%',
        plannedBudget: 0,
        actualCost: 0,
        costVariance: 0,
        spi: '0.00',
        cpi: '0.00',
      };
    }
    const tasks = project.tasks;
    const countTasks = (taskList: Task[]): { total: number, completed: number } => {
        let total = taskList.length;
        let completed = taskList.filter(t => t.status === 'Concluído').length;
        taskList.forEach(t => {
            if (t.subTasks) {
                const subCount = countTasks(t.subTasks);
                total += subCount.total;
                completed += subCount.completed;
            }
        });
        return { total, completed };
    };

    const { total: totalTasks, completed: completedTasks } = countTasks(tasks);
    
    const totalPlannedHours = tasks.reduce((sum, t) => sum + t.plannedHours, 0);
    const totalActualHours = tasks.reduce((sum, t) => sum + t.actualHours, 0);
    const earnedValue = calculateTotalProgress(tasks) / 100 * totalPlannedHours;
    
    const spi = totalPlannedHours > 0 ? (earnedValue / totalPlannedHours) : 1;
    const cpi = totalActualHours > 0 ? (earnedValue / totalActualHours) : 1;
    
    return {
      totalTasks: totalTasks,
      completedTasks: completedTasks,
      overallProgress: `${calculateTotalProgress(tasks)}%`,
      plannedBudget: project.plannedBudget,
      actualCost: project.actualCost,
      costVariance: project.plannedBudget - project.actualCost,
      spi: spi.toFixed(2),
      cpi: cpi.toFixed(2),
    }

  }, [project]);


  const formatCurrency = (value: number) => {
    if(!isClient) return 'R$ ...';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  
  if (!isClient) {
    return <div>Carregando...</div>; 
  }
  
  if (!project) {
    return <div>Projeto não encontrado.</div>;
  }

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        <ProjectHeader project={project} onNewTaskClick={handleCreateTask} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total de Atividades" value={projectKPIs.totalTasks} icon={ListTodo} color="blue" />
            <KpiCard title="Atividades Concluídas" value={projectKPIs.completedTasks} icon={CheckCircle} color="green" />
            <KpiCard title="Conclusão Geral" value={projectKPIs.overallProgress} icon={BarChart} color="purple" />
            <KpiCard title="Custo Planejado" value={formatCurrency(projectKPIs.plannedBudget)} icon={DollarSign} color="blue" />
            <KpiCard title="Custo Real" value={formatCurrency(projectKPIs.actualCost)} icon={DollarSign} color="orange" />
            <KpiCard title="Desvio de Custo" value={formatCurrency(projectKPIs.costVariance)} icon={AlertTriangle} color={projectKPIs.costVariance < 0 ? "red" : "green"} />
            <KpiCard title="SPI (Desempenho de Prazo)" value={projectKPIs.spi} icon={Clock} color={parseFloat(projectKPIs.spi) < 1 ? "red" : "green"} />
            <KpiCard title="CPI (Desempenho de Custo)" value={projectKPIs.cpi} icon={Target} color={parseFloat(projectKPIs.cpi) < 1 ? "red" : "green"} />
          </div>
          
          <Tabs defaultValue="tabela">
            <div className="flex justify-between items-end">
              <TabsList>
                <TabsTrigger value="tabela">Tabela</TabsTrigger>
                <TabsTrigger value="gantt" disabled>Gantt</TabsTrigger>
                <TabsTrigger value="kanban" disabled>Kanban</TabsTrigger>
                <TabsTrigger value="graficos" disabled>Gráficos</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="tabela">
              <Card>
                <CardContent className="p-0">
                  <TaskFilters tasks={project.tasks} onFilterChange={setFilteredTasks} />
                  <TasksTable 
                    tasks={filteredTasks} 
                    allTasks={project.tasks} 
                    onTasksChange={handleTaskUpdate} 
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <TaskForm 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTask}
        task={editingTask}
        users={project.team}
      />
    </>
  );
}
