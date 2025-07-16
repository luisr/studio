import { projects } from "@/lib/data";
import { notFound } from "next/navigation";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { TasksTable } from "@/components/dashboard/tasks-table";
import { CheckCircle, Clock, DollarSign, ListTodo, TrendingDown, TrendingUp, BarChart, AlertTriangle, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TaskFilters } from "@/components/dashboard/task-filters";

export default function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    notFound();
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  
  const getCompletedTasks = (tasks: typeof project.tasks) => tasks.filter(t => t.status === 'Concluído').length;

  return (
    <div className="flex flex-col h-full bg-background">
      <ProjectHeader project={project} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total de Atividades" value={project.tasks.length} icon={ListTodo} color="blue" />
          <KpiCard title="Atividades Concluídas" value={getCompletedTasks(project.tasks)} icon={CheckCircle} color="green" />
          <KpiCard title="Conclusão Geral" value={`${project.kpis['Progresso Total (%)']}%`} icon={BarChart} color="purple" />
          <KpiCard title="Custo Planejado" value={formatCurrency(project.plannedBudget)} icon={DollarSign} color="blue" />
          <KpiCard title="Custo Real" value={formatCurrency(project.actualCost)} icon={DollarSign} color="orange" />
          <KpiCard title="Desvio de Custo" value={formatCurrency(project.kpis['Variação de Custo (R$)'] as number)} icon={AlertTriangle} color="red" />
          <KpiCard title="SPI (Desempenho de Prazo)" value={project.kpis['Variação de Prazo (dias)']} icon={Clock} color="red" />
          <KpiCard title="CPI (Desempenho de Custo)" value={1.12} icon={Target} color="red" />
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
                 <TaskFilters />
                 <TasksTable tasks={project.tasks} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
