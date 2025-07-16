// src/components/dashboard/new-project-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Project, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useState } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";

const projectSchema = z.object({
  name: z.string().min(1, "O nome do projeto é obrigatório."),
  description: z.string().optional(),
  managerId: z.string().min(1, "É necessário selecionar um gerente."),
  plannedStartDate: z.date({ required_error: "A data de início é obrigatória." }),
  plannedEndDate: z.date({ required_error: "A data de fim é obrigatória." }),
  plannedBudget: z.coerce.number().min(0, "O orçamento deve ser um valor positivo."),
}).refine(data => data.plannedEndDate >= data.plannedStartDate, {
    message: "A data de fim não pode ser anterior à data de início.",
    path: ["plannedEndDate"],
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface NewProjectFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: Omit<Project, 'id' | 'kpis' | 'actualCost' | 'configuration'>) => void;
  users: User[];
}

export function NewProjectForm({ isOpen, onOpenChange, onSave, users }: NewProjectFormProps) {
  const [team, setTeam] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: "",
      plannedStartDate: new Date(),
      plannedEndDate: new Date(),
      plannedBudget: 0,
    },
  });

  const handleAddUserToTeam = () => {
    if (selectedUser) {
      const userToAdd = users.find(u => u.id === selectedUser);
      if (userToAdd && !team.some(member => member.id === userToAdd.id)) {
        setTeam(prev => [...prev, userToAdd]);
      }
      setSelectedUser('');
    }
  };

  const handleRemoveUserFromTeam = (userId: string) => {
    setTeam(prev => prev.filter(member => member.id !== userId));
  };
  
  const onSubmit = (data: ProjectFormValues) => {
    const manager = users.find(u => u.id === data.managerId);
    if (!manager) return;
    
    // Ensure manager is in the team
    const finalTeam = [...team];
    if(!finalTeam.some(m => m.id === manager.id)){
      finalTeam.push(manager);
    }
    
    onSave({
      name: data.name,
      description: data.description || "",
      manager: manager,
      team: finalTeam,
      plannedStartDate: data.plannedStartDate.toISOString(),
      plannedEndDate: data.plannedEndDate.toISOString(),
      plannedBudget: data.plannedBudget,
    });
    form.reset();
    setTeam([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para criar um novo projeto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Projeto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lançamento do Produto X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o objetivo principal do projeto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gerente do Projeto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gerente responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plannedStartDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início Planejada</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plannedEndDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim Planejada</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>Escolha uma data</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="plannedBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orçamento Planejado (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Equipe do Projeto</FormLabel>
              <div className="flex gap-2">
                 <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um membro..." />
                    </SelectTrigger>
                    <SelectContent>
                        {users.filter(u => !team.some(m => m.id === u.id)).map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={handleAddUserToTeam}><PlusCircle className="mr-2"/>Adicionar</Button>
              </div>
              <div className="space-y-2 rounded-md border p-2">
                  {team.length > 0 ? team.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveUserFromTeam(member.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center p-4">Nenhum membro na equipe ainda.</p>
                  )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Projeto</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
