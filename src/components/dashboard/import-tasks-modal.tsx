// src/components/dashboard/import-tasks-modal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";

export const TASK_FIELDS = {
    id: "ID da Tarefa",
    name: "Nome da Tarefa",
    progress: "Progresso (%)",
    assignee: "Responsável (Nome ou ID)",
    status: "Status",
    priority: "Prioridade",
    plannedStartDate: "Data de Início Planejada",
    plannedEndDate: "Data de Fim Planejada",
    actualStartDate: "Data de Início Real",
    actualEndDate: "Data de Fim Real",
    plannedHours: "Horas Planejadas",
    actualHours: "Horas Reais",
    dependencies: "Dependências (IDs separados por vírgula)",
    parentId: "ID da Tarefa Pai",
    isMilestone: "É um Marco (true/false)",
    isCritical: "É Crítica (true/false)",
} as const;


export type TaskField = keyof typeof TASK_FIELDS;
export type MappingValue = TaskField | "ignore" | "new_field";
export type Mapping = Record<string, { type: MappingValue, newFieldName?: string }>;

interface ImportTasksModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  csvHeaders: string[];
  onConfirm: (mapping: Mapping) => void;
}

export function ImportTasksModal({
  isOpen,
  onOpenChange,
  csvHeaders,
  onConfirm,
}: ImportTasksModalProps) {
  const [mapping, setMapping] = useState<Mapping>({});

  const handleConfirm = () => {
    onConfirm(mapping);
  };
  
  const handleAutoMapping = () => {
     const newMapping: Mapping = {};
     const taskFieldKeys = Object.keys(TASK_FIELDS) as TaskField[];

     csvHeaders.forEach(header => {
        const matchingKey = taskFieldKeys.find(key => 
          TASK_FIELDS[key].toLowerCase() === header.toLowerCase().trim() || key.toLowerCase() === header.toLowerCase().trim()
        );
        newMapping[header] = { type: matchingKey || 'ignore' };
     });
     setMapping(newMapping);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mapear Colunas do CSV</DialogTitle>
          <DialogDescription>
            Associe cada coluna do seu arquivo CSV a um campo de tarefa correspondente ou crie um novo campo personalizado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden">
            <ScrollArea className="h-full">
                <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                    <TableHead>Coluna do CSV</TableHead>
                    <TableHead>Mapear para Campo da Tarefa</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {csvHeaders.map((header) => (
                    <TableRow key={header}>
                        <TableCell className="font-semibold">{header}</TableCell>
                        <TableCell className="flex gap-2 items-center">
                        <Select
                            value={mapping[header]?.type || "ignore"}
                            onValueChange={(value) =>
                              setMapping((prev) => ({
                                  ...prev,
                                  [header]: { type: value as MappingValue, newFieldName: header },
                              }))
                            }
                        >
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione um campo..." />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="ignore">Ignorar esta coluna</SelectItem>
                            <SelectItem value="new_field">Criar Novo Campo...</SelectItem>
                            {Object.entries(TASK_FIELDS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                {label}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        {mapping[header]?.type === 'new_field' && (
                          <Input
                            placeholder="Nome do Novo Campo"
                            value={mapping[header]?.newFieldName || ''}
                            onChange={(e) => setMapping(prev => ({
                              ...prev,
                              [header]: { ...prev[header], newFieldName: e.target.value }
                            }))}
                          />
                        )}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </ScrollArea>
        </div>
        
        <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button variant="outline" onClick={handleAutoMapping}>Mapeamento Automático</Button>
            <Button onClick={handleConfirm}>Confirmar e Importar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
