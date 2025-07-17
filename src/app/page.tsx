// src/app/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';

const Logo = () => (
    <div className="flex justify-center mb-4">
        <Image 
            src="https://i.imgur.com/u1w5G2j.png"
            alt="Tô de Olho! Logo"
            width={150}
            height={84}
            className="rounded-lg"
            data-ai-hint="company logo"
            priority
        />
    </div>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Hardcoded super admin credentials
    if (email === 'luis.ribeiro@beachpark.com.br' && password === 'Lilian@2019') {
        toast({
            title: "Login bem-sucedido!",
            description: "Bem-vindo, Super Admin.",
        });
        router.push('/dashboard');
    } else {
        setError('Credenciais inválidas. Por favor, tente novamente.');
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
            <div className='flex justify-between items-start'>
                <div className="text-center w-full">
                    <Logo />
                    <CardTitle className="text-2xl font-bold">Tô de Olho!</CardTitle>
                    <CardDescription>Bem-vindo! Faça login para acessar seus projetos.</CardDescription>
                </div>
                <ThemeToggle />
            </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full">Entrar</Button>
            </CardFooter>
        </form>
      </Card>
    </main>
  );
}
