"use client";

import type { Task } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TasksTableProps {
  tasks: Task[];
}

const statusClasses: { [key: string]: string } = {
  'Concluído': 'bg-green-100 text-green-800 border-green-200',
  'Em Andamento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'A Fazer': 'bg-gray-100 text-gray-800 border-gray-200',
  'Bloqueado': 'bg-red-100 text-red-800 border-red-200',
};

const priorityClasses: { [key: string]: string } = {
  'Alta': 'bg-red-100 text-red-800',
  'Média': 'bg-yellow-100 text-yellow-800',
  'Baixa': 'bg-blue-100 text-blue-800',
};

export function TasksTable({ tasks }: TasksTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Atividade</TableHead>
            <TableHead>Disciplina</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Data Fim Plan.</TableHead>
            <TableHead>Conclusão</TableHead>
            <TableHead>SPI</TableHead>
            <TableHead>CPI</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.name}</TableCell>
              <TableCell>ACQUA</TableCell> {/* Placeholder */}
              <TableCell>{task.assignee.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("font-normal", statusClasses[task.status] || statusClasses['A Fazer'])}>{task.status}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("font-normal", priorityClasses['Média'])}>Média</Badge> {/* Placeholder */}
              </TableCell>
              <TableCell>{new Date(task.plannedEndDate).toLocaleDateString()}</TableCell>
              <TableCell>0%</TableCell> {/* Placeholder */}
              <TableCell className="text-red-600">0.00</TableCell> {/* Placeholder */}
              <TableCell className="text-red-600">0.00</TableCell> {/* Placeholder */}
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
