import { redirect } from 'next/navigation';

export default function DashboardRedirectPage() {
  // Redirect to the first project by default
  redirect('/dashboard/projects/proj-1');
}
