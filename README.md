# Tô de Olho! - Sistema de Gerenciamento de Projetos

Sistema completo de gerenciamento de projetos com IA integrada, desenvolvido com Next.js e Supabase.

## Configuração

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente no arquivo `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase
   - `GOOGLE_GENAI_API_KEY`: Chave da API do Google AI (para funcionalidades de IA)

4. Execute as migrações do Supabase para criar o schema do banco
5. Inicie o servidor de desenvolvimento: `npm run dev`

## Funcionalidades

- Gerenciamento completo de projetos e tarefas
- Análise preditiva com IA
- Gráfico de Gantt interativo
- Múltiplas visualizações (Kanban, Calendário, Roadmap)
- Sistema de alertas automáticos
- Relatórios e dashboards
- Gerenciamento de usuários e permissões

## Tecnologias

- Next.js 15
- Supabase (PostgreSQL)
- TypeScript
- Tailwind CSS
- Genkit (Google AI)
- Recharts
- React Hook Form