"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, GanttChartSquare, LayoutGrid, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


export function DashboardSidebar({ projects }: { projects: Project[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card p-4 flex flex-col">
      <div className="flex items-center gap-2 pb-6">
        <GanttChartSquare className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-primary">To Sabendo</h1>
      </div>
      <nav className="flex-1 space-y-4">
        <div>
          <h2 className="px-2 mb-2 text-xs font-semibold tracking-wider text-muted-foreground">MENU</h2>
          <ul className="space-y-1">
            <li>
              <Link href="/dashboard" className={cn("flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard" ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
                <LayoutGrid className="w-4 h-4" />
                <span>Portfolio</span>
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="px-2 mb-2 text-xs font-semibold tracking-wider text-muted-foreground">PROJETOS</h2>
          <ul className="space-y-1">
            <TooltipProvider>
            {projects.map((project) => (
              <li key={project.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className={cn(
                        "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors",
                        pathname === `/dashboard/projects/${project.id}`
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <FolderKanban className="w-4 h-4" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{project.name}</p>
                  </TooltipContent>
                </Tooltip>
              </li>
            ))}
            </TooltipProvider>
          </ul>
        </div>
      </nav>
      <div className="mt-auto">
         <Link href="#" className={cn("flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted")}>
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </Link>
      </div>
    </aside>
  );
}
