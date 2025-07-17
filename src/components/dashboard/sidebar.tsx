// src/components/dashboard/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Folder,
  CheckSquare,
  FileText,
  Users,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Shield,
  LayoutDashboard,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import type { User, Project } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";


const Logo = () => (
    <div className="flex items-center justify-center gap-2 text-primary">
        <BrainCircuit className="h-8 w-8" />
        <span className="text-xl font-bold tracking-tight">Tô de Olho!</span>
    </div>
);

interface DashboardSidebarProps {
  user: User;
  projects: Project[];
}

export function DashboardSidebar({ user, projects }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  const mainLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const analysisLinks = [
    { href: "/dashboard/tasks", label: "Todas as Tarefas", icon: CheckSquare },
    { href: "/dashboard/reports", label: "Relatórios", icon: FileText },
  ];
  
  const managementLinks = [
      { href: "/dashboard/users", label: "Usuários", icon: Users },
  ];

  const adminLinks = [
      { href: "/dashboard/admin", label: "Admin", icon: Shield },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card p-4 flex flex-col justify-between">
      <div className="flex flex-col gap-4 overflow-hidden">
        <Link href="/dashboard" className="pb-4 px-2 border-b flex justify-center">
           <Logo />
        </Link>

        <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="space-y-4">
                <nav className="space-y-1 px-2">
                    {mainLinks.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className={cn(
                        "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                        pathname === link.href
                            ? "bg-primary text-white"
                            : "hover:bg-muted"
                        )}
                    >
                        <link.icon className="w-4 h-4" />
                        <span>{link.label}</span>
                    </Link>
                    ))}
                </nav>
                
                <Separator />

                <nav className="space-y-1 px-2">
                    <Collapsible open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
                        <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                <div className="flex items-center gap-3 text-sm font-semibold">
                                <Folder className="w-4 h-4" />
                                <span>Meus Projetos</span>
                                </div>
                                <ChevronDown className={cn("h-4 w-4 transition-transform", isProjectsOpen && "rotate-180")} />
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 pt-1">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.id}`}
                                className={cn(
                                "flex items-center gap-3 pl-8 pr-2 py-1.5 rounded-md text-sm font-medium transition-colors",
                                pathname === `/dashboard/projects/${project.id}`
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="truncate">{project.name}</span>
                            </Link>
                        ))}
                        </CollapsibleContent>
                    </Collapsible>
                </nav>
                
                <Separator />
                
                <nav className="space-y-1 px-2">
                    <h2 className="px-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Análise</h2>
                    {analysisLinks.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className={cn(
                        "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                        pathname.startsWith(link.href)
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                    >
                        <link.icon className="w-4 h-4" />
                        <span>{link.label}</span>
                    </Link>
                    ))}
                </nav>

                <Separator />

                <nav className="space-y-1 px-2">
                    <h2 className="px-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Gerenciamento</h2>
                    {managementLinks.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className={cn(
                        "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                        pathname.startsWith(link.href)
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                    >
                        <link.icon className="w-4 h-4" />
                        <span>{link.label}</span>
                    </Link>
                    ))}
                </nav>
                
                {user.role === 'Admin' && (
                    <>
                        <Separator />
                        <nav className="space-y-1 px-2">
                            <h2 className="px-2 mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Sistema</h2>
                            {adminLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={cn(
                                "flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors",
                                pathname.startsWith(link.href)
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-muted"
                                )}
                            >
                                <link.icon className="w-4 h-4" />
                                <span>{link.label}</span>
                            </Link>
                            ))}
                        </nav>
                    </>
                )}
            </div>
        </ScrollArea>
      </div>

      <div className="pt-4 border-t">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-left h-auto px-2 py-2">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start overflow-hidden">
                            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
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
                <DropdownMenuItem asChild>
                    <Link href="/">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
