// src/app/dashboard/admin/settings/page.tsx
'use client';

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Upload, Server, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { projects, users } from "@/lib/data";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


export default function AdminSettingsPage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [backupFile, setBackupFile] = useState<File | null>(null);

    const handleExport = () => {
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
                    Object.assign(projects, backupData.projects);
                    Object.assign(users, backupData.users);
                    
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
        <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Server className="h-5 w-5"/>
                    <h4 className="font-semibold">Uso de Armazenamento</h4>
                </div>
                <p className="text-2xl font-bold">1.2 GB / 10 GB</p>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary mt-2">
                    <div className="absolute h-full w-full flex-1 bg-primary transition-all" style={{width: '12%'}}></div>
                </div>
            </div>
             <div className="p-4 border rounded-lg">
                 <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Server className="h-5 w-5"/>
                    <h4 className="font-semibold">Uso da IA</h4>
                </div>
                <p className="text-2xl font-bold">1,250 <span className="text-base text-muted-foreground">chamadas/mês</span></p>
                <p className="text-xs text-muted-foreground">O limite é de 10,000 chamadas/mês.</p>
            </div>
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
