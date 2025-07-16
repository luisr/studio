// src/components/dashboard/project-header.tsx
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, RefreshCw } from "lucide-react";
import React, { useRef, ChangeEvent } from "react";

interface ProjectHeaderProps {
  project: Project;
  onNewTaskClick: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export function ProjectHeader({ project, onNewTaskClick, onImport, onExport }: ProjectHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 bg-card border-b">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground max-w-3xl">{project.description}</p>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onImport}
                    accept=".csv"
                    className="hidden"
                />
                <Button variant="outline" size="sm" onClick={handleImportClick}><Upload /> Importar CSV</Button>
                <Button variant="outline" size="sm" onClick={onExport}><Download /> Exportar CSV</Button>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}><RefreshCw /> Atualizar</Button>
                <Button size="sm" onClick={onNewTaskClick}><Plus /> Nova Atividade</Button>
            </div>
        </div>
    </div>
  );
}
