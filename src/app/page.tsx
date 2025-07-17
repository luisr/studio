// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LogoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white p-2 bg-primary rounded-lg mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 12.5a3.5 3.5 0 0 1-3.5-3.5V5.5a3.5 3.5 0 0 1 7 0v3.5a3.5 3.5 0 0 1-3.5 3.5z" />
        <path d="M12 12.5V18" />
        <path d="M15 16h-6" />
        <path d="M9 20h6" />
    </svg>
)

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center">
                <LogoIcon />
            </div>
          <CardTitle className="text-2xl font-bold">Tô Sabendo!</CardTitle>
          <CardDescription>Bem-vindo de volta! Faça login para acessar seus projetos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" required />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline">
                    Esqueceu sua senha?
                </Link>
            </div>
            <Input id="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full">Entrar</Button>
          </Link>
          <div className="text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="#" className="underline">
                Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
