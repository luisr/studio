// src/components/dashboard/project-settings-modal.tsx
"use client";

import React, { useState, useEffect } from "react";
import type { ProjectConfiguration, StatusDefinition, CustomKpiDefinition } from "@/lib/types";
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
import { Trash2, GripVertical, Plus, BarChart, Clock, DollarSign, ListTodo, Target, AlertTriangle } from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { LucideIcon } from "lucide-react";

const taskFieldsForKpi: { value: keyof CustomKpiDefinition['field']; label: string }[] = [
    { value: 'plannedHours', label: 'Horas Planejadas' },
    { value: 'actualHours', label: 'Horas Reais' },
];

const aggregationTypes: { value: CustomKpiDefinition['aggregation']; label: string }[] = [
    { value: 'sum', label: 'Soma' },
    { value: 'average', label: 'Média' },
    { value: 'count', label: 'Contagem' },
];

const iconMap: Record<string, LucideIcon> = {
    BarChart,
    Clock,
    DollarSign,
    ListTodo,
    Target,
    AlertTriangle,
};

const iconOptions: {value: string, label: string, icon: LucideIcon}[] = [
    { value: 'BarChart', label: 'Gráfico de Barras', icon: BarChart },
    { value: 'Clock', label: 'Relógio', icon: Clock },
    { value: 'DollarSign', label: 'Cifrão', icon: DollarSign },
    { value: 'ListTodo', label: 'Lista', icon: ListTodo },
    { value: 'Target', label: 'Alvo', icon: Target },
    { value: 'AlertTriangle', label: 'Alerta', icon: AlertTriangle },
];


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
  const [customKpis, setCustomKpis] = useState<CustomKpiDefinition[]>([]);


  useEffect(() => {
    if (isOpen) {
      // Deep copy to avoid mutating the original state directly
      setStatuses(JSON.parse(JSON.stringify(projectConfiguration.statuses)));
      setVisibleKpis(JSON.parse(JSON.stringify(projectConfiguration.visibleKpis)));
      setCustomKpis(JSON.parse(JSON.stringify(projectConfiguration.customKpis || [])));
    }
  }, [isOpen, projectConfiguration]);

  const handleSave = () => {
    onSave({ statuses, visibleKpis, customKpis });
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

  const handleAddCustomKpi = () => {
    setCustomKpis(prev => [
      ...prev,
      {
        id: `ckpi-${Date.now()}`,
        name: 'Novo KPI',
        field: 'plannedHours',
        aggregation: 'sum',
        icon: 'BarChart'
      },
    ]);
  };

  const handleRemoveCustomKpi = (id: string) => {
    setCustomKpis(prev => prev.filter(kpi => kpi.id !== id));
  };

  const handleCustomKpiChange = (id: string, field: keyof CustomKpiDefinition, value: any) => {
    setCustomKpis(prev =>
      prev.map(kpi => (kpi.id === id ? { ...kpi, [field]: value } : kpi))
    );
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
      <DialogContent className="max-w-3xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Configurações do Projeto</DialogTitle>
          <DialogDescription>
            Personalize os status, colunas, KPIs e outras visualizações do seu projeto.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-4">
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
                 <h4 className="font-semibold text-lg">Visibilidade dos KPIs Padrão</h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(visibleKpis).map(([key, isVisible]) => (
                         <div key={key} className="flex items-center space-x-2">
                            <Switch id={`kpi-${key}`} checked={isVisible} onCheckedChange={() => handleKpiToggle(key)} />
                            <Label htmlFor={`kpi-${key}`}>{kpiLabels[key] || key}</Label>
                        </div>
                    ))}
                 </div>
            </div>

            <Separator />
            
            {/* Custom KPI Configuration */}
            <div className="space-y-4">
                 <h4 className="font-semibold text-lg">KPIs Personalizados</h4>
                 <div className="space-y-3">
                    {customKpis.map((kpi) => (
                       <div key={kpi.id} className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 p-2 border rounded-md">
                            <Input 
                                placeholder="Nome do KPI"
                                value={kpi.name}
                                onChange={(e) => handleCustomKpiChange(kpi.id, 'name', e.target.value)}
                                className="col-span-2 md:col-span-1"
                            />
                             <Select value={kpi.field} onValueChange={(v) => handleCustomKpiChange(kpi.id, 'field', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {taskFieldsForKpi.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={kpi.aggregation} onValueChange={(v) => handleCustomKpiChange(kpi.id, 'aggregation', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {aggregationTypes.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={kpi.icon} onValueChange={(v) => handleCustomKpiChange(kpi.id, 'icon', v)}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        {React.createElement(iconMap[kpi.icon] || BarChart, { className: "h-4 w-4" })}
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {iconOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex items-center gap-2">
                                                <opt.icon className="h-4 w-4" />
                                                <span>{opt.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveCustomKpi(kpi.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                 </div>
                 <Button variant="outline" size="sm" onClick={handleAddCustomKpi}>
                     <Plus className="mr-2 h-4 w-4" />
                     Adicionar KPI Personalizado
                 </Button>
            </div>
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Configurações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
