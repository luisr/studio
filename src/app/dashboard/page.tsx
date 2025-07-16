import { redirect } from 'next/navigation';

export default function DashboardRedirectPage() {
  // Redireciona para o primeiro projeto por padrão
  redirect('/dashboard/projects/proj-1');
}
