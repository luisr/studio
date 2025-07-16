import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, RefreshCw } from "lucide-react";

interface ProjectHeaderProps {
  project: Project;
  onNewTaskClick: () => void;
}

export function ProjectHeader({ project, onNewTaskClick }: ProjectHeaderProps) {
  return (
    <div className="p-6 bg-card border-b">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground max-w-3xl">{project.description}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled><Upload /> Importar CSV</Button>
                <Button variant="outline" size="sm" disabled><Download /> Exportar CSV</Button>
                <Button variant="outline" size="sm" disabled><RefreshCw /> Atualizar</Button>
                <Button size="sm" onClick={onNewTaskClick}><Plus /> Nova Atividade</Button>
            </div>
        </div>
    </div>
  );
}
