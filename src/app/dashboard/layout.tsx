// src/app/dashboard/layout.tsx
'use client';

import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { getProjects, getUsers } from '@/lib/supabase/service';
import { useEffect, useState } from 'react';
import type { Project, User } from '@/lib/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
       try {
        const userJson = sessionStorage.getItem('currentUser');
        if (!userJson) {
          // If no user, maybe redirect to login
          window.location.href = '/';
          return;
        }
        const user: User = JSON.parse(userJson);
        setCurrentUser(user);

        const projects = await getProjects();
        // In a real app, you'd filter projects based on user's team membership.
        // For now, we'll show all projects to any logged-in user.
        setUserProjects(projects);

       } catch (error) {
         console.error("Failed to fetch dashboard data:", error);
         // Handle error, maybe show a toast
       } finally {
        setLoading(false);
       }
    }
    fetchData();
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen bg-background">
        <aside className="w-64 flex-shrink-0 border-r bg-card p-4 flex flex-col justify-between" />
        <main className="flex-1 flex flex-col">{children}</main>
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
