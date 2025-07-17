// src/app/dashboard/users/page.tsx
'use client';

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserForm } from "@/components/dashboard/user-form";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/supabase/service";


export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { toast } = useToast();
    
    useEffect(() => {
       const userJson = sessionStorage.getItem('currentUser');
       if(userJson) {
          setCurrentUser(JSON.parse(userJson));
       }
       fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
        } catch(e) {
            toast({ title: "Erro ao buscar usuários", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    const handleNewUser = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };
    
    const handleSaveUser = async (userData: Omit<User, 'id'>) => {
        try {
            if(editingUser) { // Update
                await updateUser(editingUser.id, userData);
                toast({ title: "Usuário Atualizado", description: "As informações do usuário foram salvas com sucesso." });
            } else { // Create
                const newUserPayload = {
                    ...userData,
                    password: 'BeachPark@2025',
                    mustChangePassword: true,
                }
                await createUser(newUserPayload);
                toast({ title: "Usuário Criado", description: "O novo usuário foi adicionado com a senha padrão." });
            }
            await fetchUsers(); // Refresh data
            setIsFormOpen(false);
        } catch (e) {
            toast({ title: "Erro ao salvar usuário", variant: 'destructive' })
        }
    }
    
    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUser(userId);
            await fetchUsers(); // Refresh data
            toast({ title: "Usuário Excluído", description: "O usuário foi removido permanentemente.", variant: "destructive"});
        } catch (e) {
             toast({ title: "Erro ao excluir usuário", variant: 'destructive' })
        }
    }
    
    const handleToggleStatus = async (userId: string) => {
       try {
           const user = users.find(u => u.id === userId);
           if (!user) return;
           const newStatus = user.status === 'active' ? 'inactive' : 'active';
           await updateUser(userId, { status: newStatus });
           await fetchUsers(); // Refresh data
           toast({ title: "Status do Usuário Alterado" });
       } catch (e) {
            toast({ title: "Erro ao alterar status", variant: 'destructive' })
       }
    }

    const handleResetPassword = async (userToReset: User) => {
        try {
            await updateUser(userToReset.id, {
                password: 'BeachPark@2025',
                mustChangePassword: true,
            });
            toast({
                title: 'Senha Resetada',
                description: `A senha de ${userToReset.name} foi redefinida para a padrão.`,
            });
        } catch (error) {
            toast({
                title: 'Erro ao Resetar Senha',
                variant: 'destructive',
            });
        }
    }


  return (
    <>
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Adicione, edite e gerencie os usuários do sistema.</p>
        </div>
        {currentUser?.role === 'Admin' && <Button onClick={handleNewUser}>Novo Usuário</Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Total de {users.length} usuários cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Função Global</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">Carregando usuários...</TableCell>
                </TableRow>
              ) : (
                 users.map((user) => (
                    <TableRow key={user.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <span className="font-medium">{user.name}</span>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{user.role || "Membro"}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={user.status === 'active' ? "secondary" : "destructive"} className={user.status === 'active' ? "text-green-600 bg-green-100" : ""}>
                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {currentUser?.role === 'Admin' ? (
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>{user.status === 'active' ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPassword(user)}>Resetar Senha</DropdownMenuItem>
                                {user.id !== currentUser.id && (
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Excluir</DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o usuário "{user.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                                )}
                            </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <span>-</span>
                        )}
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    {currentUser && (
        <UserForm 
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSaveUser}
            user={editingUser}
            currentUser={currentUser}
        />
    )}
    </>
  );
}
