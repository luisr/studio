// src/components/dashboard/project-header.tsx
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, RefreshCw, Settings, GalleryHorizontal, Edit } from "lucide-react";
import React, { useRef, ChangeEvent } from "react";

interface ProjectHeaderProps {
  project: Project;
  canEditProject: boolean;
  canEditTasks: boolean;
  onNewTaskClick: () => void;
  onEditProjectClick: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onSettingsClick: () => void;
  onGalleryClick: () => void;
}

export function ProjectHeader({ project, canEditProject, canEditTasks, onNewTaskClick, onEditProjectClick, onImport, onExport, onSettingsClick, onGalleryClick }: ProjectHeaderProps) {
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
                    disabled={!canEditTasks}
                />
                {canEditTasks && (
                    <>
                        <Button variant="outline" size="sm" onClick={handleImportClick}><Upload /> Importar CSV</Button>
                        <Button variant="outline" size="sm" onClick={onExport}><Download /> Exportar CSV</Button>
                        <Button size="sm" onClick={onNewTaskClick}><Plus /> Nova Atividade</Button>
                    </>
                )}
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}><RefreshCw /> Atualizar</Button>
                {canEditProject && (
                    <>
                        <Button variant="outline" size="icon" onClick={onEditProjectClick}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar Projeto</span>
                        </Button>
                        <Button variant="outline" size="icon" onClick={onSettingsClick}>
                            <Settings className="h-4 w-4" />
                            <span className="sr-only">Configurações do Projeto</span>
                        </Button>
                    </>
                )}
                <Button variant="outline" size="icon" onClick={onGalleryClick}>
                    <GalleryHorizontal className="h-4 w-4" />
                    <span className="sr-only">Galeria do Projeto</span>
                </Button>
            </div>
        </div>
    </div>
  );
}
