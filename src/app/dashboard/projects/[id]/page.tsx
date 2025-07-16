import { projects } from "@/lib/data";
import { notFound } from "next/navigation";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { TasksTable } from "@/components/dashboard/tasks-table";
import { AiAnalytics } from "@/components/dashboard/ai-analytics";
import { TrendingDown, TrendingUp, DollarSign, ListTodo } from "lucide-react";

export default function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    notFound();
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader project={project} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 bg-muted/30">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Variação de Prazo"
            value={`${project.kpis['Variação de Prazo (dias)']} dias`}
            icon={project.kpis['Variação de Prazo (dias)'] > 0 ? TrendingDown : TrendingUp}
            description={project.kpis['Variação de Prazo (dias)'] > 0 ? "Atrasado" : "Adiantado ou no prazo"}
            className={project.kpis['Variação de Prazo (dias)'] > 0 ? "border-destructive/50" : "border-green-500/50"}
          />
          <KpiCard
            title="Variação de Custo"
            value={formatCurrency(project.kpis['Variação de Custo (R$)'] as number)}
            icon={DollarSign}
            description={project.kpis['Variação de Custo (R$)'] > 0 ? "Acima do orçamento" : "Dentro do orçamento"}
             className={project.kpis['Variação de Custo (R$)'] < 0 ? "border-destructive/50" : "border-green-500/50"}
          />
          <KpiCard
            title="Progresso Total"
            value={`${project.kpis['Progresso Total (%)']}%`}
            icon={ListTodo}
            description="Percentual de tarefas concluídas"
          />
          <KpiCard
            title="Tarefas Críticas Atrasadas"
            value={project.kpis['Tarefas Críticas Atrasadas']}
            icon={TrendingDown}
            description="Tarefas no caminho crítico com atraso"
          />
        </div>
        
        <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <TasksTable tasks={project.tasks} />
            </div>
            <div className="lg:col-span-2">
                <AiAnalytics project={project} />
            </div>
        </div>

      </div>
    </div>
  );
}
