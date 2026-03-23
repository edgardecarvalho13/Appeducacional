/**
 * FAMP Academy — Login Page
 * Design: "Command Center" — Login limpo sobre background médico.
 * Background: Coração anatômico wireframe em teal sobre navy.
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, GraduationCap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const LOGIN_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031165931/GTVSswVQbMzxsTPY394qoU/famp-login-bg-c4WfMBTa7gHKNn8RAvx87B.webp';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Se já autenticado, redirecionar
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } else {
      setError(result.error || 'Erro ao fazer login');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo — Formulário */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center px-8 lg:px-12 bg-background relative z-10">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                FAMP Academy
              </h1>
              <p className="text-xs text-muted-foreground">Plataforma de Educação Médica</p>
            </div>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-muted-foreground">
              Acesse com seu e-mail institucional @famp.edu.br
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail institucional
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.nome@famp.edu.br"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 bg-secondary/50 border-border focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Esqueceu a senha?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="h-11 bg-secondary/50 border-border focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <Card className="mt-8 bg-secondary/30 border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contas de demonstração
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="space-y-1.5 text-xs font-mono text-muted-foreground">
                <button
                  type="button"
                  onClick={() => { setEmail('joao.silva@famp.edu.br'); setPassword('demo'); }}
                  className="block w-full text-left hover:text-primary transition-colors py-1"
                >
                  <span className="text-primary/70">Aluno:</span> joao.silva@famp.edu.br
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('maria.santos@famp.edu.br'); setPassword('demo'); }}
                  className="block w-full text-left hover:text-primary transition-colors py-1"
                >
                  <span className="text-primary/70">Professor:</span> maria.santos@famp.edu.br
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('coord@famp.edu.br'); setPassword('demo'); }}
                  className="block w-full text-left hover:text-primary transition-colors py-1"
                >
                  <span className="text-primary/70">Coordenação:</span> coord@famp.edu.br
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Faculdade Morgana Potrich — FAMP
          </p>
        </div>
      </div>

      {/* Lado direito — Background visual */}
      <div
        className="hidden lg:flex flex-1 relative items-center justify-center"
        style={{
          backgroundImage: `url(${LOGIN_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/20 to-background" />
      </div>
    </div>
  );
}
