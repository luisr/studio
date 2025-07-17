// src/components/dashboard/project-settings-modal.tsx
"use client";

import React, { useState, useEffect } from "react";
import type { ProjectConfiguration, StatusDefinition, CustomKpiDefinition, CustomChartDefinition, CustomFieldDefinition, AlertRule, AlertMetric, AlertCondition, TeamMember, User, ProjectRole } from "@/lib/types";
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
import { Trash2, GripVertical, Plus, BarChart, Clock, DollarSign, ListTodo, Target, AlertTriangle as AlertTriangleIcon, PieChart, LineChart as LineChartIcon, BarChart2, Bell } from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

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
    AlertTriangleIcon,
};

const iconOptions: {value: string, label: string, icon: LucideIcon}[] = [
    { value: 'BarChart', label: 'Gráfico de Barras', icon: BarChart },
    { value: 'Clock', label: 'Relógio', icon: Clock },
    { value: 'DollarSign', label: 'Cifrão', icon: DollarSign },
    { value: 'ListTodo', label: 'Lista', icon: ListTodo },
    { value: 'Target', label: 'Alvo', icon: Target },
    { value: 'AlertTriangleIcon', label: 'Alerta', icon: AlertTriangleIcon },
];

const chartCategoricalFields = [
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Prioridade' },
    { value: 'assignee', label: 'Responsável' },
];

const chartNumericalFields = [
    { value: 'plannedHours', label: 'Horas Planejadas' },
    { value: 'actualHours', label: 'Horas Reais' },
];

const alertMetrics: { value: AlertMetric, label: string, conditions: AlertCondition[] }[] = [
    { value: 'task_status', label: 'Status da Tarefa', conditions: ['changes_to'] },
    { value: 'task_priority', label: 'Prioridade da Tarefa', conditions: ['is', 'changes_to'] },
    { value: 'task_overdue', label: 'Tarefa Atrasada', conditions: ['becomes'] },
    { value: 'budget_usage', label: 'Uso do Orçamento', conditions: ['exceeds_percentage'] },
];

const alertConditions: { value: AlertCondition, label: string }[] = [
    { value: 'is', label: 'é' },
    { value: 'is_not', label: 'não é' },
    { value: 'changes_to', label: 'muda para' },
    { value: 'becomes', label: 'se torna' },
    { value: 'exceeds_percentage', label: 'excede' },
];

const roleOptions: { value: ProjectRole, label: string }[] = [
    { value: 'Manager', label: 'Gerente' },
    { value: 'Editor', label: 'Membro' },
    { value: 'Viewer', label: 'Visualizador' },
];


interface ProjectSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectConfiguration: ProjectConfiguration;
  team: TeamMember[];
  allUsers: User[];
  onSave: (newConfig: ProjectConfiguration, newTeam: TeamMember[]) => void;
}

