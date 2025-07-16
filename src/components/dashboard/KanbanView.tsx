// src/components/dashboard/KanbanView.tsx
"use client";

import { useMemo } from 'react';
import type { Project, Task, StatusDefinition } from "@/lib/types";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface KanbanViewProps {
  project: Project;
  onTaskStatusChange: (taskId: string, newStatus: string) => void;
}

const KanbanTaskCard = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <Card ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-4 bg-card hover:shadow-md cursor-grab active:cursor-grabbing">
            <CardContent className="p-3">
                <p className="font-semibold text-sm mb-2">{task.name}</p>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Badge variant={task.priority === 'Alta' ? 'destructive' : task.priority === 'Média' ? 'secondary' : 'outline'}>
                            {task.priority || 'Média'}
                        </Badge>
                    </div>
                    <Avatar className="h-6 w-6">
                        <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            </CardContent>
        </Card>
    );
};

const KanbanColumn = ({ status, tasks }: { status: StatusDefinition, tasks: Task[] }) => {
    const { setNodeRef } = useSortable({ id: status.id });
    const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);
    
    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-72">
            <Card className="bg-muted/50 h-full">
                <CardHeader className="p-4 border-b">
                    <CardTitle className="text-base flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                        {status.name}
                        <Badge variant="secondary" className="ml-auto">{tasks.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    <ScrollArea className="h-[calc(100vh-20rem)]">
                        <SortableContext items={taskIds} strategy={rectSortingStrategy}>
                            {tasks.map(task => (
                                <KanbanTaskCard key={task.id} task={task} />
                            ))}
                        </SortableContext>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};

export function KanbanView({ project, onTaskStatusChange }: KanbanViewProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const tasksByStatus = useMemo(() => {
        const groupedTasks = new Map<string, Task[]>();
        project.configuration.statuses.forEach(status => {
            groupedTasks.set(status.name, []);
        });
        project.tasks.forEach(task => {
            if (groupedTasks.has(task.status)) {
                groupedTasks.get(task.status)?.push(task);
            }
        });
        return groupedTasks;
    }, [project.tasks, project.configuration.statuses]);
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            const activeTask = project.tasks.find(t => t.id === active.id);
            if (!activeTask) return;
            
            // Find which column the `over` element belongs to
            let newStatusName: string | null = null;
            
            // Check if we dropped over a column (status id)
            const overStatus = project.configuration.statuses.find(s => s.id === over.id);
            if(overStatus) {
                newStatusName = overStatus.name;
            } else {
                 // Or if we dropped over another task
                 const overTask = project.tasks.find(t => t.id === over.id);
                 if (overTask) {
                     newStatusName = overTask.status;
                 }
            }
            
            if (newStatusName && activeTask.status !== newStatusName) {
                onTaskStatusChange(active.id as string, newStatusName);
            }
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-6 p-1">
                    {project.configuration.statuses.map(status => (
                        <KanbanColumn
                            key={status.id}
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
