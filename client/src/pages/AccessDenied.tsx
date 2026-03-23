/**
 * FAMP Academy — Access Denied Page
 * Exibida quando o usuário tenta acessar uma rota sem permissão.
 */

import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useLocation } from 'wouter';

export default function AccessDenied() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Acesso Negado
        </h1>
        <p className="text-muted-foreground mb-6">
          Você não tem permissão para acessar esta página. Se acredita que isso é um erro, entre em contato com a coordenação.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
          <Button variant="default" onClick={() => navigate('/login')}>
            Trocar de Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
