// src/components/dashboard/project-header.tsx
import type { Project, ActiveAlert } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, RefreshCw, Settings, GalleryHorizontal, Edit, Bell, AlertTriangle } from "lucide-react";
import React, { useRef, ChangeEvent } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";

interface ProjectHeaderProps {
  project: Project;
  activeAlerts: ActiveAlert[];
  canEditProject: boolean;
  canEditTasks: boolean;
  onNewTaskClick: () => void;
  onEditProjectClick: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onSettingsClick: () => void;
  onGalleryClick: () => void;
}

export function ProjectHeader({ 
    project, 
    activeAlerts,
    canEditProject, 
    canEditTasks, 
    onNewTaskClick, 
    onEditProjectClick, 
    onImport, 
    onExport, 
    onSettingsClick, 
    onGalleryClick 
}: ProjectHeaderProps) {
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
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="relative">
                            <Bell className="h-4 w-4" />
                            {activeAlerts.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                    {activeAlerts.length}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Alertas Ativos</h4>
                                <p className="text-sm text-muted-foreground">
                                    Alertas automáticos baseados nas regras do projeto.
                                </p>
                            </div>
                            <Separator />
                            <div className="grid gap-2">
                               {activeAlerts.length > 0 ? (
                                    activeAlerts.map(alert => (
                                        <div key={alert.id} className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0">
                                            <AlertTriangle className="h-5 w-5 text-destructive" />
                                            <div className="grid gap-1">
                                                <p className="text-sm font-medium">{alert.message}</p>
                                            </div>
                                        </div>
                                    ))
                               ) : (
                                  <p className="text-sm text-muted-foreground text-center">Nenhum alerta ativo.</p>
                               )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

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
