// src/app/dashboard/projects/[id]/page.tsx
import { ProjectDashboardClient } from '@/components/dashboard/project-dashboard-client';
import { projects } from '@/lib/data';
import type { Project } from '@/lib/types';
import { notFound } from 'next/navigation';

// Esta função simula a busca de dados de um banco de dados
// Em uma aplicação real, você faria uma chamada assíncrona aqui.
const getProject = (id: string): Project | undefined => {
  return projects.find((p) => p.id === id);
};

export default function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const project = getProject(params.id);

  if (!project) {
    notFound();
  }

  // Passamos o projeto para um Componente de Cliente que cuidará da interatividade.
  // Isso permite que a maior parte da nossa página seja renderizada no servidor.
  return <ProjectDashboardClient initialProject={project} />;
}
