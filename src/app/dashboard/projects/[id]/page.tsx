// src/app/dashboard/projects/[id]/page.tsx
'use client';

import type { Project } from "@/lib/types";
import { notFound } from "next/navigation";
import { ProjectDashboardClient } from "@/components/dashboard/project-dashboard-client";
import { useEffect, useState } from "react";
import { getProject } from "@/lib/supabase/service";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDashboardPage({ params }: { params: { id:string } }) {
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const fetchProject = async () => {
        setLoading(true);
        const fetchedProject = await getProject(params.id);
        setProject(fetchedProject);
        setLoading(false);
      };
      fetchProject();
    }
  }, [params.id]);


  if (loading) {
     return (
      <div className="flex flex-col h-full bg-background">
        <div className="p-6 border-b">
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex-1 p-8 space-y-6">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
           </div>
           <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  return <ProjectDashboardClient initialProject={project} />;
}
