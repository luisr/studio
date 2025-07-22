// src/app/dashboard/tasks/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Task, Project } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { getProjects } from '@/lib/supabase/service';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PRIORITY_CLASSES } from '@/lib/constants';
import { formatDate } from '@/lib/utils/date';

interface AggregatedTask extends Task {
  projectName: string;
  projectId: string;
}

export default function AllTasksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProjects() {
        setLoading(true);
        try {
            const fetchedProjects = await getProjects();
            setProjects(fetchedProjects);
        } catch (error) {
            toast({
                title: "Erro ao carregar tarefas",
                description: "Não foi possível buscar os dados dos projetos.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }
    fetchProjects();
  }, [toast]);


  const allTasks: AggregatedTask[] = useMemo(() => {
    return projects.flatMap(project =>
      project.tasks.map(task => ({
        ...task,
        projectName: project.name,
        projectId: project.id,
      }))
    );
  }, [projects]);
  
  const allAssignees = useMemo(() => {
    const assignees = new Map<string, {id: string, name: string}>();
    allTasks.forEach(task => {
        if(!assignees.has(task.assignee.id)){
            assignees.set(task.assignee.id, task.assignee);
        }
    });
    return Array.from(assignees.values());
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
      const matchesAssignee = assigneeFilter === 'all' || task.assignee.id === assigneeFilter;
      return matchesSearch && matchesProject && matchesAssignee;
    });
  }, [allTasks, searchTerm, projectFilter, assigneeFilter]);
  

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Card>
            <CardHeader className='border-b'>
                 <Skeleton className="h-10 w-full" />
            </CardHeader>
            <CardContent className="p-0">
                 <div className="p-4 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                 </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Todas as Tarefas</h1>
          <p className="text-muted-foreground">Uma visão consolidada de todas as tarefas em todos os projetos.</p>
        </div>
      </div>

      <Card>
        <CardHeader className='border-b'>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar por nome da tarefa..." 
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
              </div>
              <div className="md:col-span-1">
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                      <SelectTrigger>
                          <SelectValue placeholder="Filtrar por projeto" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">Todos os Projetos</SelectItem>
                          {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <div className="md:col-span-1">
                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                      <SelectTrigger>
                          <SelectValue placeholder="Filtrar por responsável" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">Todos os Responsáveis</SelectItem>
                          {allAssignees.map(assignee => (
                              <SelectItem key={assignee.id} value={assignee.id}>{assignee.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Prazo Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/projects/${task.projectId}`} className="hover:underline">
                        {task.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                       <Link href={`/dashboard/projects/${task.projectId}`} className="text-muted-foreground hover:underline">
                        {task.projectName}
                      </Link>
                    </TableCell>
                    <TableCell>{task.assignee.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={PRIORITY_CLASSES[task.priority || 'Média']}>
                        {task.priority || 'Média'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(task.plannedEndDate)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma tarefa encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
