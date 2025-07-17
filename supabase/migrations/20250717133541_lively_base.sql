/*
  # Schema inicial para o sistema de gerenciamento de projetos

  1. Novas Tabelas
    - `users` - Usuários do sistema
    - `projects` - Projetos
    - `project_team` - Relacionamento entre projetos e usuários (equipe)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Adicionar políticas para usuários autenticados
*/

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text,
  role text DEFAULT 'Viewer',
  avatar text,
  status text DEFAULT 'active',
  phone text,
  must_change_password boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de projetos
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid REFERENCES users(id),
  planned_start_date timestamptz NOT NULL,
  planned_end_date timestamptz NOT NULL,
  actual_start_date timestamptz,
  actual_end_date timestamptz,
  planned_budget numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  tasks jsonb DEFAULT '[]'::jsonb,
  kpis jsonb DEFAULT '{}'::jsonb,
  baseline_saved_at timestamptz,
  configuration jsonb NOT NULL,
  critical_path jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de equipe do projeto
CREATE TABLE IF NOT EXISTS project_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Viewer',
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Usuários podem ver todos os usuários"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins podem gerenciar usuários"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'Admin'
    )
  );

-- Políticas para projetos
CREATE POLICY "Usuários podem ver projetos da sua equipe"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_team 
      WHERE project_team.project_id = projects.id 
      AND project_team.user_id::text = auth.uid()::text
    )
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'Admin'
    )
  );

CREATE POLICY "Gerentes podem atualizar seus projetos"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    manager_id::text = auth.uid()::text
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'Admin'
    )
  );

CREATE POLICY "Admins podem criar projetos"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'Admin'
    )
  );

-- Políticas para equipe do projeto
CREATE POLICY "Usuários podem ver equipes dos seus projetos"
  ON project_team
  FOR SELECT
  TO authenticated
  USING (
    user_id::text = auth.uid()::text
    OR 
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_team.project_id 
      AND projects.manager_id::text = auth.uid()::text
    )
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'Admin'
    )
  );

CREATE POLICY "Gerentes podem gerenciar equipe dos seus projetos"
  ON project_team
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_team.project_id 
      AND projects.manager_id::text = auth.uid()::text
    )
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'Admin'
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();