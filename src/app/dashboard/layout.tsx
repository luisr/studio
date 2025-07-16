import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { projects } from '@/lib/data';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // In a real app, this would be based on the authenticated user
  const userProjects = projects;
  const currentUser = projects[0].manager;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar user={currentUser} projects={userProjects} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
