// src/components/dashboard/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
  CheckSquare,
  FileText,
  Users,
  TrendingUp,
  Activity,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { projects } from "@/lib/data";

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white p-2 bg-primary rounded-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.95-3.38 2.5 2.5 0 0 1 1.22-3.63 2.5 2.5 0 0 1 3.53-2.62 2.5 2.5 0 0 1 3.16-3.33"/>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.95-3.38 2.5 2.5 0 0 0-1.22-3.63 2.5 2.5 0 0 0-3.53-2.62 2.5 2.5 0 0 0-3.16-3.33"/>
    </svg>
)


export function DashboardSidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard Macro", icon: LayoutDashboard },
    { href: "/dashboard/projects", label: "Projetos", icon: Folder },
    { href: "/dashboard/tasks", label: "Tarefas", icon: CheckSquare },
    { href: "/dashboard/reports", label: "Relatórios", icon: FileText },
    { href: "/dashboard/users", label: "Usuários", icon: Users },
  ];

  const totalProjects = projects.length;
  const pendingTasks = projects.flatMap(p => p.tasks).filter(t => t.status !== 'Concluído').length;
  // This is just a placeholder value
  const aiAnalyses = 3;

   const insightLinks = [
    { label: "Projetos Ativos", icon: TrendingUp, value: totalProjects },
    { label: "Tarefas Pendentes", icon: Activity, value: pendingTasks },
    { label: "Análises IA", icon: BrainCircuit, value: aiAnalyses },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 pb-6 px-2">
           <BrainIcon />
          <div>
            <h1 className="text-xl font-bold text-foreground">To Sabendo</h1>
            <p className="text-xs text-muted-foreground">Gestão Inteligente de Projetos</p>
          </div>
        </div>

        <div className="space-y-4">
            <div>
                <h2 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Navegação Principal</h2>
                <nav className="space-y-1">
                    {navLinks.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                         pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard')
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                    >
                        <link.icon className="w-4 h-4" />
                        <span>{link.label}</span>
                    </Link>
                    ))}
                </nav>
            </div>

            <div>
                <h2 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Análises e Insights</h2>
                <div className="space-y-1">
                 {insightLinks.map((link) => (
                    <div
                        key={link.label}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground"
                    >
                        <div className="flex items-center gap-3">
                            <link.icon className="w-4 h-4" />
                            <span>{link.label}</span>
                        </div>
                        <span className="font-bold text-foreground">{link.value}</span>
                    </div>
                 ))}
                </div>
            </div>
        </div>
      </div>

      <div className="pt-6">
        <Separator className="mb-4"/>
        <div className="flex items-center gap-3 px-2">
            <Avatar>
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
                <p className="text-sm font-semibold text-foreground">Usuário</p>
                <p className="text-xs text-muted-foreground">Gestão de Projetos</p>
            </div>
        </div>
      </div>
    </aside>
  );
}
