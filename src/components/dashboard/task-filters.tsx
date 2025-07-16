"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export function TaskFilters() {
  return (
    <div className="p-4 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por atividade, disciplina..." className="pl-8" />
                </div>
            </div>
            <div className="md:col-span-1">
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Todos os Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="in-progress">Em Andamento</SelectItem>
                        <SelectItem value="done">Concluído</SelectItem>
                        <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="md:col-span-1">
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Todos Responsáveis" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos Responsáveis</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="md:col-span-1">
                <Button variant="ghost" className="w-full">Limpar Filtros</Button>
            </div>
        </div>
    </div>
  )
}
