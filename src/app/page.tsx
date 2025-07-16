// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white p-2 bg-primary rounded-lg mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.95-3.38 2.5 2.5 0 0 1 1.22-3.63 2.5 2.5 0 0 1 3.53-2.62 2.5 2.5 0 0 1 3.16-3.33"/>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.95-3.38 2.5 2.5 0 0 0-1.22-3.63 2.5 2.5 0 0 0-3.53-2.62 2.5 2.5 0 0 0-3.16-3.33"/>
    </svg>
)

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center">
                <BrainIcon />
            </div>
          <CardTitle className="text-2xl font-bold">To Sabendo</CardTitle>
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
