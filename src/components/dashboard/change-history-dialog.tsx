"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ChangeLog } from "@/lib/types";

interface ChangeHistoryDialogProps {
  history: ChangeLog[];
  trigger: React.ReactNode;
}

export function ChangeHistoryDialog({ history, trigger }: ChangeHistoryDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campo</TableHead>
                <TableHead>Valor Antigo</TableHead>
                <TableHead>Novo Valor</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Justificativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length > 0 ? (
                history.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{log.fieldChanged}</TableCell>
                    <TableCell>{log.oldValue}</TableCell>
                    <TableCell>{log.newValue}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.justification}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Nenhuma alteração registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
