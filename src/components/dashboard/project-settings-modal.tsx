// src/components/dashboard/project-settings-modal.tsx
"use client";

import { useState, useEffect } from "react";
import type { ProjectConfiguration, StatusDefinition } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, GripVertical, Plus } from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectConfiguration: ProjectConfiguration;
  onSave: (newConfig: ProjectConfiguration) => void;
}

export function ProjectSettingsModal({
  isOpen,
  onOpenChange,
  projectConfiguration,
  onSave,
}: ProjectSettingsModalProps) {
  const [statuses, setStatuses] = useState<StatusDefinition[]>([]);
  const [visibleKpis, setVisibleKpis] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      // Deep copy to avoid mutating the original state directly
      setStatuses(JSON.parse(JSON.stringify(projectConfiguration.statuses)));
      setVisibleKpis(JSON.parse(JSON.stringify(projectConfiguration.visibleKpis)));
    }
  }, [isOpen, projectConfiguration]);

  const handleSave = () => {
    onSave({ statuses, visibleKpis });
    onOpenChange(false);
  };

  const handleStatusChange = (index: number, field: keyof StatusDefinition, value: any) => {
    const newStatuses = [...statuses];
    (newStatuses[index] as any)[field] = value;
    
    // Ensure only one is default/completed
    if (field === 'isDefault' && value === true) {
        newStatuses.forEach((s, i) => { if (i !== index) s.isDefault = false });
    }
     if (field === 'isCompleted' && value === true) {
        newStatuses.forEach((s, i) => { if (i !== index) s.isCompleted = false });
    }

    setStatuses(newStatuses);
  };

  const handleAddNewStatus = () => {
    setStatuses([
      ...statuses,
      {
        id: `status-${Date.now()}`,
        name: "Novo Status",
        color: "#cccccc",
      },
    ]);
  };

  const handleRemoveStatus = (index: number) => {
    if (statuses.length > 1) { // Prevent deleting all statuses
        const newStatuses = statuses.filter((_, i) => i !== index);
        // If the deleted status was default, make the first one the new default
        if (statuses[index].isDefault && newStatuses.length > 0) {
            newStatuses[0].isDefault = true;
        }
        setStatuses(newStatuses);
    }
  };

  const handleKpiToggle = (key: string) => {
    setVisibleKpis(prev => ({
        ...prev,
        [key]: !prev[key],
    }));
  };

  const kpiLabels: Record<string, string> = {
    totalTasks: 'Total de Atividades',
    completedTasks: 'Atividades Concluídas',
    overallProgress: 'Conclusão Geral',
    plannedBudget: 'Custo Planejado',
    actualCost: 'Custo Real',
    costVariance: 'Desvio de Custo',
    spi: 'SPI (Prazo)',
    cpi: 'CPI (Custo)',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurações do Projeto</DialogTitle>
          <DialogDescription>
            Personalize os status, colunas, KPIs e outras visualizações do seu projeto.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
            {/* Status Configuration */}
            <div className="space-y-4">
                 <h4 className="font-semibold text-lg">Status das Tarefas</h4>
                 <div className="space-y-3">
                    {statuses.map((status, index) => (
                        <div key={status.id} className="flex items-center gap-2 p-2 border rounded-md">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <Input 
                                type="color" 
                                value={status.color} 
                                onChange={(e) => handleStatusChange(index, 'color', e.target.value)}
                                className="w-12 h-8 p-1"
                            />
                            <Input 
                                value={status.name}
                                onChange={(e) => handleStatusChange(index, 'name', e.target.value)}
                                className="flex-1"
                            />
                             <div className="flex items-center space-x-2">
                                <Switch id={`default-${index}`} checked={status.isDefault} onCheckedChange={(c) => handleStatusChange(index, 'isDefault', c)} />
                                <Label htmlFor={`default-${index}`} className="text-xs">Padrão</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id={`completed-${index}`} checked={status.isCompleted} onCheckedChange={(c) => handleStatusChange(index, 'isCompleted', c)} />
                                <Label htmlFor={`completed-${index}`} className="text-xs">Concluído</Label>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveStatus(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                 </div>
                 <Button variant="outline" size="sm" onClick={handleAddNewStatus}>
                     <Plus className="mr-2 h-4 w-4" />
                     Adicionar Status
                 </Button>
            </div>
            
            <Separator />

            {/* KPI Configuration */}
            <div className="space-y-4">
                 <h4 className="font-semibold text-lg">Visibilidade dos KPIs</h4>
                 <div className="grid grid-cols-2 gap-4">
                    {Object.entries(visibleKpis).map(([key, isVisible]) => (
                         <div key={key} className="flex items-center space-x-2">
                            <Switch id={`kpi-${key}`} checked={isVisible} onCheckedChange={() => handleKpiToggle(key)} />
                            <Label htmlFor={`kpi-${key}`}>{kpiLabels[key] || key}</Label>
                        </div>
                    ))}
                 </div>
            </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Configurações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
