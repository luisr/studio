// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Logo = () => (
    <div className="flex justify-center mb-4">
        <Image 
            src="https://placehold.co/150x80.png"
            alt="Beach Park Logo"
            width={120}
            height={64}
            className="rounded-lg"
            data-ai-hint="water park"
        />
    </div>
);


export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <Logo />
          <CardTitle className="text-2xl font-bold">Beach Park</CardTitle>
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
