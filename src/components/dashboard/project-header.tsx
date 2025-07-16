import type { Project } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User } from "lucide-react";

export function ProjectHeader({ project }: { project: Project }) {
  return (
    <div className="p-8 bg-card border-b">
      <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
      <p className="mt-2 text-muted-foreground max-w-3xl">{project.description}</p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">Gerente:</span>
          <div className="flex items-center gap-2">
             <Avatar className="h-6 w-6">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${project.manager.id}`} />
              <AvatarFallback>{project.manager.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{project.manager.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">Planejado:</span>
          <span>{new Date(project.plannedStartDate).toLocaleDateString()} - {new Date(project.plannedEndDate).toLocaleDateString()}</span>
        </div>
        {project.actualEndDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium">Realizado:</span>
            <span>{new Date(project.actualStartDate!).toLocaleDateString()} - {new Date(project.actualEndDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
