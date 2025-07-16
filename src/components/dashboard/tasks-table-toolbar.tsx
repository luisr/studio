// src/components/dashboard/tasks-table-toolbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ChevronsDown, ChevronsUp } from "lucide-react";

interface TasksTableToolbarProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  children?: React.ReactNode;
}

export function TasksTableToolbar({ onExpandAll, onCollapseAll, children }: TasksTableToolbarProps) {
  return (
    <div className="flex items-center justify-between p-2 border-b no-print">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExpandAll}>
          <ChevronsDown className="mr-2 h-4 w-4" />
          Expandir Tudo
        </Button>
        <Button variant="outline" size="sm" onClick={onCollapseAll}>
          <ChevronsUp className="mr-2 h-4 w-4" />
          Recolher Tudo
        </Button>
      </div>
      <div>{children}</div>
    </div>
  );
}
