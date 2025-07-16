// src/components/dashboard/project-dashboard-client.tsx
'use client';

import { useState, useMemo, useEffect } from "react";
import type { Project, Task } from "@/lib/types";
import { notFound, useParams } from "next/navigation";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { TasksTable } from "@/components/dashboard/tasks-table";
import { CheckCircle, Clock, DollarSign, ListTodo, BarChart, AlertTriangle, Target, BrainCircuit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TaskFilters } from "@/components/dashboard/task-filters";
import { TaskForm } from "@/components/dashboard/task-form";
import { AiAnalysisTab } from "./ai-analysis-tab";
import { projects as initialProjects } from "@/lib/data";

const nestTasks = (tasks: Task[]): Task[] => {
    const taskMap: Map<string, Task & { subTasks: Task[] }> = new Map();
    // Initialize every task with a subTasks array
    tasks.forEach(t => taskMap.set(t.id, { ...t, subTasks: [] }));

    const rootTasks: (Task & { subTasks: Task[] })[] = [];

    tasks.forEach(task => {
        const currentTask = taskMap.get(task.id);
        if (!currentTask) return;

        if (task.parentId && taskMap.has(task.parentId)) {
            const parent = taskMap.get(task.parentId);
            if(parent) {
                parent.subTasks.push(currentTask);
            }
        } else {
            rootTasks.push(currentTask);
        }
    });
    return rootTasks;
};


const flattenTasks = (tasks: Task[]): Task[] => {
  let allTasks: Task[] = [];
  for (const task of tasks) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { subTasks, ...taskWithoutSubtasks } = task;
    allTasks.push(taskWithoutSubtasks);
    if (task.subTasks && task.subTasks.length > 0) {
      allTasks = allTasks.concat(flattenTasks(task.subTasks));
    }
  }
  return allTasks;
};

export function ProjectDashboardClient({ initialProject }: { initialProject: Project }) {
  const [project, setProject] = useState<Project>(initialProject);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const nestedTasks = useMemo(() => nestTasks(project.tasks), [project.tasks]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(nestedTasks);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setFilteredTasks(nestedTasks);
  }, [nestedTasks]);


  // Atualiza o estado do projeto se a propriedade inicial mudar
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const handleTaskUpdate = (updatedTasks: Task[]) => {
    const newProjectState = { ...project, tasks: updatedTasks };
    setProject(newProjectState);
  };
  
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'subTasks' | 'changeHistory'> & { parentId?: string | null }) => {
    const flatTasks = flattenTasks(project.tasks);
    let newTasks: Task[];
    
    if (editingTask) {
        // Lógica de atualização
        newTasks = flatTasks.map(t => {
            if (t.id === editingTask.id) {
                const newChangeHistory = [...(t.changeHistory || [])];

                (Object.keys(taskData) as Array<keyof typeof taskData>).forEach(key => {
                    if (t[key] !== taskData[key]) {
                        newChangeHistory.push({
                            fieldChanged: key,
                            oldValue: String(t[key]),
                            newValue: String(taskData[key]),
                            user: 'Usuário',
                            timestamp: new Date().toISOString(),
                            justification: 'Atualização via formulário'
                        });
                    }
                });

                return { ...t, ...taskData, changeHistory: newChangeHistory };
            }
            return t;
        });
    } else {
        // Lógica de criação
        const newTask: Task = {
            ...taskData,
            id: `task-${Date.now()}`,
            subTasks: [],
            changeHistory: [],
            isCritical: false, 
        };
        newTasks = [...flatTasks, newTask];
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
    const flatTasks = flattenTasks(project.tasks);
    const taskToDelete = flatTasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    const childIdsToDelete = new Set<string>();
    const getChildIds = (id: string) => {
        childIdsToDelete.add(id);
        flatTasks.forEach(t => {
            if (t.parentId === id) {
                getChildIds(t.id);
            }
        });
    }
    getChildIds(taskId);
    
    const newTasks = flatTasks.filter(t => !childIdsToDelete.has(t.id));
    handleTaskUpdate(newTasks);
  };

  const calculateTotalProgress = useMemo(() => {
    const calculate = (tasks: Task[]): number => {
      if (!tasks || tasks.length === 0) return 0;
      
      const totalWeightedProgress = tasks.reduce((acc, task) => {
          const progress = task.status === 'Concluído' ? 100 : (task.subTasks && task.subTasks.length > 0 ? calculate(task.subTasks) : 0);
          return acc + (progress * (task.plannedHours || 1));
      }, 0);
  
      const totalHours = tasks.reduce((acc, task) => acc + (task.plannedHours || 1), 0);
      
      if (totalHours === 0) return 0;
  
      return Math.round(totalWeightedProgress / totalHours);
    }
    return calculate;
  }, []);
  
  const projectKPIs = useMemo(() => {
    const tasks = project.tasks;
    const countTasks = (taskList: Task[]): { total: number, completed: number } => {
        let total = taskList.length;
        let completed = taskList.filter(t => t.status === 'Concluído').length;
        return { total, completed };
    };

    const { total: totalTasks, completed: completedTasks } = countTasks(tasks);
    const overallProgress = calculateTotalProgress(nestTasks(tasks));
    
    const totalPlannedHours = tasks.reduce((sum, t) => sum + t.plannedHours, 0);
    const totalActualHours = tasks.reduce((sum, t) => sum + t.actualHours, 0);
    const earnedValue = overallProgress / 100 * totalPlannedHours;
    
    const spi = totalPlannedHours > 0 && earnedValue > 0 ? (earnedValue / totalPlannedHours) : 1;
    const cpi = totalActualHours > 0 && earnedValue > 0 ? (earnedValue / totalActualHours) : 1;
    
    return {
      totalTasks: totalTasks,
      completedTasks: completedTasks,
      overallProgress: `${overallProgress}%`,
      plannedBudget: project.plannedBudget,
      actualCost: project.actualCost,
      costVariance: project.plannedBudget - project.actualCost,
      spi: spi.toFixed(2),
      cpi: cpi.toFixed(2),
    }

  }, [project, calculateTotalProgress]);

  const formatCurrency = (value: number) => {
    if(!isClient) return 'R$ ...';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  if (!isClient) {
    return <div>Carregando...</div>; 
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
            <KpiCard title="SPI (Prazo)" value={projectKPIs.spi} icon={Clock} color={parseFloat(projectKPIs.spi) < 1 ? "red" : "green"} />
            <KpiCard title="CPI (Custo)" value={projectKPIs.cpi} icon={Target} color={parseFloat(projectKPIs.cpi) < 1 ? "red" : "green"} />
          </div>
          
          <Tabs defaultValue="tabela">
            <div className="flex justify-between items-end">
              <TabsList>
                <TabsTrigger value="tabela">Tabela</TabsTrigger>
                <TabsTrigger value="ai_analysis">
                    <BrainCircuit className="w-4 h-4 mr-2" />
                    Análise IA
                </TabsTrigger>
                <TabsTrigger value="gantt" disabled>Gantt</TabsTrigger>
                <TabsTrigger value="kanban" disabled>Kanban</TabsTrigger>
                <TabsTrigger value="graficos" disabled>Gráficos</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="tabela">
              <Card>
                <TaskFilters tasks={nestedTasks} onFilterChange={setFilteredTasks} />
                <CardContent className="p-0">
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
             <TabsContent value="ai_analysis">
              <AiAnalysisTab project={project} />
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
        allTasks={project.tasks}
      />
    </>
  );
}
