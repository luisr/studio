import Link from "next/link";
import { projects } from "@/lib/data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPortfolioPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio de Projetos</h1>
        <p className="text-muted-foreground">Uma visão geral de todos os projetos em andamento.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block">
            <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Progresso</span>
                      <span className="text-sm font-bold text-primary">{project.kpis['Progresso Total (%)']}%</span>
                    </div>
                    <Progress value={project.kpis['Progresso Total (%)'] as number} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Prazo</span>
                    </div>
                    <span>{new Date(project.plannedEndDate).toLocaleDateString()}</span>
                  </div>
                   <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Gerente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${project.manager.id}`} />
                        <AvatarFallback>{project.manager.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{project.manager.name}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                 {project.kpis['Variação de Prazo (dias)'] > 0 ? (
                    <Badge variant="destructive">Atrasado</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">No Prazo</Badge>
                  )}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
