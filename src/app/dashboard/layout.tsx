// src/app/dashboard/layout.tsx
'use client';

import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { getProjects, getUsers } from '@/lib/supabase/service';
import { useEffect, useState } from 'react';
import type { Project, User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, loading: authLoading } = useAuth();

  useEffect(() => {
    async function fetchData() {
      if (authLoading) return;
      
      if (!currentUser) {
        window.location.href = '/';
        return;
      }
      
      setLoading(true);
       try {

        const projects = await getProjects();
        setUserProjects(projects);

       } catch (error) {
         console.error("Failed to fetch dashboard data:", error);
         // Handle error, maybe show a toast
       } finally {
        setLoading(false);
       }
    }
    fetchData();
  }, [currentUser, authLoading]);

  if (authLoading || loading || !currentUser) {
    return (
      <div className="flex min-h-screen bg-background">
        <aside className="w-64 flex-shrink-0 border-r bg-card p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </aside>
        <main className="flex-1 flex flex-col">
          <div className="p-6">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar user={currentUser} projects={userProjects} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
