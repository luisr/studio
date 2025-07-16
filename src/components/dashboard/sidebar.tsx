"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Settings, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 border-r bg-card p-4 flex flex-col">
      <div className="flex items-center gap-2 pb-6 px-2">
        <LineChart className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold">ProjectDash</h1>
      </div>
      <nav className="flex-1 space-y-2">
        <Link href="/dashboard" className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", pathname.startsWith("/dashboard/projects") || pathname === "/dashboard" ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
            <LayoutGrid className="w-4 h-4" />
            <span>Dashboard</span>
        </Link>
        <Link href="#" className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted text-muted-foreground")}>
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
        </Link>
      </nav>
    </aside>
  );
}
