// src/components/dashboard/project-dashboard-client.tsx
'use client';

import { useState, useMemo, useEffect, useCallback, ChangeEvent } from "react";
import type { Project, Task, User, CustomFieldDefinition, ProjectConfiguration, Attachment, ProjectRole } from "@/lib/types";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { TasksTable } from "@/components/dashboard/tasks-table";
import { CheckCircle, Clock, DollarSign, ListTodo, BarChart, AlertTriangle, Target, BrainCircuit, PieChart, GanttChartSquare, Layers, Route, ClipboardList, Trello, Calendar, Network } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TaskFilters } from "@/components/dashboard/task-filters";
import { TaskForm } from "@/components/dashboard/task-form";
import { AiAnalysisTab } from "./ai-analysis-tab";
import { ChartsTab } from "./charts-tab";
import { GanttChart } from "./gantt-chart";
import { addDays, max, parseISO, differenceInDays } from "date-fns";
import { RoadmapView } from "./roadmap-view";
import { BacklogView } from "./backlog-view";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { ImportTasksModal, Mapping, TaskField } from "./import-tasks-modal";
import { ProjectSettingsModal } from "./project-settings-modal";
import { ProjectGalleryModal } from "./project-gallery-modal";
import { KanbanView } from "./KanbanView";
import type { LucideIcon } from "lucide-react";
import { CalendarView } from "./calendar-view";
import { ProjectForm } from "./project-form";
import { users as allUsers } from "@/lib/data";


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

const calculateTotalProgress = (tasks: Task[], config: ProjectConfiguration): number => {
    if (!tasks || tasks.length === 0) return 0;
    
    const rootTasks = nestTasks(tasks);

    const calculateWeightedProgress = (taskNode: Task): { progress: number, totalHours: number } => {
        const subTasks = (taskNode as any).subTasks;
        if (!subTasks || subTasks.length === 0) {
            const completedStatus = config.statuses.find(s => s.isCompleted);
            const progress = (completedStatus && taskNode.status === completedStatus.name) ? 100 : 0;
            return { progress: progress * (taskNode.plannedHours || 1), totalHours: taskNode.plannedHours || 1 };
        }

        const subTasksResult = subTasks.reduce((acc: any, subTask: any) => {
            const result = calculateWeightedProgress(subTask);
            acc.progress += result.progress;
            acc.totalHours += result.totalHours;
            return acc;
        }, { progress: 0, totalHours: 0 });
        
        return subTasksResult;
    }

    let totalWeightedProgress = 0;
    let totalHours = 0;

    for (const task of rootTasks) {
        const { progress, totalHours: taskHours } = calculateWeightedProgress(task);
        totalWeightedProgress += progress;
        totalHours += taskHours;
    }
  
    if (totalHours === 0) return 0;

    return Math.round(totalWeightedProgress / totalHours);
}

const iconMap: Record<string, LucideIcon> = {
    BarChart, Clock, DollarSign, ListTodo, Target, AlertTriangle, CheckCircle
};

