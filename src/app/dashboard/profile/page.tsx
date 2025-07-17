// src/app/dashboard/profile/page.tsx
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { users } from "@/lib/data";

export default function ProfilePage() {
  // In a real app, you'd get the currently logged-in user.
  // We'll use the first user as a placeholder.
  const currentUser = users[0];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
            <p className="text-muted-foreground">
                Gerencie suas informações pessoais e configurações de segurança.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <ProfileForm user={currentUser} />
      </div>
    </div>
  );
}
