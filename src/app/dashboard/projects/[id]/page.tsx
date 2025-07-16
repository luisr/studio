// src/app/dashboard/projects/[id]/page.tsx
import type { Project } from "@/lib/types";
import { notFound } from "next/navigation";
import { projects } from "@/lib/data";
import { ProjectDashboardClient } from "@/components/dashboard/project-dashboard-client";

const getProject = (id: string): Project | undefined => {
  return projects.find((p) => p.id === id);
};

export default function ProjectDashboardPage({ params }: { params: { id:string } }) {
  const project = getProject(params.id);

  if (!project) {
    notFound();
  }

  return <ProjectDashboardClient initialProject={project} />;
}
