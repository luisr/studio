// src/app/dashboard/projects/[id]/page.tsx
'use client'

import { useState, useMemo, useEffect, use } from "react";
import type { Project, Task } from "@/lib/types";
import { notFound } from "next/navigation";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { TasksTable } from "@/components/dashboard/tasks-table";
import { CheckCircle, Clock, DollarSign, ListTodo, BarChart, AlertTriangle, Target, BrainCircuit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TaskFilters } from "@/components/dashboard/task-filters";
import { TaskForm } from "@/components/dashboard/task-form";
import { AiAnalysisTab } from "@/components/dashboard/ai-analysis-tab";
import { projects } from "@/lib/data";
import { ProjectDashboardClient } from "@/components/dashboard/project-dashboard-client";

const getProject = (id: string): Project | undefined => {
  return projects.find((p) => p.id === id);
};

export default function ProjectDashboardPage({ params }: { params: { id: string } }) {
  const project = getProject(params.id);

  if (!project) {
    notFound();
  }

  return <ProjectDashboardClient initialProject={project} />;
}
