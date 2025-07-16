// src/components/dashboard/tasks-table-toolbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ChevronsDown, ChevronsUp } from "lucide-react";

interface TasksTableToolbarProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function TasksTableToolbar({ onExpandAll, onCollapseAll }: TasksTableToolbarProps) {
  return (
    <div className="flex items-center justify-end p-2 border-b">
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
    </div>
  );
}
