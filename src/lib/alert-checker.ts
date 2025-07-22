// src/lib/alert-checker.ts
import { isAfter, startOfToday } from 'date-fns';
import type { Project, Task, AlertRule, ActiveAlert } from './types';

export function checkAlerts(project: Project): ActiveAlert[] {
  const { tasks, configuration, plannedBudget, actualCost } = project;
  const alertRules = configuration.alertRules || [];
  const triggeredAlerts: ActiveAlert[] = [];
  const today = startOfToday();

  // Helper to prevent duplicate alert messages
  const addAlert = (alert: Omit<ActiveAlert, 'id'>) => {
    const fullAlert = { ...alert, id: `active-alert-${Date.now()}-${Math.random()}` };
    if (!triggeredAlerts.some(a => a.message === fullAlert.message)) {
      triggeredAlerts.push(fullAlert);
    }
  };

  alertRules.forEach(rule => {
    switch (rule.metric) {
      case 'task_status':
        if (rule.condition === 'changes_to') {
            tasks.forEach(task => {
                if(task.status === rule.value) {
                    addAlert({
                        message: `A tarefa "${task.name}" mudou para o status "${rule.value}".`,
                        ruleId: rule.id,
                        severity: 'info',
                    });
                }
            })
        }
        break;

      case 'task_priority':
         if (rule.condition === 'is') {
            tasks.forEach(task => {
                if(task.priority === rule.value) {
                    addAlert({
                        message: `A tarefa "${task.name}" tem prioridade "${rule.value}".`,
                        ruleId: rule.id,
                        severity: 'warning',
                    });
                }
            })
        }
        break;

      case 'task_overdue':
        if (rule.condition === 'becomes') {
            const completedStatus = configuration.statuses.find(s => s.isCompleted)?.name;
            tasks.forEach(task => {
                const endDate = new Date(task.plannedEndDate);
                if (task.status !== completedStatus && isAfter(today, endDate)) {
                    addAlert({
                        message: `A tarefa "${task.name}" está atrasada. O prazo era ${endDate.toLocaleDateString()}.`,
                        ruleId: rule.id,
                        severity: 'critical',
                    });
                }
            });
        }
        break;

      case 'budget_usage':
        if (rule.condition === 'exceeds_percentage') {
          const percentageThreshold = parseFloat(rule.value);
          if (!isNaN(percentageThreshold) && plannedBudget > 0) {
            const currentUsage = (actualCost / plannedBudget) * 100;
            if (currentUsage > percentageThreshold) {
              addAlert({
                message: `O uso do orçamento (${currentUsage.toFixed(0)}%) excedeu o limite de ${percentageThreshold}%.`,
                ruleId: rule.id,
                severity: 'critical',
              });
            }
          }
        }
        break;
    }
  });

  return triggeredAlerts;
}
