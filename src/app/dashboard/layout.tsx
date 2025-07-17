// src/app/dashboard/layout.tsx
'use client';

import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { getProjects, getUsers } from '@/lib/firebase/service';
import { useEffect, useState } from 'react';
import type { Project, User } from '@/lib/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // In a real app, this would be based on the authenticated user
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [projects, users] = await Promise.all([getProjects(), getUsers()]);
      setUserProjects(projects);
      // Simulate getting the current user (e.g., the first user)
      setCurrentUser(users[0] || null);
      setLoading(false);
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
