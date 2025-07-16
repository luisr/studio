import { projects } from '@/lib/data';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar projects={projects} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
