// src/components/dashboard/KanbanView.tsx
"use client";

import { useMemo } from 'react';
import type { Project, Task, StatusDefinition } from "@/lib/types";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface KanbanViewProps {
  project: Project;
  onTaskStatusChange: (taskId: string, newStatus: string) => void;
}

const KanbanTaskCard = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-4 bg-card hover:shadow-md cursor-grab active:cursor-grabbing touch-none">
            <CardContent className="p-3">
                <p className="font-semibold text-sm mb-2">{task.name}</p>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Badge variant={task.priority === 'Alta' ? 'destructive' : task.priority === 'Média' ? 'secondary' : 'outline'}>
                            {task.priority || 'Média'}
                        </Badge>
                    </div>
                     <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                        <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            </CardContent>
        </Card>
    );
};

const KanbanColumn = ({ status, tasks }: { status: StatusDefinition, tasks: Task[] }) => {
    const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);
    
    return (
        <div className="flex-shrink-0 w-72 h-full">
            <Card className="bg-muted/50 h-full flex flex-col">
                <CardHeader className="p-4 border-b">
                    <CardTitle className="text-base flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                        {status.name}
                        <Badge variant="secondary" className="ml-auto">{tasks.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-grow">
                    <CardContent className="p-2 h-full">
                        <SortableContext items={taskIds} strategy={rectSortingStrategy}>
                            {tasks.map(task => (
                                <KanbanTaskCard key={task.id} task={task} />
                            ))}
                        </SortableContext>
                    </CardContent>
                </ScrollArea>
            </Card>
        </div>
    );
};

export function KanbanView({ project, onTaskStatusChange }: KanbanViewProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const tasksByStatus = useMemo(() => {
        const groupedTasks = new Map<string, Task[]>();
        project.configuration.statuses.forEach(status => {
            groupedTasks.set(status.name, []);
        });
        project.tasks.forEach(task => {
            const taskStatus = task.status || project.configuration.statuses.find(s => s.isDefault)?.name || 'A Fazer';
            if (groupedTasks.has(taskStatus)) {
                groupedTasks.get(taskStatus)?.push(task);
            }
        });
        return groupedTasks;
    }, [project.tasks, project.configuration.statuses]);
    
    const findContainer = (id: string) => {
        if (project.configuration.statuses.some(s => s.name === id)) {
            return id;
        }
        for (const [statusName, tasks] of tasksByStatus.entries()) {
            if (tasks.some(t => t.id === id)) {
                return statusName;
            }
        }
        return null;
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!active || !over) return;
        
        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over.id as string);

        if (!activeContainer || !overContainer || activeContainer !== overContainer) {
            // This handles moving a task to a different column
            const taskId = active.id as string;
            let newStatus = overContainer;

            // If we drop over a task in another column, get that column's status
            if (!project.configuration.statuses.some(s => s.name === newStatus)) {
                const overTask = project.tasks.find(t => t.id === over.id);
                if (overTask) {
                    newStatus = overTask.status;
                }
            }
            
            if (newStatus && newStatus !== activeContainer) {
                onTaskStatusChange(taskId, newStatus);
            }
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-6 p-1 h-[calc(100vh-18rem)]">
                    {project.configuration.statuses.map(status => (
                        <KanbanColumn
                            key={status.name}
                            status={status}
                            tasks={tasksByStatus.get(status.name) || []}
                        />
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </DndContext>
    );
}
