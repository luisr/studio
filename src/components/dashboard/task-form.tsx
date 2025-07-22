// src/components/dashboard/task-form.tsx
"use client";

import { useEffect, useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Task, User, Project, Attachment, ChangeLog } from "@/lib/types";
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
import { CalendarIcon, Check, ChevronsUpDown, Paperclip, X, History, UserCircle } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { format, differenceInDays, addDays, formatDistanceToNow } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Switch } from "../ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Textarea } from "../ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Badge } from "../ui/badge";
import { Slider } from "../ui/slider";

import { taskSchema } from '@/lib/validation';
import { getBestEffortUnit, convertEffortToHours, type EffortUnit } from '@/lib/utils/effort';
import { fileToDataUrl } from '@/lib/utils/file';
import { formatDate } from '@/lib/utils/date';

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: Omit<Task, 'id' | 'changeHistory' | 'isCritical'>, justification: string) => void;
  task: Task | null;
  project: Project;
}

export function TaskForm({ isOpen, onOpenChange, onSave, task, project }: TaskFormProps) {
  const { team: users, tasks: allTasks, configuration } = project;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [justification, setJustification] = useState("");
  const [isJustificationDialogOpen, setIsJustificationDialogOpen] = useState(false);
  const [formDataCache, setFormDataCache] = useState<TaskFormValues | null>(null);
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      assignee: "",
      status: configuration.statuses.find(s => s.isDefault)?.name || "",
      priority: "Média",
      progress: 0,
      plannedEffort: 0,
      plannedEffortUnit: 'hours',
      actualEffort: 0,
      actualEffortUnit: 'hours',
      plannedHours: 0,
      actualHours: 0,
      parentId: null,
      isMilestone: false,
      dependencies: [],
      customFields: {},
      attachments: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      const defaultCustomFields: Record<string, any> = {};
      configuration.customFieldDefinitions?.forEach(def => {
          defaultCustomFields[def.id] = '';
      });
      
      if (task) {
         const plannedEffortDisplay = getBestEffortUnit(task.plannedHours);
         const actualEffortDisplay = getBestEffortUnit(task.actualHours);
        form.reset({
          name: task.name,
          assignee: task.assignee.id,
          status: task.status,
          priority: task.priority || 'Média',
          progress: task.progress || 0,
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
          customFields: { ...defaultCustomFields, ...task.customFields },
          attachments: task.attachments || [],
        });
      } else {
        form.reset({
          name: "",
          assignee: "",
          status: configuration.statuses.find(s => s.isDefault)?.name || "",
          priority: 'Média',
          progress: 0,
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
          customFields: defaultCustomFields,
          attachments: [],
        });
      }
    }
  }, [task, form, isOpen, configuration]);

  // Watch for changes in the start date to update the end date
  useEffect(() => {
      const subscription = form.watch((value, { name, type }) => {
        if (name === 'plannedStartDate' && type === 'change') {
            const startDate = value.plannedStartDate;
            const oldStartDate = task ? new Date(task.plannedStartDate) : new Date();
            const oldEndDate = task ? new Date(task.plannedEndDate) : new Date();
            
            if (startDate) {
                const duration = differenceInDays(oldEndDate, oldStartDate);
                const newEndDate = addDays(startDate, duration);
                form.setValue('plannedEndDate', newEndDate, { shouldValidate: true });
            }
        }
      });
      return () => subscription.unsubscribe();
  }, [form, task]);


 const onSubmit = (data: TaskFormValues) => {
    // If we're editing an existing task, check if critical fields have changed.
    if (task) {
        const criticalFields: (keyof TaskFormValues)[] = ['name', 'status', 'priority', 'plannedStartDate', 'plannedEndDate', 'plannedHours', 'progress'];
        const hasCriticalChanges = criticalFields.some(field => {
            const formValue = JSON.stringify(data[field]);
            // Re-create the initial value from `task` for comparison
            let taskValue;
            if (field === 'plannedStartDate' || field === 'plannedEndDate') {
                taskValue = JSON.stringify(new Date(task[field] as string));
            } else if (field === 'plannedHours') {
                 taskValue = JSON.stringify(task.plannedHours);
            } else if(field === 'progress') {
                taskValue = JSON.stringify(task.progress || 0);
            } else {
                 taskValue = JSON.stringify(task[field as keyof Task]);
            }
            return formValue !== taskValue;
        });

        if (hasCriticalChanges) {
            setFormDataCache(data); // Cache the form data
            setIsJustificationDialogOpen(true); // Open the justification dialog
            return; // Stop the submission here
        }
    }
    
    // Proceed with saving if it's a new task or no critical changes were made.
    saveTask(data, "Criação da tarefa");
  };

  const saveTask = (data: TaskFormValues, justification: string) => {
    const selectedUser = users.find(u => u.user.id === data.assignee);
    if (!selectedUser) return;

    // Convert effort from UI to hours for storage
    const plannedHours = convertEffortToHours(data.plannedEffort, data.plannedEffortUnit);
    const actualHours = convertEffortToHours(data.actualEffort, data.actualEffortUnit);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { plannedEffort, plannedEffortUnit, actualEffort, actualEffortUnit, ...dataToSave } = data;

    onSave({
        ...dataToSave,
        plannedHours,
        actualHours,
        parentId: data.parentId === "null" ? null : data.parentId,
        assignee: selectedUser.user,
        plannedStartDate: data.plannedStartDate.toISOString(),
        plannedEndDate: data.plannedEndDate.toISOString(),
        dependencies: data.dependencies || [],
        customFields: data.customFields || {},
        attachments: data.attachments || [],
    }, justification);
  };

  const handleJustificationSubmit = () => {
    if (formDataCache && justification.trim()) {
        saveTask(formDataCache, justification);
        setIsJustificationDialogOpen(false);
        setJustification('');
    } else {
        toast({
            title: "Justificativa Necessária",
            description: "Por favor, forneça uma justificativa para as alterações.",
            variant: "destructive"
        });
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const newAttachments: Attachment[] = await Promise.all(
        Array.from(files).map(async file => {
          const url = await fileToDataUrl(file);
          return {
            id: `att-${Date.now()}-${Math.random()}`,
            name: file.name,
            url,
            type: file.type,
            taskId: task?.id || 'new-task',
            taskName: form.getValues('name') || 'Nova Tarefa',
            timestamp: new Date().toISOString(),
          };
        })
      );
      
      const currentAttachments = form.getValues('attachments') || [];
      form.setValue('attachments', [...currentAttachments, ...newAttachments]);

    } catch (error) {
       toast({
        title: "Erro no Upload",
        description: "Falha ao ler o arquivo selecionado.",
        variant: "destructive"
      });
      console.error(error);
    }
     // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    const currentAttachments = form.getValues('attachments') || [];
    form.setValue('attachments', currentAttachments.filter(att => att.id !== id));
  };

  const formatChangeLogValue = (field: string, value: string): string => {
      if (field.toLowerCase().includes('date')) {
          try {
              return formatDate(value);
          } catch {
              return value;
          }
      }
      if(field === 'progress'){
          return `${value}%`;
      }
      return value;
  };

  const possibleParents = allTasks.filter(t => t.id !== task?.id);
  const possibleDependencies = allTasks.filter(t => t.id !== task?.id && (!task || !task.parentId || t.id !== task.parentId));

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Criar Nova Tarefa"}</DialogTitle>
          <DialogDescription>
            {task ? "Atualize os detalhes da tarefa." : "Preencha os detalhes da nova tarefa."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
           <ScrollArea className="h-[65vh] pr-6">
            <div className="space-y-6">
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
                          {users.map((member) => (
                            <SelectItem key={member.user.id} value={member.user.id}>{member.user.name}</SelectItem>
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
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progresso ({field.value}%)</FormLabel>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        max={100}
                        step={5}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
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

              {/* Attachments Section */}
              <div className="space-y-2">
                <FormLabel>Anexos</FormLabel>
                <div className="space-y-2 rounded-lg border p-3">
                  <FormField
                    control={form.control}
                    name="attachments"
                    render={({ field }) => (
                      <>
                        {field.value && field.value.length > 0 ? (
                          <div className="space-y-2">
                            {field.value.map(att => (
                              <div key={att.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                                  {att.name}
                                </a>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttachment(att.id)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center p-2">Nenhum anexo.</p>
                        )}
                      </>
                    )}
                  />
                   <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="mr-2 h-4 w-4" /> Adicionar Anexo
                  </Button>
                  <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                </div>
              </div>
              
              {configuration.customFieldDefinitions && configuration.customFieldDefinitions.length > 0 && (
                <div>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <h3 className="text-md font-medium">Campos Personalizados</h3>
                    {configuration.customFieldDefinitions.map(def => (
                       <FormField
                        key={def.id}
                        control={form.control}
                        name={`customFields.${def.id}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{def.name}</FormLabel>
                            <FormControl>
                              <div>
                                {def.type === 'text' && <Input {...field} value={field.value || ''} />}
                                {def.type === 'number' && <Input type="number" {...field} value={field.value || ''} />}
                                {def.type === 'date' && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : <span>Escolha uma data</span>}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={field.value ? new Date(field.value) : undefined}
                                        onSelect={(date) => field.onChange(date?.toISOString())}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {task && (
                <div>
                  <Separator className="my-6" />
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="link" className="p-0 text-muted-foreground">
                        <History className="mr-2 h-4 w-4" />
                        Ver Histórico de Alterações
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-4 space-y-4 max-h-48 overflow-y-auto pr-2">
                        {task.changeHistory && task.changeHistory.length > 0 ? (
                           [...task.changeHistory].reverse().map((log: ChangeLog) => (
                              <div key={log.timestamp} className="text-xs p-3 rounded-md bg-muted/50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold flex items-center gap-1"><UserCircle className="h-3 w-3" />{log.user}</span>
                                    <span className="text-muted-foreground">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: ptBR })}</span>
                                </div>
                                <div>
                                    Alterou <Badge variant="secondary">{log.fieldChanged}</Badge> de <Badge variant="outline">{formatChangeLogValue(log.fieldChanged, log.oldValue)}</Badge> para <Badge variant="outline">{formatChangeLogValue(log.fieldChanged, log.newValue)}</Badge>.
                                </div>
                                <div className="mt-1 italic text-muted-foreground">
                                    <strong>Justificativa:</strong> {log.justification}
                                </div>
                              </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">Nenhuma alteração registrada.</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}


            </div>
           </ScrollArea>

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Tarefa</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={isJustificationDialogOpen} onOpenChange={setIsJustificationDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Justificar Alteração</AlertDialogTitle>
                <AlertDialogDescription>
                    Você fez alterações importantes na tarefa. Por favor, forneça uma justificativa para registrar no histórico.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea 
                placeholder="Ex: Replanejamento devido a mudança no escopo solicitado pelo cliente."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
            />
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setJustification('')}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleJustificationSubmit}>Salvar Alterações</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
