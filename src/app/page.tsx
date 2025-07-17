// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { getUsers } from '@/lib/firebase/service';
import type { User } from '@/lib/types';
import { BrainCircuit, Eye, EyeOff } from 'lucide-react';

const Logo = () => (
    <div className="flex justify-center items-center mb-4 text-primary">
        <BrainCircuit className="h-16 w-16" />
    </div>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const allUsers = await getUsers();
        const foundUser = allUsers.find(
            (user: User) => user.email === email && user.password === password
        );
        
        if (foundUser) {
            toast({
                title: "Login bem-sucedido!",
                description: `Bem-vindo, ${foundUser.name}.`,
            });
            // Store user in session/local storage for persistence
            sessionStorage.setItem('currentUser', JSON.stringify(foundUser));

            if (foundUser.mustChangePassword) {
                router.push('/dashboard/profile');
            } else {
                router.push('/dashboard');
            }
        } else {
             setError('Credenciais inválidas. Por favor, tente novamente.');
        }
    } catch(err) {
        console.error("Login failed:", err);
        setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
    } finally {
        setLoading(false);
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
                    disabled={loading}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                    <Input 
                        id="password" 
                        type={showPassword ? 'text' : 'password'}
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                        <span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
                    </Button>
                </div>
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </Button>
            </CardFooter>
        </form>
      </Card>
    </main>
  );
}
