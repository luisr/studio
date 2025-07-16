// src/components/dashboard/project-dashboard-client.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Project, Task } from "@/lib/types";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { TasksTable } from "@/components/dashboard/tasks-table";
import { CheckCircle, Clock, DollarSign, ListTodo, BarChart, AlertTriangle, Target, BrainCircuit, PieChart, GanttChartSquare, Layers, Route, ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TaskFilters } from "@/components/dashboard/task-filters";
import { TaskForm } from "@/components/dashboard/task-form";
import { AiAnalysisTab } from "./ai-analysis-tab";
import { ChartsTab } from "./charts-tab";
import { GanttChart } from "./gantt-chart";
import { addDays, max, parseISO } from "date-fns";
import { RoadmapView } from "./roadmap-view";
import { BacklogView } from "./backlog-view";
import { useToast } from "@/hooks/use-toast";


const nestTasks = (tasks: Task[]): Task[] => {
    const taskMap: Map<string, Task & { subTasks: Task[] }> = new Map();
    const tasksWithoutParents: Task[] = [];
    tasks.forEach(t => {
      tasksWithoutParents.push(t);
      taskMap.set(t.id, { ...t, subTasks: [] })
    });

    const rootTasks: (Task & { subTasks: Task[] })[] = [];

    tasksWithoutParents.forEach(task => {
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

export function ProjectDashboardClient({ initialProject }: { initialProject: Project }) {
  const [project, setProject] = useState<Project>(initialProject);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  
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

  const handleTaskUpdate = useCallback((updatedTasks: Task[]) => {
    // This function now receives and sets a flat list of tasks
    setProject(prevProject => ({ ...prevProject, tasks: updatedTasks }));
  }, []);

   const handleSaveBaseline = () => {
    const tasksWithBaseline = project.tasks.map(task => ({
      ...task,
      baselineStartDate: task.plannedStartDate,
      baselineEndDate: task.plannedEndDate,
    }));
    setProject({
      ...project,
      tasks: tasksWithBaseline,
      baselineSavedAt: new Date().toISOString(),
    });
    toast({
        title: "Linha de Base Salva",
        description: "A linha de base do projeto foi salva com sucesso.",
    });
  };

  const handleDeleteBaseline = () => {
    const tasksWithoutBaseline = project.tasks.map(task => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { baselineStartDate, baselineEndDate, ...rest } = task;
      return rest;
    });
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { baselineSavedAt, ...restProject } = project;
    setProject({
      ...restProject,
      tasks: tasksWithoutBaseline,
    });
     toast({
        title: "Linha de Base Excluída",
        description: "A linha de base do projeto foi removida.",
        variant: "destructive"
    });
  };
  
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'subTasks' | 'changeHistory' | 'isCritical'>) => {
    let flatTasks = [...project.tasks];
    let updatedTaskData = { ...taskData };

    // Lógica de ajuste de data com base nas dependências
    if (updatedTaskData.dependencies && updatedTaskData.dependencies.length > 0) {
        const dependencyEndDates = updatedTaskData.dependencies
            .map(depId => flatTasks.find(t => t.id === depId))
            .filter((t): t is Task => !!t)
            .map(t => parseISO(t.plannedEndDate));
        
        if (dependencyEndDates.length > 0) {
            const latestDependencyEndDate = max(dependencyEndDates);
            const newStartDate = addDays(latestDependencyEndDate, 1);
            
            // Se a data de início planejada for anterior à nova data de início, ajuste-a
            if (parseISO(updatedTaskData.plannedStartDate) < newStartDate) {
                const duration = parseISO(updatedTaskData.plannedEndDate).getTime() - parseISO(updatedTaskData.plannedStartDate).getTime();
                updatedTaskData.plannedStartDate = newStartDate.toISOString();
                updatedTaskData.plannedEndDate = new Date(newStartDate.getTime() + duration).toISOString();
            }
        }
    }


    let newTasks: Task[];
    if (editingTask) {
        // Lógica de atualização
        newTasks = flatTasks.map(t => {
            if (t.id === editingTask.id) {
                const newChangeHistory = [...(t.changeHistory || [])];

                (Object.keys(updatedTaskData) as Array<keyof typeof updatedTaskData>).forEach(key => {
                    if (t[key] !== updatedTaskData[key]) {
                        newChangeHistory.push({
                            fieldChanged: key,
                            oldValue: String(t[key]),
                            newValue: String(updatedTaskData[key]),
                            user: 'Usuário',
                            timestamp: new Date().toISOString(),
                            justification: 'Atualização via formulário'
                        });
                    }
                });

                return { ...t, ...updatedTaskData, changeHistory: newChangeHistory };
            }
            return t;
        });
    } else {
        // Lógica de criação
        const newTask: Task = {
            ...updatedTaskData,
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
    let flatTasks = [...project.tasks];
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
    
    let newTasks = flatTasks.filter(t => !childIdsToDelete.has(t.id));
    // Remover a tarefa deletada das dependências de outras tarefas
    newTasks = newTasks.map(t => ({
      ...t,
      dependencies: t.dependencies.filter(depId => !childIdsToDelete.has(depId))
    }));

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
                 <TabsTrigger value="gantt">
                  <GanttChartSquare className="w-4 h-4 mr-2" />
                  Gantt
                </TabsTrigger>
                <TabsTrigger value="roadmap">
                  <Route className="w-4 h-4 mr-2" />
                  Roadmap
                </TabsTrigger>
                <TabsTrigger value="backlog">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Backlog
                </TabsTrigger>
                 <TabsTrigger value="graficos">
                    <PieChart className="w-4 h-4 mr-2" />
                    Gráficos
                </TabsTrigger>
                 <TabsTrigger value="ai_analysis">
                    <BrainCircuit className="w-4 h-4 mr-2" />
                    Análise IA
                </TabsTrigger>
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
            <TabsContent value="gantt">
              <GanttChart project={project} onSaveBaseline={handleSaveBaseline} onDeleteBaseline={handleDeleteBaseline} />
            </TabsContent>
             <TabsContent value="roadmap">
              <RoadmapView project={project} />
            </TabsContent>
             <TabsContent value="backlog">
              <BacklogView project={project} />
            </TabsContent>
             <TabsContent value="graficos">
              <ChartsTab project={project} />
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
