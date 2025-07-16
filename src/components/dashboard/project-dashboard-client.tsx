// src/components/dashboard/project-dashboard-client.tsx
'use client';

import { useState, useMemo, useEffect, useCallback, ChangeEvent } from "react";
import type { Project, Task, User } from "@/lib/types";
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
import Papa from "papaparse";
import { ImportTasksModal, TaskField } from "./import-tasks-modal";


const nestTasks = (tasks: Task[]): Task[] => {
    const taskMap: Map<string, Task & { subTasks: Task[] }> = new Map();
    
    tasks.forEach(task => {
        taskMap.set(task.id, { ...task, subTasks: [] });
    });

    const rootTasks: (Task & { subTasks: Task[] })[] = [];

    taskMap.forEach(task => {
        if (task.parentId && taskMap.has(task.parentId)) {
            const parent = taskMap.get(task.parentId);
            if (parent) {
                parent.subTasks.push(task);
            }
        } else {
            rootTasks.push(task);
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
  
  // State for import modal
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  
  const nestedTasks = useMemo(() => nestTasks(project.tasks), [project.tasks]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(nestedTasks);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setFilteredTasks(nestedTasks);
  }, [nestedTasks]);


  // Update project state if initial prop changes
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const handleTaskUpdate = useCallback((updatedTasks: Task[]) => {
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

    if (updatedTaskData.dependencies && updatedTaskData.dependencies.length > 0) {
        const dependencyEndDates = updatedTaskData.dependencies
            .map(depId => flatTasks.find(t => t.id === depId))
            .filter((t): t is Task => !!t)
            .map(t => parseISO(t.plannedEndDate));
        
        if (dependencyEndDates.length > 0) {
            const latestDependencyEndDate = max(dependencyEndDates);
            const newStartDate = addDays(latestDependencyEndDate, 1);
            
            if (parseISO(updatedTaskData.plannedStartDate) < newStartDate) {
                const duration = parseISO(updatedTaskData.plannedEndDate).getTime() - parseISO(updatedTaskData.plannedStartDate).getTime();
                updatedTaskData.plannedStartDate = newStartDate.toISOString();
                updatedTaskData.plannedEndDate = new Date(newStartDate.getTime() + duration).toISOString();
            }
        }
    }


    let newTasks: Task[];
    if (editingTask) {
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
    newTasks = newTasks.map(t => ({
      ...t,
      dependencies: t.dependencies.filter(depId => !childIdsToDelete.has(depId))
    }));

    handleTaskUpdate(newTasks);
  };
  
  const handleExportTasks = () => {
    const dataToExport = project.tasks.map(task => ({
      id: task.id,
      name: task.name,
      assignee_id: task.assignee.id,
      assignee_name: task.assignee.name,
      status: task.status,
      priority: task.priority || '',
      plannedStartDate: task.plannedStartDate,
      plannedEndDate: task.plannedEndDate,
      actualStartDate: task.actualStartDate || '',
      actualEndDate: task.actualEndDate || '',
      plannedHours: task.plannedHours,
      actualHours: task.actualHours,
      dependencies: task.dependencies.join(','),
      isCritical: task.isCritical,
      parentId: task.parentId || '',
      isMilestone: task.isMilestone || false,
      baselineStartDate: task.baselineStartDate || '',
      baselineEndDate: task.baselineEndDate || '',
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tarefas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

     toast({
        title: "Exportação Concluída",
        description: "O arquivo CSV com as tarefas foi baixado.",
    });
  };
  
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            if (results.meta.fields) {
                setCsvHeaders(results.meta.fields);
                setCsvData(results.data);
                setImportModalOpen(true);
            } else {
                 toast({
                    title: "Erro na Importação",
                    description: "Não foi possível ler os cabeçalhos do arquivo CSV.",
                    variant: "destructive"
                });
            }
        },
        error: (error) => {
            console.error("Error parsing CSV:", error);
            toast({
                title: "Erro na Importação",
                description: "Não foi possível ler o arquivo CSV. Verifique o formato.",
                variant: "destructive"
            });
        }
    });
    // Reset file input
    event.target.value = '';
  };
  
  const handleImportConfirm = (mapping: Record<string, TaskField>) => {
    const usersMap = new Map<string, User>(project.team.map(u => [u.id, u]));
    const usersByNameMap = new Map<string, User>(project.team.map(u => [u.name.toLowerCase(), u]));

    const newTasks: Task[] = csvData.map(row => {
        const task: Partial<Task> = {};
        
        for (const csvHeader in mapping) {
            const taskField = mapping[csvHeader];
            const value = row[csvHeader];

            if (value === null || value === undefined || value === '') continue;

            switch (taskField) {
                case 'id':
                case 'name':
                    task[taskField] = String(value);
                    break;
                case 'status':
                    if (['A Fazer', 'Em Andamento', 'Concluído', 'Bloqueado'].includes(value)) {
                       task.status = value as Task['status'];
                    }
                    break;
                case 'priority':
                    if (['Baixa', 'Média', 'Alta'].includes(value)) {
                        task.priority = value as Task['priority'];
                    }
                    break;
                case 'assignee':
                    const foundUser = usersByNameMap.get(String(value).toLowerCase()) || usersMap.get(String(value));
                    if (foundUser) task.assignee = foundUser;
                    break;
                case 'plannedStartDate':
                case 'plannedEndDate':
                case 'actualStartDate':
                case 'actualEndDate':
                    const date = parseISO(value);
                    if (!isNaN(date.getTime())) {
                        task[taskField] = date.toISOString();
                    }
                    break;
                case 'plannedHours':
                case 'actualHours':
                    const hours = parseFloat(value);
                    if (!isNaN(hours)) task[taskField] = hours;
                    break;
                case 'dependencies':
                    task.dependencies = String(value).split(',').map(s => s.trim()).filter(Boolean);
                    break;
                case 'parentId':
                    task.parentId = String(value);
                    break;
                case 'isMilestone':
                case 'isCritical':
                    task[taskField] = String(value).toLowerCase() === 'true';
                    break;
            }
        }
        
        // Add default values for required fields if they are missing
        if (!task.id) task.id = `task-${Date.now()}-${Math.random()}`;
        if (!task.name) task.name = "Tarefa importada sem nome";
        if (!task.assignee) task.assignee = project.team[0];
        if (!task.status) task.status = 'A Fazer';
        if (!task.plannedStartDate) task.plannedStartDate = new Date().toISOString();
        if (!task.plannedEndDate) task.plannedEndDate = new Date().toISOString();
        if (task.plannedHours === undefined) task.plannedHours = 0;
        if (task.actualHours === undefined) task.actualHours = 0;
        if (!task.dependencies) task.dependencies = [];
        if (!task.changeHistory) task.changeHistory = [];

        return task as Task;
    });

    const allTasks = [...project.tasks, ...newTasks];
    handleTaskUpdate(allTasks);

    toast({
        title: "Importação Concluída",
        description: `${newTasks.length} tarefas foram importadas com sucesso.`,
    });

    setImportModalOpen(false);
    setCsvData([]);
    setCsvHeaders([]);
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
        <ProjectHeader 
          project={project} 
          onNewTaskClick={handleCreateTask} 
          onImport={handleFileSelect}
          onExport={handleExportTasks}
        />
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
      <ImportTasksModal
        isOpen={isImportModalOpen}
        onOpenChange={setImportModalOpen}
        csvHeaders={csvHeaders}
        onConfirm={handleImportConfirm}
      />
    </>
  );
}
