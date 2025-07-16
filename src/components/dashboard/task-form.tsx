// src/components/dashboard/task-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Task, User, Project } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Switch } from "../ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";

type EffortUnit = 'hours' | 'days' | 'weeks' | 'months';

const conversionFactors: Record<EffortUnit, number> = {
  hours: 1,
  days: 8,
  weeks: 40,
  months: 160, 
};

const taskSchema = z.object({
  name: z.string().min(1, { message: "O nome da tarefa é obrigatório." }),
  assignee: z.string().min(1, { message: "Selecione um responsável." }),
  status: z.string().min(1, { message: "Selecione um status." }),
  priority: z.enum(["Baixa", "Média", "Alta"]),
  plannedStartDate: z.date({ required_error: "A data de início é obrigatória." }),
  plannedEndDate: z.date({ required_error: "A data de fim é obrigatória." }),
  
  // These fields are for the form UI
  plannedEffort: z.coerce.number().min(0),
  plannedEffortUnit: z.enum(['hours', 'days', 'weeks', 'months']),
  actualEffort: z.coerce.number().min(0),
  actualEffortUnit: z.enum(['hours', 'days', 'weeks', 'months']),
  
  // These will be calculated and passed on save
  plannedHours: z.coerce.number().min(0, { message: "As horas planejadas devem ser positivas." }),
  actualHours: z.coerce.number().min(0, { message: "As horas reais devem ser positivas." }),

  parentId: z.string().nullable().optional(),
  isMilestone: z.boolean().optional(),
  dependencies: z.array(z.string()).optional(),
}).refine(data => data.plannedEndDate >= data.plannedStartDate, {
    message: "A data de fim não pode ser anterior à data de início.",
    path: ["plannedEndDate"],
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: Omit<Task, 'id' | 'changeHistory' | 'isCritical'>) => void;
  task: Task | null;
  project: Project;
}

const getBestEffortUnit = (hours: number): { value: number, unit: EffortUnit } => {
    if (hours >= 160) return { value: hours / 160, unit: 'months' };
    if (hours >= 40) return { value: hours / 40, unit: 'weeks' };
    if (hours >= 8) return { value: hours / 8, unit: 'days' };
    return { value: hours, unit: 'hours' };
}

