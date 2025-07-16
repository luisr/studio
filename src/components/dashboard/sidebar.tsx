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
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { projects } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white p-2 bg-primary rounded-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.95-3.38 2.5 2.5 0 0 1 1.22-3.63 2.5 2.5 0 0 1 3.53-2.62 2.5 2.5 0 0 1 3.16-3.33"/>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.95-3.38 2.5 2.5 0 0 0-1.22-3.63 2.5 2.5 0 0 0-3.53-2.62 2.5 2.5 0 0 0-3.16-3.33"/>
    </svg>
)


export function DashboardSidebar() {
  const pathname = usePathname();
  // Placeholder for the current user. In a real app, this would come from an auth context.
  const currentUser = projects[0].manager;

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
                         pathname.startsWith(link.href) && link.href !== '/dashboard' || pathname === link.href
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-left h-auto px-2 py-2">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                            <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
                            <p className="text-xs text-muted-foreground">{currentUser.role || "Membro"}</p>
                        </div>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {/* In a real app, this would be the user's email */}
                            exemplo@email.com
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Editar Perfil</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
