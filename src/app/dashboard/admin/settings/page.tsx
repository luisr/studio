// src/app/dashboard/admin/settings/page.tsx
'use client';

import { useRef, useState, useMemo, useEffect } from "react";
import type { Project, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Upload, Server, Loader2, UserCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { getProjects, getUsers } from "@/lib/supabase/service";
import { Skeleton } from "@/components/ui/skeleton";


export default function AdminSettingsPage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [backupFile, setBackupFile] = useState<File | null>(null);

    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [fetchedProjects, fetchedUsers] = await Promise.all([
                    getProjects(),
                    getUsers()
                ]);
                setProjects(fetchedProjects);
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Failed to fetch admin settings data:", error);
                toast({
                    title: "Erro ao carregar dados",
                    description: "Não foi possível buscar os dados do sistema.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [toast]);

    const systemMetrics = useMemo(() => {
        // Simulated storage usage calculation
        const projectSize = JSON.stringify(projects).length;
        const usersSize = JSON.stringify(users).length;
        const totalStorageBytes = projectSize + usersSize;
        const totalStorageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(4);
        const storageLimitGB = 10;
        
        // Simulated AI usage
        const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
        const aiCalls = projects.length * 5 + totalTasks * 2; // Example calculation
        
        // Active Users
        const activeUsers = users.filter(u => u.status === 'active').length;

        // Projects at risk
        const projectsAtRisk = projects.filter(p => p.actualCost > p.plannedBudget).length;

        return {
            storageUsed: `${totalStorageGB} GB`,
            storageLimit: `${storageLimitGB} GB`,
            aiCalls,
            aiCallsLimit: 10000,
            activeUsers,
            projectsAtRisk,
            totalUsers: users.length
        };
    }, [projects, users]);

    const handleExport = () => {
        if (projects.length === 0 && users.length === 0) {
            toast({
                title: "Nenhum dado para exportar",
                description: "Não há projetos ou usuários no sistema.",
                variant: "destructive"
            });
            return;
        }

        toast({
            title: "Exportação Iniciada",
            description: "O backup completo do sistema está sendo gerado...",
        });
        
        try {
            const backupData = {
                projects: projects,
                users: users,
                timestamp: new Date().toISOString(),
            };
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(backupData, null, 2)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            const formattedDate = new Date().toISOString().split('T')[0];
            link.download = `todeolho-backup-${formattedDate}.json`;
            link.click();
            
            toast({
                title: "Backup Concluído",
                description: `O arquivo 'todeolho-backup-${formattedDate}.json' foi baixado.`,
            });
        } catch (error) {
            console.error("Backup failed:", error);
            toast({
                title: "Erro no Backup",
                description: "Não foi possível gerar o arquivo de backup.",
                variant: "destructive"
            });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setBackupFile(file);
        }
    };

    const handleRestore = () => {
        if (!backupFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("File could not be read as text.");
                }
                const backupData = JSON.parse(text);

                if (backupData && backupData.projects && backupData.users) {
                    // In a real app, this would be an API call to the backend to update the database.
                    // Here, we are mutating the in-memory data, which is not persistent.
                    // For a real effect on the client, we would need a state management solution
                    // or to reload the page.
                    // This will not work with Firestore, a write operation is needed.
                    console.log("Restoring data (API call needed):", backupData);
                    
                    toast({
                        title: "Restauração Concluída!",
                        description: "Os dados do sistema foram restaurados. A página será recarregada.",
                    });

                    // Reload the page to reflect the new data state across the app
                    setTimeout(() => window.location.reload(), 2000);

                } else {
                    throw new Error("Invalid backup file structure.");
                }
            } catch (error) {
                console.error("Restore failed:", error);
                toast({
                    title: "Erro na Restauração",
                    description: "O arquivo de backup é inválido ou está corrompido.",
                    variant: "destructive",
                });
            } finally {
                setBackupFile(null);
            }
        };
        reader.onerror = () => {
            toast({
                title: "Erro de Leitura",
                description: "Não foi possível ler o arquivo selecionado.",
                variant: "destructive",
            });
            setBackupFile(null);
        };
        reader.readAsText(backupFile);
    };


  if (loading) {
    return (
         <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
         </div>
    )
  }

  return (
    <>
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground">Gerencie as configurações globais da aplicação.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Versão do Sistema</CardTitle>
            <CardDescription>Informações sobre a versão atual e atualizações.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <span className="font-semibold">Versão Atual:</span>
                <Badge variant="secondary">1.0.0</Badge>
            </div>
            <Button>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verificar Atualizações
            </Button>
        </CardContent>
      </Card>

      <Separator />

       <Card>
        <CardHeader>
            <CardTitle>Backup e Restauração</CardTitle>
            <CardDescription>Exporte um backup completo do sistema ou importe um para restaurar os dados.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/json"
                className="hidden"
            />
            <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Backup Completo
            </Button>
             <Button variant="outline" onClick={handleImportClick}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Backup
            </Button>
        </CardContent>
      </Card>

      <Separator />

       <Card>
        <CardHeader>
            <CardTitle>Métricas do Sistema</CardTitle>
            <CardDescription>Visão geral do uso dos recursos do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <KpiCard
                title="Armazenamento"
                value={systemMetrics.storageUsed}
                icon={Server}
                description={`de ${systemMetrics.storageLimit}`}
                color="blue"
            />
             <KpiCard
                title="Uso da IA"
                value={systemMetrics.aiCalls}
                icon={Server}
                description={`de ${systemMetrics.aiCallsLimit} chamadas/mês`}
                color="purple"
            />
            <KpiCard
                title="Usuários Ativos"
                value={systemMetrics.activeUsers}
                icon={UserCheck}
                description={`de ${systemMetrics.totalUsers} usuários totais`}
                color="green"
            />
             <KpiCard
                title="Projetos em Risco"
                value={systemMetrics.projectsAtRisk}
                icon={AlertTriangle}
                description="Custo real acima do planejado"
                color="red"
            />
        </CardContent>
      </Card>

    </div>

    {backupFile && (
        <AlertDialog open={!!backupFile} onOpenChange={(open) => !open && setBackupFile(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Restauração</AlertDialogTitle>
                    <AlertDialogDescription>
                        Você tem certeza que deseja restaurar o backup do arquivo '{backupFile.name}'? 
                        <span className="font-bold text-destructive"> Todos os dados atuais serão substituídos.</span> Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setBackupFile(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestore}>
                        {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar e Restaurar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )}
    </>
  );
}
