import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { UserCircle } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 flex flex-col">
         <header className="flex h-16 items-center justify-end border-b bg-card px-6">
            <div className="flex items-center gap-2">
              <UserCircle className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm">
                <div>Usuário</div>
                <div className="text-muted-foreground">Bem-vindo(a)!</div>
              </div>
            </div>
          </header>
        {children}
      </main>
    </div>
  )
}
