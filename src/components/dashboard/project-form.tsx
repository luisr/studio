// src/components/dashboard/project-form.tsx
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
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useEffect } from "react";

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

interface ProjectFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: any) => void;
  users: User[];
  project?: Project | null;
}

export function ProjectForm({ isOpen, onOpenChange, onSave, users, project = null }: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  });

  useEffect(() => {
    if (isOpen) {
        if (project) { // Edit mode
            form.reset({
                name: project.name,
                description: project.description,
                managerId: project.manager.id,
                plannedStartDate: new Date(project.plannedStartDate),
                plannedEndDate: new Date(project.plannedEndDate),
                plannedBudget: project.plannedBudget,
            });
        } else { // Create mode
            form.reset({
                name: "",
                description: "",
                managerId: "",
                plannedStartDate: new Date(),
                plannedEndDate: new Date(),
                plannedBudget: 0,
            });
        }
    }
  }, [project, isOpen, form]);
  
  const onSubmit = (data: ProjectFormValues) => {
    // For editing, we pass only the updated fields
    if (project) {
        const manager = users.find(u => u.id === data.managerId);
        if (!manager) return;

        const payload = {
            name: data.name,
            description: data.description || "",
            manager: manager,
            plannedStartDate: data.plannedStartDate.toISOString(),
            plannedEndDate: data.plannedEndDate.toISOString(),
            plannedBudget: data.plannedBudget,
        };
        onSave(payload);
    } else {
        // For creating, we pass the managerId to be resolved by the parent
        const payload = {
            name: data.name,
            description: data.description || "",
            managerId: data.managerId,
            plannedStartDate: data.plannedStartDate.toISOString(),
            plannedEndDate: data.plannedEndDate.toISOString(),
            plannedBudget: data.plannedBudget,
        };
         onSave(payload);
    }
  };
  
  const dialogTitle = project ? "Editar Detalhes do Projeto" : "Criar Novo Projeto";
  const dialogDescription = project 
    ? "Atualize as informações principais do seu projeto."
    : "Preencha os detalhes para criar um novo projeto.";


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Projeto</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