export function TaskForm({ isOpen, onOpenChange, onSave, task, project }: TaskFormProps) {
  const { team: users, tasks: allTasks, configuration } = project;
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      assignee: "",
      status: configuration.statuses.find(s => s.isDefault)?.name || "",
      priority: "Média",
      plannedEffort: 0,
      plannedEffortUnit: 'hours',
      actualEffort: 0,
      actualEffortUnit: 'hours',
      plannedHours: 0,
      actualHours: 0,
      parentId: null,
      isMilestone: false,
      dependencies: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (task) {
         const plannedEffortDisplay = getBestEffortUnit(task.plannedHours);
         const actualEffortDisplay = getBestEffortUnit(task.actualHours);
        form.reset({
          name: task.name,
          assignee: task.assignee.id,
          status: task.status,
          priority: task.priority || 'Média',
          plannedStartDate: new Date(task.plannedStartDate),
          plannedEndDate: new Date(task.plannedEndDate),
          plannedEffort: plannedEffortDisplay.value,
          plannedEffortUnit: plannedEffortDisplay.unit,
          actualEffort: actualEffortDisplay.value,
          actualEffortUnit: actualEffortDisplay.unit,
          plannedHours: task.plannedHours, // keep original values
          actualHours: task.actualHours, // keep original values
          parentId: task.parentId,
          isMilestone: task.isMilestone,
          dependencies: task.dependencies || [],
        });
      } else {
        form.reset({
          name: "",
          assignee: "",
          status: configuration.statuses.find(s => s.isDefault)?.name || "",
          priority: 'Média',
          plannedStartDate: new Date(),
          plannedEndDate: new Date(),
          plannedEffort: 0,
          plannedEffortUnit: 'hours',
          actualEffort: 0,
          actualEffortUnit: 'hours',
          plannedHours: 0,
          actualHours: 0,
          parentId: null,
          isMilestone: false,
          dependencies: [],
        });
      }
    }
  }, [task, form, isOpen, configuration]);

  const onSubmit = (data: TaskFormValues) => {
    const selectedUser = users.find(u => u.id === data.assignee);
    if (!selectedUser) return;

    // Convert effort from UI to hours for storage
    const plannedHours = data.plannedEffort * conversionFactors[data.plannedEffortUnit];
    const actualHours = data.actualEffort * conversionFactors[data.actualEffortUnit];
    
    // Create the object to save, excluding UI-only fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { plannedEffort, plannedEffortUnit, actualEffort, actualEffortUnit, ...dataToSave } = data;

    onSave({
        ...dataToSave,
        plannedHours,
        actualHours,
        parentId: data.parentId === "null" ? null : data.parentId,
        assignee: selectedUser,
        plannedStartDate: data.plannedStartDate.toISOString(),
        plannedEndDate: data.plannedEndDate.toISOString(),
        dependencies: data.dependencies || [],
    });
  };

  const possibleParents = allTasks.filter(t => t.id !== task?.id);
  const possibleDependencies = allTasks.filter(t => t.id !== task?.id && (!task || !task.parentId || t.id !== task.parentId));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Criar Nova Tarefa"}</DialogTitle>
          <DialogDescription>
            {task ? "Atualize os detalhes da tarefa." : "Preencha os detalhes da nova tarefa."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Tarefa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Desenvolver página de login" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um responsável" />
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
               <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {configuration.statuses.map(status => (
                           <SelectItem key={status.id} value={status.name}>{status.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarefa Pai</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'null'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhuma (tarefa principal)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Nenhuma (tarefa principal)</SelectItem>
                        {possibleParents.map((parentTask) => (
                          <SelectItem key={parentTask.id} value={parentTask.id}>{parentTask.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="dependencies"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Dependências</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                "w-full justify-between",
                                !field.value?.length && "text-muted-foreground"
                                )}
                            >
                                {field.value && field.value.length > 0
                                ? `${field.value.length} selecionada(s)`
                                : "Selecione as dependências"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                            <CommandInput placeholder="Buscar tarefa..." />
                            <CommandList>
                                <CommandEmpty>Nenhuma tarefa encontrada.</CommandEmpty>
                                <CommandGroup>
                                {possibleDependencies.map((depTask) => (
                                    <CommandItem
                                    key={depTask.id}
                                    onSelect={() => {
                                        const selected = field.value || [];
                                        const isSelected = selected.includes(depTask.id);
                                        const newSelected = isSelected
                                        ? selected.filter((id) => id !== depTask.id)
                                        : [...selected, depTask.id];
                                        field.onChange(newSelected);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        (field.value || []).includes(depTask.id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {depTask.name}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                ) : (
                                    <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
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
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                ) : (
                                    <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormItem>
                    <FormLabel>Esforço Planejado</FormLabel>
                    <div className="flex gap-2">
                        <FormField
                        control={form.control}
                        name="plannedEffort"
                        render={({ field }) => (
                            <FormControl>
                                <Input type="number" placeholder="Ex: 80" {...field} />
                            </FormControl>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="plannedEffortUnit"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="hours">Horas</SelectItem>
                                    <SelectItem value="days">Dias</SelectItem>
                                    <SelectItem value="weeks">Semanas</SelectItem>
                                    <SelectItem value="months">Meses</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        />
                    </div>
                    <FormMessage>{form.formState.errors.plannedHours?.message}</FormMessage>
                </FormItem>
                 <FormItem>
                    <FormLabel>Esforço Real</FormLabel>
                    <div className="flex gap-2">
                        <FormField
                        control={form.control}
                        name="actualEffort"
                        render={({ field }) => (
                            <FormControl>
                                <Input type="number" placeholder="Ex: 95" {...field} />
                            </FormControl>
                        )}
                        />
                         <FormField
                        control={form.control}
                        name="actualEffortUnit"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="hours">Horas</SelectItem>
                                    <SelectItem value="days">Dias</SelectItem>
                                    <SelectItem value="weeks">Semanas</SelectItem>
                                    <SelectItem value="months">Meses</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        />
                    </div>
                    <FormMessage>{form.formState.errors.actualHours?.message}</FormMessage>
                </FormItem>
            </div>

            <FormField
              control={form.control}
              name="isMilestone"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>É um Marco?</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Marcos são pontos de verificação importantes no projeto.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Tarefa</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
