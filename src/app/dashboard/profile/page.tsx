// src/app/dashboard/profile/page.tsx
'use client'

import { ProfileForm } from "@/components/dashboard/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user: currentUser, loading } = useAuth();

  if (loading) {
     return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
            <div className="max-w-2xl mx-auto">
                 <Skeleton className="h-10 w-1/3 mb-8" />
                 <Skeleton className="h-64 w-full" />
            </div>
        </div>
     )
  }

  if (!currentUser) {
     return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
            <div className="max-w-2xl mx-auto">
                <p>Usuário não encontrado. Por favor, faça o login novamente.</p>
            </div>
        </div>
     );
  }

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

        {currentUser.mustChangePassword && (
           <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ação Necessária</AlertTitle>
            <AlertDescription>
              Para sua segurança, você deve alterar sua senha padrão antes de continuar a usar a aplicação.
            </AlertDescription>
          </Alert>
        )}

        <ProfileForm user={currentUser} />
      </div>
    </div>
  );
}
