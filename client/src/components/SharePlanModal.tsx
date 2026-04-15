/*
 * SharePlanModal — Modal de Compartilhamento de Plano de Estudo
 * Permite alunos compartilharem seus planos via Link, WhatsApp, Email ou Copiar
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Link2,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

interface SharePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareCode: string;
  titulo: string;
  ownerNome: string;
  temaCount: number;
}

export function SharePlanModal({
  open,
  onOpenChange,
  shareCode,
  titulo,
  ownerNome,
  temaCount,
}: SharePlanModalProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/planner/shared/${shareCode}`;
  const shareMessage = `Confira o plano de estudo "${titulo}" de ${ownerNome} (${temaCount} temas) no FAMP Academy: ${shareUrl}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores antigos
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleShareWhatsApp = useCallback(() => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
  }, [shareMessage]);

  const handleShareEmail = useCallback(() => {
    const subject = `Plano de Estudo: ${titulo}`;
    const body = `Olá!\n\nGostaria de compartilhar meu plano de estudo com você.\n\n${shareMessage}\n\nAtenciosamente,\n${ownerNome}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }, [shareMessage, titulo, ownerNome]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Compartilhar Plano de Estudo
          </DialogTitle>
          <DialogDescription>
            Compartilhe "{titulo}" com seus colegas de diferentes formas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Link compartilhável */}
          <div className="space-y-2">
            <Label htmlFor="share-link" className="text-sm font-medium">
              Link Compartilhável
            </Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareUrl}
                readOnly
                className="text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Código: <span className="font-mono font-semibold">{shareCode}</span>
            </p>
          </div>

          {/* Opções de compartilhamento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Compartilhar via</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Copiar Link</span>
                <span className="sm:hidden">Link</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
                <span className="sm:hidden">WA</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareEmail}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
                <span className="sm:hidden">Email</span>
              </Button>
            </div>
          </div>

          {/* Info do plano */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
            <p className="font-medium">{titulo}</p>
            <p className="text-xs text-muted-foreground">
              Por {ownerNome} • {temaCount} tema{temaCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
