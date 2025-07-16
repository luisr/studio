export interface ChangeLog {
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  user: string;
  timestamp: string;
  justification: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date';
}

export interface Task {
  id: string;
  name: string;
  assignee: User;
  status: 'A Fazer' | 'Em Andamento' | 'Concluído' | 'Bloqueado';
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  plannedHours: number;
  actualHours: number;
  dependencies: string[];
  subTasks?: Task[];
  changeHistory: ChangeLog[];
  isCritical: boolean;
  parentId?: string | null;
  isMilestone?: boolean;
  color?: string;
  baselineStartDate?: string;
  baselineEndDate?: string;
  priority?: 'Alta' | 'Média' | 'Baixa';
  customFields?: { [key: string]: string | number | boolean };
}

export interface Project {
  id: string;
  name:string;
  description: string;
  manager: User;
  team: User[];
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  plannedBudget: number;
  actualCost: number;
  tasks: Task[];
  kpis: {
    [key: string]: number | string;
  };
  baselineSavedAt?: string;
  customFieldDefinitions?: CustomFieldDefinition[];
}
