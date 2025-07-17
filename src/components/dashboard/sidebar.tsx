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


const LogoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white p-2 bg-primary rounded-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 12.5a3.5 3.5 0 0 1-3.5-3.5V5.5a3.5 3.5 0 0 1 7 0v3.5a3.5 3.5 0 0 1-3.5 3.5z" />
        <path d="M12 12.5V18" />
        <path d="M15 16h-6" />
        <path d="M9 20h6" />
    </svg>
)

interface DashboardSidebarProps {
  user: User;
  projects: Project[];
}

export function DashboardSidebar({ user, projects }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  const navLinks = [
    { href: "/dashboard/tasks", label: "Todas as Tarefas", icon: CheckSquare },
    { href: "/dashboard/reports", label: "Relatórios", icon: FileText },
    { href: "/dashboard/users", label: "Usuários", icon: Users },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card p-4 flex flex-col justify-between">
      <div className="flex flex-col gap-4 overflow-hidden">
        <Link href="/dashboard" className="flex items-center gap-3 pb-2 px-2 border-b">
           <LogoIcon />
          <div>
            <h1 className="text-xl font-bold text-foreground">Tô Sabendo!</h1>
          </div>
        </Link>

        <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="space-y-4">
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
                    {navLinks.map((link) => (
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