export function ProjectSettingsModal({
  isOpen,
  onOpenChange,
  projectConfiguration,
  team,
  allUsers,
  onSave,
}: ProjectSettingsModalProps) {
  const [statuses, setStatuses] = useState<StatusDefinition[]>([]);
  const [visibleKpis, setVisibleKpis] = useState<Record<string, boolean>>({});
  const [customKpis, setCustomKpis] = useState<CustomKpiDefinition[]>([]);
  const [customCharts, setCustomCharts] = useState<CustomChartDefinition[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [currentTeam, setCurrentTeam] = useState<TeamMember[]>([]);


  useEffect(() => {
    if (isOpen) {
      setStatuses(JSON.parse(JSON.stringify(projectConfiguration.statuses)));
      setVisibleKpis(JSON.parse(JSON.stringify(projectConfiguration.visibleKpis)));
      setCustomKpis(JSON.parse(JSON.stringify(projectConfiguration.customKpis || [])));
      setCustomCharts(JSON.parse(JSON.stringify(projectConfiguration.customCharts || [])));
      setCustomFields(JSON.parse(JSON.stringify(projectConfiguration.customFieldDefinitions || [])));
      setAlertRules(JSON.parse(JSON.stringify(projectConfiguration.alertRules || [])));
      setCurrentTeam(JSON.parse(JSON.stringify(team || [])));
    }
  }, [isOpen, projectConfiguration, team]);

  const handleSave = () => {
    const newConfig = { ...projectConfiguration, statuses, visibleKpis, customKpis, customCharts, customFieldDefinitions: customFields, alertRules };
    onSave(newConfig, currentTeam);
    onOpenChange(false);
  };

  const handleStatusChange = (index: number, field: keyof StatusDefinition, value: any) => {
    const newStatuses = [...statuses];
    (newStatuses[index] as any)[field] = value;
    
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
    if (statuses.length > 1) { 
        const newStatuses = statuses.filter((_, i) => i !== index);
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
  
  const handleAddCustomChart = () => {
    setCustomCharts(prev => [
      ...prev,
      {
        id: `cchart-${Date.now()}`,
        name: 'Novo Gráfico',
        type: 'bar',
        xAxisField: 'status',
        yAxisField: 'plannedHours',
        yAxisAggregation: 'sum',
      }
    ]);
  };

  const handleRemoveCustomChart = (id: string) => {
    setCustomCharts(prev => prev.filter(chart => chart.id !== id));
  };

  const handleCustomChartChange = (id: string, field: keyof CustomChartDefinition, value: any) => {
    setCustomCharts(prev =>
      prev.map(chart => (chart.id === id ? { ...chart, [field]: value } : chart))
    );
  };

  const handleAddCustomField = () => {
    setCustomFields(prev => [
      ...prev,
      { id: `cfield-${Date.now()}`, name: 'Novo Campo', type: 'text' }
    ]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== id));
  };

  const handleCustomFieldChange = (id: string, field: keyof CustomFieldDefinition, value: any) => {
    setCustomFields(prev => 
      prev.map(f => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleAddAlertRule = () => {
    setAlertRules(prev => [
        ...prev,
        {
            id: `alert-${Date.now()}`,
            metric: 'task_status',
            condition: 'changes_to',
            value: statuses.find(s => s.name === 'Bloqueado')?.name || '',
            label: '',
        }
    ]);
  };

  const handleRemoveAlertRule = (id: string) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== id));
  };

  const handleAlertRuleChange = (id: string, field: keyof AlertRule, value: any) => {
     setAlertRules(prev => prev.map(rule => {
        if (rule.id === id) {
            const newRule = { ...rule, [field]: value };
            
            if (field === 'metric') {
                const metricDef = alertMetrics.find(m => m.value === value);
                newRule.condition = metricDef?.conditions[0] || '' as AlertCondition;
            }

            const metricDef = alertMetrics.find(m => m.value === newRule.metric);
            const conditionDef = alertConditions.find(c => c.value === newRule.condition);

            let valueLabel = newRule.value;
            if (newRule.metric === 'task_status') {
                valueLabel = statuses.find(s => s.name === newRule.value)?.name || newRule.value;
            }
             if (newRule.metric === 'budget_usage') {
                valueLabel = `${newRule.value}%`;
            }

            newRule.label = `Alertar quando ${metricDef?.label.toLowerCase()} ${conditionDef?.label.toLowerCase()} ${valueLabel}`;

            return newRule;
        }
        return rule;
     }))
  };

  const handleAddUserToTeam = (userId: string) => {
      const userToAdd = allUsers.find(u => u.id === userId);
      if (userToAdd && !currentTeam.some(member => member.user.id === userToAdd.id)) {
        setCurrentTeam(prev => [...prev, { user: userToAdd, role: 'Viewer' }]);
      }
  };

  const handleRemoveUserFromTeam = (userId: string) => {
    setCurrentTeam(prev => prev.filter(member => member.user.id !== userId));
  };

  const handleRoleChange = (userId: string, newRole: ProjectRole) => {
      setCurrentTeam(prev => prev.map(member => 
          member.user.id === userId ? { ...member, role: newRole } : member
      ));
  };

  const allCategoricalFields = [
    ...chartCategoricalFields,
    ...(customFields || []).filter(f => f.type === 'text').map(f => ({ value: f.id, label: f.name }))
  ];

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
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Configurações do Projeto</DialogTitle>
          <DialogDescription>
            Personalize os status, colunas, KPIs e outras visualizações do seu projeto.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="flex-grow overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>
          
          <div className="flex-grow overflow-y-auto pr-4 pt-4 space-y-6">
            <TabsContent value="general" className="mt-0 space-y-6">
               <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Campos Personalizados</h4>
                   <div className="space-y-3">
                      {customFields.map((field) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 p-2 border rounded-md">
                          <Input
                            placeholder="Nome do Campo"
                            value={field.name}
                            onChange={(e) => handleCustomFieldChange(field.id, 'name', e.target.value)}
                            className="col-span-2"
                          />
                          <Select value={field.type} onValueChange={(v) => handleCustomFieldChange(field.id, 'type', v)}>
                              <SelectTrigger><SelectValue/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="date">Data</SelectItem>
                              </SelectContent>
                          </Select>
                           <Button variant="ghost" size="icon" onClick={() => handleRemoveCustomField(field.id)} className="justify-self-end">
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                   </div>
                   <Button variant="outline" size="sm" onClick={handleAddCustomField}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Campo
                   </Button>
                </div>
                
                <Separator />

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
            </TabsContent>

            <TabsContent value="team" className="mt-0 space-y-6">
                <div className="space-y-2">
                    <div className="space-y-2 rounded-md border p-2 min-h-[80px]">
                        {currentTeam.map(member => (
                            <div key={member.user.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                                <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={member.user.avatar} alt={member.user.name} />
                                    <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{member.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                                </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select 
                                        value={member.role} 
                                        onValueChange={(v) => handleRoleChange(member.user.id, v as ProjectRole)}
                                        disabled={member.role === 'Manager'}
                                    >
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                        {roleOptions.map(opt => (
                                            <SelectItem 
                                                key={opt.value} 
                                                value={opt.value} 
                                                disabled={opt.value === 'Manager'}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    {member.role !== 'Manager' && (
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveUserFromTeam(member.user.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="flex gap-2">
                        <Select onValueChange={(userId) => handleAddUserToTeam(userId)}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Adicionar membro à equipe..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allUsers.filter(u => !currentTeam.some(m => m.user.id === u.id)).map((user) => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="kpis" className="mt-0 space-y-6">
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
            </TabsContent>
            
            <TabsContent value="charts" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Gráficos Personalizados</h4>
                  <div className="space-y-3">
                    {customCharts.map(chart => (
                      <div key={chart.id} className="p-4 border rounded-md space-y-4">
                        <div className="flex items-center gap-4">
                           <Input 
                              placeholder="Nome do Gráfico"
                              value={chart.name}
                              onChange={(e) => handleCustomChartChange(chart.id, 'name', e.target.value)}
                              className="flex-1 font-semibold"
                            />
                             <Select value={chart.type} onValueChange={(v) => handleCustomChartChange(chart.id, 'type', v)}>
                                <SelectTrigger className="w-[180px]">
                                    <div className="flex items-center gap-2">
                                        {chart.type === 'bar' && <BarChart className="h-4 w-4" />}
                                        {chart.type === 'pie' && <PieChart className="h-4 w-4" />}
                                        {chart.type === 'line' && <LineChartIcon className="h-4 w-4" />}
                                        {chart.type === 'horizontalBar' && <BarChart2 className="h-4 w-4" />}
                                        <SelectValue/>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bar">Barras Verticais</SelectItem>
                                    <SelectItem value="horizontalBar">Barras Horizontais</SelectItem>
                                    <SelectItem value="line">Linha</SelectItem>
                                    <SelectItem value="pie">Pizza</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveCustomChart(chart.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {(chart.type === 'bar' || chart.type === 'horizontalBar' || chart.type === 'line') && (
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label>Eixo X (Categorias)</Label>
                              <Select value={chart.xAxisField} onValueChange={(v) => handleCustomChartChange(chart.id, 'xAxisField', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{allCategoricalFields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                             <div className="space-y-1">
                              <Label>Eixo Y (Valores)</Label>
                              <Select value={chart.yAxisField} onValueChange={(v) => handleCustomChartChange(chart.id, 'yAxisField', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{chartNumericalFields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                             <div className="space-y-1">
                              <Label>Agregação do Eixo Y</Label>
                              <Select value={chart.yAxisAggregation} onValueChange={(v) => handleCustomChartChange(chart.id, 'yAxisAggregation', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sum">Soma</SelectItem>
                                    <SelectItem value="average">Média</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        {chart.type === 'pie' && (
                          <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-1">
                              <Label>Segmentar por</Label>
                               <Select value={chart.segmentField} onValueChange={(v) => handleCustomChartChange(chart.id, 'segmentField', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{allCategoricalFields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Valor do Segmento</Label>
                              <Select value={chart.valueField} onValueChange={(v) => handleCustomChartChange(chart.id, 'valueField', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="count">Contagem de Tarefas</SelectItem>
                                    {chartNumericalFields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddCustomChart}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Gráfico Personalizado
                  </Button>
                </div>
            </TabsContent>

            <TabsContent value="alerts" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Regras de Alerta</h4>
                   <div className="space-y-3">
                      {alertRules.map((rule) => {
                        const metricDef = alertMetrics.find(m => m.value === rule.metric);
                        const availableConditions = alertConditions.filter(c => metricDef?.conditions.includes(c.value));
                        
                        let valueInput;
                        if (rule.metric === 'task_status') {
                            valueInput = (
                                <Select value={rule.value} onValueChange={v => handleAlertRuleChange(rule.id, 'value', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{statuses.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            );
                        } else if (rule.metric === 'task_priority') {
                            valueInput = (
                                <Select value={rule.value} onValueChange={v => handleAlertRuleChange(rule.id, 'value', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Alta">Alta</SelectItem>
                                        <SelectItem value="Média">Média</SelectItem>
                                        <SelectItem value="Baixa">Baixa</SelectItem>
                                    </SelectContent>
                                </Select>
                            );
                        } else if (rule.metric === 'budget_usage') {
                             valueInput = (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="number" 
                                        value={rule.value} 
                                        onChange={e => handleAlertRuleChange(rule.id, 'value', e.target.value)}
                                        className="w-24"
                                    />
                                    <span>%</span>
                                </div>
                             );
                        } else {
                            valueInput = <Input type="text" value={rule.value} readOnly className="bg-muted" />;
                        }

                        return (
                          <div key={rule.id} className="p-3 border rounded-md space-y-3">
                             <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Bell className="h-4 w-4 text-primary" />
                                    <span>{rule.label || 'Configurar regra...'}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveAlertRule(rule.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                             <div className="grid grid-cols-3 gap-2 items-center">
                                <Select value={rule.metric} onValueChange={v => handleAlertRuleChange(rule.id, 'metric', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{alertMetrics.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                                </Select>
                                 <Select value={rule.condition} onValueChange={v => handleAlertRuleChange(rule.id, 'condition', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{availableConditions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                                </Select>
                                {valueInput}
                             </div>
                          </div>
                        )
                      })}
                   </div>
                   <Button variant="outline" size="sm" onClick={handleAddAlertRule}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Regra de Alerta
                   </Button>
                </div>
            </TabsContent>

          </div>
        </Tabs>
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
