// src/lib/data.bak.ts
// This file can be used to store backup or default data structures.
import type { ProjectConfiguration } from './types';

export const defaultConfiguration: ProjectConfiguration = {
    statuses: [
        { id: 'status-1', name: 'A Fazer', color: '#808080', isDefault: true },
        { id: 'status-2', name: 'Em Andamento', color: '#3b82f6' },
        { id: 'status-3', name: 'Bloqueado', color: '#f97316' },
        { id: 'status-4', name: 'Concluído', color: '#22c55e', isCompleted: true },
    ],
    visibleKpis: {
        totalTasks: true,
        completedTasks: true,
        overallProgress: true,
        plannedBudget: true,
        actualCost: true,
        costVariance: true,
        spi: true,
        cpi: true,
    },
    customKpis: [],
    customFieldDefinitions: [],
    customCharts: [],
    alertRules: [],
};