export function ProjectDashboardClient({ initialProject }: { initialProject: Project }) {
  const [project, setProject] = useState<Project>(initialProject);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  
  // State for import modal
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  
  const nestedTasks = useMemo(() => nestTasks(project.tasks), [project.tasks]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(nestedTasks);

  const allAttachments = useMemo(() => {
    return project.tasks.flatMap(task => task.attachments || []);
  }, [project.tasks]);

  // --- Start of Permissions Logic ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<ProjectRole | null>(null);

  useEffect(() => {
    // In a real app, you would get the current user from an auth context.
    // For now, we'll simulate it by picking the first user from the project's team.
    const user = project.team[0]?.user;
    if (user) {
      setCurrentUser(user);
      const member = project.team.find(m => m.user.id === user.id);
      setCurrentUserRole(member ? member.role : null);
    }
  }, [project.team]);

  const canEditProject = currentUserRole === 'Manager';
  const canEditTasks = currentUserRole === 'Manager' || currentUserRole === 'Editor';
  // --- End of Permissions Logic ---

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
     const newActualCost = updatedTasks.reduce((sum, t) => sum + (t.actualHours * 50), 0);
    setProject(prevProject => ({ 
      ...prevProject, 
      tasks: updatedTasks,
      actualCost: newActualCost,
    }));
  }, []);

  const handleProjectUpdate = (updatedProjectData: Omit<Project, 'id' | 'kpis' | 'actualCost' | 'configuration' | 'tasks'>) => {
    setProject(prev => ({
        ...prev,
        ...updatedProjectData,
    }));
    toast({
        title: "Projeto Atualizado",
        description: "Os detalhes do projeto foram salvos com sucesso.",
    });
    setIsProjectFormOpen(false);
  }
  
  const handleConfigUpdate = (newConfig: ProjectConfiguration) => {
    setProject(prevProject => ({
      ...prevProject,
      configuration: newConfig
    }));
     toast({
        title: "Configurações Salvas",
        description: "As configurações do projeto foram atualizadas.",
    });
  };

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
  
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'changeHistory' | 'isCritical'>, justification: string) => {
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
                const duration = differenceInDays(parseISO(updatedTaskData.plannedEndDate), parseISO(updatedTaskData.plannedStartDate));
                updatedTaskData.plannedStartDate = newStartDate.toISOString();
                updatedTaskData.plannedEndDate = addDays(newStartDate, duration).toISOString();
            }
        }
    }

    let newTasks: Task[];
    if (editingTask) {
        newTasks = flatTasks.map(t => {
            if (t.id === editingTask.id) {
                const newChangeHistory = [...(t.changeHistory || [])];
                const originalTask = t;

                // Define which fields are critical for justification
                const criticalFields: (keyof Task)[] = ['name', 'status', 'priority', 'plannedStartDate', 'plannedEndDate', 'plannedHours'];

                criticalFields.forEach(key => {
                     if (JSON.stringify(originalTask[key]) !== JSON.stringify(updatedTaskData[key])) {
                        newChangeHistory.push({
                            fieldChanged: key,
                            oldValue: String(originalTask[key]),
                            newValue: String(updatedTaskData[key]),
                            user: currentUser?.name || 'Sistema',
                            timestamp: new Date().toISOString(),
                            justification: justification,
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
            changeHistory: [],
            isCritical: false, 
        };
        newTasks = [...flatTasks, newTask];
    }

    handleTaskUpdate(newTasks);
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleTaskStatusChange = useCallback((taskId: string, newStatus: string) => {
    setProject(prevProject => {
        const updatedTasks = prevProject.tasks.map(task => {
            if (task.id === taskId) {
                const oldStatus = task.status;
                if (oldStatus === newStatus) return task;

                const newChangeHistory = [...(task.changeHistory || []), {
                    fieldChanged: 'status',
                    oldValue: oldStatus,
                    newValue: newStatus,
                    user: currentUser?.name || 'Sistema',
                    timestamp: new Date().toISOString(),
                    justification: 'Status alterado no quadro Kanban'
                }];

                return { ...task, status: newStatus, changeHistory: newChangeHistory };
            }
            return task;
        });

        return { ...prevProject, tasks: updatedTasks };
    });
  }, [currentUser]);
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };
  
  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
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

  const handleBulkAction = (action: 'delete' | 'duplicate' | 'move', taskIds: Set<string>, newParentId?: string | null) => {
    let currentTasks = [...project.tasks];

    if (action === 'delete') {
      const allIdsToDelete = new Set(taskIds);
      taskIds.forEach(id => {
          const getChildIds = (parentId: string) => {
              currentTasks.forEach(t => {
                  if (t.parentId === parentId) {
                      allIdsToDelete.add(t.id);
                      getChildIds(t.id);
                  }
              });
          };
          getChildIds(id);
      });
      
      let newTasks = currentTasks.filter(t => !allIdsToDelete.has(t.id));
      newTasks = newTasks.map(t => ({
        ...t,
        dependencies: t.dependencies.filter(depId => !allIdsToDelete.has(depId))
      }));
      handleTaskUpdate(newTasks);
      toast({ title: `${allIdsToDelete.size} tarefas foram excluídas.`});
    }

    if (action === 'duplicate') {
       const newTasks: Task[] = [];
       const idMapping = new Map<string, string>();

       taskIds.forEach(id => {
            const originalTask = currentTasks.find(t => t.id === id);
            if (originalTask && !originalTask.parentId) { // Only duplicate root selected tasks for simplicity
                const newId = `task-${Date.now()}-${Math.random()}`;
                idMapping.set(id, newId);
                newTasks.push({
                    ...originalTask,
                    id: newId,
                    name: `${originalTask.name} (Cópia)`,
                    dependencies: [], // Dependencies are complex to duplicate correctly, so we clear them
                });
            }
       });
       handleTaskUpdate([...currentTasks, ...newTasks]);
       toast({ title: `${newTasks.length} tarefas foram duplicadas.`});
    }

    if (action === 'move') {
       const newTasks = currentTasks.map(task => {
           if (taskIds.has(task.id)) {
               return { ...task, parentId: newParentId === "root" ? null : newParentId };
           }
           return task;
       });
       handleTaskUpdate(newTasks);
       toast({ title: `${taskIds.size} tarefas foram movidas.`});
    }
  };
  
  const handleExportTasks = () => {
    const dataToExport = project.tasks.map(task => {
      const customFieldsData: {[key: string]: any} = {};
      project.configuration.customFieldDefinitions?.forEach(def => {
          customFieldsData[def.name] = task.customFields?.[def.id] ?? '';
      });

      return {
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
        ...customFieldsData
      };
    });

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
  
  const handleImportConfirm = (mapping: Mapping) => {
    const usersInProject = project.team.map(tm => tm.user);
    const usersMap = new Map<string, User>(usersInProject.map(u => [u.id, u]));
    const usersByNameMap = new Map<string, User>(usersInProject.map(u => [u.name.toLowerCase(), u]));

    const newCustomFieldDefs: CustomFieldDefinition[] = [...(project.configuration.customFieldDefinitions || [])];
    const newCustomFieldMap = new Map<string, string>(); // csvHeader -> customFieldId

    Object.entries(mapping).forEach(([csvHeader, mapInfo]) => {
      if (mapInfo.type === 'new_field' && mapInfo.newFieldName) {
        const fieldId = mapInfo.newFieldName.toLowerCase().replace(/\s+/g, '_');
        if (!newCustomFieldDefs.some(def => def.id === fieldId)) {
          newCustomFieldDefs.push({ id: fieldId, name: mapInfo.newFieldName, type: 'text' });
        }
        newCustomFieldMap.set(csvHeader, fieldId);
      }
    });

    const newTasks: Task[] = csvData.map(row => {
        const task: Partial<Task> & { customFields: Record<string, any> } = { customFields: {} };
        
        for (const csvHeader in mapping) {
            const mapInfo = mapping[csvHeader];
            const taskField = mapInfo.type;
            const value = row[csvHeader];

            if (value === null || value === undefined || value === '') continue;

            if (taskField === 'new_field') {
              const fieldId = newCustomFieldMap.get(csvHeader);
              if (fieldId) {
                task.customFields[fieldId] = value;
              }
              continue;
            }

            if (taskField === 'ignore') continue;

            switch (taskField as TaskField) {
                case 'id':
                case 'name':
                    task[taskField] = String(value);
                    break;
                case 'status':
                    task.status = String(value);
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
                    try {
                      const date = new Date(value);
                      if (!isNaN(date.getTime())) {
                        task[taskField] = date.toISOString();
                      }
                    } catch(e) { /* ignore invalid date */ }
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
        if (!task.assignee) task.assignee = project.team[0].user;
        if (!task.status) task.status = project.configuration.statuses.find(s => s.isDefault)?.name || 'A Fazer';
        if (!task.plannedStartDate) task.plannedStartDate = new Date().toISOString();
        if (!task.plannedEndDate) task.plannedEndDate = new Date().toISOString();
        if (task.plannedHours === undefined) task.plannedHours = 0;
        if (task.actualHours === undefined) task.actualHours = 0;
        if (!task.dependencies) task.dependencies = [];
        if (!task.changeHistory) task.changeHistory = [];

        return task as Task;
    }).filter(t => t.name !== "Tarefa importada sem nome"); // Filter out potentially empty rows

    const allTasks = [...project.tasks, ...newTasks];
    
    // Update the state once with all new data
    setProject(prev => {
      const newActualCost = allTasks.reduce((sum, t) => sum + (t.actualHours * 50), 0); // Assuming a fixed rate for simplicity
      return { 
        ...prev, 
        tasks: allTasks,
        configuration: { ...prev.configuration, customFieldDefinitions: newCustomFieldDefs },
        actualCost: newActualCost 
      };
    });

    toast({
        title: "Importação Concluída",
        description: `${newTasks.length} tarefas foram importadas com sucesso.`,
    });

    setImportModalOpen(false);
    setCsvData([]);
    setCsvHeaders([]);
  };

  const handleCriticalPathAnalyzed = (criticalPathIds: string[]) => {
    setProject(prevProject => ({
      ...prevProject,
      criticalPath: criticalPathIds,
    }));
    toast({
      title: 'Caminho Crítico Analisado',
      description: 'As tarefas críticas foram destacadas no Gráfico de Gantt.',
    });
  };

  const formatCurrency = useCallback((value: number) => {
    if(!isClient) return 'R$ ...';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }, [isClient]);
  
  const allKpis = useMemo(() => {
    const { tasks, configuration, plannedBudget, actualCost } = project;
    
    // Default KPIs
    const completedStatus = configuration.statuses.find(s => s.isCompleted);
    const completedTasks = completedStatus ? tasks.filter(t => t.status === completedStatus.name).length : 0;
    const overallProgress = calculateTotalProgress(tasks, configuration);
    const totalPlannedHours = tasks.reduce((sum, t) => sum + t.plannedHours, 0);
    const totalActualHours = tasks.reduce((sum, t) => sum + t.actualHours, 0);
    const earnedValue = (overallProgress / 100) * totalPlannedHours;
    const spi = totalPlannedHours > 0 && earnedValue > 0 ? (earnedValue / totalPlannedHours) : 1;
    const cpi = totalActualHours > 0 && earnedValue > 0 ? (earnedValue / totalActualHours) : 1;

    const defaultKpis = {
      totalTasks: { title: 'Total de Atividades', value: tasks.length, icon: ListTodo, color: 'blue' },
      completedTasks: { title: 'Atividades Concluídas', value: completedTasks, icon: CheckCircle, color: 'green' },
      overallProgress: { title: 'Conclusão Geral', value: `${overallProgress}%`, icon: BarChart, color: 'purple' },
      plannedBudget: { title: 'Custo Planejado', value: formatCurrency(plannedBudget), icon: DollarSign, color: 'blue' },
      actualCost: { title: 'Custo Real', value: formatCurrency(actualCost), icon: DollarSign, color: 'orange' },
      costVariance: { title: 'Desvio de Custo', value: formatCurrency(plannedBudget - actualCost), icon: AlertTriangle, color: (plannedBudget - actualCost) < 0 ? 'red' : 'green' },
      spi: { title: 'SPI (Prazo)', value: spi.toFixed(2), icon: Clock, color: spi < 1 ? 'red' : 'green' },
      cpi: { title: 'CPI (Custo)', value: cpi.toFixed(2), icon: Target, color: cpi < 1 ? 'red' : 'green' },
    };

    // Custom KPIs
    const customKpisCalculated = (configuration.customKpis || []).map(kpiDef => {
      let value: number | string = 0;
      const relevantTasks = tasks.filter(t => typeof (t as any)[kpiDef.field] === 'number');

      if (relevantTasks.length > 0) {
        switch (kpiDef.aggregation) {
          case 'sum':
            value = relevantTasks.reduce((acc, t) => acc + ((t as any)[kpiDef.field] as number), 0);
            break;
          case 'average':
            value = relevantTasks.reduce((acc, t) => acc + ((t as any)[kpiDef.field] as number), 0) / relevantTasks.length;
            value = value.toFixed(2);
            break;
          case 'count':
            value = relevantTasks.length;
            break;
        }
      }
      return {
        id: kpiDef.id,
        title: kpiDef.name,
        value: value,
        icon: iconMap[kpiDef.icon] || BarChart,
        color: 'blue' // Default color for custom KPIs for now
      };
    });
    
    // Filter default KPIs based on visibility settings
    const visibleDefaultKpis = Object.entries(defaultKpis)
      .filter(([key]) => configuration.visibleKpis[key])
      .map(([key, kpi]) => ({ id: key, ...kpi }));

    return [...visibleDefaultKpis, ...customKpisCalculated];
  }, [project, formatCurrency]);

  if (!isClient) {
    return <div className="flex items-center justify-center h-screen"><p>Carregando dashboard...</p></div>; 
  }
  
  return (
    <>
      <div className="flex flex-col h-full bg-background">
        <ProjectHeader 
          project={project} 
          canEditProject={canEditProject}
          canEditTasks={canEditTasks}
          onNewTaskClick={handleCreateTask}
          onEditProjectClick={() => setIsProjectFormOpen(true)}
          onImport={handleFileSelect}
          onExport={handleExportTasks}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onGalleryClick={() => setIsGalleryOpen(true)}
        />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {allKpis.map((kpi) => (
                <KpiCard key={kpi.id} title={kpi.title} value={kpi.value} icon={kpi.icon} color={kpi.color as any} />
            ))}
          </div>
          
          <Tabs defaultValue="tabela">
            <div className="flex justify-between items-end">
              <TabsList>
                <TabsTrigger value="tabela">Tabela</TabsTrigger>
                <TabsTrigger value="kanban">
                  <Trello className="w-4 h-4 mr-2" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="calendario">
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendário
                </TabsTrigger>
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
                <TaskFilters project={project} onFilterChange={setFilteredTasks} />
                <CardContent className="p-0">
                  <TasksTable 
                    tasks={filteredTasks} 
                    project={project}
                    onTasksChange={handleTaskUpdate} 
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onBulkAction={handleBulkAction}
                    canEditTasks={canEditTasks}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="kanban">
              <KanbanView project={project} onTaskStatusChange={handleTaskStatusChange} />
            </TabsContent>
            <TabsContent value="calendario">
              <CalendarView project={project} onEditTask={handleEditTask} />
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
              <AiAnalysisTab project={project} onCriticalPathAnalyzed={handleCriticalPathAnalyzed} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <TaskForm 
        isOpen={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        onSave={handleSaveTask}
        task={editingTask}
        project={project}
      />
       <ProjectForm 
        isOpen={isProjectFormOpen}
        onOpenChange={setIsProjectFormOpen}
        onSave={handleProjectUpdate}
        project={project}
        users={allUsers}
      />
      <ImportTasksModal
        isOpen={isImportModalOpen}
        onOpenChange={setImportModalOpen}
        csvHeaders={csvHeaders}
        onConfirm={handleImportConfirm}
      />
      <ProjectSettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        projectConfiguration={project.configuration}
        onSave={handleConfigUpdate}
      />
      <ProjectGalleryModal
        isOpen={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        attachments={allAttachments}
       />
    </>
  );
}
