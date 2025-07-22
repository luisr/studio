// src/components/dashboard/profile-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { updateUser } from "@/lib/supabase/service";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { profileSchema, passwordSchema } from '@/lib/validation';


interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
    const { toast } = useToast();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name,
            avatar: user.avatar,
            email: user.email,
            phone: user.phone || '',
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        }
    });

    const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
        try {
            await updateUser(user.id, data);
            toast({
                title: "Perfil Atualizado",
                description: "Suas informações foram salvas com sucesso.",
            });
        } catch(e) {
            toast({ title: "Erro ao atualizar perfil", variant: 'destructive' })
        }
    };
    
    const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
        if (data.currentPassword !== user.password) {
            passwordForm.setError("currentPassword", { message: "A senha atual está incorreta."});
            return;
        }

        try {
            await updateUser(user.id, {
                password: data.newPassword,
                mustChangePassword: false,
            });
            toast({
                title: "Senha Alterada",
                description: "Sua senha foi alterada com sucesso.",
            });
            passwordForm.reset();
             // Reload page to clear sensitive state
            setTimeout(() => window.location.reload(), 1500);
        } catch(e) {
            toast({ title: "Erro ao alterar senha", variant: 'destructive' })
        }
    };

  return (
    <div className="space-y-8">
        {/* Profile Information Card */}
        <Card>
            <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>Atualize seu nome, avatar e informações de contato.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                        control={profileForm.control}
                        name="avatar"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-4">
                               <Avatar className="h-20 w-20">
                                 <AvatarImage src={field.value} alt={user.name} />
                                 <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div className="flex-1">
                                <FormLabel>URL do Avatar</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com/avatar.png" {...field} />
                                </FormControl>
                                <FormMessage />
                               </div>
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Seu nome" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="seu@email.com" {...field} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                    <Input placeholder="(99) 99999-9999" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" disabled={user.mustChangePassword}>Salvar Alterações</Button>
                </CardFooter>
            </form>
            </Form>
        </Card>

        {/* Change Password Card */}
        <Card>
            <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <CardHeader>
                    <CardTitle>Alterar Senha</CardTitle>
                    <CardDescription>Para sua segurança, escolha uma senha forte.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Senha Atual</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input type={showCurrentPassword ? "text" : "password"} {...field} className="pr-10" />
                                    </FormControl>
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nova Senha</FormLabel>
                                 <div className="relative">
                                    <FormControl>
                                        <Input type={showNewPassword ? "text" : "password"} {...field} className="pr-10" />
                                    </FormControl>
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirmar Nova Senha</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input type={showConfirmPassword ? "text" : "password"} {...field} className="pr-10" />
                                    </FormControl>
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit">Alterar Senha</Button>
                </CardFooter>
            </form>
            </Form>
        </Card>
    </div>
  );
}
