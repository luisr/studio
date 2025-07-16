// src/app/dashboard/projects/page.tsx
import { redirect } from 'next/navigation';

export default function ProjectsRedirectPage() {
    // Redirect to the main dashboard page, which now lists projects.
    redirect('/dashboard');
}
