// src/app/dashboard/projects/page.tsx
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

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreateProject = (projectData: Omit<Project, 'id' | 'kpis' | 'actualCost' | 'configuration'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      actualCost: 0,
      tasks: [],
      kpis: {},
      configuration: defaultConfiguration, // Use a default configuration
    };
    setProjects(prevProjects => [...prevProjects, newProject]);
    setIsFormOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
         <div>
          <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">Selecione um projeto para ver seus detalhes.</p>
        </div>
         <Button onClick={() => setIsFormOpen(true)}>Novo Projeto</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card key={project.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2 h-10">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
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
                <div>
                  <h4 className="text-sm font-semibold mb-1">Progresso</h4>
                   <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{project.tasks.length}</span> Tarefas
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Link href={`/dashboard/projects/${project.id}`}>
                  <Button className="w-full">Acessar Painel</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
        <ProjectForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSave={handleCreateProject}
          users={users}
        />
    </div>
  );
}
