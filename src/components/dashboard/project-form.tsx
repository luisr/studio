// src/components/dashboard/project-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Project, User, TeamMember, ProjectRole } from "@/lib/types";
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
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

const projectSchema = z.object({
  name: z.string().min(1, "O nome do projeto é obrigatório."),
  description: z.string().optional(),
  managerId: z.string().min(1, "É necessário selecionar um gerente."),
  plannedStartDate: z.date({ required_error: "A data de início é obrigatória." }),
  plannedEndDate: z.date({ required_error: "A data de fim é obrigatória." }),
  plannedBudget: z.coerce.number().min(0, "O orçamento deve ser um valor positivo."),
  team: z.array(z.any()).optional(), // Team is managed in project settings now
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

const roleOptions: { value: ProjectRole, label: string }[] = [
    { value: 'Manager', label: 'Gerente' },
    { value: 'Editor', label: 'Membro' },
    { value: 'Viewer', label: 'Visualizador' },
];

export function ProjectForm({ isOpen, onOpenChange, onSave, users, project = null }: ProjectFormProps) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  
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
            setTeam(project.team || []);
        } else { // Create mode
            form.reset({
                name: "",
                description: "",
                managerId: "",
                plannedStartDate: new Date(),
                plannedEndDate: new Date(),
                plannedBudget: 0,
            });
            setTeam([]);
        }
    }
  }, [project, isOpen, form]);
  
  const onSubmit = (data: ProjectFormValues) => {
    const manager = users.find(u => u.id === data.managerId);
    if (!manager) return;
    
    // For editing, we might want to preserve the team if it's not managed here
    if (project) {
        const payload = {
            ...project,
            name: data.name,
            description: data.description || "",
            manager: manager,
            team: team, // Keep existing team on edit
            plannedStartDate: data.plannedStartDate.toISOString(),
            plannedEndDate: data.plannedEndDate.toISOString(),
            plannedBudget: data.plannedBudget,
        };
        onSave(payload);
    } else {
        // For creating, we just pass the core data
        const payload = {
            name: data.name,
            description: data.description || "",
            manager: manager,
            plannedStartDate: data.plannedStartDate.toISOString(),
            plannedEndDate: data.plannedEndDate.toISOString(),
            plannedBudget: data.plannedBudget,
        };
         onSave(payload);
    }
  };
  
  const dialogTitle = project ? "Editar Projeto" : "Criar Novo Projeto";
  const dialogDescription = project 
    ? "Atualize os detalhes e a equipe do seu projeto."
    : "Preencha os detalhes para criar um novo projeto.";

  const handleAddUserToTeam = (userId: string, role: ProjectRole) => {
      const userToAdd = users.find(u => u.id === userId);
      if (userToAdd && !team.some(member => member.user.id === userToAdd.id)) {
        setTeam(prev => [...prev, { user: userToAdd, role: role }]);
      }
  };

  const handleRemoveUserFromTeam = (userId: string) => {
    setTeam(prev => prev.filter(member => member.user.id !== userId));
  };
   const handleRoleChange = (userId: string, newRole: ProjectRole) => {
        setTeam(prev => prev.map(member => 
            member.user.id === userId ? { ...member, role: newRole } : member
        ));
    };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
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

             {project && (
                <div className="space-y-2">
                    <FormLabel>Equipe do Projeto</FormLabel>
                    <div className="space-y-2 rounded-md border p-2 min-h-[80px]">
                        {team.map(member => (
                            <div key={member.user.id} className="flex items-center justify-between p-1">
                                <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.user.avatar} alt={member.user.name} />
                                    <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{member.user.name}</span>
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
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveUserFromTeam(member.user.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="flex gap-2">
                        <Select onValueChange={(userId) => handleAddUserToTeam(userId, 'Editor')}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Adicionar membro à equipe..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.filter(u => !team.some(m => m.user.id === u.id)).map((user) => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}


            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
