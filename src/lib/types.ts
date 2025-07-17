export interface ChangeLog {
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  user: string;
  timestamp: string;
  justification: string;
}

export type ProjectRole = 'Manager' | 'Editor' | 'Viewer';

export interface TeamMember {
  user: User;
  role: ProjectRole;
}

export type UserRole = 'Admin' | 'Editor' | 'Viewer';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  password?: string;
  mustChangePassword?: boolean;
  phone?: string;
  role?: UserRole; // Global/default role
  status: UserStatus;
}

export interface Attachment {
  id: string;
  name: string;
  url: string; // data URI
  type: string; // MIME type
  taskId: string;
  taskName: string;
  timestamp: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date';
}

export interface StatusDefinition {
    id: string;
    name: string;
    color: string;
    isCompleted?: boolean;
    isDefault?: boolean;
}

export interface CustomKpiDefinition {
  id: string;
  name: string;
  field: 'plannedHours' | 'actualHours';
  aggregation: 'sum' | 'average' | 'count';
  icon: 'BarChart' | 'Clock' | 'DollarSign' | 'ListTodo' | 'Target' | 'AlertTriangle';
}

export type ChartType = 'bar' | 'pie' | 'line' | 'horizontalBar';

export interface CustomChartDefinition {
  id: string;
  name: string;
  type: ChartType;
  // For Bar, Horizontal Bar, and Line charts
  xAxisField?: 'status' | 'priority' | 'assignee' | string; // string for custom fields
  yAxisField?: 'plannedHours' | 'actualHours';
  yAxisAggregation?: 'sum' | 'average';
  // For Pie charts
  segmentField?: 'status' | 'priority' | 'assignee' | string;
  valueField?: 'plannedHours' | 'actualHours' | 'count';
}

export type AlertMetric = 'task_status' | 'task_priority' | 'task_overdue' | 'budget_usage';
export type AlertCondition = 
  | 'is' 
  | 'is_not' 
  | 'changes_to' 
  | 'becomes' 
  | 'exceeds_percentage';

export interface AlertRule {
  id: string;
  metric: AlertMetric;
  condition: AlertCondition;
  value: string; // Could be a status name, priority, or percentage
  label: string;
}

export interface ActiveAlert {
    id: string;
    ruleId: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
}


export interface ProjectConfiguration {
    statuses: StatusDefinition[];
    visibleKpis: Record<string, boolean>;
    customKpis: CustomKpiDefinition[];
    customCharts?: CustomChartDefinition[];
    customFieldDefinitions: CustomFieldDefinition[];
    alertRules?: AlertRule[];
}

export type BulkAction = 'delete' | 'duplicate' | 'move';

export interface Task {
  id: string;
  name: string;
  assignee: User;
  status: string; // Changed from enum to string to allow custom statuses
  progress: number; // Percentage from 0 to 100
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
  attachments?: Attachment[];
}

export interface Project {
  id: string;
  name:string;
  description: string;
  manager: User;
  team: TeamMember[];
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
  configuration: ProjectConfiguration;
  criticalPath?: string[];
}
