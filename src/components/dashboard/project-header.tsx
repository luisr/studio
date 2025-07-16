import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, RefreshCw } from "lucide-react";

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="p-6 bg-card border-b">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground max-w-3xl">{project.description}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"><Upload /> Importar CSV</Button>
                <Button variant="outline" size="sm"><Download /> Exportar CSV</Button>
                <Button variant="outline" size="sm"><RefreshCw /> Atualizar</Button>
                <Button size="sm"><Plus /> Nova Atividade</Button>
            </div>
        </div>
    </div>
  );
}
