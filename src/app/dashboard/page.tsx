// src/app/dashboard/page.tsx
import { projects } from "@/lib/data";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TrendingUp, Activity, CheckCircle, ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardMacroPage() {
  const totalProjects = projects.length;
  const allTasks = projects.flatMap(p => p.tasks);
  const totalTasks = allTasks.length;
  const pendingTasks = allTasks.filter(t => t.status !== 'Concluído').length;
  const completedTasks = totalTasks - pendingTasks;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Macro</h1>
          <p className="text-muted-foreground">Visão geral de todos os seus projetos.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Projetos Ativos" value={totalProjects} icon={TrendingUp} color="blue" />
        <KpiCard title="Total de Tarefas" value={totalTasks} icon={ListTodo} color="purple" />
        <KpiCard title="Tarefas Pendentes" value={pendingTasks} icon={Activity} color="orange" />
        <KpiCard title="Tarefas Concluídas" value={completedTasks} icon={CheckCircle} color="green" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Projetos</CardTitle>
          <CardDescription>Acompanhe o progresso de cada projeto individualmente.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{project.tasks.length}</span> Tarefas Totais
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{project.team.length}</span> Membros na Equipe
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Link href={`/dashboard/projects/${project.id}`}>
                  <Button className="w-full">Ver Detalhes</Button>
                </Link>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
