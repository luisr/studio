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

const profileSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  avatar: z.string().url("URL do avatar inválida.").optional(),
  email: z.string().email("Por favor, insira um e-mail válido."),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "A senha atual é obrigatória."),
    newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
});


interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
    const { toast } = useToast();

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

    const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
        console.log("Profile data:", data);
        // Here you would typically call an API to update the user's profile
        toast({
            title: "Perfil Atualizado",
            description: "Suas informações foram salvas com sucesso.",
        });
    };
    
    const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
        console.log("Password data:", data);
        // Here you would call an API to change the password
        toast({
            title: "Senha Alterada",
            description: "Sua senha foi alterada com sucesso.",
        });
        passwordForm.reset();
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
                                    <Input type="email" placeholder="seu@email.com" {...field} />
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
                    <Button type="submit">Salvar Alterações</Button>
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
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
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
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
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
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
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
