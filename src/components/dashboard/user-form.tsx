// src/components/dashboard/user-form.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { userSchema } from '@/lib/validation';
import { DEFAULT_AVATAR } from '@/lib/constants';

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: Omit<User, 'id'>) => void;
  user: User | null;
  currentUser: User;
}

export function UserForm({ isOpen, onOpenChange, onSave, user, currentUser }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        form.reset({
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role || 'Viewer',
        });
      } else {
        form.reset({
          name: "",
          email: "",
          avatar: DEFAULT_AVATAR,
          role: 'Viewer',
        });
      }
    }
  }, [user, isOpen, form]);

  const onSubmit = (data: UserFormValues) => {
    const userData = { 
      ...data,
      status: user?.status || 'active', 
    };
    onSave(userData);
  };

  const dialogTitle = user ? "Editar Usuário" : "Criar Novo Usuário";
  const dialogDescription = user
    ? "Atualize as informações do usuário."
    : "Preencha os dados para criar um novo usuário no sistema.";

  const canEditRole = currentUser?.role === 'Admin';


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                       <Avatar className="h-24 w-24">
                         <AvatarImage src={field.value} />
                         <AvatarFallback>{form.getValues('name')?.charAt(0) || 'U'}</AvatarFallback>
                       </Avatar>
                        <FormControl>
                            <Input placeholder="URL do Avatar" {...field} className="mt-2 text-center text-xs"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="joao.silva@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função Global</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canEditRole}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função do usuário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {canEditRole && <SelectItem value="Admin">Admin</SelectItem>}
                        <SelectItem value="Editor">Editor</SelectItem>
                        <SelectItem value="Viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                    {!canEditRole && <p className="text-xs text-muted-foreground mt-1">Apenas um Admin pode alterar a função.</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
