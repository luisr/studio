// src/app/dashboard/reports/page.tsx
import { projects } from "@/lib/data";
import { Accordion } from "@/components/ui/accordion";
import { ProjectSummaryCard } from "@/components/dashboard/project-summary-card";

export default function ReportsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios Consolidados</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho de todos os seus projetos em um só lugar.
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {projects.map((project) => (
           <ProjectSummaryCard key={project.id} project={project} />
        ))}
      </Accordion>
    </div>
  );
}
