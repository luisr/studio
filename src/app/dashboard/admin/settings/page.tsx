// src/app/dashboard/admin/settings/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Upload, Server } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
    const { toast } = useToast();

    const handleExport = () => {
        toast({
            title: "Exportação Iniciada",
            description: "O backup completo do sistema está sendo gerado...",
        });
        // Lógica de exportação simulada
        setTimeout(() => {
            toast({
                title: "Backup Concluído",
                description: "O arquivo de backup 'backup-completo.json' foi baixado.",
            });
        }, 3000);
    };

    const handleImport = () => {
        // Em um app real, abriria um seletor de arquivo
        toast({
            title: "Importação de Backup",
            description: "Selecione um arquivo de backup para restaurar o sistema.",
        });
    };

  return (
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
            <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Backup Completo
            </Button>
             <Button variant="outline" onClick={handleImport}>
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
  );
}
