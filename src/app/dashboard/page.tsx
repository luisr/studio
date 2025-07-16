// src/app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { projects as initialProjects, users } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectForm } from '@/components/dashboard/project-form';
import type { Project, TeamMember } from '@/lib/types';
import { defaultConfiguration } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { PlusCircle } from 'lucide-react';

const calculateProgress = (project: Project): number => {
    if (project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(t => t.status === 'Concluído').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
}

// Em um app real, este seria o usuário autenticado.
const currentUser = users.find(u => u.role === 'Admin');

export default function DashboardProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreateProject = (projectData: Omit<Project, 'id' | 'kpis' | 'actualCost' | 'configuration'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      actualCost: 0,
      tasks: [],
      kpis: {},
      configuration: defaultConfiguration,
    };
    setProjects(prevProjects => [...prevProjects, newProject]);
    setIsFormOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
         <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Projetos</h1>
          <p className="text-muted-foreground">Selecione um projeto para ver seus detalhes ou crie um novo.</p>
        </div>
         {currentUser?.role === 'Admin' && (
            <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle />
                Novo Projeto
            </Button>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const progress = calculateProgress(project);
            return (
                <Card key={project.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2 h-10">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="text-sm font-semibold">Progresso</h4>
                            <span className="text-sm font-bold text-primary">{progress}%</span>
                        </div>
                        <Progress value={progress} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Equipe</h4>
                        <div className="flex -space-x-2 overflow-hidden">
                            {project.team.slice(0, 5).map((member: TeamMember) => (
                                <Avatar key={member.user.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                <AvatarImage src={member.user.avatar} alt={member.user.name} />
                                <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            ))}
                            {project.team.length > 5 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                                <span className="text-xs font-medium">+{project.team.length - 5}</span>
                            </div>
                            )}
                        </div>
                    </div>
                </CardContent>
                <div className="p-6 pt-0">
                    <Link href={`/dashboard/projects/${project.id}`} passHref>
                        <Button className="w-full">Acessar Painel</Button>
                    </Link>
                </div>
                </Card>
            )
          })}
        </div>
        
        {isFormOpen && (
            <ProjectForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleCreateProject}
            users={users}
            />
        )}
    </div>
  );
}
