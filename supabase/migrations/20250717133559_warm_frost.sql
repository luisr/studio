/*
  # Inserir dados de exemplo

  1. Usuários de exemplo
  2. Projeto de exemplo
  3. Equipe do projeto
*/

-- Inserir usuários de exemplo
INSERT INTO users (id, name, email, password, role, avatar, status, phone) VALUES
  ('user-1', 'Alice Silva', 'alice@example.com', 'senha123', 'Admin', 'https://placehold.co/100x100.png', 'active', '111-222-3333'),
  ('user-2', 'Bob Santos', 'bob@example.com', 'senha123', 'Editor', 'https://placehold.co/100x100.png', 'active', '222-333-4444'),
  ('user-3', 'Charlie Oliveira', 'charlie@example.com', 'senha123', 'Editor', 'https://placehold.co/100x100.png', 'active', '333-444-5555'),
  ('user-4', 'Diana Costa', 'diana@example.com', 'senha123', 'Viewer', 'https://placehold.co/100x100.png', 'inactive', '444-555-6666')
ON CONFLICT (email) DO NOTHING;

-- Inserir projeto de exemplo
INSERT INTO projects (
  id, 
  name, 
  description, 
  manager_id, 
  planned_start_date, 
  planned_end_date, 
  planned_budget, 
  actual_cost,
  configuration,
  tasks,
  kpis
) VALUES (
  'proj-1',
  'Sistema de E-commerce "Nexus"',
  'Desenvolvimento de uma nova plataforma de e-commerce com foco em experiência do usuário e performance.',
  'user-1',
  '2024-01-01T00:00:00Z',
  '2024-06-30T00:00:00Z',
  500000,
  250000,
  '{
    "statuses": [
      {"id": "status-1", "name": "A Fazer", "color": "#808080", "isDefault": true},
      {"id": "status-2", "name": "Em Andamento", "color": "#3b82f6"},
      {"id": "status-3", "name": "Concluído", "color": "#22c55e", "isCompleted": true},
      {"id": "status-4", "name": "Bloqueado", "color": "#ef4444"}
    ],
    "visibleKpis": {
      "totalTasks": true,
      "completedTasks": true,
      "overallProgress": true,
      "plannedBudget": true,
      "actualCost": true,
      "costVariance": true,
      "spi": true,
      "cpi": true
    },
    "customKpis": [],
    "customCharts": [],
    "customFieldDefinitions": [
      {"id": "sprint", "name": "Sprint", "type": "text"}
    ],
    "alertRules": [
      {
        "id": "alert-1",
        "metric": "task_status",
        "condition": "changes_to",
        "value": "Bloqueado",
        "label": "Alertar quando Status da Tarefa muda para Bloqueado"
      }
    ]
  }',
  '[
    {
      "id": "task-1",
      "name": "Fase 1: Planejamento e Design",
      "assignee": {"id": "user-1", "name": "Alice Silva", "email": "alice@example.com", "avatar": "https://placehold.co/100x100.png", "status": "active"},
      "status": "Concluído",
      "priority": "Alta",
      "progress": 100,
      "plannedStartDate": "2024-01-01T00:00:00Z",
      "plannedEndDate": "2024-01-31T00:00:00Z",
      "actualStartDate": "2024-01-05T00:00:00Z",
      "actualEndDate": "2024-02-05T00:00:00Z",
      "plannedHours": 120,
      "actualHours": 130,
      "dependencies": [],
      "isCritical": true,
      "isMilestone": true,
      "changeHistory": [
        {
          "fieldChanged": "plannedEndDate",
          "oldValue": "2024-01-31",
          "newValue": "2024-02-05",
          "user": "Alice",
          "timestamp": "2024-01-20T10:00:00Z",
          "justification": "Atraso na definição de requisitos pelo cliente."
        }
      ],
      "customFields": {"sprint": "Sprint 1"}
    },
    {
      "id": "task-2",
      "name": "Fase 2: Desenvolvimento do Frontend",
      "assignee": {"id": "user-2", "name": "Bob Santos", "email": "bob@example.com", "avatar": "https://placehold.co/100x100.png", "status": "active"},
      "status": "Em Andamento",
      "priority": "Alta",
      "progress": 60,
      "plannedStartDate": "2024-02-01T00:00:00Z",
      "plannedEndDate": "2024-04-30T00:00:00Z",
      "actualStartDate": "2024-02-06T00:00:00Z",
      "plannedHours": 300,
      "actualHours": 180,
      "dependencies": ["task-1"],
      "isCritical": true,
      "isMilestone": true,
      "changeHistory": [],
      "customFields": {"sprint": "Sprint 2"}
    },
    {
      "id": "task-3",
      "name": "Fase 3: Desenvolvimento do Backend",
      "assignee": {"id": "user-3", "name": "Charlie Oliveira", "email": "charlie@example.com", "avatar": "https://placehold.co/100x100.png", "status": "active"},
      "status": "A Fazer",
      "priority": "Alta",
      "progress": 0,
      "plannedStartDate": "2024-02-15T00:00:00Z",
      "plannedEndDate": "2024-05-15T00:00:00Z",
      "plannedHours": 350,
      "actualHours": 0,
      "dependencies": ["task-1"],
      "isCritical": true,
      "isMilestone": true,
      "changeHistory": [],
      "customFields": {"sprint": "Sprint 3"}
    }
  ]',
  '{
    "Variação de Prazo (dias)": 15,
    "Variação de Custo (R$)": -50000,
    "Progresso Total (%)": 53,
    "Tarefas Críticas Atrasadas": 1
  }'
) ON CONFLICT (id) DO NOTHING;

-- Inserir equipe do projeto
INSERT INTO project_team (project_id, user_id, role) VALUES
  ('proj-1', 'user-1', 'Manager'),
  ('proj-1', 'user-2', 'Editor'),
  ('proj-1', 'user-3', 'Editor'),
  ('proj-1', 'user-4', 'Viewer')
ON CONFLICT (project_id, user_id) DO NOTHING;